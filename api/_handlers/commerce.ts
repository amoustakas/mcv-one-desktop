// api/commerce.ts
// Vercel serverless function — Commerce API
// Actions: products, subscriptions, invoices, loans

import type { VercelRequest, VercelResponse } from '@vercel/node';

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

// ─────────────────────────────────────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? '',
  );

  const action = (req.method === 'GET' ? req.query.action : req.body?.action) as string;
  const ventureId = ((req.method === 'GET' ? req.query.ventureId : req.body?.ventureId) as string) ?? '';

  if (!ventureId) {
    return res.status(400).json({ error: 'ventureId is required' });
  }

  try {
    switch (action) {

      // ── PRODUCTS ─────────────────────────────────────────────────────────

      case 'list-products': {
        const { type, status, limit: lRaw, offset: oRaw } = req.query;
        const limit = Math.min(Number(lRaw) || 50, 200);
        const offset = Number(oRaw) || 0;

        let query = supabase
          .from('products')
          .select('*')
          .eq('venture_id', ventureId)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (type) query = query.eq('type', type as string);
        if (status) query = query.eq('status', status as string);

        const { data, error } = await query;
        if (error) throw error;
        return res.json({ data, meta: { limit, offset } });
      }

      case 'get-product': {
        const { productId } = req.query;
        if (!productId) return res.status(400).json({ error: 'productId is required' });

        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId as string)
          .eq('venture_id', ventureId)
          .single();
        if (error) throw error;
        return res.json({ data });
      }

      case 'create-product': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const {
          type, name, description, status = 'draft',
          sku, pricing, categoryIds, tags,
          trackInventory, inventoryCount, taxCategoryId, taxExempt,
          requiresKyc, minimumComplianceTier, geoRestrictions,
          physical, digital, subscription, metered, credit, loan, investment, gift, transfer,
          metadata,
        } = req.body;

        if (!type) return res.status(400).json({ error: 'type is required' });
        if (!name) return res.status(400).json({ error: 'name is required' });
        if (!pricing) return res.status(400).json({ error: 'pricing is required' });

        const { data, error } = await supabase
          .from('products')
          .insert({
            venture_id: ventureId,
            type,
            name,
            description: description ?? null,
            status,
            sku: sku ?? null,
            pricing,
            category_ids: categoryIds ?? [],
            tags: tags ?? [],
            track_inventory: trackInventory ?? false,
            inventory_count: inventoryCount ?? null,
            tax_category_id: taxCategoryId ?? null,
            tax_exempt: taxExempt ?? false,
            requires_kyc: requiresKyc ?? false,
            minimum_compliance_tier: minimumComplianceTier ?? null,
            geo_restrictions: geoRestrictions ?? [],
            physical: physical ?? null,
            digital: digital ?? null,
            subscription: subscription ?? null,
            metered: metered ?? null,
            credit: credit ?? null,
            loan: loan ?? null,
            investment: investment ?? null,
            gift: gift ?? null,
            transfer: transfer ?? null,
            metadata: metadata ?? {},
          })
          .select()
          .single();
        if (error) throw error;
        return res.json({ data });
      }

      case 'update-product': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const { productId, ...updates } = req.body;
        if (!productId) return res.status(400).json({ error: 'productId is required' });

        // Map camelCase updates to snake_case columns
        const snakeUpdates: Record<string, unknown> = {};
        const fieldMap: Record<string, string> = {
          name: 'name', description: 'description', status: 'status', sku: 'sku',
          pricing: 'pricing', categoryIds: 'category_ids', tags: 'tags',
          trackInventory: 'track_inventory', inventoryCount: 'inventory_count',
          taxCategoryId: 'tax_category_id', taxExempt: 'tax_exempt',
          requiresKyc: 'requires_kyc', minimumComplianceTier: 'minimum_compliance_tier',
          geoRestrictions: 'geo_restrictions',
          physical: 'physical', digital: 'digital', subscription: 'subscription',
          metered: 'metered', credit: 'credit', loan: 'loan',
          investment: 'investment', gift: 'gift', transfer: 'transfer',
          metadata: 'metadata',
        };
        for (const [key, col] of Object.entries(fieldMap)) {
          if (key in updates) snakeUpdates[col] = updates[key];
        }

        const { data, error } = await supabase
          .from('products')
          .update(snakeUpdates)
          .eq('id', productId as string)
          .eq('venture_id', ventureId)
          .select()
          .single();
        if (error) throw error;
        return res.json({ data });
      }

      case 'archive-product': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const { productId } = req.body;
        if (!productId) return res.status(400).json({ error: 'productId is required' });

        const { data, error } = await supabase
          .from('products')
          .update({ status: 'archived' })
          .eq('id', productId as string)
          .eq('venture_id', ventureId)
          .select()
          .single();
        if (error) throw error;
        return res.json({ data });
      }

      case 'search-products': {
        const { query: searchQuery } = req.query;
        if (!searchQuery) return res.status(400).json({ error: 'query is required' });

        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('venture_id', ventureId)
          .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
          .neq('status', 'archived')
          .limit(50);
        if (error) throw error;
        return res.json({ data });
      }

      // ── SUBSCRIPTIONS ─────────────────────────────────────────────────────

      case 'list-subscriptions': {
        const { status, customerId, limit: lRaw, offset: oRaw } = req.query;
        const limit = Math.min(Number(lRaw) || 50, 200);
        const offset = Number(oRaw) || 0;

        let query = supabase
          .from('subscriptions')
          .select('*')
          .eq('venture_id', ventureId)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (status) query = query.eq('status', status as string);
        if (customerId) query = query.eq('customer_id', customerId as string);

        const { data, error } = await query;
        if (error) throw error;
        return res.json({ data, meta: { limit, offset } });
      }

      case 'create-subscription': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const {
          customerId, planId, productId, status = 'active',
          currentPeriodStart, currentPeriodEnd, trialEnd,
          cancelAtPeriodEnd, quantity, metadata,
        } = req.body;

        if (!customerId) return res.status(400).json({ error: 'customerId is required' });
        if (!planId) return res.status(400).json({ error: 'planId is required' });
        if (!currentPeriodStart) return res.status(400).json({ error: 'currentPeriodStart is required' });
        if (!currentPeriodEnd) return res.status(400).json({ error: 'currentPeriodEnd is required' });

        const { data, error } = await supabase
          .from('subscriptions')
          .insert({
            venture_id: ventureId,
            customer_id: customerId,
            plan_id: planId,
            product_id: productId ?? null,
            status,
            current_period_start: currentPeriodStart,
            current_period_end: currentPeriodEnd,
            trial_end: trialEnd ?? null,
            cancel_at_period_end: cancelAtPeriodEnd ?? false,
            quantity: quantity ?? 1,
            metadata: metadata ?? {},
          })
          .select()
          .single();
        if (error) throw error;
        return res.json({ data });
      }

      case 'cancel-subscription': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const { subscriptionId, immediate = false } = req.body;
        if (!subscriptionId) return res.status(400).json({ error: 'subscriptionId is required' });

        const updatePayload: Record<string, unknown> = immediate
          ? { status: 'canceled' }
          : { cancel_at_period_end: true };

        const { data, error } = await supabase
          .from('subscriptions')
          .update(updatePayload)
          .eq('id', subscriptionId as string)
          .eq('venture_id', ventureId)
          .select()
          .single();
        if (error) throw error;
        return res.json({ data });
      }

      case 'record-usage': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const { subscriptionId, meterId, quantity, idempotencyKey, action: usageAction = 'increment' } = req.body;
        if (!subscriptionId) return res.status(400).json({ error: 'subscriptionId is required' });
        if (!meterId) return res.status(400).json({ error: 'meterId is required' });
        if (quantity === undefined) return res.status(400).json({ error: 'quantity is required' });
        if (!idempotencyKey) return res.status(400).json({ error: 'idempotencyKey is required' });

        // Check for duplicate idempotency key
        const { data: existing } = await supabase
          .from('usage_records')
          .select('id')
          .eq('idempotency_key', idempotencyKey as string)
          .maybeSingle();
        if (existing) return res.json({ data: existing, duplicate: true });

        const { data, error } = await supabase
          .from('usage_records')
          .insert({
            subscription_id: subscriptionId,
            meter_id: meterId,
            quantity,
            idempotency_key: idempotencyKey,
            action: usageAction,
            timestamp: new Date().toISOString(),
          })
          .select()
          .single();
        if (error) throw error;
        return res.json({ data });
      }

      // ── INVOICES ──────────────────────────────────────────────────────────

      case 'list-invoices': {
        const { status, customerId, limit: lRaw, offset: oRaw } = req.query;
        const limit = Math.min(Number(lRaw) || 50, 200);
        const offset = Number(oRaw) || 0;

        let query = supabase
          .from('invoices')
          .select('*, invoice_line_items(*)')
          .eq('venture_id', ventureId)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (status) query = query.eq('status', status as string);
        if (customerId) query = query.eq('customer_id', customerId as string);

        const { data, error } = await query;
        if (error) throw error;
        return res.json({ data, meta: { limit, offset } });
      }

      case 'create-invoice': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const {
          customerId, status = 'draft', subtotal, tax = 0,
          discountAmount = 0, total, amountDue, dueDate,
          paymentTerms = 'net_30', lineItems = [], metadata,
        } = req.body;

        if (!customerId) return res.status(400).json({ error: 'customerId is required' });
        if (!dueDate) return res.status(400).json({ error: 'dueDate is required' });
        if (total === undefined) return res.status(400).json({ error: 'total is required' });

        // Generate invoice number
        const invoiceNumber = `INV-${Date.now()}`;

        const { data: invoice, error: invoiceErr } = await supabase
          .from('invoices')
          .insert({
            venture_id: ventureId,
            customer_id: customerId,
            invoice_number: invoiceNumber,
            status,
            subtotal: subtotal ?? total,
            tax,
            discount_amount: discountAmount,
            total,
            amount_due: amountDue ?? total,
            amount_paid: 0,
            due_date: dueDate,
            payment_terms: paymentTerms,
            metadata: metadata ?? {},
          })
          .select()
          .single();
        if (invoiceErr) throw invoiceErr;

        if (Array.isArray(lineItems) && lineItems.length > 0) {
          const lineRows = (lineItems as Record<string, unknown>[]).map((li) => ({
            invoice_id: invoice.id,
            description: li.description,
            quantity: li.quantity,
            unit_price: li.unitPrice,
            total: li.total,
            product_id: li.productId ?? null,
            tax_amount: li.taxAmount ?? 0,
          }));
          const { error: liErr } = await supabase.from('invoice_line_items').insert(lineRows);
          if (liErr) throw liErr;
        }

        return res.json({ data: invoice });
      }

      case 'send-invoice': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const { invoiceId } = req.body;
        if (!invoiceId) return res.status(400).json({ error: 'invoiceId is required' });

        const { data, error } = await supabase
          .from('invoices')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', invoiceId as string)
          .eq('venture_id', ventureId)
          .select()
          .single();
        if (error) throw error;
        return res.json({ data });
      }

      case 'record-invoice-payment': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const { invoiceId, amount } = req.body;
        if (!invoiceId) return res.status(400).json({ error: 'invoiceId is required' });
        if (amount === undefined) return res.status(400).json({ error: 'amount is required' });

        // Fetch current invoice state
        const { data: current, error: fetchErr } = await supabase
          .from('invoices')
          .select('amount_due, amount_paid, total')
          .eq('id', invoiceId as string)
          .eq('venture_id', ventureId)
          .single();
        if (fetchErr) throw fetchErr;

        const newAmountPaid = Number(current.amount_paid) + Number(amount);
        const newAmountDue = Math.max(0, Number(current.total) - newAmountPaid);
        const newStatus = newAmountDue <= 0
          ? 'paid'
          : newAmountPaid > 0 ? 'partial' : current.status;

        const { data, error } = await supabase
          .from('invoices')
          .update({
            amount_paid: newAmountPaid,
            amount_due: newAmountDue,
            status: newStatus,
            paid_at: newAmountDue <= 0 ? new Date().toISOString() : null,
          })
          .eq('id', invoiceId as string)
          .eq('venture_id', ventureId)
          .select()
          .single();
        if (error) throw error;
        return res.json({ data });
      }

      case 'get-overdue': {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
          .from('invoices')
          .select('*, invoice_line_items(*)')
          .eq('venture_id', ventureId)
          .in('status', ['sent', 'viewed', 'partial'])
          .lt('due_date', today)
          .order('due_date', { ascending: true });
        if (error) throw error;
        return res.json({ data });
      }

      // ── LOANS ─────────────────────────────────────────────────────────────

      case 'list-loans': {
        const { status, limit: lRaw, offset: oRaw } = req.query;
        const limit = Math.min(Number(lRaw) || 50, 200);
        const offset = Number(oRaw) || 0;

        let query = supabase
          .from('loans')
          .select('*')
          .eq('venture_id', ventureId)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (status) query = query.eq('status', status as string);

        const { data, error } = await query;
        if (error) throw error;
        return res.json({ data, meta: { limit, offset } });
      }

      case 'create-loan': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const {
          customerId, productId, principal, interestRate,
          interestType = 'simple', termMonths, status = 'application',
          outstandingBalance, nextPaymentDate, metadata,
        } = req.body;

        if (!customerId) return res.status(400).json({ error: 'customerId is required' });
        if (!principal) return res.status(400).json({ error: 'principal is required' });
        if (interestRate === undefined) return res.status(400).json({ error: 'interestRate is required' });
        if (!termMonths) return res.status(400).json({ error: 'termMonths is required' });

        const { data, error } = await supabase
          .from('loans')
          .insert({
            venture_id: ventureId,
            customer_id: customerId,
            product_id: productId ?? null,
            principal,
            interest_rate: interestRate,
            interest_type: interestType,
            term_months: termMonths,
            status,
            outstanding_balance: outstandingBalance ?? principal,
            next_payment_date: nextPaymentDate ?? null,
            disbursed_at: null,
            metadata: metadata ?? {},
          })
          .select()
          .single();
        if (error) throw error;
        return res.json({ data });
      }

      case 'disburse-loan': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const { loanId } = req.body;
        if (!loanId) return res.status(400).json({ error: 'loanId is required' });

        const { data, error } = await supabase
          .from('loans')
          .update({ status: 'disbursed', disbursed_at: new Date().toISOString() })
          .eq('id', loanId as string)
          .eq('venture_id', ventureId)
          .eq('status', 'approved')
          .select()
          .single();
        if (error) throw error;
        return res.json({ data });
      }

      case 'record-repayment': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const { loanId, amount } = req.body;
        if (!loanId) return res.status(400).json({ error: 'loanId is required' });
        if (amount === undefined) return res.status(400).json({ error: 'amount is required' });

        // Fetch current loan balance
        const { data: loan, error: fetchErr } = await supabase
          .from('loans')
          .select('outstanding_balance, principal, interest_rate, interest_type, status')
          .eq('id', loanId as string)
          .eq('venture_id', ventureId)
          .single();
        if (fetchErr) throw fetchErr;

        const newBalance = Math.max(0, Number(loan.outstanding_balance) - Number(amount));
        const newStatus = newBalance <= 0 ? 'paid_off' : 'repaying';

        // Record repayment transaction
        const { error: repayErr } = await supabase
          .from('loan_repayments')
          .insert({
            loan_id: loanId,
            amount,
            principal_portion: Math.min(amount, loan.outstanding_balance),
            interest_portion: 0,
            payment_date: new Date().toISOString(),
            status: 'completed',
          });
        if (repayErr) throw repayErr;

        // Update loan balance
        const { data, error } = await supabase
          .from('loans')
          .update({ outstanding_balance: newBalance, status: newStatus })
          .eq('id', loanId as string)
          .eq('venture_id', ventureId)
          .select()
          .single();
        if (error) throw error;
        return res.json({ data });
      }

      case 'get-schedule': {
        const { loanId } = req.query;
        if (!loanId) return res.status(400).json({ error: 'loanId is required' });

        const { data: loan, error: loanErr } = await supabase
          .from('loans')
          .select('*')
          .eq('id', loanId as string)
          .eq('venture_id', ventureId)
          .single();
        if (loanErr) throw loanErr;

        const { data: repayments, error: repErr } = await supabase
          .from('loan_repayments')
          .select('*')
          .eq('loan_id', loanId as string)
          .order('payment_date', { ascending: true });
        if (repErr) throw repErr;

        return res.json({ data: { loan, repayments } });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
