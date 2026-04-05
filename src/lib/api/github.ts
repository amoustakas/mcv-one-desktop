import { apiGet } from './client';

export interface GithubRepo {
  name: string;
  full_name: string;
  html_url: string;
  description: string;
  language: string;
  updated_at: string;
  open_issues_count: number;
  stargazers_count: number;
}

export interface GithubPR {
  number: number;
  title: string;
  state: string;
  html_url: string;
  user: { login: string };
  created_at: string;
  updated_at: string;
}

export interface GithubCommit {
  sha: string;
  commit: { message: string; author: { name: string; date: string } };
  html_url: string;
}

export async function listRepos() {
  return apiGet<{ repos: GithubRepo[] }>('/api/github', { action: 'repos' });
}

export async function listPRs(repo?: string) {
  return apiGet<{ prs: GithubPR[] }>('/api/github', { action: 'prs', repo });
}

export async function listCommits(repo?: string) {
  return apiGet<{ commits: GithubCommit[] }>('/api/github', { action: 'commits', repo });
}

export async function getOverview() {
  return apiGet<{ overview: { repos: number; openPRs: number; openIssues: number } }>('/api/github', { action: 'overview' });
}
