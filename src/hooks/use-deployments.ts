import { useQuery } from '@tanstack/react-query';
import * as api from '../lib/api/vercel';

export const vercelKeys = {
  deployments: () => ['vercel', 'deployments'] as const,
  projects: () => ['vercel', 'projects'] as const,
};

export function useDeployments() {
  return useQuery({
    queryKey: vercelKeys.deployments(),
    queryFn: () => api.listDeployments().then(r => r.deployments),
  });
}

export function useVercelProjects() {
  return useQuery({
    queryKey: vercelKeys.projects(),
    queryFn: () => api.listProjects().then(r => r.projects),
    staleTime: 60_000,
  });
}
