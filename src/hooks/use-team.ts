import { useQuery } from '@tanstack/react-query';
import * as api from '../lib/api/team';

export const teamKeys = {
  list: () => ['team', 'list'] as const,
  member: (id: string) => ['team', id] as const,
};

export function useTeamMembers() {
  return useQuery({
    queryKey: teamKeys.list(),
    queryFn: () => api.listTeamMembers().then(r => r.members),
    staleTime: 60_000,
  });
}

export function useTeamMember(id: string) {
  return useQuery({
    queryKey: teamKeys.member(id),
    queryFn: () => api.getTeamMember(id).then(r => r.member),
    enabled: !!id,
  });
}
