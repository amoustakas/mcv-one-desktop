import { apiPost } from './client';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url: string;
  venture_ids: string[];
  status: string;
  created_at: string;
}

const EP = '/api/team';

export async function listTeamMembers() {
  return apiPost<{ members: TeamMember[] }>(EP, { action: 'list' });
}

export async function getTeamMember(id: string) {
  return apiPost<{ member: TeamMember }>(EP, { action: 'get', id });
}

export async function createTeamMember(member: Partial<TeamMember>) {
  return apiPost<{ member: TeamMember }>(EP, { action: 'create', member });
}

export async function updateTeamMember(member: Partial<TeamMember> & { id: string }) {
  return apiPost<{ member: TeamMember }>(EP, { action: 'update', member });
}

export async function deleteTeamMember(id: string) {
  return apiPost<{ success: boolean }>(EP, { action: 'delete', id });
}

export async function assignVentures(id: string, venture_assignments: string[]) {
  return apiPost<{ member: TeamMember }>(EP, { action: 'assign-ventures', id, venture_assignments });
}
