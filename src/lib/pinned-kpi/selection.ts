import type { KpiId, SuiteId } from './types';
import { DEFAULT_LOADOUTS } from './loadouts';

/**
 * Resolve the effective tile id list for a suite.
 * If a user customization exists (non-empty), use it; else fall back to the default loadout.
 */
export function selectSuiteTiles(suite: SuiteId, custom?: KpiId[]): KpiId[] {
  return custom && custom.length > 0 ? custom : DEFAULT_LOADOUTS[suite];
}
