// EdgeIQ Capital — unified API handler
// SPEC-EQC-001 Epic 2.3
// Backed by @mcv/capital-sdk + Supabase. Pattern matches api/_handlers/epics.ts.

import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  createCapitalEngine,
  type CommitmentStatus,
  type RoundStatus,
} from '@mcv/capital-sdk';
import { makeCapitalLedgerAdapter, makeCapitalPaymentRouterAdapter } from '../../src/lib/capital/adapters';
import { paymentRouter } from '../../src/lib/payments/router';

async function requireAuth(req: VercelRequest, res: VercelResponse): Promise<string | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return 'no-secret';
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.cookies?.__session || null);
  if (!token) { res.status(401).json({ error: 'Authentication required' }); return null; }
  try {
    const { verifyToken } = await import('@clerk/backend');
    const payload = await verifyToken(token, { secretKey });
    return payload.sub;
  } catch { res.status(401).json({ error: 'Invalid session' }); return null; }
}

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
);

// Full ecosystem-wired engine:
//   - ledger: every distribution auto-posts DR source / CR cash journal entry
//   - paymentRouter: recipient payouts route through registered processors
// Adapters bridge the capital-sdk's narrow contracts to the app's richer APIs.
const engine = createCapitalEngine({
  supabase,
  ledger: makeCapitalLedgerAdapter(supabase),
  paymentRouter: makeCapitalPaymentRouterAdapter(paymentRouter),
});

// Fire-and-forget notification helper — mirrors api/_handlers/crm.ts:notify.
// Writes to the shared `notifications` table so the Desktop bell + any
// future Fabric consumer sees Capital lifecycle events.
async function publishCapitalEvent(
  topic: string,
  title: string,
  opts: {
    description?: string;
    ventureId?: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    payload?: Record<string, unknown>;
  } = {},
) {
  try {
    await supabase.from('notifications').insert({
      type: opts.type ?? 'info',
      title,
      description: opts.description ?? null,
      source: 'capital',
      venture_id: opts.ventureId ?? null,
    });
  } catch (err) {
    console.warn(`[capital ${topic}] notify failed:`, err instanceof Error ? err.message : err);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res); if (!userId) return;
  const action = req.method === 'GET' ? req.query.action as string : req.body?.action;
  const params = { ...req.query, ...(req.body || {}) } as Record<string, unknown>;

  try {
    switch (action) {
      // ─── Rounds ─────────────────────────────────────────────────────
      case 'list-rounds': {
        const ventureId = params.venture_id as string | undefined;
        const status = params.status as RoundStatus | undefined;
        const rounds = ventureId
          ? await engine.rounds.listRounds(ventureId, { status })
          : await engine.rounds.listAllRounds({ status });
        return res.json({ rounds });
      }
      case 'list-public-rounds': {
        const rounds = await engine.rounds.listPublicRounds({ limit: 50 });
        return res.json({ rounds });
      }
      case 'get-round': {
        const round = await engine.rounds.getRound(params.id as string);
        return res.json({ round });
      }
      case 'get-round-by-slug': {
        const round = await engine.rounds.getRoundBySlug(
          params.venture_id as string,
          params.slug as string,
        );
        return res.json({ round });
      }
      case 'create-round': {
        const round = await engine.rounds.createRound(params.round as never);
        await engine.activities.recordActivity({
          ventureId: round.ventureId,
          roundId: round.id,
          activityType: 'system',
          title: `Round created: ${round.name}`,
          actorId: userId,
          actorType: 'user',
        });
        await publishCapitalEvent('capital.round.created', `Round created: ${round.name}`, {
          description: `${round.ventureId} · ${round.roundType} · target ${round.targetRaise}`,
          ventureId: round.ventureId,
          type: 'success',
        });
        return res.json({ round });
      }
      case 'update-round': {
        const { id, venture_id, ...updates } = params;
        const round = await engine.rounds.updateRound(id as string, venture_id as string, updates as never);
        return res.json({ round });
      }
      case 'update-round-status': {
        const round = await engine.rounds.updateStatus(
          params.id as string,
          params.status as RoundStatus,
          userId,
        );
        await engine.activities.recordActivity({
          ventureId: round.ventureId,
          roundId: round.id,
          activityType: 'status_change',
          title: `Round → ${round.status}`,
          newValue: round.status,
          actorId: userId,
          actorType: 'user',
        });
        const topic = `capital.round.${round.status}`;
        const titleByStatus: Record<string, string> = {
          open: `Round opened: ${round.name}`,
          closing: `Round closing: ${round.name}`,
          closed: `Round closed: ${round.name}`,
          funded: `Round funded: ${round.name}`,
          cancelled: `Round cancelled: ${round.name}`,
        };
        await publishCapitalEvent(topic, titleByStatus[round.status] ?? `Round → ${round.status}`, {
          description: `${round.ventureId} · committed ${round.totalCommitted} of ${round.targetRaise}`,
          ventureId: round.ventureId,
          type: round.status === 'funded' ? 'success' : round.status === 'cancelled' ? 'warning' : 'info',
        });
        return res.json({ round });
      }

      // ─── Commitments ────────────────────────────────────────────────
      case 'list-commitments': {
        const ventureId = params.venture_id as string;
        const commitments = await engine.commitments.listCommitments(ventureId, {
          roundId: params.round_id as string | undefined,
          contactId: params.contact_id as string | undefined,
          status: params.status as CommitmentStatus | undefined,
        });
        return res.json({ commitments });
      }
      case 'list-commitments-by-round': {
        const commitments = await engine.commitments.listByRound(params.round_id as string);
        return res.json({ commitments });
      }
      case 'list-portal-commitments': {
        const commitments = await engine.commitments.listByPortalUser(params.portal_user_id as string);
        return res.json({ commitments });
      }
      case 'create-commitment': {
        const commitment = await engine.commitments.createCommitment(params.commitment as never);
        await engine.activities.recordActivity({
          ventureId: commitment.ventureId,
          contactId: commitment.contactId,
          roundId: commitment.roundId,
          commitmentId: commitment.id,
          activityType: 'system',
          title: `Commitment created: ${commitment.amountUsd} USD`,
          newValue: commitment.status,
          actorId: userId,
          actorType: 'user',
        });
        return res.json({ commitment });
      }
      case 'update-commitment': {
        const { id, ...updates } = params;
        const commitment = await engine.commitments.updateCommitment(id as string, updates as never);
        return res.json({ commitment });
      }
      case 'update-commitment-status': {
        const before = await engine.commitments.getCommitment(params.id as string);
        const commitment = await engine.commitments.updateStatus(
          params.id as string,
          params.status as CommitmentStatus,
          userId,
        );
        await engine.activities.recordActivity({
          ventureId: commitment.ventureId,
          contactId: commitment.contactId,
          roundId: commitment.roundId,
          commitmentId: commitment.id,
          activityType: 'status_change',
          title: `Commitment → ${commitment.status}`,
          previousValue: before?.status,
          newValue: commitment.status,
          actorId: userId,
          actorType: 'user',
        });
        return res.json({ commitment });
      }
      case 'record-payment': {
        const commitment = await engine.commitments.recordPayment(
          params.commitment_id as string,
          params.payment_method as never,
          params.payment_reference as string,
        );
        await engine.activities.recordActivity({
          ventureId: commitment.ventureId,
          contactId: commitment.contactId,
          commitmentId: commitment.id,
          activityType: 'payment_received',
          title: `Payment received: ${commitment.amountUsd} USD via ${commitment.paymentMethod}`,
          actorId: userId,
          actorType: 'user',
        });
        await publishCapitalEvent('capital.commitment.funded', `Commitment funded: ${commitment.amountUsd} USD`, {
          description: `${commitment.ventureId} · ${commitment.paymentMethod} · ref ${commitment.paymentReference}`,
          ventureId: commitment.ventureId,
          type: 'success',
        });
        return res.json({ commitment });
      }
      case 'send-docusign': {
        // TODO: real DocuSign integration in Epic 3
        const envelopeId = `mock-envelope-${Date.now()}`;
        const commitment = await engine.commitments.attachDocuSign(
          params.commitment_id as string,
          envelopeId,
        );
        await engine.activities.recordActivity({
          ventureId: commitment.ventureId,
          commitmentId: commitment.id,
          activityType: 'doc_sent',
          title: `DocuSign envelope sent`,
          actorId: userId,
          actorType: 'user',
          metadata: { envelope_id: envelopeId },
        });
        return res.json({ envelope_id: envelopeId, commitment });
      }
      case 'distribute-tokens': {
        // TODO: real Solana distribution in Epic 5
        return res.json({ distributed_count: 0, message: 'Token distribution stubbed (Epic 5)' });
      }

      // ─── Investors / Contacts (satellite on crm_contacts) ───────────
      case 'list-investors': {
        const ventureId = params.venture_id as string | undefined;
        const investors = ventureId
          ? await engine.contacts.listInvestors(ventureId, {
              contactType: params.contact_type as never,
              stage: params.stage as never,
            })
          : await engine.contacts.listAllInvestors({
              contactType: params.contact_type as never,
              stage: params.stage as never,
            });
        return res.json({ investors });
      }
      case 'get-investor-position': {
        const contactId = params.contact_id as string;
        const [profile, commitments] = await Promise.all([
          engine.contacts.getInvestorProfile(contactId),
          engine.commitments.listByContact(contactId),
        ]);
        return res.json({ profile, commitments });
      }
      case 'upsert-investor-profile': {
        const profile = await engine.contacts.upsertInvestorProfile(params.profile as never);
        return res.json({ profile });
      }
      case 'enable-portal': {
        const profile = await engine.contacts.enablePortal(
          params.contact_id as string,
          params.portal_user_id as string,
        );
        return res.json({ profile });
      }
      case 'update-investor-stage': {
        const profile = await engine.contacts.updateStage(
          params.contact_id as string,
          params.stage as never,
        );
        return res.json({ profile });
      }
      case 'update-lead-score': {
        const profile = await engine.contacts.updateLeadScore(
          params.contact_id as string,
          Number(params.lead_score),
        );
        return res.json({ profile });
      }

      // ─── Organizations ──────────────────────────────────────────────
      case 'list-organizations': {
        const orgs = await engine.organizations.listOrganizations(
          params.venture_id as string,
          { orgType: params.org_type as never, isRaisingProject: params.is_raising_project as boolean | undefined },
        );
        return res.json({ organizations: orgs });
      }
      case 'list-launchpad-projects': {
        const orgs = await engine.organizations.listLaunchpadProjects({
          projectStatus: params.project_status as string | undefined,
        });
        return res.json({ projects: orgs });
      }
      case 'create-organization': {
        const org = await engine.organizations.createOrganization(params.organization as never);
        return res.json({ organization: org });
      }

      // ─── Activities ─────────────────────────────────────────────────
      case 'list-activities': {
        const activities = await engine.activities.listActivities(
          params.venture_id as string,
          {
            contactId: params.contact_id as string | undefined,
            roundId: params.round_id as string | undefined,
            commitmentId: params.commitment_id as string | undefined,
            limit: Number(params.limit ?? 100),
          },
        );
        return res.json({ activities });
      }
      case 'recent-activities': {
        const activities = await engine.activities.listAllRecent({ limit: Number(params.limit ?? 50) });
        return res.json({ activities });
      }

      // ─── Documents ──────────────────────────────────────────────────
      case 'list-documents-by-round': {
        const investorOnly = params.investor_visible_only === true || params.investor_visible_only === 'true';
        const documents = await engine.documents.listByRound(params.round_id as string, { investorVisibleOnly: investorOnly });
        return res.json({ documents });
      }
      case 'list-documents-by-commitment': {
        const documents = await engine.documents.listByCommitment(params.commitment_id as string);
        return res.json({ documents });
      }
      case 'create-document': {
        const document = await engine.documents.createDocument(params.document as never);
        return res.json({ document });
      }

      // ─── Dashboard / Analytics ──────────────────────────────────────
      case 'global-summary': {
        const summary = await engine.dashboard.globalSummary();
        return res.json({ summary });
      }
      case 'venture-summary': {
        const summary = await engine.dashboard.ventureSummary(params.venture_id as string);
        return res.json({ summary });
      }
      case 'pipeline-funnel': {
        const funnel = await engine.dashboard.pipelineFunnel(params.venture_id as string | undefined);
        return res.json({ funnel });
      }
      case 'top-investors': {
        const investors = await engine.dashboard.topInvestors(Number(params.limit ?? 10));
        return res.json({ investors });
      }
      case 'upcoming-followups': {
        const followups = await engine.dashboard.upcomingFollowUps(Number(params.days_ahead ?? 7));
        return res.json({ followups });
      }

      // ─── Distributions (Capital × Ledger × Payments) ────────────────
      case 'list-distributions': {
        const distributions = await engine.distributions.listDistributions(
          params.venture_id as string,
          { roundId: params.round_id as string | undefined, status: params.status as never, limit: Number(params.limit ?? 50) },
        );
        return res.json({ distributions });
      }
      case 'get-distribution': {
        const state = await engine.distributions.getDistribution(params.id as string);
        return res.json(state ?? { distribution: null, recipients: [] });
      }
      case 'create-distribution': {
        const dist = await engine.distributions.createDistribution({
          ...(params.input as never),
          createdBy: userId,
        });
        await publishCapitalEvent('capital.distribution.created', `Distribution scheduled: ${dist.distributionType}`, {
          description: `${dist.ventureId} · ${dist.totalAmount} ${dist.currency}`,
          ventureId: dist.ventureId,
          type: 'info',
        });
        return res.json({ distribution: dist });
      }
      case 'process-distribution': {
        const dist = await engine.distributions.processDistribution(params.id as string, userId);
        await publishCapitalEvent('capital.distribution.paid', `Distribution ${dist.status}: ${dist.distributionType}`, {
          description: `${dist.ventureId} · paid ${dist.totalPaid} to ${dist.totalRecipients}`,
          ventureId: dist.ventureId,
          type: dist.status === 'completed' ? 'success' : dist.status === 'failed' ? 'error' : 'warning',
        });
        return res.json({ distribution: dist });
      }
      case 'cancel-distribution': {
        const dist = await engine.distributions.cancelDistribution(params.id as string);
        return res.json({ distribution: dist });
      }

      // ─── Tax exports (1099-DIV / T5 CSV from processed distributions) ─
      case 'export-tax-form': {
        const result = await engine.tax.exportTaxForm({
          form: params.form as 'T5' | '1099-DIV',
          ventureId: params.venture_id as string,
          taxYear: Number(params.tax_year),
        });
        // Optionally return as raw CSV download when ?as=csv on the body.
        if (params.as === 'csv') {
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename="${result.form}-${result.ventureId}-${result.taxYear}.csv"`);
          return res.send(result.csv);
        }
        return res.json(result);
      }

      // ─── Ventures lookup (Capital × Ventures registry) ──────────────
      case 'get-venture-for-round': {
        const venture = await engine.ventures.getVenture(params.venture_id as string);
        return res.json({ venture });
      }
      case 'list-ventures': {
        const ventures = await engine.ventures.listVentures({
          status: params.status as string | undefined,
          tier: params.tier !== undefined ? Number(params.tier) : undefined,
        });
        return res.json({ ventures });
      }

      // ─── Content integration (Capital × Content OS) ────────────────
      case 'list-round-content': {
        const entries = await engine.content.listRoundContent(params.round_id as string, {
          role: params.role as never,
          visibilityMin: params.visibility_min as never,
        });
        return res.json({ entries });
      }
      case 'get-round-description': {
        const description = await engine.content.getRoundDescription(params.round_id as string);
        return res.json({ description });
      }
      case 'list-round-updates': {
        const updates = await engine.content.listRoundUpdates(params.round_id as string, {
          includeDrafts: params.include_drafts === true,
          limit: params.limit ? Number(params.limit) : undefined,
        });
        return res.json({ updates });
      }
      case 'create-round-content': {
        const entry = await engine.content.createRoundContent(params.input as never);
        await engine.activities.recordActivity({
          ventureId: (params.input as { ventureId: string }).ventureId,
          roundId: (params.input as { roundId: string }).roundId,
          activityType: 'system',
          title: `Content attached: ${entry.content.title}`,
          actorId: userId,
          actorType: 'user',
          metadata: { content_id: entry.contentId, role: entry.role },
        });
        return res.json({ entry });
      }
      case 'publish-round-update': {
        const content = await engine.content.publishUpdate(
          params.content_id as string,
          params.visibility as never,
        );
        return res.json({ content });
      }
      case 'attach-content-to-round': {
        const link = await engine.content.attachContent(
          params.round_id as string,
          params.content_id as string,
          params.role as never,
          { isPrimary: params.is_primary as boolean, ordinal: params.ordinal as number },
        );
        return res.json({ link });
      }
      case 'detach-content-from-round': {
        await engine.content.detachContent(
          params.round_id as string,
          params.content_id as string,
          params.role as never,
        );
        return res.json({ success: true });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : JSON.stringify(error),
    });
  }
}
