import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../lib/api/crm';
import type { Contact, Deal, Activity, Account } from '../lib/schemas/crm';
import { onDealStageChanged, onContactCreated } from '../lib/commerce-comms-bridge';

// ── Query Keys ──
export const crmKeys = {
  contacts: (ventureId?: string) => ['crm', 'contacts', ventureId] as const,
  contact: (id: string) => ['crm', 'contact', id] as const,
  deals: (ventureId?: string) => ['crm', 'deals', ventureId] as const,
  activities: (ventureId?: string) => ['crm', 'activities', ventureId] as const,
  accounts: (ventureId?: string) => ['crm', 'accounts', ventureId] as const,
  pipeline: (ventureId?: string) => ['crm', 'pipeline', ventureId] as const,
};

// ── Contacts ──
export function useContacts(ventureId?: string) {
  return useQuery({
    queryKey: crmKeys.contacts(ventureId),
    queryFn: () => api.listContacts(ventureId).then(r => r.contacts),
  });
}

export function useContact(id: string) {
  return useQuery({
    queryKey: crmKeys.contact(id),
    queryFn: () => api.getContact(id),
    enabled: !!id,
  });
}

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (contact: Partial<Contact>) => api.createContact(contact),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['crm', 'contacts'] });
      // Commerce-Comms Bridge: trigger welcome flow
      if (vars.name) {
        onContactCreated({ name: vars.name, email: vars.email, venture_id: vars.venture_id });
      }
    },
  });
}

export function useUpdateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (contact: Partial<Contact> & { id: string }) => api.updateContact(contact),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['crm', 'contacts'] });
      qc.invalidateQueries({ queryKey: crmKeys.contact(vars.id) });
    },
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteContact(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crm', 'contacts'] }); },
  });
}

// ── Deals ──
export function useDeals(ventureId?: string) {
  return useQuery({
    queryKey: crmKeys.deals(ventureId),
    queryFn: () => api.listDeals(ventureId).then(r => r.deals),
  });
}

export function useCreateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (deal: Partial<Deal>) => api.createDeal(deal),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crm', 'deals'] }); },
  });
}

export function useUpdateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (deal: Partial<Deal> & { id: string }) => api.updateDeal(deal),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['crm', 'deals'] });
      // Commerce-Comms Bridge: trigger comms on deal stage change
      if (vars.stage) {
        onDealStageChanged({ title: vars.title || '', stage: vars.stage, value: vars.value, contact_id: vars.contact_id, venture_id: vars.venture_id });
      }
    },
  });
}

export function useDeleteDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteDeal(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crm', 'deals'] }); },
  });
}

// ── Activities ──
export function useActivities(ventureId?: string) {
  return useQuery({
    queryKey: crmKeys.activities(ventureId),
    queryFn: () => api.listActivities(ventureId).then(r => r.activities),
  });
}

export function useCreateActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (activity: Partial<Activity>) => api.createActivity(activity),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crm', 'activities'] }); },
  });
}

// ── Accounts ──
export function useAccounts(ventureId?: string) {
  return useQuery({
    queryKey: crmKeys.accounts(ventureId),
    queryFn: () => api.listAccounts(ventureId).then(r => r.accounts),
  });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (account: Partial<Account>) => api.createAccount(account),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crm', 'accounts'] }); },
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (account: Partial<Account> & { id: string }) => api.updateAccount(account),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crm', 'accounts'] }); },
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteAccount(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crm', 'accounts'] }); },
  });
}

// ── Pipeline ──
export function usePipelineStats(ventureId?: string) {
  return useQuery({
    queryKey: crmKeys.pipeline(ventureId),
    queryFn: () => api.getPipelineStats(ventureId).then(r => r.pipeline),
  });
}
