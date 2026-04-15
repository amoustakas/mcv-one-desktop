// Thin shim — canonical implementation lives in @mcv/commerce-sdk/customer-service.
import { createCustomerService } from '@mcv/commerce-sdk/customer-service';
import { supabase } from '../supabase';

const service = createCustomerService({ supabase });

export const createCustomer = service.createCustomer;
export const getCustomer = service.getCustomer;
export const getCustomerByEmail = service.getCustomerByEmail;
export const updateCustomer = service.updateCustomer;
export const listCustomers = service.listCustomers;
export const addAddress = service.addAddress;
export const removeAddress = service.removeAddress;
export const setDefaultAddress = service.setDefaultAddress;
export const savePaymentMethod = service.savePaymentMethod;
export const removePaymentMethod = service.removePaymentMethod;
export const setDefaultPaymentMethod = service.setDefaultPaymentMethod;
export const getCustomerOrders = service.getCustomerOrders;
export const computeSegments = service.computeSegments;
export const updateCustomerStats = service.updateCustomerStats;

// Pure row mappers — re-exported so callers can hydrate rows they
// already joined server-side.
export { mapAddressRow, mapPaymentMethodRow, mapCustomerRow } from '@mcv/commerce-sdk/customer-service';
export type { CustomerService, ListCustomersFilters } from '@mcv/commerce-sdk/customer-service';
