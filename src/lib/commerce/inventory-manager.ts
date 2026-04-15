// Thin shim — canonical implementation lives in @mcv/commerce-sdk/inventory-manager.
import { createInventoryManager } from '@mcv/commerce-sdk/inventory-manager';
import { supabase } from '../supabase';

const manager = createInventoryManager({ supabase });

export const createLocation = manager.createLocation;
export const listLocations = manager.listLocations;
export const getInventoryLevel = manager.getInventoryLevel;
export const getInventoryLevels = manager.getInventoryLevels;
export const setInventoryLevel = manager.setInventoryLevel;
export const adjustInventory = manager.adjustInventory;
export const reserveStock = manager.reserveStock;
export const commitStock = manager.commitStock;
export const releaseReservation = manager.releaseReservation;
export const deductStock = manager.deductStock;
export const returnStock = manager.returnStock;
export const transferStock = manager.transferStock;
export const getLowStockProducts = manager.getLowStockProducts;
export const getInventoryMovements = manager.getInventoryMovements;

export type { InventoryManager } from '@mcv/commerce-sdk/inventory-manager';
