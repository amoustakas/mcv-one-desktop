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
import { createServerFabric } from '../../src/lib/mcv-core/fabric';

// Fabric client (null when FABRIC_URL isn't configured — fire-and-forget
// publishes degrade gracefully). Instantiated once per serverless cold start.
const fabric = createServerFabric();

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

// Fire-and-forget lifecycle event helper — TWO sinks:
//   1. `notifications` table: Desktop bell + cron-notifications-dispatch
//      deliver to slack/email when channels JSON is populated.
//   2. Fabric event bus (when FABRIC_URL set): real-time fan-out to any
//      subscriber — portal, investor apps, external webhooks, agents.
//
// Both are best-effort. Fabric outages never block the primary mutation.
// Topic format documented in docs/capital/PROTOCOL.md §Event Schema:
//   capital.<entity>.<action>  e.g. capital.round.created, capital.distribution.paid
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
  // Sink 1: notifications row (always attempted)
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

  // Sink 2: Fabric pub-sub (degrades silently when not configured)
  if (fabric) {
    try {
      await fabric.publish({
        topic,
        payload: {
          title,
          description: opts.description ?? null,
          type: opts.type ?? 'info',
          ...(opts.payload ?? {}),
        },
        ventureId: opts.ventureId,
      });
    } catch (err) {
      console.warn(`[capital ${topic}] fabric publish failed:`, err instanceof Error ? err.message : err);
    }
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
        const commitmentInput = params.commitment as {
          contactId: string;
          roundId: string;
          [k: string]: unknown;
        };

        // OFAC gate (Epic 13 Story 6 follow-up): screen every commitment
        // regardless of round — sanctions compliance isn't round-scoped.
        // Reads the normalized outcome from
        // capital_investor_profile.metadata.compliance.ofac stamped by
        // reconcileCapitalCompliance. 'review' allows with flag +
        // activity entry; 'match' hard-blocks with 403 OFAC_MATCH.
        const { checkOfacGate } = await import('../../src/lib/capital/compliance-gate');
        const ofacGate = await checkOfacGate({ supabase, contactId: commitmentInput.contactId });
        if (!ofacGate.allow) {
          return res.status(403).json({
            error: ofacGate.error,
            code: ofacGate.code,
            matched_record: 'matchedRecord' in ofacGate ? ofacGate.matchedRecord : undefined,
          });
        }
        const ofacFlag = ofacGate.flag; // 'review' | 'unscreened' | undefined

        // VC gate (Epic 11 Story 5): if the round requires accreditation and
        // the investor profile has a VC on file, verify it. Non-accredited
        // status or invalid signatures are rejected. No VC on file =
        // allowed in dev (backwards-compat) but flagged in activity log.
        const round = await engine.rounds.getRound(commitmentInput.roundId);
        if (round?.accreditedOnly) {
          const { data: profile } = await supabase
            .from('capital_investor_profile')
            .select('metadata')
            .eq('contact_id', commitmentInput.contactId)
            .maybeSingle();
          const vc = (profile?.metadata as { vc?: unknown } | null)?.vc as Record<string, unknown> | undefined;
          if (!vc) {
            if (process.env.NODE_ENV === 'production') {
              return res.status(403).json({
                error: 'Round requires accredited investors; no credential on file',
                code: 'VC_REQUIRED',
              });
            }
            // Dev: allow but log
            console.warn(`[capital] commit without VC on accreditedOnly round ${round.id} (allowed in ${process.env.NODE_ENV})`);
          } else {
            const { verifyAccreditationCredential } = await import('../../src/lib/capital/vc-issuer');
            const vr = verifyAccreditationCredential(vc as never);
            if (!vr.ok) {
              return res.status(403).json({
                error: `Accreditation credential invalid: ${vr.reason ?? 'unknown'}`,
                code: 'VC_INVALID',
                expired: vr.expired,
                unsigned: vr.unsigned,
              });
            }
            const subj = (vc as { credentialSubject?: { accreditationStatus?: string } }).credentialSubject;
            if (subj?.accreditationStatus === 'non_accredited') {
              return res.status(403).json({
                error: 'Round requires accredited investors; credential shows non_accredited',
                code: 'VC_NOT_ACCREDITED',
              });
            }
          }
        }

        const commitment = await engine.commitments.createCommitment(params.commitment as never);
        await engine.activities.recordActivity({
          ventureId: commitment.ventureId,
          contactId: commitment.contactId,
          roundId: commitment.roundId,
          commitmentId: commitment.id,
          activityType: 'system',
          title: ofacFlag
            ? `Commitment created (OFAC flag: ${ofacFlag}): ${commitment.amountUsd} USD`
            : `Commitment created: ${commitment.amountUsd} USD`,
          newValue: commitment.status,
          actorId: userId,
          actorType: 'user',
        });
        // When OFAC gate surfaced a non-clear-but-allowed result, emit
        // a warning notification so compliance + Tony see the flag
        // alongside the activity entry. Matches pattern used by the
        // compliance-reconcile helper but scoped to the commit event.
        if (ofacFlag) {
          await publishCapitalEvent(
            'capital.compliance.review_needed',
            `Commitment created with OFAC flag '${ofacFlag}' — review required`,
            {
              description: `Commitment ${commitment.id.slice(0, 8)} for contact ${commitment.contactId.slice(0, 8)} · amount ${commitment.amountUsd} USD`,
              type: 'warning',
              ventureId: commitment.ventureId,
            },
          );
        }
        return res.json({ commitment, ofac_flag: ofacFlag ?? null });
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
        // Real DocuSign envelope creation (Epic 13 S3). Resolves the
        // commitment + linked contact, calls createEnvelope which uses
        // the JWT-grant flow when DOCUSIGN_INTEGRATION_KEY is set and
        // falls back to a deterministic mock when not. Persists the
        // envelope row to docusign_envelopes for idempotent webhook
        // handling + audit.
        const commitmentId = params.commitment_id as string;
        const templateId = (params.template_id as string) || process.env.DOCUSIGN_DEFAULT_TEMPLATE_ID || 'mock-template';
        const returnUrl = params.return_url as string | undefined;
        if (!commitmentId) return res.status(400).json({ error: 'commitment_id required' });

        const { data: commitmentRow } = await supabase
          .from('capital_commitments')
          .select('id, contact_id, venture_id, amount_usd')
          .eq('id', commitmentId)
          .maybeSingle();
        if (!commitmentRow) return res.status(404).json({ error: 'commitment not found' });

        const { data: contact } = await supabase
          .from('crm_contacts')
          .select('id, full_name, email')
          .eq('id', commitmentRow.contact_id)
          .maybeSingle();
        if (!contact?.email || !contact?.full_name) {
          return res.status(400).json({ error: 'contact missing full_name or email — cannot address envelope' });
        }

        const { createEnvelope } = await import('../../src/lib/capital/adapters/docusign-adapter');
        try {
          const envelope = await createEnvelope({
            commitmentId,
            templateId,
            returnUrl,
            signers: [{
              name: contact.full_name as string,
              email: contact.email as string,
              roleName: 'Investor',
              embedded: Boolean(returnUrl),
            }],
          });

          // Audit row — idempotent on envelope_id; webhook upserts the
          // same row when completion arrives.
          await supabase.from('docusign_envelopes').upsert({
            envelope_id: envelope.envelopeId,
            commitment_id: commitmentId,
            adapter: envelope.source === 'docusign-mock' ? 'docusign' : 'docusign',
            template_id: templateId,
            signers_json: [{ email: contact.email, name: contact.full_name, role: 'Investor' }],
            updated_at: new Date().toISOString(),
          }, { onConflict: 'envelope_id' });

          // SDK call to stamp envelope id on the commitment + record
          // activity. Pre-existing markSigned / attachDocuSign methods.
          const commitment = await engine.commitments.attachDocuSign(commitmentId, envelope.envelopeId);
          await engine.activities.recordActivity({
            ventureId: commitment.ventureId,
            commitmentId: commitment.id,
            activityType: 'doc_sent',
            title: envelope.source === 'docusign-mock'
              ? `DocuSign envelope MOCKED (no creds): ${envelope.envelopeId}`
              : `DocuSign envelope sent: ${envelope.envelopeId}`,
            actorId: userId,
            actorType: 'user',
            metadata: {
              envelope_id: envelope.envelopeId,
              template_id: templateId,
              source: envelope.source,
              hosted_recipient_urls: envelope.hostedRecipientUrls ?? [],
            },
          });

          await publishCapitalEvent(
            'capital.commitment.envelope_sent',
            `Subscription envelope sent to ${contact.full_name}`,
            {
              description: `Commitment ${commitmentId.slice(0, 8)} · template ${templateId} · adapter ${envelope.source}`,
              ventureId: commitment.ventureId,
              type: 'info',
            },
          );

          return res.json({
            envelope_id: envelope.envelopeId,
            status: envelope.status,
            source: envelope.source,
            hosted_recipient_urls: envelope.hostedRecipientUrls ?? [],
            commitment,
          });
        } catch (err) {
          return res.status(500).json({ error: err instanceof Error ? err.message : 'envelope creation failed' });
        }
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

      // ─── Accreditation VC (Epic 11 — portable investor credentials) ───
      case 'issue-accreditation-vc': {
        const { issueAccreditationCredential } = await import('../../src/lib/capital/vc-issuer');
        const vc = issueAccreditationCredential({
          clerkUserId: (params.clerk_user_id as string) ?? userId,
          accreditationStatus: params.accreditation_status as never,
          jurisdiction: (params.jurisdiction as never) ?? 'US',
          verificationMethod: (params.verification_method as string) ?? 'futurestate-kyc-v2',
          exemptions: params.exemptions as string[] | undefined,
          validityDays: params.validity_days as number | undefined,
        });
        // Persist to the investor profile metadata.vc. Caller-provided contact_id
        // or fall back to looking up by clerk_user_id.
        if (params.contact_id) {
          const { data: existing } = await supabase
            .from('capital_investor_profile')
            .select('metadata')
            .eq('contact_id', params.contact_id as string)
            .maybeSingle();
          const mergedMeta = { ...((existing?.metadata as Record<string, unknown>) ?? {}), vc };
          await supabase
            .from('capital_investor_profile')
            .update({ metadata: mergedMeta })
            .eq('contact_id', params.contact_id as string);
        }
        await publishCapitalEvent('capital.accreditation.issued',
          `Accreditation VC issued — ${vc.credentialSubject.accreditationStatus}`,
          { description: `subject ${vc.credentialSubject.id}`, type: 'success' });
        return res.json({ vc });
      }
      case 'verify-accreditation-vc': {
        const { verifyAccreditationCredential } = await import('../../src/lib/capital/vc-issuer');
        const result = verifyAccreditationCredential(params.vc as never, params.public_key as string | undefined);
        return res.json(result);
      }
      case 'enable-portal': {
        const profile = await engine.contacts.enablePortal(
          params.contact_id as string,
          params.portal_user_id as string,
        );
        return res.json({ profile });
      }
      case 'screen-contact-ofac': {
        // OFAC SDN screening (Epic 13 S6). Runs the contact's legal name
        // (+ optional DOB) against the ofac_sdn_entries Supabase cache
        // when populated (set by scripts/fetch-ofac-sdn.ts) and falls
        // back to the bundled 5-entry seed for dev / cold start. Stamps
        // the result on capital_investor_profile.metadata.compliance.ofac.
        const contactId = params.contact_id as string;
        if (!contactId) return res.status(400).json({ error: 'contact_id required' });

        const { data: contact } = await supabase
          .from('crm_contacts')
          .select('id, full_name, metadata')
          .eq('id', contactId)
          .maybeSingle();
        if (!contact?.full_name) {
          return res.status(404).json({ error: 'contact not found or missing full_name' });
        }
        const dob = (contact.metadata as { date_of_birth?: string } | null)?.date_of_birth
          ?? (params.dob as string | undefined);

        const { createOfacAdapter } = await import('../../src/lib/capital/adapters/ofac-adapter');
        const { loadSdnEntries } = await import('../../src/lib/capital/adapters/ofac-sdn-cache');
        const { reconcileCapitalCompliance } = await import('../../src/lib/capital/compliance-reconcile');

        const { entries, source } = await loadSdnEntries(supabase);
        const adapter = createOfacAdapter({ sdnEntries: entries });
        const event = await adapter.fromForeign({ contactId: contact.id, name: contact.full_name, dob });
        const result = await reconcileCapitalCompliance(event, { supabase });
        if (event && event.outcome !== 'clear') {
          await publishCapitalEvent(
            `capital.compliance.${event.outcome === 'match' ? 'match' : 'review_needed'}`,
            `OFAC screening ${event.outcome} — ${contact.full_name}`,
            {
              description: event.matchedRecord
                ? `Matched ${event.matchedRecord.name} (${(event.matchedRecord.programs ?? []).join(', ')}) · score ${event.score.toFixed(2)}`
                : `score ${event.score.toFixed(2)} (threshold ${event.matchDiagnostics.threshold})`,
              type: event.outcome === 'match' ? 'error' : 'warning',
            },
          );
        }
        return res.json({ event, result, sdn_source: source, sdn_entry_count: entries.length });
      }
      case 'refresh-ofac-sdn': {
        // Accepts a batch of SdnEntry records and upserts into
        // ofac_sdn_entries. Typically called by
        // scripts/fetch-ofac-sdn.ts from a service-role bearer token;
        // can also be invoked manually from the admin console to seed
        // the table. delete_missing=true triggers a full-refresh diff.
        const entries = params.entries as unknown;
        if (!Array.isArray(entries)) {
          return res.status(400).json({ error: 'entries (SdnEntry[]) required' });
        }
        const { upsertSdnEntries } = await import('../../src/lib/capital/adapters/ofac-sdn-cache');
        try {
          const result = await upsertSdnEntries(
            supabase,
            entries as never,
            {
              sourceUrl: params.source_url as string | undefined,
              deleteMissing: Boolean(params.delete_missing),
            },
          );
          await publishCapitalEvent(
            'capital.compliance.sdn_refreshed',
            `OFAC SDN cache refreshed — ${result.upserted} upserted${result.deleted ? `, ${result.deleted} deleted` : ''}`,
            { type: 'info' },
          );
          return res.json({ ok: true, ...result });
        } catch (err) {
          return res.status(500).json({
            error: err instanceof Error ? err.message : 'SDN refresh failed',
          });
        }
      }
      case 'initiate-accreditation-verification': {
        // Outbound leg of the VerifyInvestor adapter (Epic 13 S9).
        // Creates a vendor-side request, returns the hosted URL for
        // the investor to complete. Completion arrives asynchronously
        // at /api/verify-investor-webhook which auto-issues the VC.
        const contactId = params.contact_id as string;
        const returnUrl = params.return_url as string | undefined;
        if (!contactId) return res.status(400).json({ error: 'contact_id required' });

        const { data: contact } = await supabase
          .from('crm_contacts')
          .select('id, full_name, email, metadata')
          .eq('id', contactId)
          .maybeSingle();
        if (!contact) return res.status(404).json({ error: 'contact not found' });

        const { data: profile } = await supabase
          .from('capital_investor_profile')
          .select('clerk_user_id')
          .eq('contact_id', contactId)
          .maybeSingle();

        const { createVerificationRequest } = await import('../../src/lib/capital/adapters/verify-investor-adapter');
        try {
          const request = await createVerificationRequest({
            contactId,
            clerkUserId: profile?.clerk_user_id as string | undefined,
            email: contact.email as string | undefined,
            returnUrl,
          });
          // Stamp the vendor request id on the contact so the webhook
          // can correlate back when completion arrives. The adapter's
          // fromForeign already uses subject.contactId (passed via the
          // vendor's external_id field) as the primary linkage, but
          // having the pending request id visible here lets admins +
          // UI show "verification in flight" state.
          const mergedMeta = {
            ...((contact.metadata as Record<string, unknown>) ?? {}),
            verify_investor_request_id: request.requestId,
            verify_investor_request_at: request.createdAt,
          };
          await supabase.from('crm_contacts').update({ metadata: mergedMeta }).eq('id', contactId);

          await publishCapitalEvent(
            'capital.accreditation.verification_requested',
            `Accreditation verification requested for ${contact.full_name ?? contactId}`,
            { description: `VerifyInvestor request ${request.requestId.slice(0, 12)}…`, type: 'info' },
          );
          return res.json({ request });
        } catch (err) {
          return res.status(500).json({ error: err instanceof Error ? err.message : 'verification request failed' });
        }
      }
      case 'link-stripe-customer': {
        // Stamps `crm_contacts.metadata.stripe_customer_id` so the
        // StripeAdapter (Epic 13 S2) can auto-match payment_intent.succeeded
        // events to this investor when the PaymentIntent doesn't carry an
        // explicit capital_commitment_id. Called by StripeCustomerLinkButton
        // after /api/stripe action=create-customer succeeds.
        const contactId = params.contact_id as string;
        const stripeCustomerId = params.stripe_customer_id as string;
        if (!contactId || !stripeCustomerId) {
          return res.status(400).json({ error: 'contact_id and stripe_customer_id required' });
        }
        const { data: existing } = await supabase
          .from('crm_contacts')
          .select('metadata')
          .eq('id', contactId)
          .maybeSingle();
        const merged = { ...((existing?.metadata as Record<string, unknown>) ?? {}), stripe_customer_id: stripeCustomerId };
        const { error: updErr } = await supabase
          .from('crm_contacts')
          .update({ metadata: merged })
          .eq('id', contactId);
        if (updErr) return res.status(500).json({ error: updErr.message });
        return res.json({ ok: true, contact_id: contactId, stripe_customer_id: stripeCustomerId });
      }
      case 'link-plaid-account': {
        // Stamps `crm_contacts.metadata.plaid_account_id` so the PlaidAdapter
        // (Epic 13 S1) can match incoming settled credits to this investor.
        // Called after PlaidLinkButton successfully completes Plaid Link.
        const contactId = params.contact_id as string;
        const plaidAccountId = params.plaid_account_id as string;
        if (!contactId || !plaidAccountId) {
          return res.status(400).json({ error: 'contact_id and plaid_account_id required' });
        }
        const { data: existing } = await supabase
          .from('crm_contacts')
          .select('metadata')
          .eq('id', contactId)
          .maybeSingle();
        const merged = { ...((existing?.metadata as Record<string, unknown>) ?? {}), plaid_account_id: plaidAccountId };
        const { error: updErr } = await supabase
          .from('crm_contacts')
          .update({ metadata: merged })
          .eq('id', contactId);
        if (updErr) return res.status(500).json({ error: updErr.message });
        return res.json({ ok: true, contact_id: contactId, plaid_account_id: plaidAccountId });
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
