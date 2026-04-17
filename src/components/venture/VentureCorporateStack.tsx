import { useVentureCorporateStack } from '../../hooks/use-venture-corporate-stack';
import { CorpsBlock } from './CorpsBlock';
import { JurisdictionsBlock } from './JurisdictionsBlock';
import { AccountsBlock } from './AccountsBlock';
import { TeamBlock } from './TeamBlock';
import { BrandBlock } from './BrandBlock';

interface Props { ventureId: string | null }

export function VentureCorporateStack({ ventureId }: Props) {
  const { jurisdictions, accounts, brandKit, isLoading } = useVentureCorporateStack(ventureId);

  if (!ventureId) return null;
  if (isLoading) return <div style={{ padding: 12, color: 'var(--text-muted)' }}>Loading corporate stack…</div>;

  // Corps derived from jurisdictions tax_structure for v1 — richer corps fetch lands in follow-up.
  const corps = jurisdictions.map((j) => ({ name: `${ventureId} · ${j.tax_structure ?? 'entity'}`, jurisdiction: j.jurisdiction_code }));
  const team: Array<{ name: string; role?: string }> = []; // Team fetch wires in T5 (personas)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 12 }}>
      <CorpsBlock corps={corps} />
      <JurisdictionsBlock jurisdictions={jurisdictions} />
      <AccountsBlock accounts={accounts} />
      <TeamBlock team={team} />
      <BrandBlock brand={brandKit} />
    </div>
  );
}
