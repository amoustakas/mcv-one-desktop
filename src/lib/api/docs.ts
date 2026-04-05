import { apiPost } from './client';
import type { Document } from '../schemas/docs';

const EP = '/api/docs';

export async function listDocuments(ventureId?: string, docType?: string) {
  return apiPost<{ documents: Document[] }>(EP, { action: 'list', venture_id: ventureId, doc_type: docType });
}

export async function getDocument(id: string) {
  return apiPost<{ document: Document }>(EP, { action: 'get', id });
}

export async function createDocument(doc: { title: string; content?: string; venture_id?: string; doc_type?: string; metadata?: Record<string, unknown> }) {
  return apiPost<{ document: Document }>(EP, { action: 'create', ...doc });
}

export async function updateDocument(id: string, updates: Partial<Document>) {
  return apiPost<{ document: Document }>(EP, { action: 'update', id, ...updates });
}

export async function deleteDocument(id: string) {
  return apiPost<{ success: boolean }>(EP, { action: 'delete', id });
}

export async function searchDocuments(query: string, ventureId?: string) {
  return apiPost<{ documents: Document[] }>(EP, { action: 'search', query, venture_id: ventureId });
}

export async function askDocuments(question: string, ventureId?: string) {
  return apiPost<{ answer: string; sources: Document[] }>(EP, { action: 'ask', question, venture_id: ventureId });
}
