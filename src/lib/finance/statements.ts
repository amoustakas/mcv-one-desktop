// src/lib/finance/statements.ts
// Financial Statements Generator — P&L, Balance Sheet, Cash Flow
// Reads from Supabase ledger tables with direct aggregation queries.

import { supabase } from '../supabase';
import type {
  ReportScope,
  IncomeStatement,
  BalanceSheet,
  CashFlowStatement,
  RevenueBreakdown,
  CostOfRevenue,
  OperatingExpenses,
  CurrentAssets,
  NonCurrentAssets,
  CurrentLiabilities,
  NonCurrentLiabilities,
  Equity,
} from './types';

// ─────────────────────────────────────────────────────────
// ACCOUNT CODE → P&L CATEGORY MAPPINGS
// ─────────────────────────────────────────────────────────
//
// Standard MCV Chart of Accounts:
//   1xxx = Assets
//   2xxx = Liabilities
//   3xxx = Equity
//   4xxx = Revenue
//   5xxx = Cost of Revenue / COGS
//   6xxx = Operating Expenses

const REVENUE_MAP: Record<string, keyof Omit<RevenueBreakdown, 'total'>> = {
  '4010': 'subscriptions',
  '4020': 'oneTimeSales',
  '4030': 'digitalProducts',
  '4040': 'physicalGoods',
  '4050': 'platformFees',
  '4060': 'transactionFees',
  '4070': 'creditSales',
  '4080': 'loanInterest',
  '4090': 'marketplaceCommissions',
  '4100': 'meteredUsage',
  '4110': 'services',
};

const COGS_MAP: Record<string, keyof Omit<CostOfRevenue, 'total'>> = {
  '5010': 'physicalGoodsCost',
  '5020': 'digitalDeliveryCost',
  '5030': 'paymentProcessingFees',
  '5040': 'refundsAndChargebacks',
};

const OPEX_MAP: Record<string, keyof Omit<OperatingExpenses, 'total'>> = {
  '6010': 'infrastructure',
  '6020': 'thirdPartyServices',
  '6030': 'creditGrants',
  '6040': 'loanWriteoffs',
};

// ─────────────────────────────────────────────────────────
// BALANCE SHEET CODE RANGES
// ─────────────────────────────────────────────────────────

function isInRange(code: string, min: number, max: number): boolean {
  const n = parseInt(code, 10);
  return n >= min && n <= max;
}

// ─────────────────────────────────────────────────────────
// HELPER — safe division
// ─────────────────────────────────────────────────────────

function safeDivide(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return numerator / denominator;
}

// ─────────────────────────────────────────────────────────
// GENERATE INCOME STATEMENT
// ─────────────────────────────────────────────────────────

export async function generateIncomeStatement(scope: ReportScope): Promise<IncomeStatement> {
  if (!supabase) {
    return buildEmptyIncomeStatement(scope);
  }

  // Build the query: join journal_entry_lines → journal_entries → ledger_accounts
  // Filter to posted entries within date range for the venture (or global)
  let query = supabase
    .from('journal_entry_lines')
    .select(`
      debit_amount,
      credit_amount,
      ledger_accounts!inner(code, type, venture_id),
      journal_entries!inner(status, entry_date, venture_id)
    `)
    .eq('journal_entries.status', 'posted')
    .gte('journal_entries.entry_date', scope.dateRange.start)
    .lte('journal_entries.entry_date', scope.dateRange.end);

  if (scope.ventureId) {
    query = query.eq('journal_entries.venture_id', scope.ventureId);
  }

  const { data: lines, error } = await query;

  if (error || !lines) {
    return buildEmptyIncomeStatement(scope);
  }

  // Initialize accumulators
  const revenueAccum: Record<string, number> = {};
  const cogsAccum: Record<string, number> = {};
  const opexAccum: Record<string, number> = {};

  for (const line of lines as Array<{
    debit_amount: number;
    credit_amount: number;
    ledger_accounts: { code: string; type: string };
    journal_entries: { status: string };
  }>) {
    const code = line.ledger_accounts?.code;
    if (!code) continue;

    // Revenue (4xxx): net = credits - debits (normal credit balance)
    if (REVENUE_MAP[code]) {
      const net = (line.credit_amount ?? 0) - (line.debit_amount ?? 0);
      revenueAccum[code] = (revenueAccum[code] ?? 0) + net;
    }
    // COGS (5xxx): net = debits - credits (normal debit balance)
    else if (COGS_MAP[code]) {
      const net = (line.debit_amount ?? 0) - (line.credit_amount ?? 0);
      cogsAccum[code] = (cogsAccum[code] ?? 0) + net;
    }
    // OpEx (6xxx): net = debits - credits
    else if (OPEX_MAP[code]) {
      const net = (line.debit_amount ?? 0) - (line.credit_amount ?? 0);
      opexAccum[code] = (opexAccum[code] ?? 0) + net;
    }
  }

  // Map to revenue breakdown
  const revenue: RevenueBreakdown = {
    subscriptions: 0,
    oneTimeSales: 0,
    digitalProducts: 0,
    physicalGoods: 0,
    platformFees: 0,
    transactionFees: 0,
    creditSales: 0,
    loanInterest: 0,
    marketplaceCommissions: 0,
    meteredUsage: 0,
    services: 0,
    total: 0,
  };
  for (const [code, net] of Object.entries(revenueAccum)) {
    const key = REVENUE_MAP[code];
    if (key) revenue[key] += net;
  }
  revenue.total = Object.entries(revenue)
    .filter(([k]) => k !== 'total')
    .reduce((sum, [, v]) => sum + v, 0);

  // Map to cost of revenue
  const costOfRevenue: CostOfRevenue = {
    physicalGoodsCost: 0,
    digitalDeliveryCost: 0,
    paymentProcessingFees: 0,
    refundsAndChargebacks: 0,
    total: 0,
  };
  for (const [code, net] of Object.entries(cogsAccum)) {
    const key = COGS_MAP[code];
    if (key) costOfRevenue[key] += net;
  }
  costOfRevenue.total = Object.entries(costOfRevenue)
    .filter(([k]) => k !== 'total')
    .reduce((sum, [, v]) => sum + v, 0);

  // Map to operating expenses
  const operatingExpenses: OperatingExpenses = {
    infrastructure: 0,
    thirdPartyServices: 0,
    creditGrants: 0,
    loanWriteoffs: 0,
    total: 0,
  };
  for (const [code, net] of Object.entries(opexAccum)) {
    const key = OPEX_MAP[code];
    if (key) operatingExpenses[key] += net;
  }
  operatingExpenses.total = Object.entries(operatingExpenses)
    .filter(([k]) => k !== 'total')
    .reduce((sum, [, v]) => sum + v, 0);

  const grossProfit = revenue.total - costOfRevenue.total;
  const grossMargin = safeDivide(grossProfit, revenue.total);
  const operatingIncome = grossProfit - operatingExpenses.total;
  const netIncome = operatingIncome; // Simplified: no tax/interest below the line yet

  return {
    scope,
    revenue,
    costOfRevenue,
    grossProfit,
    grossMargin,
    operatingExpenses,
    operatingIncome,
    netIncome,
    generatedAt: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────
// GENERATE BALANCE SHEET
// ─────────────────────────────────────────────────────────

export async function generateBalanceSheet(scope: ReportScope): Promise<BalanceSheet> {
  if (!supabase) {
    return buildEmptyBalanceSheet(scope);
  }

  // Use current_balance maintained by the update_account_balance trigger
  let query = supabase
    .from('ledger_accounts')
    .select('code, type, current_balance, venture_id');

  if (scope.ventureId) {
    query = query.eq('venture_id', scope.ventureId);
  }

  const { data: accounts, error } = await query;

  if (error || !accounts) {
    return buildEmptyBalanceSheet(scope);
  }

  // Initialize section accumulators
  const currentAssets: CurrentAssets = {
    cashAndEquivalents: 0,
    accountsReceivable: 0,
    inventory: 0,
    creditsReceivable: 0,
    loansReceivable: 0,
    prepaidExpenses: 0,
    total: 0,
  };

  const nonCurrentAssets: NonCurrentAssets = {
    equipment: 0,
    investments: 0,
    tokenTreasury: 0,
    total: 0,
  };

  const currentLiabilities: CurrentLiabilities = {
    accountsPayable: 0,
    creditsPayable: 0,
    unearnedRevenue: 0,
    taxPayable: 0,
    refundsPayable: 0,
    total: 0,
  };

  const nonCurrentLiabilities: NonCurrentLiabilities = {
    loansPayable: 0,
    total: 0,
  };

  const equity: Equity = {
    ownersEquity: 0,
    retainedEarnings: 0,
    tokenTreasury: 0,
    totalEquity: 0,
  };

  for (const acc of accounts as Array<{ code: string; type: string; current_balance: number }>) {
    const code = acc.code;
    const balance = acc.current_balance ?? 0;
    const codeNum = parseInt(code, 10);

    if (acc.type === 'asset') {
      // Current assets (1010–1059)
      if (isInRange(code, 1010, 1015)) currentAssets.cashAndEquivalents += balance;
      else if (isInRange(code, 1020, 1025)) currentAssets.accountsReceivable += balance;
      else if (codeNum === 1030) currentAssets.inventory += balance;
      else if (isInRange(code, 1031, 1035)) currentAssets.creditsReceivable += balance;
      else if (isInRange(code, 1036, 1040)) currentAssets.loansReceivable += balance;
      else if (isInRange(code, 1050, 1059)) currentAssets.prepaidExpenses += balance;
      // Non-current assets (1060+)
      else if (isInRange(code, 1060, 1089)) nonCurrentAssets.equipment += balance;
      else if (isInRange(code, 1090, 1099)) nonCurrentAssets.investments += balance;
      else if (isInRange(code, 1200, 1299)) nonCurrentAssets.tokenTreasury += balance;
    } else if (acc.type === 'liability') {
      // Current liabilities (2010–2059)
      if (isInRange(code, 2010, 2019)) currentLiabilities.accountsPayable += balance;
      else if (isInRange(code, 2020, 2029)) currentLiabilities.creditsPayable += balance;
      else if (isInRange(code, 2030, 2039)) currentLiabilities.unearnedRevenue += balance;
      else if (isInRange(code, 2040, 2049)) currentLiabilities.taxPayable += balance;
      else if (isInRange(code, 2050, 2059)) currentLiabilities.refundsPayable += balance;
      // Non-current liabilities (2100+)
      else if (isInRange(code, 2100, 2199)) nonCurrentLiabilities.loansPayable += balance;
    } else if (acc.type === 'equity') {
      if (isInRange(code, 3010, 3019)) equity.ownersEquity += balance;
      else if (isInRange(code, 3020, 3029)) equity.retainedEarnings += balance;
      else if (isInRange(code, 3030, 3099)) equity.tokenTreasury += balance;
    }
    // Revenue (4xxx) and Expense (5xxx/6xxx) accounts are P&L — not on balance sheet directly
    // (retained earnings captures their net effect)
  }

  // Compute totals
  currentAssets.total = sumFields(currentAssets, ['cashAndEquivalents', 'accountsReceivable', 'inventory', 'creditsReceivable', 'loansReceivable', 'prepaidExpenses']);
  nonCurrentAssets.total = sumFields(nonCurrentAssets, ['equipment', 'investments', 'tokenTreasury']);
  currentLiabilities.total = sumFields(currentLiabilities, ['accountsPayable', 'creditsPayable', 'unearnedRevenue', 'taxPayable', 'refundsPayable']);
  nonCurrentLiabilities.total = sumFields(nonCurrentLiabilities, ['loansPayable']);
  equity.totalEquity = sumFields(equity, ['ownersEquity', 'retainedEarnings', 'tokenTreasury']);

  const totalAssets = currentAssets.total + nonCurrentAssets.total;
  const totalLiabilities = currentLiabilities.total + nonCurrentLiabilities.total;

  const TOLERANCE = 0.01;
  const balanced = Math.abs(totalAssets - (totalLiabilities + equity.totalEquity)) < TOLERANCE;

  return {
    scope,
    assets: { current: currentAssets, nonCurrent: nonCurrentAssets },
    totalAssets,
    liabilities: { current: currentLiabilities, nonCurrent: nonCurrentLiabilities },
    totalLiabilities,
    equity,
    balanced,
    generatedAt: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────
// GENERATE CASH FLOW STATEMENT
// ─────────────────────────────────────────────────────────

export async function generateCashFlow(scope: ReportScope): Promise<CashFlowStatement> {
  if (!supabase) {
    return buildEmptyCashFlow(scope);
  }

  // Step 1: Get net income from P&L
  const incomeStatement = await generateIncomeStatement(scope);
  const netIncome = incomeStatement.netIncome;

  // Step 2: Query balance changes in working capital accounts for the period
  // We need beginning and ending balances for AR, AP, inventory, unearned revenue, credits payable
  // Strategy: sum journal entry lines for each account code in the period

  const workingCapitalQuery = async (accountCodes: string[], useCredit: boolean): Promise<number> => {
    let q = supabase!
      .from('journal_entry_lines')
      .select(`
        debit_amount,
        credit_amount,
        ledger_accounts!inner(code, venture_id),
        journal_entries!inner(status, entry_date, venture_id)
      `)
      .eq('journal_entries.status', 'posted')
      .gte('journal_entries.entry_date', scope.dateRange.start)
      .lte('journal_entries.entry_date', scope.dateRange.end)
      .in('ledger_accounts.code', accountCodes);

    if (scope.ventureId) {
      q = q.eq('journal_entries.venture_id', scope.ventureId);
    }

    const { data } = await q;
    if (!data) return 0;

    return (data as Array<{ debit_amount: number; credit_amount: number }>).reduce((sum, line) => {
      // For asset accounts: increase in balance = cash outflow (negative)
      // For liability accounts: increase in balance = cash inflow (positive)
      const delta = useCredit
        ? (line.credit_amount ?? 0) - (line.debit_amount ?? 0)  // liability / unearned
        : (line.debit_amount ?? 0) - (line.credit_amount ?? 0); // asset
      return sum - delta; // negate: increase in asset = negative OCF adjustment
    }, 0);
  };

  // Operating adjustments (run in parallel)
  const [arChange, apChange, inventoryChange, unearnedChange, creditsPayableChange] = await Promise.all([
    workingCapitalQuery(['1020', '1021', '1022', '1023', '1024', '1025'], false), // AR
    workingCapitalQuery(['2010', '2011', '2012', '2013', '2014', '2015'], true),  // AP
    workingCapitalQuery(['1030'], false),                                           // Inventory
    workingCapitalQuery(['2030', '2031', '2032', '2033'], true),                  // Unearned revenue
    workingCapitalQuery(['2020', '2021', '2022'], true),                           // Credits payable
  ]);

  const netOperatingCashFlow = netIncome + arChange + apChange + inventoryChange + unearnedChange + creditsPayableChange;

  // Step 3: Investing activities — changes in equipment and investment accounts
  const investingQuery = async (accountCodes: string[]): Promise<number> => {
    let q = supabase!
      .from('journal_entry_lines')
      .select(`
        debit_amount,
        credit_amount,
        ledger_accounts!inner(code, venture_id),
        journal_entries!inner(status, entry_date, venture_id)
      `)
      .eq('journal_entries.status', 'posted')
      .gte('journal_entries.entry_date', scope.dateRange.start)
      .lte('journal_entries.entry_date', scope.dateRange.end)
      .in('ledger_accounts.code', accountCodes);

    if (scope.ventureId) {
      q = q.eq('journal_entries.venture_id', scope.ventureId);
    }

    const { data } = await q;
    if (!data) return 0;

    return (data as Array<{ debit_amount: number; credit_amount: number }>).reduce((sum, line) => {
      const net = (line.debit_amount ?? 0) - (line.credit_amount ?? 0);
      return sum - net; // increase in asset = cash outflow
    }, 0);
  };

  // Equipment purchases (1060–1089) and investment activity (1090–1099)
  const [equipmentChange, investmentChange] = await Promise.all([
    investingQuery(['1060', '1061', '1062', '1063', '1064', '1065', '1066', '1067', '1068', '1069', '1070', '1080', '1081', '1082', '1083', '1084', '1085', '1086', '1087', '1088', '1089']),
    investingQuery(['1090', '1091', '1092', '1093', '1094', '1095', '1096', '1097', '1098', '1099']),
  ]);

  const equipmentPurchases = Math.min(0, equipmentChange); // negative = purchases
  const investmentPurchases = Math.min(0, investmentChange);
  const investmentSales = Math.max(0, investmentChange);
  const netInvestingCashFlow = equipmentPurchases + investmentPurchases + investmentSales;

  // Step 4: Financing — loan payable changes and equity changes
  const financingQuery = async (accountCodes: string[], isLiability: boolean): Promise<number> => {
    let q = supabase!
      .from('journal_entry_lines')
      .select(`
        debit_amount,
        credit_amount,
        ledger_accounts!inner(code, venture_id),
        journal_entries!inner(status, entry_date, venture_id)
      `)
      .eq('journal_entries.status', 'posted')
      .gte('journal_entries.entry_date', scope.dateRange.start)
      .lte('journal_entries.entry_date', scope.dateRange.end)
      .in('ledger_accounts.code', accountCodes);

    if (scope.ventureId) {
      q = q.eq('journal_entries.venture_id', scope.ventureId);
    }

    const { data } = await q;
    if (!data) return 0;

    return (data as Array<{ debit_amount: number; credit_amount: number }>).reduce((sum, line) => {
      const net = isLiability
        ? (line.credit_amount ?? 0) - (line.debit_amount ?? 0) // increase in liability = cash inflow
        : (line.credit_amount ?? 0) - (line.debit_amount ?? 0); // increase in equity = inflow
      return sum + net;
    }, 0);
  };

  const [loanChange, equityChange] = await Promise.all([
    financingQuery(['2100', '2101', '2102', '2103', '2104', '2105', '2110', '2120', '2130', '2140', '2150', '2160', '2170', '2180', '2190', '2199'], true),
    financingQuery(['3010', '3020', '3030'], false),
  ]);

  const loanProceeds = Math.max(0, loanChange);
  const loanRepayments = Math.abs(Math.min(0, loanChange));
  const equityContributions = Math.max(0, equityChange);
  const equityDistributions = Math.abs(Math.min(0, equityChange));
  const netFinancingCashFlow = loanProceeds - loanRepayments + equityContributions - equityDistributions;

  // Step 5: Beginning cash — sum cash accounts at period start
  const cashAccountCodes = ['1010', '1011', '1012', '1013', '1014', '1015'];

  let cashQuery = supabase
    .from('ledger_accounts')
    .select('current_balance, code')
    .in('code', cashAccountCodes);

  if (scope.ventureId) {
    cashQuery = cashQuery.eq('venture_id', scope.ventureId);
  }

  const { data: cashAccounts } = await cashQuery;
  const endingCash = (cashAccounts as Array<{ current_balance: number }> | null)
    ?.reduce((sum, acc) => sum + (acc.current_balance ?? 0), 0) ?? 0;

  const netCashChange = netOperatingCashFlow + netInvestingCashFlow + netFinancingCashFlow;
  const beginningCash = endingCash - netCashChange;

  return {
    scope,
    operating: {
      netIncome,
      adjustments: {
        depreciation: 0, // would require separate depreciation schedule query
        arChange,
        apChange,
        inventoryChange,
        unearnedRevenueChange: unearnedChange,
        creditsPayableChange,
        other: 0,
      },
      netOperatingCashFlow,
    },
    investing: {
      equipmentPurchases,
      investmentPurchases,
      investmentSales,
      netInvestingCashFlow,
    },
    financing: {
      loanProceeds,
      loanRepayments,
      equityContributions,
      equityDistributions,
      netFinancingCashFlow,
    },
    netCashChange,
    beginningCash,
    endingCash,
    generatedAt: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────
// EMPTY STATEMENT BUILDERS (returned when Supabase is null)
// ─────────────────────────────────────────────────────────

function buildEmptyIncomeStatement(scope: ReportScope): IncomeStatement {
  return {
    scope,
    revenue: { subscriptions: 0, oneTimeSales: 0, digitalProducts: 0, physicalGoods: 0, platformFees: 0, transactionFees: 0, creditSales: 0, loanInterest: 0, marketplaceCommissions: 0, meteredUsage: 0, services: 0, total: 0 },
    costOfRevenue: { physicalGoodsCost: 0, digitalDeliveryCost: 0, paymentProcessingFees: 0, refundsAndChargebacks: 0, total: 0 },
    grossProfit: 0,
    grossMargin: 0,
    operatingExpenses: { infrastructure: 0, thirdPartyServices: 0, creditGrants: 0, loanWriteoffs: 0, total: 0 },
    operatingIncome: 0,
    netIncome: 0,
    generatedAt: new Date().toISOString(),
  };
}

function buildEmptyBalanceSheet(scope: ReportScope): BalanceSheet {
  return {
    scope,
    assets: {
      current: { cashAndEquivalents: 0, accountsReceivable: 0, inventory: 0, creditsReceivable: 0, loansReceivable: 0, prepaidExpenses: 0, total: 0 },
      nonCurrent: { equipment: 0, investments: 0, tokenTreasury: 0, total: 0 },
    },
    totalAssets: 0,
    liabilities: {
      current: { accountsPayable: 0, creditsPayable: 0, unearnedRevenue: 0, taxPayable: 0, refundsPayable: 0, total: 0 },
      nonCurrent: { loansPayable: 0, total: 0 },
    },
    totalLiabilities: 0,
    equity: { ownersEquity: 0, retainedEarnings: 0, tokenTreasury: 0, totalEquity: 0 },
    balanced: true,
    generatedAt: new Date().toISOString(),
  };
}

function buildEmptyCashFlow(scope: ReportScope): CashFlowStatement {
  return {
    scope,
    operating: { netIncome: 0, adjustments: { depreciation: 0, arChange: 0, apChange: 0, inventoryChange: 0, unearnedRevenueChange: 0, creditsPayableChange: 0, other: 0 }, netOperatingCashFlow: 0 },
    investing: { equipmentPurchases: 0, investmentPurchases: 0, investmentSales: 0, netInvestingCashFlow: 0 },
    financing: { loanProceeds: 0, loanRepayments: 0, equityContributions: 0, equityDistributions: 0, netFinancingCashFlow: 0 },
    netCashChange: 0,
    beginningCash: 0,
    endingCash: 0,
    generatedAt: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────
// UTILITY — sum specific keys of a record
// ─────────────────────────────────────────────────────────

function sumFields<T extends Record<string, number>>(obj: T, keys: (keyof T)[]): number {
  return keys.reduce((sum, k) => sum + (obj[k] ?? 0), 0);
}
