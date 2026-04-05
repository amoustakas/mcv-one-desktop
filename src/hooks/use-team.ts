import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../lib/api/team';
import type { TeamMember } from '../lib/api/team';

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

export function useCreateTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (member: Partial<TeamMember>) => api.createTeamMember(member),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['team'] }); },
  });
}

export function useUpdateTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (member: Partial<TeamMember> & { id: string }) => api.updateTeamMember(member),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['team'] }); },
  });
}

export function useDeleteTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteTeamMember(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['team'] }); },
  });
}

export function useAssignVentures() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, venture_assignments }: { id: string; venture_assignments: string[] }) =>
      api.assignVentures(id, venture_assignments),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['team'] }); },
  });
}
