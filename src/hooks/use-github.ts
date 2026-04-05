import { useQuery } from '@tanstack/react-query';
import * as api from '../lib/api/github';

export const githubKeys = {
  repos: () => ['github', 'repos'] as const,
  prs: (repo?: string) => ['github', 'prs', repo] as const,
  commits: (repo?: string) => ['github', 'commits', repo] as const,
  overview: () => ['github', 'overview'] as const,
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
