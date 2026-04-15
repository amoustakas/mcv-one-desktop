// Thin shim — canonical implementation lives in @mcv/commerce-sdk/fulfillment-service.
// First commerce factory with cross-engine dependencies: binds createFulfillment
// Service to the app's Supabase, the ledger service (for refund journals), and
// the inventory manager (for restocking on receiveReturn).
import {
  createFulfillmentService,
  type LedgerAdapter,
  type InventoryAdapter,
} from '@mcv/commerce-sdk/fulfillment-service';
import { supabase } from '../supabase';
import {
  createJournalEntry as svcCreateJournalEntry,
  postJournalEntry as svcPostJournalEntry,
  getAccountByCode as svcGetAccountByCode,
} from '../ledger/service';
import { returnStock as invReturnStock } from './inventory-manager';

const ledger: LedgerAdapter = {
  getAccountByCode: (ventureId, code) => svcGetAccountByCode(ventureId, code),
  createJournalEntry: (input) => svcCreateJournalEntry(input),
  postJournalEntry: (entryId, postedBy) => svcPostJournalEntry(entryId, postedBy),
};

const inventory: InventoryAdapter = {
  returnStock: (productId, locationId, quantity, referenceId, variantId) =>
    invReturnStock(productId, locationId, quantity, referenceId, variantId),
};

const service = createFulfillmentService({ supabase, ledger, inventory });

export const createFulfillment = service.createFulfillment;
export const markShipped = service.markShipped;
export const markDelivered = service.markDelivered;
export const getOrderFulfillments = service.getOrderFulfillments;
export const getUnfulfilledOrders = service.getUnfulfilledOrders;
export const generatePickList = service.generatePickList;
export const createReturnRequest = service.createReturnRequest;
export const approveReturn = service.approveReturn;
export const receiveReturn = service.receiveReturn;
export const rejectReturn = service.rejectReturn;
export const getReturnRequests = service.getReturnRequests;
export const updateOrderFulfillmentStatus = service.updateOrderFulfillmentStatus;

export type {
  FulfillmentService,
  PickListItem,
} from '@mcv/commerce-sdk/fulfillment-service';
