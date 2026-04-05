/**
 * MCV One Desktop — Docker Hooks
 *
 * TanStack Query hooks for Docker container monitoring.
 * Only enabled when the local server is connected.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalStore } from '../lib/local';
import {
  listContainers,
  getStats,
  getContainerLogs,
  containerAction,
  listImages,
  listVolumes,
  listNetworks,
  composeAction,
  type DockerContainersResponse,
  type DockerStats,
  type ContainerAction,
  type ComposeAction,
} from '../lib/docker';

/** List all containers — polls every 10s when local server is connected */
export function useDockerContainers() {
  const connected = useLocalStore((s) => s.connected);
  return useQuery<DockerContainersResponse>({
    queryKey: ['docker', 'containers'],
    queryFn: listContainers,
    enabled: connected,
    refetchInterval: 10_000,
    staleTime: 8_000,
    retry: 1,
  });
}

/** Live stats (CPU/memory) — polls every 5s */
export function useDockerStats() {
  const connected = useLocalStore((s) => s.connected);
  return useQuery<{ stats: DockerStats[] }>({
    queryKey: ['docker', 'stats'],
    queryFn: getStats,
    enabled: connected,
    refetchInterval: 5_000,
    staleTime: 4_000,
    retry: 1,
  });
}

/** Container logs */
export function useDockerLogs(containerId: string, tail = 100) {
  const connected = useLocalStore((s) => s.connected);
  return useQuery({
    queryKey: ['docker', 'logs', containerId, tail],
    queryFn: () => getContainerLogs(containerId, tail),
    enabled: connected && !!containerId,
    staleTime: 5_000,
  });
}

/** Docker images */
export function useDockerImages() {
  const connected = useLocalStore((s) => s.connected);
  return useQuery({
    queryKey: ['docker', 'images'],
    queryFn: listImages,
    enabled: connected,
    staleTime: 60_000,
  });
}

/** Docker volumes */
export function useDockerVolumes() {
  const connected = useLocalStore((s) => s.connected);
  return useQuery({
    queryKey: ['docker', 'volumes'],
    queryFn: listVolumes,
    enabled: connected,
    staleTime: 60_000,
  });
}

/** Docker networks */
export function useDockerNetworks() {
  const connected = useLocalStore((s) => s.connected);
  return useQuery({
    queryKey: ['docker', 'networks'],
    queryFn: listNetworks,
    enabled: connected,
    staleTime: 60_000,
  });
}

/** Container action mutation (start/stop/restart/pause/unpause) */
export function useContainerAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ containerId, action }: { containerId: string; action: ContainerAction }) =>
      containerAction(containerId, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['docker', 'containers'] });
      queryClient.invalidateQueries({ queryKey: ['docker', 'stats'] });
    },
  });
}

/** Docker compose action mutation */
export function useComposeAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ action, cwd }: { action: ComposeAction; cwd?: string }) =>
      composeAction(action, cwd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['docker'] });
    },
  });
}
