import { apiGet } from './client';

export interface Deployment {
  uid: string;
  name: string;
  url: string;
  state: string;
  created: number;
  target?: string;
  ready?: number;
  meta?: { githubCommitMessage?: string };
}

export interface VercelProject {
  id: string;
  name: string;
  framework: string;
  updatedAt: number;
}

export async function listDeployments() {
  return apiGet<{ deployments: Deployment[] }>('/api/vercel-status', { action: 'deployments' });
}

export async function listProjects() {
  return apiGet<{ projects: VercelProject[] }>('/api/vercel-status', { action: 'projects' });
}
