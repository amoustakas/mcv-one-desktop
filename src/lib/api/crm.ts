import { apiPost } from './client';
import type { Contact, Deal, Activity, Account, PipelineStage } from '../schemas/crm';

const EP = '/api/crm';

// ── Contacts ──
export async function listContacts(ventureId?: string) {
  return apiPost<{ contacts: Contact[] }>(EP, { action: 'list-contacts', venture_id: ventureId });
}

export async function getContact(id: string) {
  return apiPost<{ contact: Contact; activities: Activity[]; deals: Deal[] }>(EP, { action: 'get-contact', id });
}

export async function createContact(contact: Partial<Contact>) {
  return apiPost<{ contact: Contact }>(EP, { action: 'create-contact', contact });
}

export async function updateContact(contact: Partial<Contact> & { id: string }) {
  return apiPost<{ contact: Contact }>(EP, { action: 'update-contact', contact });
}

export async function deleteContact(id: string) {
  return apiPost<{ success: boolean }>(EP, { action: 'delete-contact', id });
}

// ── Deals ──
export async function listDeals(ventureId?: string) {
  return apiPost<{ deals: Deal[] }>(EP, { action: 'list-deals', venture_id: ventureId });
}

export async function createDeal(deal: Partial<Deal>) {
  return apiPost<{ deal: Deal }>(EP, { action: 'create-deal', deal });
}

export async function updateDeal(deal: Partial<Deal> & { id: string }) {
  return apiPost<{ deal: Deal }>(EP, { action: 'update-deal', ...deal });
}

export async function deleteDeal(id: string) {
  return apiPost<{ success: boolean }>(EP, { action: 'delete-deal', id });
}

// ── Activities ──
export async function listActivities(ventureId?: string) {
  return apiPost<{ activities: Activity[] }>(EP, { action: 'list-activities', venture_id: ventureId });
}

export async function createActivity(activity: Partial<Activity>) {
  return apiPost<{ activity: Activity }>(EP, { action: 'create-activity', ...activity });
}

// ── Accounts ──
export async function listAccounts(ventureId?: string) {
  return apiPost<{ accounts: Account[] }>(EP, { action: 'list-accounts', venture_id: ventureId });
}

export async function createAccount(account: Partial<Account>) {
  return apiPost<{ account: Account }>(EP, { action: 'create-account', account });
}

export async function updateAccount(account: Partial<Account> & { id: string }) {
  return apiPost<{ account: Account }>(EP, { action: 'update-account', account });
}

export async function deleteAccount(id: string) {
  return apiPost<{ success: boolean }>(EP, { action: 'delete-account', id });
}

// ── Pipeline ──
export async function getPipelineStats(ventureId?: string) {
  return apiPost<{ pipeline: PipelineStage[] }>(EP, { action: 'pipeline-stats', venture_id: ventureId });
}
