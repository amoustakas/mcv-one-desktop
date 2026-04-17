// src/hooks/use-venture-corporate-stack.ts
import { useQuery } from '@tanstack/react-query';

interface Jurisdiction { venture_id: string; jurisdiction_code: string; regulatory_frameworks: string[]; tax_structure: string | null }
interface VAccount { id: string; venture_id: string; account_type: string; provider: string; currency: string; balance_cached: number | null }
interface BrandKit { venture_id: string; primary_domain: string | null; color_primary: string | null; color_accent: string | null; brand_kit_version: string | null }

async function callVentureStack<T>(action: string, ventureId?: string): Promise<T> {
  const res = await fetch('/api/venture-stack', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action, ventureId }),
  });
  if (!res.ok) throw new Error(`venture-stack ${action} failed: ${res.status}`);
  return res.json();
}

export function useVentureCorporateStack(ventureId: string | null) {
  const jurisdictions = useQuery({
    queryKey: ['venture-stack', 'jurisdictions', ventureId],
    queryFn: () => callVentureStack<{ jurisdictions: Jurisdiction[] }>('list-jurisdictions', ventureId!),
    enabled: !!ventureId,
  });
  const accounts = useQuery({
    queryKey: ['venture-stack', 'accounts', ventureId],
    queryFn: () => callVentureStack<{ accounts: VAccount[] }>('list-accounts', ventureId!),
    enabled: !!ventureId,
  });
  const brandKit = useQuery({
    queryKey: ['venture-stack', 'brand-kit', ventureId],
    queryFn: () => callVentureStack<{ brandKit: BrandKit | null }>('get-brand-kit', ventureId!),
    enabled: !!ventureId,
  });

  return {
    jurisdictions: jurisdictions.data?.jurisdictions ?? [],
    accounts: accounts.data?.accounts ?? [],
    brandKit: brandKit.data?.brandKit ?? null,
    isLoading: jurisdictions.isLoading || accounts.isLoading || brandKit.isLoading,
  };
}
