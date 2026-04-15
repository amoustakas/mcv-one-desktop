// @mcv/commerce-sdk/digital-delivery-service — downloads, license keys,
// access tokens, drip content.
//
// 6 methods. Four delivery methods supported, each with their own
// counter + expiry semantics:
//   download      → nanoid(32) → /api/downloads/{token}, max N downloads,
//                    expires after N days
//   license_key   → XXXX-XXXX-XXXX-XXXX, max N activations
//   access_grant  → nanoid(40) bearer token, timed access
//   drip_content  → access_grant + a contentSchedule array
// revokeAccess sets both expiries to now.

import { nanoid } from 'nanoid';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { DigitalFulfillment, DripScheduleItem } from './surface-types';

// ─── Row mapper ─────────────────────────────────────────────────────────

function mapFulfillmentRow(row: Record<string, unknown>): DigitalFulfillment {
  const parseJson = <T>(value: unknown): T | null => {
    if (value === null || value === undefined) return null;
    if (Array.isArray(value)) return value as T;
    if (typeof value === 'object') return value as T;
    if (typeof value === 'string') {
      try { return JSON.parse(value) as T; } catch { return null; }
    }
    return null;
  };

  return {
    id: row.id as string,
    orderId: row.order_id as string,
    productId: row.product_id as string,
    deliveryMethod: row.delivery_method as DigitalFulfillment['deliveryMethod'],
    downloadUrl: (row.download_url as string) ?? null,
    downloadCount: Number(row.download_count ?? 0),
    maxDownloads: Number(row.max_downloads ?? 5),
    expiresAt: (row.expires_at as string) ?? null,
    licenseKey: (row.license_key as string) ?? null,
    activations: Number(row.activations ?? 0),
    maxActivations: Number(row.max_activations ?? 1),
    accessToken: (row.access_token as string) ?? null,
    accessExpiresAt: (row.access_expires_at as string) ?? null,
    contentSchedule: parseJson<DripScheduleItem[]>(row.content_schedule),
    createdAt: row.created_at as string,
  };
}

// ─── Pure helpers ──────────────────────────────────────────────────────

function generateLicenseKey(): string {
  // Format: XXXX-XXXX-XXXX-XXXX (uppercase alphanumeric, sanitized)
  const segment = () =>
    nanoid(4).toUpperCase().replace(/[^A-Z0-9]/g, '0').padEnd(4, '0').slice(0, 4);
  return `${segment()}-${segment()}-${segment()}-${segment()}`;
}

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

// ─── Engine interface ──────────────────────────────────────────────────

export interface DigitalDeliveryService {
  createDigitalFulfillment(
    orderId: string,
    productId: string,
    deliveryMethod: DigitalFulfillment['deliveryMethod'],
    options?: {
      maxDownloads?: number;
      downloadExpiryDays?: number;
      maxActivations?: number;
      accessExpiryDays?: number;
      contentSchedule?: DripScheduleItem[];
    },
  ): Promise<DigitalFulfillment>;
  getDownloadUrl(fulfillmentId: string): Promise<string>;
  activateLicense(licenseKey: string): Promise<DigitalFulfillment>;
  validateAccess(accessToken: string): Promise<boolean>;
  listDigitalFulfillments(orderId: string): Promise<DigitalFulfillment[]>;
  revokeAccess(fulfillmentId: string): Promise<DigitalFulfillment>;
}

export interface DigitalDeliveryServiceOptions {
  supabase: SupabaseClient | null;
}

// ─── Factory ───────────────────────────────────────────────────────────

export function createDigitalDeliveryService({
  supabase,
}: DigitalDeliveryServiceOptions): DigitalDeliveryService {
  return {
    async createDigitalFulfillment(orderId, productId, deliveryMethod, options) {
      if (!supabase) throw new Error('Supabase client not available');

      const now = new Date().toISOString();
      const row: Record<string, unknown> = {
        order_id: orderId,
        product_id: productId,
        delivery_method: deliveryMethod,
        download_count: 0,
        max_downloads: options?.maxDownloads ?? 5,
        activations: 0,
        max_activations: options?.maxActivations ?? 1,
        created_at: now,
      };

      if (deliveryMethod === 'download') {
        const token = nanoid(32);
        row.download_url = `/api/downloads/${token}`;
        row.expires_at = daysFromNow(options?.downloadExpiryDays ?? 30);
      } else if (deliveryMethod === 'license_key') {
        row.license_key = generateLicenseKey();
      } else if (deliveryMethod === 'access_grant') {
        row.access_token = nanoid(40);
        row.access_expires_at = daysFromNow(options?.accessExpiryDays ?? 365);
      } else if (deliveryMethod === 'drip_content') {
        row.content_schedule = options?.contentSchedule ?? [];
        row.access_token = nanoid(40);
        row.access_expires_at = daysFromNow(options?.accessExpiryDays ?? 365);
      }

      const { data, error } = await supabase
        .from('digital_fulfillments')
        .insert(row)
        .select()
        .single();

      if (error) throw new Error(`Failed to create digital fulfillment: ${error.message}`);
      return mapFulfillmentRow(data);
    },

    async getDownloadUrl(fulfillmentId) {
      if (!supabase) throw new Error('Supabase client not available');

      const { data, error } = await supabase
        .from('digital_fulfillments')
        .select()
        .eq('id', fulfillmentId)
        .single();

      if (error || !data) throw new Error('Digital fulfillment not found');

      const fulfillment = mapFulfillmentRow(data);

      if (!fulfillment.downloadUrl) throw new Error('No download URL for this fulfillment');
      if (fulfillment.expiresAt && new Date(fulfillment.expiresAt) < new Date()) {
        throw new Error('Download link has expired');
      }
      if (fulfillment.downloadCount >= fulfillment.maxDownloads) {
        throw new Error(`Maximum downloads (${fulfillment.maxDownloads}) exceeded`);
      }

      await supabase
        .from('digital_fulfillments')
        .update({ download_count: fulfillment.downloadCount + 1 })
        .eq('id', fulfillmentId);

      return fulfillment.downloadUrl;
    },

    async activateLicense(licenseKey) {
      if (!supabase) throw new Error('Supabase client not available');

      const { data, error } = await supabase
        .from('digital_fulfillments')
        .select()
        .eq('license_key', licenseKey)
        .single();

      if (error || !data) throw new Error('License key not found');

      const fulfillment = mapFulfillmentRow(data);

      if (fulfillment.activations >= fulfillment.maxActivations) {
        throw new Error(`Maximum activations (${fulfillment.maxActivations}) reached`);
      }

      const { data: updated, error: updateError } = await supabase
        .from('digital_fulfillments')
        .update({ activations: fulfillment.activations + 1 })
        .eq('id', fulfillment.id)
        .select()
        .single();

      if (updateError) throw new Error(`Failed to activate license: ${updateError.message}`);
      return mapFulfillmentRow(updated);
    },

    async validateAccess(accessToken) {
      if (!supabase) return false;

      const { data, error } = await supabase
        .from('digital_fulfillments')
        .select()
        .eq('access_token', accessToken)
        .single();

      if (error || !data) return false;

      const fulfillment = mapFulfillmentRow(data);

      if (fulfillment.accessExpiresAt && new Date(fulfillment.accessExpiresAt) < new Date()) {
        return false;
      }

      return true;
    },

    async listDigitalFulfillments(orderId) {
      if (!supabase) return [];

      const { data, error } = await supabase
        .from('digital_fulfillments')
        .select()
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (error) throw new Error(`Failed to list digital fulfillments: ${error.message}`);
      return (data ?? []).map(mapFulfillmentRow);
    },

    async revokeAccess(fulfillmentId) {
      if (!supabase) throw new Error('Supabase client not available');

      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('digital_fulfillments')
        .update({
          expires_at: now,
          access_expires_at: now,
        })
        .eq('id', fulfillmentId)
        .select()
        .single();

      if (error) throw new Error(`Failed to revoke access: ${error.message}`);
      return mapFulfillmentRow(data);
    },
  };
}
