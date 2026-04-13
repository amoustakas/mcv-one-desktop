import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ---------------------------------------------------------------------------
// Twilio React Query hooks
// Direct hooks for SMS, voice, WhatsApp, verify, lookup via /api/twilio
// ---------------------------------------------------------------------------

async function twilioApi(action: string, params: Record<string, unknown> = {}, method: 'GET' | 'POST' = 'GET') {
  const base = '/api/twilio';
  if (method === 'GET') {
    const qs = new URLSearchParams({ action, ...Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])) }).toString();
    const res = await fetch(`${base}?${qs}`);
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `Twilio ${res.status}`); }
    return res.json();
  }
  const res = await fetch(base, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...params }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `Twilio ${res.status}`); }
  return res.json();
}

// ── Account ──
export function useTwilioAccount() {
  return useQuery({
    queryKey: ['twilio', 'account'],
    queryFn: () => twilioApi('get-account'),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useTwilioBalance() {
  return useQuery({
    queryKey: ['twilio', 'balance'],
    queryFn: () => twilioApi('get-balance'),
    staleTime: 60_000,
    retry: 1,
  });
}

// ── SMS ──
export function useRecentMessages(limit = 25) {
  return useQuery({
    queryKey: ['twilio', 'messages', limit],
    queryFn: () => twilioApi('list-messages', { pageSize: limit }),
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: 1,
  });
}

export function useSendSms() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { to: string; body: string; from?: string }) => twilioApi('send-message', params, 'POST'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['twilio', 'messages'] }),
  });
}

// ── Voice Calls ──
export function useRecentCalls(limit = 25) {
  return useQuery({
    queryKey: ['twilio', 'calls', limit],
    queryFn: () => twilioApi('list-calls', { pageSize: limit }),
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: 1,
  });
}

export function useMakeCall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { to: string; twiml?: string; url?: string; from?: string }) =>
      twilioApi('make-call', params, 'POST'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['twilio', 'calls'] }),
  });
}

// ── WhatsApp ──
export function useSendWhatsApp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { to: string; body: string }) => twilioApi('send-whatsapp', params, 'POST'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['twilio', 'messages'] }),
  });
}

// ── Phone Lookup ──
export function usePhoneLookup(phone?: string) {
  return useQuery({
    queryKey: ['twilio', 'lookup', phone],
    queryFn: () => twilioApi('lookup', { phone }),
    enabled: !!phone && phone.length > 5,
    staleTime: 24 * 60 * 60 * 1000, // 1 day
    retry: 1,
  });
}

// ── Verify ──
export function useSendVerify() {
  return useMutation({
    mutationFn: (params: { to: string; channel?: 'sms' | 'call' }) =>
      twilioApi('verify-start', params, 'POST'),
  });
}

export function useCheckVerify() {
  return useMutation({
    mutationFn: (params: { to: string; code: string }) => twilioApi('verify-check', params, 'POST'),
  });
}

// ── Phone Numbers ──
export function useOwnedNumbers() {
  return useQuery({
    queryKey: ['twilio', 'numbers'],
    queryFn: () => twilioApi('list-numbers'),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
