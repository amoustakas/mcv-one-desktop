/**
 * MCV One Desktop — Workflow Hooks
 *
 * TanStack Query hooks for triggering and monitoring durable workflows.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface WorkflowRunResponse {
  runId: string;
  workflow: string;
  [key: string]: unknown;
}

async function postWorkflow(action: string, body: Record<string, unknown> = {}): Promise<WorkflowRunResponse> {
  const res = await fetch('/api/workflows', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...body }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || 'Workflow failed');
  }
  return res.json();
}

async function getWorkflowRun(runId: string) {
  const res = await fetch(`/api/workflows?action=status&runId=${runId}`);
  if (!res.ok) throw new Error('Failed to fetch workflow run');
  return res.json();
}

// ── Deploy Pipeline ──
export function useDeployWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ venture, environment }: { venture: string; environment: 'preview' | 'production' }) =>
      postWorkflow('deploy', { venture, environment }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['docker'] });
      qc.invalidateQueries({ queryKey: ['pipeline'] });
    },
  });
}

// ── Docker Infrastructure ──
export function useDockerStartWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectDir, projectName }: { projectDir: string; projectName: string }) =>
      postWorkflow('docker-start', { projectDir, projectName }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['docker'] }),
  });
}

export function useDockerStopWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectDir, projectName }: { projectDir: string; projectName: string }) =>
      postWorkflow('docker-stop', { projectDir, projectName }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['docker'] }),
  });
}

export function useDockerHealthWorkflow() {
  return useMutation({
    mutationFn: () => postWorkflow('docker-health'),
  });
}

// ── Morning Brief ──
export function useMorningBriefWorkflow() {
  return useMutation({
    mutationFn: () => postWorkflow('morning-brief'),
  });
}

// ── HITL: Resume Hook (approve/reject) ──
export function useResumeHook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ token, data }: { token: string; data: Record<string, unknown> }) =>
      postWorkflow('resume-hook', { token, data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipeline'] });
    },
  });
}

// ── Query Run Status ──
export function useWorkflowRun(runId: string | null) {
  return useQuery({
    queryKey: ['workflow-run', runId],
    queryFn: () => getWorkflowRun(runId!),
    enabled: !!runId,
    refetchInterval: 3000, // Poll every 3s while active
    staleTime: 2000,
  });
}
