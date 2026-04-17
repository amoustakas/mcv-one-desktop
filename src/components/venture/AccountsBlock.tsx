import { StackBlock, Empty, lineStyle } from './_shell';

export function AccountsBlock({ accounts }: { accounts: Array<{ account_type: string; provider: string; currency: string; balance_cached: number | null }> }) {
  return (
    <StackBlock label="🏦 Accounts">
      {accounts.length === 0 ? <Empty /> : accounts.map((a, i) => (
        <div key={i} style={lineStyle}>
          {a.provider} <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>({a.account_type} · {a.currency})</span>
        </div>
      ))}
    </StackBlock>
  );
}
