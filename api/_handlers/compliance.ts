// api/compliance.ts
// Compliance API — Fraud, Dunning, Tax, Price Localization
// Vercel serverless function

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withAuth } from './_auth.js';
import { scoreTransaction, listFraudRules, createFraudRule, updateFraudRule, deleteFraudRule } from '../../src/lib/compliance/fraud-engine';
import {
  getDunningStats,
  getDunningConfig,
  updateDunningConfig,
  processRetries,
  initiateDunning,
  markRecovered,
} from '../../src/lib/compliance/dunning-manager';
import { calculateTax, checkNexus, updateNexusTracking } from '../../src/lib/compliance/tax-engine';
import { localizePrice, getPriceLocalizationConfig, updatePriceLocalizationConfig } from '../../src/lib/compliance/price-localization';

// ─────────────────────────────────────────────────────────
// HANDLER
// ─────────────────────────────────────────────────────────

async function handler(req: VercelRequest, res: VercelResponse) {
  const ventureId = (req.query.ventureId as string) || (req.body?.ventureId as string) || 'mcv';

  // ── GET ──────────────────────────────────────────────
  if (req.method === 'GET') {
    const action = req.query.action as string;

    switch (action) {
      case 'list-fraud-rules': {
        const rules = await listFraudRules(ventureId);
        return res.json({ data: rules });
      }

      case 'get-dunning-stats': {
        const stats = await getDunningStats(ventureId);
        return res.json({ data: stats });
      }

      case 'get-dunning-config': {
        const config = await getDunningConfig(ventureId);
        return res.json({ data: config });
      }

      case 'check-nexus': {
        const alerts = await checkNexus(ventureId);
        return res.json({ data: alerts });
      }

      case 'get-localization-config': {
        const config = await getPriceLocalizationConfig(ventureId);
        return res.json({ data: config });
      }

      default:
        return res.status(400).json({ error: `Unknown GET action: ${action}` });
    }
  }

  // ── POST ─────────────────────────────────────────────
  if (req.method === 'POST') {
    const { action, ...body } = req.body as Record<string, unknown>;

    switch (action) {
      case 'score-transaction': {
        const result = await scoreTransaction({
          transactionId: body.transactionId as string,
          ventureId,
          customerId: body.customerId as string,
          amount: body.amount as number,
          currency: (body.currency as string) ?? 'USD',
          customerCountry: body.customerCountry as string | undefined,
          paymentMethodCountry: body.paymentMethodCountry as string | undefined,
          deviceFingerprint: body.deviceFingerprint as string | undefined,
          customerCreatedAt: body.customerCreatedAt as string | undefined,
          ipAddress: body.ipAddress as string | undefined,
        });
        return res.json({ data: result });
      }

      case 'create-fraud-rule': {
        const rule = await createFraudRule({
          ventureId,
          name: body.name as string,
          condition: body.condition as string,
          action: body.ruleAction as 'block' | 'review' | 'require_3ds' | 'flag' | 'add_score',
          scoreImpact: (body.scoreImpact as number) ?? 0,
          enabled: (body.enabled as boolean) ?? true,
        });
        return res.json({ data: rule });
      }

      case 'update-fraud-rule': {
        const id = body.id as string;
        if (!id) return res.status(400).json({ error: 'id is required' });
        // Partial update — only fields explicitly present in the body are forwarded
        // so the dialog can do field-level toggles (e.g. enabled-only) without
        // clobbering the rest of the rule.
        const patch: Record<string, unknown> = {};
        if (body.name !== undefined) patch.name = body.name;
        if (body.condition !== undefined) patch.condition = body.condition;
        if (body.ruleAction !== undefined) patch.action = body.ruleAction;
        if (body.scoreImpact !== undefined) patch.scoreImpact = body.scoreImpact;
        if (body.enabled !== undefined) patch.enabled = body.enabled;
        const rule = await updateFraudRule(id, patch as Parameters<typeof updateFraudRule>[1]);
        if (!rule) return res.status(404).json({ error: 'Rule not found or update failed' });
        return res.json({ data: rule });
      }

      case 'delete-fraud-rule': {
        const id = body.id as string;
        if (!id) return res.status(400).json({ error: 'id is required' });
        const ok = await deleteFraudRule(id);
        if (!ok) return res.status(500).json({ error: 'Delete failed' });
        return res.json({ data: { success: true, id } });
      }

      case 'process-retries': {
        const results = await processRetries(ventureId);
        return res.json({ data: results });
      }

      case 'initiate-dunning': {
        const state = await initiateDunning(
          body.subscriptionId as string,
          body.paymentIntentId as string,
          ventureId,
        );
        return res.json({ data: state });
      }

      case 'mark-recovered': {
        await markRecovered(body.dunningId as string);
        return res.json({ data: { success: true } });
      }

      case 'update-dunning-config': {
        const config = await updateDunningConfig(ventureId, body as Parameters<typeof updateDunningConfig>[1]);
        return res.json({ data: config });
      }

      case 'calculate-tax': {
        const breakdown = await calculateTax({
          ventureId,
          lineItems: body.lineItems as Parameters<typeof calculateTax>[0]['lineItems'],
          customerLocation: body.customerLocation as Parameters<typeof calculateTax>[0]['customerLocation'],
          sellerLocation: body.sellerLocation as Parameters<typeof calculateTax>[0]['sellerLocation'],
          isB2B: (body.isB2B as boolean) ?? false,
          customerVatId: body.customerVatId as string | undefined,
          shippingAmount: body.shippingAmount as number | undefined,
          discountAmount: body.discountAmount as number | undefined,
        });
        return res.json({ data: breakdown });
      }

      case 'update-nexus-tracking': {
        await updateNexusTracking(
          ventureId,
          body.jurisdictionCode as string,
          body.amount as number,
        );
        return res.json({ data: { success: true } });
      }

      case 'localize-price': {
        const result = localizePrice(
          body.amount as number,
          (body.baseCurrency as string) ?? 'USD',
          body.customerCountry as string,
          body.config as Parameters<typeof localizePrice>[3],
        );
        return res.json({ data: result });
      }

      case 'update-localization-config': {
        const config = await updatePriceLocalizationConfig(ventureId, body as Parameters<typeof updatePriceLocalizationConfig>[1]);
        return res.json({ data: config });
      }

      default:
        return res.status(400).json({ error: `Unknown POST action: ${action}` });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withAuth(handler);
