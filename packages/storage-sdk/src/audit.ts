import type { AuditAction, AuditEntry, StorageItem } from './types';

const API_BASE = '/api/storage-audit';

/**
 * Log an audit entry for a file operation.
 * Fire-and-forget — doesn't block the calling operation.
 */
export function logAudit(params: {
  fileId: string;
  action: AuditAction;
  provider: string;
  userId?: string;
  ventureId?: string;
  details?: Record<string, unknown>;
  previousState?: Partial<StorageItem>;
}): void {
  // Fire and forget — don't await
  fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'log',
      file_id: params.fileId,
      audit_action: params.action,
      provider: params.provider,
      user_id: params.userId || 'local-user',
      venture_id: params.ventureId,
      details: params.details || {},
      previous_state: params.previousState,
    }),
  }).catch(() => {
    // Silently fail — audit shouldn't break operations
  });
}

/**
 * Fetch audit entries for a specific file.
 */
export async function getFileAuditLog(fileId: string, limit = 20): Promise<AuditEntry[]> {
  const res = await fetch(`${API_BASE}?action=list&file_id=${fileId}&limit=${limit}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.entries || [];
}

/**
 * Fetch audit entries with filters.
 */
export async function searchAuditLog(params: {
  userId?: string;
  ventureId?: string;
  action?: AuditAction;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}): Promise<AuditEntry[]> {
  const query = new URLSearchParams({ action: 'search', ...Object.fromEntries(Object.entries(params).filter(([_, v]) => v != null).map(([k, v]) => [k, String(v)])) });
  const res = await fetch(`${API_BASE}?${query}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.entries || [];
}
