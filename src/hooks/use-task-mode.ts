import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '../lib/api/client';

// ── Types ──────────────────────────────────────────────────────────────────
export type TaskMode = 'human' | 'agent' | 'hybrid';

export interface UpdateTaskModeInput {
  taskId: string;
  mode: TaskMode;
}

export interface UpdatedTask {
  id: string;
  mode: TaskMode;
  title: string;
  status: string;
  updated_at: string;
  [key: string]: unknown;
}

// ── Hooks ──────────────────────────────────────────────────────────────────

/**
 * Update a task's execution mode (human | agent | hybrid).
 * camelCase `taskId` input is translated to snake_case `task_id` on the wire.
 */
export function useUpdateTaskMode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      taskId,
      mode,
    }: UpdateTaskModeInput): Promise<{ task: UpdatedTask }> => {
      return apiPost<{ task: UpdatedTask }>('/api/tasks', {
        action: 'update_task_mode',
        task_id: taskId,
        mode,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
