// src/hooks/use-factory-heartbeat.ts
// Polls the Factory heartbeat endpoint every 5s. Used by Command Center tile.

import { useQuery } from '@tanstack/react-query';
import { factory_client, type FactoryHeartbeat } from '../lib/factory-client';

export function useFactoryHeartbeat(opts?: { poll_ms?: number; enabled?: boolean }) {
  return useQuery({
    queryKey: ['factory', 'heartbeat'],
    queryFn: () => factory_client.heartbeat(),
    refetchInterval: opts?.poll_ms ?? 5_000,
    staleTime: 4_000,
    retry: 1,
    enabled: opts?.enabled ?? true,
  });
}

export type { FactoryHeartbeat };
