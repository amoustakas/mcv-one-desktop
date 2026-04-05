import { useQuery } from '@tanstack/react-query';
import * as api from '../lib/api/github';

export const githubKeys = {
  repos: () => ['github', 'repos'] as const,
  prs: (repo?: string) => ['github', 'prs', repo] as const,
  commits: (repo?: string) => ['github', 'commits', repo] as const,
  overview: () => ['github', 'overview'] as const,
  branches: (repo: string) => ['github', 'branches', repo] as const,
  tree: (repo: string, branch?: string) => ['github', 'tree', repo, branch] as const,
  file: (repo: string, path: string, branch?: string) => ['github', 'file', repo, path, branch] as const,
  prFiles: (repo: string, pr: string) => ['github', 'pr-files', repo, pr] as const,
  commitDetail: (repo: string, sha: string) => ['github', 'commit-detail', repo, sha] as const,
};

export function useGithubRepos() {
  return useQuery({
    queryKey: githubKeys.repos(),
    queryFn: () => api.listRepos().then(r => r.repos),
    staleTime: 60_000, // repos change infrequently
  });
}

export function useGithubPRs(repo?: string) {
  return useQuery({
    queryKey: githubKeys.prs(repo),
    queryFn: () => api.listPRs(repo).then(r => r.prs),
  });
}

export function useGithubCommits(repo?: string) {
  return useQuery({
    queryKey: githubKeys.commits(repo),
    queryFn: () => api.listCommits(repo).then(r => r.commits),
  });
}

export function useGithubOverview() {
  return useQuery({
    queryKey: githubKeys.overview(),
    queryFn: () => api.getOverview().then(r => r.overview),
    staleTime: 60_000,
  });
}

// ---------------------------------------------------------------------------
// Repository Browsing Hooks (Phase B)
// ---------------------------------------------------------------------------

export function useGithubBranches(repo: string) {
  return useQuery({
    queryKey: githubKeys.branches(repo),
    queryFn: () => api.listBranches(repo).then(r => r.branches),
    staleTime: 120_000,
    enabled: !!repo,
  });
}

export function useGithubTree(repo: string, branch?: string) {
  return useQuery({
    queryKey: githubKeys.tree(repo, branch),
    queryFn: () => api.getTree(repo, branch),
    staleTime: 60_000,
    enabled: !!repo,
  });
}

export function useGithubFile(repo: string, path: string, branch?: string) {
  return useQuery({
    queryKey: githubKeys.file(repo, path, branch),
    queryFn: () => api.getFileContent(repo, path, branch),
    staleTime: 300_000, // files change less frequently
    enabled: !!repo && !!path,
  });
}

export function useGithubPRFiles(repo: string, pr: string) {
  return useQuery({
    queryKey: githubKeys.prFiles(repo, pr),
    queryFn: () => api.getPRFiles(repo, pr).then(r => r.files),
    enabled: !!repo && !!pr,
  });
}

export function useGithubCommitDetail(repo: string, sha: string) {
  return useQuery({
    queryKey: githubKeys.commitDetail(repo, sha),
    queryFn: () => api.getCommitDetail(repo, sha),
    enabled: !!repo && !!sha,
  });
}
