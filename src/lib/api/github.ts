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

// ---------------------------------------------------------------------------
// Repository Browsing (Phase B)
// ---------------------------------------------------------------------------

export interface GitTreeEntry {
  path: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
}

export interface GitFileContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  content: string;
  encoding: string;
}

export interface GitBranch {
  name: string;
  sha: string;
  protected: boolean;
}

export interface PRFile {
  filename: string;
  status: 'added' | 'removed' | 'modified' | 'renamed';
  additions: number;
  deletions: number;
  patch?: string;
}

export interface CommitDetail {
  sha: string;
  message: string;
  author: string;
  date: string;
  stats: { additions: number; deletions: number; total: number };
  files: PRFile[];
}

export async function listBranches(repo?: string) {
  return apiGet<{ branches: GitBranch[] }>('/api/github', { action: 'branches', repo });
}

export async function getTree(repo: string, branch?: string) {
  return apiGet<{ tree: GitTreeEntry[]; sha: string; truncated: boolean }>('/api/github', { action: 'tree', repo, branch });
}

export async function getFileContent(repo: string, path: string, branch?: string) {
  return apiGet<GitFileContent>('/api/github', { action: 'file', repo, path, branch });
}

export async function getPRFiles(repo: string, pr: string) {
  return apiGet<{ files: PRFile[] }>('/api/github', { action: 'pr-files', repo, pr });
}

export async function getCommitDetail(repo: string, sha: string) {
  return apiGet<CommitDetail>('/api/github', { action: 'commit-detail', repo, sha });
}
