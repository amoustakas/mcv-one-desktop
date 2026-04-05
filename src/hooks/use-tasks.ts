import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../lib/api/tasks';
import type { Task } from '../lib/schemas/tasks';

export const taskKeys = {
  list: (ventureId?: string, status?: string) => ['tasks', ventureId, status] as const,
  stats: () => ['tasks', 'stats'] as const,
};

export function useTasks(ventureId?: string, status?: string) {
  return useQuery({
    queryKey: taskKeys.list(ventureId, status),
    queryFn: () => api.listTasks(ventureId, status).then(r => r.tasks),
  });
}

export function useTaskStats() {
  return useQuery({
    queryKey: taskKeys.stats(),
    queryFn: () => api.getTaskStats(),
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (task: Partial<Task>) => api.createTask(task),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...updates }: Partial<Task> & { id: string }) => api.updateTask(id, updates),
    // Optimistic update for status changes
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ['tasks'] });
      const previous = qc.getQueriesData<Task[]>({ queryKey: ['tasks'] });
      qc.setQueriesData<Task[]>({ queryKey: ['tasks'] }, (old) =>
        old?.map(t => t.id === vars.id ? { ...t, ...vars } : t),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        for (const [key, data] of context.previous) {
          qc.setQueryData(key, data);
        }
      }
    },
    onSettled: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteTask(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); },
  });
}
