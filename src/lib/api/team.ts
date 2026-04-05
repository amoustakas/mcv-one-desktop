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
