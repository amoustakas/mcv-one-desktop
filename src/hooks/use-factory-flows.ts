// src/hooks/use-factory-flows.ts
import { useQuery } from '@tanstack/react-query';
import { factory_client, type FactoryFlow } from '../lib/factory-client';

export function useFactoryFlows() {
  return useQuery({
    queryKey: ['factory', 'flows'],
    queryFn: () => factory_client.list_flows(),
    staleTime: 60_000,
  });
}

export type { FactoryFlow };
