// React Query hooks for MCV Sign operator surface. Backs /api/sign.
//
// Three actions map to four hooks:
//   - useEnvelopes  : get-envelope w/ list=true  (inbox list)
//   - useEnvelope   : get-envelope w/ publicId   (detail drawer)
//   - useCreateEnvelope : create-envelope       (mutation)
//   - useAcceptSignature : accept-signature     (mutation — for local
//                       testing; Futurestate will call /api/sign
//                       directly from its signer page)

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '../lib/api/client';
import type {
  EnvelopeSummary,
  EnvelopeRow,
  GetEnvelopeOperatorResult,
  EnvelopeCreationResult,
} from '../lib/capital/sign/envelope';
import type { ApplySignatureResult } from '../lib/capital/sign/apply';

export type EnvelopeStatus = EnvelopeRow['status'];

export function useEnvelopes(opts: { ventureId?: string; status?: EnvelopeStatus[]; limit?: number } = {}) {
  return useQuery({
    queryKey: ['mcv-sign', 'envelopes', opts.ventureId ?? 'all', opts.status ?? 'any', opts.limit ?? 100],
    queryFn: async () => {
      const data = await apiPost<{ envelopes: EnvelopeSummary[] }>('/api/sign', {
        action: 'get-envelope',
        list: true,
        ventureId: opts.ventureId,
        status: opts.status,
        limit: opts.limit,
      });
      return data.envelopes;
    },
  });
}

export function useEnvelope(publicId: string | null | undefined) {
  return useQuery({
    queryKey: ['mcv-sign', 'envelope', publicId],
    queryFn: async () => {
      if (!publicId) return null;
      return apiPost<GetEnvelopeOperatorResult>('/api/sign', {
        action: 'get-envelope',
        publicId,
      });
    },
    enabled: Boolean(publicId),
  });
}

export interface CreateEnvelopeArgs {
  contentId: string;
  signers: Array<{ email: string; name?: string; role?: string; contactId?: string }>;
  ventureId?: string;
  commitmentId?: string;
  subject?: string;
  message?: string;
  expiresInDays?: number;
}

export function useCreateEnvelope() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: CreateEnvelopeArgs) => {
      const data = await apiPost<{ envelope: EnvelopeCreationResult }>('/api/sign', {
        action: 'create-envelope',
        ...args,
      });
      return data.envelope;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mcv-sign', 'envelopes'] }),
  });
}

export function useAcceptSignature() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { publicId: string; token: string; acceptedTerms: boolean }) => {
      return apiPost<ApplySignatureResult>('/api/sign', {
        action: 'accept-signature',
        ...args,
      });
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['mcv-sign', 'envelopes'] });
      qc.invalidateQueries({ queryKey: ['mcv-sign', 'envelope', vars.publicId] });
    },
  });
}
