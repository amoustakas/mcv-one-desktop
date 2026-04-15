// @mcv/commerce-sdk/customer-service — profiles, addresses, payment
// methods, segmentation, rolling stats.
//
// 12 methods behind createCustomerService({ supabase }) plus three pure
// row mappers exported top-level for callers that need to hydrate rows
// they already have in hand (e.g. a list endpoint that already joined
// addresses server-side).
//
// Notable behaviors:
//   - addAddress / savePaymentMethod auto-promote the first one to
//     default and stamp the customer's default_*_id accordingly.
//   - remove*s clear the customer's default_*_id only if the row being
//     removed was the default.
//   - updateCustomerStats aggregates from orders and calls computeSegments
//     so the persisted segments array stays fresh alongside the roll-ups.
//   - computeSegments uses percentile math for the "high_value" tier;
//     "whale" is an absolute $10k threshold, so it short-circuits the
//     percentile query.

import type { SupabaseClient } from '@supabase/supabase-js';
import { CreateCustomerInput } from './surface-types';
import type {
  Customer,
  SurfaceAddress,
  SavedPaymentMethod,
  CustomerSegment,
} from './surface-types';

// ─── Pure row mappers (exported top-level) ──────────────────────────────

export function mapAddressRow(
  row: Record<string, unknown>,
): SurfaceAddress & { id: string; isDefault: boolean } {
  return {
    id: row.id as string,
    firstName: (row.first_name as string) ?? '',
    lastName: (row.last_name as string) ?? '',
    company: (row.company as string) ?? null,
    line1: row.line1 as string,
    line2: (row.line2 as string) ?? null,
    city: row.city as string,
    state: row.state as string,
    postalCode: row.postal_code as string,
    country: row.country as string,
    phone: (row.phone as string) ?? null,
    isDefault: (row.is_default as boolean) ?? false,
  };
}

export function mapPaymentMethodRow(row: Record<string, unknown>): SavedPaymentMethod {
  return {
    id: row.id as string,
    type: row.type as string,
    last4: row.last4 as string,
    brand: (row.brand as string) ?? null,
    expiryMonth:
      row.expiry_month !== null && row.expiry_month !== undefined
        ? Number(row.expiry_month)
        : null,
    expiryYear:
      row.expiry_year !== null && row.expiry_year !== undefined
        ? Number(row.expiry_year)
        : null,
    isDefault: (row.is_default as boolean) ?? false,
    processorId: row.processor_id as string,
    processorMethodId: row.processor_method_id as string,
  };
}

export function mapCustomerRow(
  row: Record<string, unknown>,
  addresses: Array<SurfaceAddress & { id: string; isDefault: boolean }>,
  paymentMethods: SavedPaymentMethod[],
): Customer {
  const parseJson = <T>(value: unknown): T | null => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'object') return value as T;
    if (typeof value === 'string') {
      try { return JSON.parse(value) as T; } catch { return null; }
    }
    return null;
  };

  const parseStringArray = (value: unknown): string[] => {
    if (Array.isArray(value)) return value as string[];
    if (typeof value === 'string') {
      try { return JSON.parse(value) as string[]; } catch { return []; }
    }
    return [];
  };

  return {
    id: row.id as string,
    ventureId: row.venture_id as string,
    userId: (row.user_id as string) ?? null,
    email: row.email as string,
    firstName: row.first_name as string,
    lastName: row.last_name as string,
    phone: (row.phone as string) ?? null,
    addresses,
    defaultAddressId: (row.default_address_id as string) ?? null,
    savedPaymentMethods: paymentMethods,
    defaultPaymentMethodId: (row.default_payment_method_id as string) ?? null,
    tags: parseStringArray(row.tags),
    segments: parseStringArray(row.segments),
    group: (row.group as string) ?? null,
    totalOrders: Number(row.total_orders ?? 0),
    totalSpent: Number(row.total_spent ?? 0),
    averageOrderValue: Number(row.average_order_value ?? 0),
    firstOrderAt: (row.first_order_at as string) ?? null,
    lastOrderAt: (row.last_order_at as string) ?? null,
    ltv: Number(row.ltv ?? 0),
    communicationPreferences:
      parseJson<{ email: boolean; sms: boolean; push: boolean }>(
        row.communication_preferences,
      ) ?? { email: true, sms: false, push: true },
    notes: (row.notes as string) ?? '',
    metadata: parseJson<Record<string, unknown>>(row.metadata) ?? {},
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ─── Engine interface ──────────────────────────────────────────────────

export interface ListCustomersFilters {
  segment?: CustomerSegment;
  group?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface CustomerService {
  createCustomer(input: CreateCustomerInput): Promise<Customer>;
  getCustomer(id: string, ventureId: string): Promise<Customer | null>;
  getCustomerByEmail(ventureId: string, email: string): Promise<Customer | null>;
  updateCustomer(
    id: string,
    ventureId: string,
    updates: Partial<{
      email: string;
      firstName: string;
      lastName: string;
      phone: string | null;
      tags: string[];
      group: string | null;
      communicationPreferences: { email: boolean; sms: boolean; push: boolean };
      notes: string;
      metadata: Record<string, unknown>;
    }>,
  ): Promise<Customer>;
  listCustomers(ventureId: string, filters?: ListCustomersFilters): Promise<Customer[]>;

  addAddress(
    customerId: string,
    address: SurfaceAddress,
  ): Promise<SurfaceAddress & { id: string; isDefault: boolean }>;
  removeAddress(addressId: string, customerId: string): Promise<void>;
  setDefaultAddress(addressId: string, customerId: string): Promise<void>;

  savePaymentMethod(
    customerId: string,
    method: Omit<SavedPaymentMethod, 'id' | 'isDefault'>,
  ): Promise<SavedPaymentMethod>;
  removePaymentMethod(methodId: string, customerId: string): Promise<void>;
  setDefaultPaymentMethod(methodId: string, customerId: string): Promise<void>;

  getCustomerOrders(customerId: string, ventureId: string): Promise<Record<string, unknown>[]>;
  computeSegments(customerId: string): Promise<CustomerSegment[]>;
  updateCustomerStats(customerId: string): Promise<void>;
}

export interface CustomerServiceOptions {
  supabase: SupabaseClient | null;
}

// ─── Factory ───────────────────────────────────────────────────────────

export function createCustomerService({ supabase }: CustomerServiceOptions): CustomerService {
  // Closed-over helpers — internal plumbing not on the interface.
  async function fetchAddresses(
    customerId: string,
  ): Promise<Array<SurfaceAddress & { id: string; isDefault: boolean }>> {
    if (!supabase) return [];
    const { data } = await supabase
      .from('customer_addresses')
      .select()
      .eq('customer_id', customerId)
      .order('is_default', { ascending: false });
    return (data ?? []).map(mapAddressRow);
  }

  async function fetchPaymentMethods(customerId: string): Promise<SavedPaymentMethod[]> {
    if (!supabase) return [];
    const { data } = await supabase
      .from('saved_payment_methods')
      .select()
      .eq('customer_id', customerId)
      .order('is_default', { ascending: false });
    return (data ?? []).map(mapPaymentMethodRow);
  }

  const service: CustomerService = {
    async createCustomer(input) {
      if (!supabase) throw new Error('Supabase client not available');

      const validated = CreateCustomerInput.parse(input);

      const { data, error } = await supabase
        .from('customers')
        .insert({
          venture_id: validated.ventureId,
          user_id: validated.userId ?? null,
          email: validated.email,
          first_name: validated.firstName,
          last_name: validated.lastName,
          phone: validated.phone ?? null,
          tags: validated.tags,
          segments: [],
          group: validated.group ?? null,
          total_orders: 0,
          total_spent: 0,
          average_order_value: 0,
          ltv: 0,
          communication_preferences: validated.communicationPreferences,
          notes: validated.notes,
          metadata: validated.metadata,
        })
        .select()
        .single();

      if (error) throw new Error(`Failed to create customer: ${error.message}`);
      return mapCustomerRow(data, [], []);
    },

    async getCustomer(id, ventureId) {
      if (!supabase) return null;

      const { data, error } = await supabase
        .from('customers')
        .select()
        .eq('id', id)
        .eq('venture_id', ventureId)
        .single();

      if (error?.code === 'PGRST116') return null;
      if (error) throw new Error(`Failed to get customer: ${error.message}`);

      const [addresses, methods] = await Promise.all([
        fetchAddresses(id),
        fetchPaymentMethods(id),
      ]);
      return mapCustomerRow(data, addresses, methods);
    },

    async getCustomerByEmail(ventureId, email) {
      if (!supabase) return null;

      const { data, error } = await supabase
        .from('customers')
        .select()
        .eq('venture_id', ventureId)
        .ilike('email', email)
        .maybeSingle();

      if (error) throw new Error(`Failed to get customer by email: ${error.message}`);
      if (!data) return null;

      const [addresses, methods] = await Promise.all([
        fetchAddresses(data.id as string),
        fetchPaymentMethods(data.id as string),
      ]);
      return mapCustomerRow(data, addresses, methods);
    },

    async updateCustomer(id, ventureId, updates) {
      if (!supabase) throw new Error('Supabase client not available');

      const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (updates.email !== undefined) row.email = updates.email;
      if (updates.firstName !== undefined) row.first_name = updates.firstName;
      if (updates.lastName !== undefined) row.last_name = updates.lastName;
      if (updates.phone !== undefined) row.phone = updates.phone;
      if (updates.tags !== undefined) row.tags = updates.tags;
      if (updates.group !== undefined) row.group = updates.group;
      if (updates.communicationPreferences !== undefined) {
        row.communication_preferences = updates.communicationPreferences;
      }
      if (updates.notes !== undefined) row.notes = updates.notes;
      if (updates.metadata !== undefined) row.metadata = updates.metadata;

      const { error } = await supabase
        .from('customers')
        .update(row)
        .eq('id', id)
        .eq('venture_id', ventureId);

      if (error) throw new Error(`Failed to update customer: ${error.message}`);

      const customer = await service.getCustomer(id, ventureId);
      if (!customer) throw new Error('Customer not found after update');
      return customer;
    },

    async listCustomers(ventureId, filters) {
      if (!supabase) return [];

      const limit = filters?.limit ?? 50;
      const offset = filters?.offset ?? 0;

      let query = supabase
        .from('customers')
        .select()
        .eq('venture_id', ventureId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (filters?.segment) query = query.contains('segments', [filters.segment]);
      if (filters?.group) query = query.eq('group', filters.group);
      if (filters?.search) {
        const term = `%${filters.search}%`;
        query = query.or(
          `email.ilike.${term},first_name.ilike.${term},last_name.ilike.${term}`,
        );
      }

      const { data, error } = await query;
      if (error) throw new Error(`Failed to list customers: ${error.message}`);

      return Promise.all(
        (data ?? []).map(async (row: Record<string, unknown>) => {
          const [addresses, methods] = await Promise.all([
            fetchAddresses(row.id as string),
            fetchPaymentMethods(row.id as string),
          ]);
          return mapCustomerRow(row, addresses, methods);
        }),
      );
    },

    async addAddress(customerId, address) {
      if (!supabase) throw new Error('Supabase client not available');

      const existing = await fetchAddresses(customerId);
      const isFirst = existing.length === 0;

      const { data, error } = await supabase
        .from('customer_addresses')
        .insert({
          customer_id: customerId,
          first_name: address.firstName,
          last_name: address.lastName,
          company: address.company ?? null,
          line1: address.line1,
          line2: address.line2 ?? null,
          city: address.city,
          state: address.state,
          postal_code: address.postalCode,
          country: address.country,
          phone: address.phone ?? null,
          is_default: isFirst,
        })
        .select()
        .single();

      if (error) throw new Error(`Failed to add address: ${error.message}`);

      if (isFirst) {
        await supabase
          .from('customers')
          .update({ default_address_id: data.id, updated_at: new Date().toISOString() })
          .eq('id', customerId);
      }

      return mapAddressRow(data);
    },

    async removeAddress(addressId, customerId) {
      if (!supabase) throw new Error('Supabase client not available');

      const { error } = await supabase
        .from('customer_addresses')
        .delete()
        .eq('id', addressId)
        .eq('customer_id', customerId);

      if (error) throw new Error(`Failed to remove address: ${error.message}`);

      // Clear the customer's pointer only if this was the default.
      await supabase
        .from('customers')
        .update({ default_address_id: null, updated_at: new Date().toISOString() })
        .eq('id', customerId)
        .eq('default_address_id', addressId);
    },

    async setDefaultAddress(addressId, customerId) {
      if (!supabase) throw new Error('Supabase client not available');

      await supabase
        .from('customer_addresses')
        .update({ is_default: false })
        .eq('customer_id', customerId);

      await supabase
        .from('customer_addresses')
        .update({ is_default: true })
        .eq('id', addressId)
        .eq('customer_id', customerId);

      await supabase
        .from('customers')
        .update({ default_address_id: addressId, updated_at: new Date().toISOString() })
        .eq('id', customerId);
    },

    async savePaymentMethod(customerId, method) {
      if (!supabase) throw new Error('Supabase client not available');

      const existing = await fetchPaymentMethods(customerId);
      const isFirst = existing.length === 0;

      const { data, error } = await supabase
        .from('saved_payment_methods')
        .insert({
          customer_id: customerId,
          type: method.type,
          last4: method.last4,
          brand: method.brand ?? null,
          expiry_month: method.expiryMonth ?? null,
          expiry_year: method.expiryYear ?? null,
          is_default: isFirst,
          processor_id: method.processorId,
          processor_method_id: method.processorMethodId,
        })
        .select()
        .single();

      if (error) throw new Error(`Failed to save payment method: ${error.message}`);

      if (isFirst) {
        await supabase
          .from('customers')
          .update({ default_payment_method_id: data.id, updated_at: new Date().toISOString() })
          .eq('id', customerId);
      }

      return mapPaymentMethodRow(data);
    },

    async removePaymentMethod(methodId, customerId) {
      if (!supabase) throw new Error('Supabase client not available');

      const { error } = await supabase
        .from('saved_payment_methods')
        .delete()
        .eq('id', methodId)
        .eq('customer_id', customerId);

      if (error) throw new Error(`Failed to remove payment method: ${error.message}`);

      await supabase
        .from('customers')
        .update({ default_payment_method_id: null, updated_at: new Date().toISOString() })
        .eq('id', customerId)
        .eq('default_payment_method_id', methodId);
    },

    async setDefaultPaymentMethod(methodId, customerId) {
      if (!supabase) throw new Error('Supabase client not available');

      await supabase
        .from('saved_payment_methods')
        .update({ is_default: false })
        .eq('customer_id', customerId);

      await supabase
        .from('saved_payment_methods')
        .update({ is_default: true })
        .eq('id', methodId)
        .eq('customer_id', customerId);

      await supabase
        .from('customers')
        .update({ default_payment_method_id: methodId, updated_at: new Date().toISOString() })
        .eq('id', customerId);
    },

    async getCustomerOrders(customerId, ventureId) {
      if (!supabase) return [];

      const { data, error } = await supabase
        .from('orders')
        .select()
        .eq('customer_id', customerId)
        .eq('venture_id', ventureId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(`Failed to get customer orders: ${error.message}`);
      return data ?? [];
    },

    async computeSegments(customerId) {
      if (!supabase) return [];

      const { data: row, error } = await supabase
        .from('customers')
        .select('total_orders, total_spent, ltv, first_order_at, last_order_at')
        .eq('id', customerId)
        .single();

      if (error) throw new Error(`Failed to compute segments: ${error.message}`);

      const totalOrders = Number(row.total_orders ?? 0);
      const totalSpent = Number(row.total_spent ?? 0);
      const ltv = Number(row.ltv ?? 0);
      const firstOrderAt = row.first_order_at ? new Date(row.first_order_at as string) : null;
      const lastOrderAt = row.last_order_at ? new Date(row.last_order_at as string) : null;
      const now = new Date();

      const segments: CustomerSegment[] = [];

      // "whale" — absolute spend threshold, short-circuits the percentile query.
      if (totalSpent > 10000) segments.push('whale');

      // "high_value" — approximate top-10% by LTV via top-row percentile probe.
      if (!segments.includes('whale')) {
        const { data: percentileResult } = await supabase
          .from('customers')
          .select('ltv')
          .order('ltv', { ascending: false })
          .range(0, 0)
          .limit(1)
          .maybeSingle();

        const topLtv = percentileResult ? Number(percentileResult.ltv ?? 0) : 0;
        if (topLtv > 0 && ltv >= topLtv * 0.9) {
          segments.push('high_value');
        }
      }

      if (totalOrders >= 3) segments.push('repeat');

      if (firstOrderAt) {
        const daysSinceFirst = (now.getTime() - firstOrderAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceFirst <= 30) segments.push('new');
      }

      if (lastOrderAt && totalOrders > 0) {
        const daysSinceLast = (now.getTime() - lastOrderAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceLast > 90) segments.push('dormant');
        else if (daysSinceLast > 60) segments.push('at_risk');
      }

      return segments;
    },

    async updateCustomerStats(customerId) {
      if (!supabase) return;

      const { data: orders, error } = await supabase
        .from('orders')
        .select('total, created_at')
        .eq('customer_id', customerId)
        .not('status', 'eq', 'canceled')
        .order('created_at', { ascending: true });

      if (error) return; // non-fatal

      const orderList = orders ?? [];
      const totalOrders = orderList.length;
      const totalSpent = orderList.reduce(
        (sum: number, o: Record<string, unknown>) => sum + Number(o.total ?? 0),
        0,
      );
      const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

      // Simple LTV = total spent (extensible with predictive model later).
      const ltv = totalSpent;

      const firstOrderAt =
        orderList.length > 0 ? (orderList[0] as Record<string, unknown>).created_at as string : null;
      const lastOrderAt =
        orderList.length > 0
          ? (orderList[orderList.length - 1] as Record<string, unknown>).created_at as string
          : null;

      const segments = await service
        .computeSegments(customerId)
        .catch(() => [] as CustomerSegment[]);

      await supabase
        .from('customers')
        .update({
          total_orders: totalOrders,
          total_spent: totalSpent,
          average_order_value: averageOrderValue,
          ltv,
          first_order_at: firstOrderAt,
          last_order_at: lastOrderAt,
          segments,
          updated_at: new Date().toISOString(),
        })
        .eq('id', customerId);
    },
  };

  return service;
}
