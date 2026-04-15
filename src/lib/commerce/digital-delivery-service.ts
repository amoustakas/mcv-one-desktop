// Thin shim — canonical implementation lives in @mcv/commerce-sdk/digital-delivery-service.
import { createDigitalDeliveryService } from '@mcv/commerce-sdk/digital-delivery-service';
import { supabase } from '../supabase';

const service = createDigitalDeliveryService({ supabase });

export const createDigitalFulfillment = service.createDigitalFulfillment;
export const getDownloadUrl = service.getDownloadUrl;
export const activateLicense = service.activateLicense;
export const validateAccess = service.validateAccess;
export const listDigitalFulfillments = service.listDigitalFulfillments;
export const revokeAccess = service.revokeAccess;

export type { DigitalDeliveryService } from '@mcv/commerce-sdk/digital-delivery-service';
