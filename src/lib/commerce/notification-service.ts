// Thin shim — canonical implementation lives in @mcv/commerce-sdk/notification-service.
import { createNotificationService } from '@mcv/commerce-sdk/notification-service';
import { supabase } from '../supabase';

const service = createNotificationService({ supabase });

export const createTemplate = service.createTemplate;
export const listTemplates = service.listTemplates;
export const updateTemplate = service.updateTemplate;
export const queueNotification = service.queueNotification;
export const processNotificationQueue = service.processNotificationQueue;
export const getDeliveryHistory = service.getDeliveryHistory;

export { interpolateTemplate } from '@mcv/commerce-sdk/notification-service';
export type { NotificationService } from '@mcv/commerce-sdk/notification-service';
