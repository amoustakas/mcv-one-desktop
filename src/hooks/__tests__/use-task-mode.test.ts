import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/api/client', () => ({
  apiPost: vi.fn(async () => ({ task: { id: 't1', mode: 'agent', title: 'x', status: 'open', updated_at: 'now' } })),
}));

const invalidateQueries = vi.fn();
vi.mock('@tanstack/react-query', () => ({
  useMutation: (opts: { mutationFn: (v: unknown) => Promise<unknown>; onSuccess?: () => void }) => ({
    mutateAsync: async (v: unknown) => {
      const result = await opts.mutationFn(v);
      opts.onSuccess?.();
      return result;
    },
  }),
  useQueryClient: () => ({ invalidateQueries }),
}));

import { apiPost } from '../../lib/api/client';
import { useUpdateTaskMode } from '../use-task-mode';

const mockedApiPost = apiPost as unknown as ReturnType<typeof vi.fn>;

describe('use-task-mode', () => {
  beforeEach(() => {
    mockedApiPost.mockClear();
    invalidateQueries.mockClear();
  });

  it('sends action=update_task_mode with camelCase taskId translated to snake_case task_id', async () => {
    const m = useUpdateTaskMode() as unknown as { mutateAsync: (v: unknown) => Promise<unknown> };
    await m.mutateAsync({ taskId: 'task-42', mode: 'agent' });

    expect(mockedApiPost).toHaveBeenCalledTimes(1);
    expect(mockedApiPost).toHaveBeenCalledWith('/api/tasks', {
      action: 'update_task_mode',
      task_id: 'task-42',
      mode: 'agent',
    });
  });

  it('does not leak camelCase taskId onto the wire body', async () => {
    const m = useUpdateTaskMode() as unknown as { mutateAsync: (v: unknown) => Promise<unknown> };
    await m.mutateAsync({ taskId: 'task-99', mode: 'hybrid' });

    const body = mockedApiPost.mock.calls[0][1] as Record<string, unknown>;
    expect(body).not.toHaveProperty('taskId');
    expect(body.task_id).toBe('task-99');
    expect(body.mode).toBe('hybrid');
  });

  it('passes each mode value through unchanged (human|agent|hybrid)', async () => {
    const m = useUpdateTaskMode() as unknown as { mutateAsync: (v: unknown) => Promise<unknown> };
    for (const mode of ['human', 'agent', 'hybrid'] as const) {
      mockedApiPost.mockClear();
      await m.mutateAsync({ taskId: 'same', mode });
      const body = mockedApiPost.mock.calls[0][1] as Record<string, unknown>;
      expect(body.mode).toBe(mode);
    }
  });

  it('invalidates the tasks query cache on success', async () => {
    const m = useUpdateTaskMode() as unknown as { mutateAsync: (v: unknown) => Promise<unknown> };
    await m.mutateAsync({ taskId: 'task-1', mode: 'agent' });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['tasks'] });
  });
});
