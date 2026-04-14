import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServiceClient, requireAuth } from './_supabase.js';

// ---------------------------------------------------------------------------
// Sample Data Seeder — populates a venture with a realistic cross-section of
// commerce, financial, payments, and ledger data so the UI has something to
// render. Idempotent: re-running upserts by stable keys.
//
// Actions:
//   seed-venture      — all-in-one: products + customers + orders + invoices
//                       + ledger accounts + sample payment + fraud rule
//   seed-ledger-chart — just the chart-of-accounts for a venture
//   clear-venture     — delete all seeded sample data for a venture (safe
//                       for production: only targets sku='sample-*' and
//                       customer email='sample-*@*')
// ---------------------------------------------------------------------------

const SAMPLE_PRODUCTS = [
  { sku: 'sample-saas-pro', name: 'Pro Plan', type: 'subscription', amount: 4900 },
  { sku: 'sample-saas-ent', name: 'Enterprise Plan', type: 'subscription', amount: 49900 },
  { sku: 'sample-credit-100', name: '100 Credits', type: 'credit_pack', amount: 1000 },
  { sku: 'sample-workshop', name: 'Live Workshop', type: 'service', amount: 19900 },
  { sku: 'sample-ebook', name: 'Founder Playbook', type: 'digital_download', amount: 2900 },
];

const SAMPLE_CUSTOMERS = [
  { email: 'sample-alex@demo.mcv', first: 'Alex', last: 'Chen', spent: 199, orders: 1 },
  { email: 'sample-jordan@demo.mcv', first: 'Jordan', last: 'Lee', spent: 588, orders: 3 },
  { email: 'sample-sam@demo.mcv', first: 'Sam', last: 'Patel', spent: 49900, orders: 1 },
];

// Standard 5-section chart of accounts
const LEDGER_ACCOUNTS = [
  // Assets (1000)
  { code: '1000', name: 'Cash & Equivalents', type: 'asset', subtype: 'current_asset' },
  { code: '1100', name: 'Accounts Receivable', type: 'asset', subtype: 'current_asset' },
  { code: '1200', name: 'Inventory', type: 'asset', subtype: 'current_asset' },
  { code: '1300', name: 'Stripe Balance', type: 'asset', subtype: 'current_asset' },
  { code: '1400', name: 'Solana Wallet (USDC)', type: 'asset', subtype: 'crypto' },
  // Liabilities (2000)
  { code: '2000', name: 'Accounts Payable', type: 'liability', subtype: 'current_liability' },
  { code: '2100', name: 'Sales Tax Payable', type: 'liability', subtype: 'current_liability' },
  { code: '2200', name: 'Deferred Revenue', type: 'liability', subtype: 'current_liability' },
  // Equity (3000)
  { code: '3000', name: 'Retained Earnings', type: 'equity', subtype: 'retained' },
  { code: '3100', name: 'Owner Contributions', type: 'equity', subtype: 'contribution' },
  // Revenue (4000)
  { code: '4000', name: 'Subscription Revenue', type: 'revenue', subtype: 'recurring' },
  { code: '4100', name: 'Product Sales', type: 'revenue', subtype: 'one_time' },
  { code: '4200', name: 'Service Revenue', type: 'revenue', subtype: 'one_time' },
  // Expenses (5000)
  { code: '5000', name: 'Cost of Goods Sold', type: 'expense', subtype: 'cogs' },
  { code: '5100', name: 'Processing Fees', type: 'expense', subtype: 'financial' },
  { code: '5200', name: 'Marketing', type: 'expense', subtype: 'sg_and_a' },
  { code: '5300', name: 'Engineering Tools', type: 'expense', subtype: 'rd' },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const ctx = await requireAuth(req, res);
  if (!ctx) return;
  const supabase = getServiceClient();
  const action = req.body?.action || req.query.action;
  const ventureId = (req.body?.venture_id || req.query.venture_id || 'mcv') as string;

  try {
    switch (action) {

      // ── Full venture seed ──
      case 'seed-venture': {
        const stats: Record<string, number> = {};

        // 1. Ledger accounts
        const accountRows = LEDGER_ACCOUNTS.map(a => ({
          venture_id: ventureId, code: a.code, name: a.name,
          type: a.type, subtype: a.subtype, currency: 'USD',
          current_balance: 0, is_system: true, metadata: { seeded: true },
        }));
        const { data: accounts } = await supabase
          .from('ledger_accounts')
          .upsert(accountRows, { onConflict: 'venture_id,code' })
          .select('id, code');
        stats.ledger_accounts = accounts?.length || 0;
        const accByCode = new Map((accounts || []).map(a => [a.code, a.id]));

        // 2. Products
        const productRows = SAMPLE_PRODUCTS.map(p => ({
          venture_id: ventureId, sku: p.sku, name: p.name, type: p.type, status: 'active',
          pricing: { default: { amount: p.amount / 100, currency: 'USD', compareAtPrice: null, costBasis: null }, volumeTiers: [], wholesaleTiers: [] },
          metadata: { seeded: true },
        }));
        // Check existing by venture+sku (no unique index on SKU so we de-dupe manually)
        const { data: existingProducts } = await supabase
          .from('products').select('id, sku').eq('venture_id', ventureId).in('sku', SAMPLE_PRODUCTS.map(p => p.sku));
        const existingSkus = new Set((existingProducts || []).map(p => p.sku));
        const toInsertProducts = productRows.filter(p => !existingSkus.has(p.sku));
        const { data: newProducts } = toInsertProducts.length > 0
          ? await supabase.from('products').insert(toInsertProducts).select('id, sku')
          : { data: [] };
        stats.products = (existingProducts?.length || 0) + (newProducts?.length || 0);
        const productBySku = new Map(
          [...(existingProducts || []), ...(newProducts || [])].map(p => [p.sku, p.id])
        );

        // 3. Customers
        const customerRows = SAMPLE_CUSTOMERS.map(c => ({
          venture_id: ventureId, email: c.email,
          first_name: c.first, last_name: c.last,
          total_orders: c.orders, total_spent: c.spent,
          average_order_value: c.orders > 0 ? c.spent / c.orders : 0,
          ltv: c.spent,
          metadata: { seeded: true },
        }));
        const { data: customers } = await supabase
          .from('customers')
          .upsert(customerRows, { onConflict: 'venture_id,email' })
          .select('id, email');
        stats.customers = customers?.length || 0;

        // 4. Orders (one per customer, linked to first product)
        const firstProductId = productBySku.get('sample-saas-pro');
        if (firstProductId && customers && customers.length > 0) {
          const orderRows = customers.map((c, i) => ({
            venture_id: ventureId, customer_id: c.id,
            status: ['delivered', 'processing', 'delivered'][i % 3],
            total_amount: SAMPLE_CUSTOMERS[i]?.spent || 49,
            currency: 'USD', metadata: { seeded: true },
          }));
          const { data: orders } = await supabase.from('orders').insert(orderRows).select('id');
          stats.orders = orders?.length || 0;

          // Order items
          if (orders) {
            const itemRows = orders.map((o, i) => ({
              order_id: o.id, product_id: firstProductId,
              quantity: 1, unit_price: SAMPLE_CUSTOMERS[i]?.spent || 49,
              total_price: SAMPLE_CUSTOMERS[i]?.spent || 49,
            }));
            await supabase.from('order_items').insert(itemRows);
          }
        }

        // 5. Invoices for customers with orders (auto invoice_number via trigger)
        if (customers && customers.length > 0) {
          const invoiceRows = customers.map((c, i) => ({
            venture_id: ventureId, customer_id: c.id,
            invoice_number: '', // trigger auto-fills
            status: ['paid', 'sent', 'paid'][i % 3],
            subtotal: SAMPLE_CUSTOMERS[i]?.spent || 49,
            tax: ((SAMPLE_CUSTOMERS[i]?.spent || 49) * 0.07),
            total: (SAMPLE_CUSTOMERS[i]?.spent || 49) * 1.07,
            amount_due: i === 1 ? (SAMPLE_CUSTOMERS[i]?.spent || 49) * 1.07 : 0,
            amount_paid: i === 1 ? 0 : (SAMPLE_CUSTOMERS[i]?.spent || 49) * 1.07,
            due_date: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10),
            metadata: { seeded: true },
          }));
          const { data: invoices } = await supabase.from('invoices').insert(invoiceRows).select('id');
          stats.invoices = invoices?.length || 0;
        }

        // 6. A payment intent + transaction record
        const { data: paymentIntents } = await supabase.from('payment_intents').insert([{
          venture_id: ventureId, processor_id: 'stripe',
          processor_payment_id: 'pi_sample_' + Date.now(),
          amount: 499, currency: 'USD', status: 'succeeded',
          payment_method: 'card', customer_country: 'US',
          description: 'Sample payment', metadata: { seeded: true },
        }]).select('id');
        stats.payment_intents = paymentIntents?.length || 0;

        await supabase.from('transaction_records').insert([{
          venture_id: ventureId, source_type: 'payment_intent',
          source_id: paymentIntents?.[0]?.id || 'none',
          amount: 499, currency: 'USD', direction: 'inflow',
          category: 'subscription_revenue', processor: 'stripe',
          metadata: { seeded: true },
        }]);
        stats.transactions = 1;

        // 7. A fraud rule
        await supabase.from('fraud_rules').upsert([{
          venture_id: ventureId, name: 'Sample: Velocity Block',
          condition: 'transaction_count_last_hour > 10',
          action: 'block', score_impact: 50, enabled: true,
          type: 'velocity', description: 'Block bursts of >10 tx/hour per customer',
          risk_score: 80, trigger_type: 'velocity',
        }], { onConflict: 'id' });
        stats.fraud_rules = 1;

        // 8. A dunning config
        await supabase.from('dunning_configs').upsert([{
          venture_id: ventureId,
          retry_schedule: [
            { days_after_failure: 1 }, { days_after_failure: 3 }, { days_after_failure: 7 }
          ],
          notification_schedule: [
            { days_before_final: 3, channel: 'email' }
          ],
          grace_period_days: 7, final_action: 'cancel', smart_retry_enabled: true,
        }], { onConflict: 'venture_id' });
        stats.dunning_config = 1;

        // 9. A tax nexus alert example
        await supabase.from('nexus_alerts').insert([{
          venture_id: ventureId, jurisdiction_code: 'US-CA', jurisdiction_name: 'California',
          alert_type: 'approaching_threshold', threshold_percent: 82,
          current_value: 410000, threshold_value: 500000,
          severity: 'warning', resolved: false,
        }]);
        stats.nexus_alerts = 1;

        return res.json({ success: true, venture_id: ventureId, stats });
      }

      // ── Just the chart of accounts ──
      case 'seed-ledger-chart': {
        const rows = LEDGER_ACCOUNTS.map(a => ({
          venture_id: ventureId, code: a.code, name: a.name,
          type: a.type, subtype: a.subtype, currency: 'USD',
          is_system: true, metadata: { seeded: true },
        }));
        const { data, error } = await supabase
          .from('ledger_accounts')
          .upsert(rows, { onConflict: 'venture_id,code' })
          .select();
        if (error) throw error;
        return res.json({ success: true, accounts: data?.length || 0 });
      }

      // ── Clear all sample data for this venture ──
      case 'clear-venture': {
        // Only delete rows metadata={seeded:true} OR sku starting with 'sample-'
        const stats: Record<string, number> = {};
        const del = async (table: string, filter: Record<string, unknown>) => {
          let q = supabase.from(table).delete();
          for (const [k, v] of Object.entries(filter)) q = q.eq(k, v);
          const { count } = await q;
          stats[table] = count || 0;
        };
        await supabase.from('orders').delete().eq('venture_id', ventureId).contains('metadata', { seeded: true });
        await supabase.from('invoices').delete().eq('venture_id', ventureId).contains('metadata', { seeded: true });
        await supabase.from('payment_intents').delete().eq('venture_id', ventureId).contains('metadata', { seeded: true });
        await supabase.from('transaction_records').delete().eq('venture_id', ventureId).contains('metadata', { seeded: true });
        await supabase.from('customers').delete().eq('venture_id', ventureId).contains('metadata', { seeded: true });
        await supabase.from('products').delete().eq('venture_id', ventureId).like('sku', 'sample-%');
        await supabase.from('ledger_accounts').delete().eq('venture_id', ventureId).contains('metadata', { seeded: true });
        await supabase.from('fraud_rules').delete().eq('venture_id', ventureId).like('name', 'Sample:%');
        await supabase.from('nexus_alerts').delete().eq('venture_id', ventureId).eq('jurisdiction_code', 'US-CA');
        return res.json({ success: true, venture_id: ventureId, cleared: stats });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}. Use seed-venture | seed-ledger-chart | clear-venture.` });
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[seed-sample]', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}
