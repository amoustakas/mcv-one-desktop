import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../lib/api/docs';
import type { Document } from '../lib/schemas/docs';

export const docKeys = {
  list: (ventureId?: string, docType?: string) => ['docs', ventureId, docType] as const,
  detail: (id: string) => ['docs', 'detail', id] as const,
  search: (query: string, ventureId?: string) => ['docs', 'search', query, ventureId] as const,
};

export function useDocuments(ventureId?: string, docType?: string) {
  return useQuery({
    queryKey: docKeys.list(ventureId, docType),
    queryFn: () => api.listDocuments(ventureId, docType).then(r => r.documents),
  });
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: docKeys.detail(id),
    queryFn: () => api.getDocument(id).then(r => r.document),
    enabled: !!id,
  });
}

export function useSearchDocuments(query: string, ventureId?: string) {
  return useQuery({
    queryKey: docKeys.search(query, ventureId),
    queryFn: () => api.searchDocuments(query, ventureId).then(r => r.documents),
    enabled: query.length >= 2,
  });
}

export function useCreateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createDocument,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['docs'] }); },
  });
}

export function useUpdateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...updates }: Partial<Document> & { id: string }) => api.updateDocument(id, updates),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['docs'] });
      qc.invalidateQueries({ queryKey: docKeys.detail(vars.id) });
    },
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteDocument(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['docs'] }); },
  });
}
