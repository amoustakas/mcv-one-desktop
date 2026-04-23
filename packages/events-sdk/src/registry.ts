// packages/events-sdk/src/registry.ts
//
// ContractRegistry — in-memory lookup + DB upsert for integration contracts.
//
//   - createContractRegistry({ contracts }) — builds an index of every
//     emission + subscription across the modules passed in, for O(1) lookups
//     used by publisher (validation) + subscriber (re-validation) + EventStreamView.
//   - registerContracts(supabase, registry) — persists the declarations into
//     the integration_contracts table so the runtime + cockpit can inspect
//     what's contracted without importing every module's code.

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  ContractDeclaration,
  EmissionDeclaration,
  SubscriptionDeclaration,
} from './types.js';

export interface ContractRegistry {
  /** All declarations keyed by module. */
  readonly modules: ReadonlyMap<string, ContractDeclaration>;
  /** O(1) emission lookup by exact topic. */
  findEmission(topic: string): EmissionDeclaration | undefined;
  /** All subscriptions across every module, for UI listing. */
  allSubscriptions(): ReadonlyArray<SubscriptionDeclaration & { module: string }>;
  /** All emissions across every module, for UI listing. */
  allEmissions(): ReadonlyArray<EmissionDeclaration & { module: string }>;
}

export interface CreateContractRegistryOptions {
  contracts: ReadonlyArray<ContractDeclaration>;
}

export function createContractRegistry(opts: CreateContractRegistryOptions): ContractRegistry {
  const modules = new Map<string, ContractDeclaration>();
  const emissionsByTopic = new Map<string, EmissionDeclaration>();
  const allEms: Array<EmissionDeclaration & { module: string }> = [];
  const allSubs: Array<SubscriptionDeclaration & { module: string }> = [];

  for (const contract of opts.contracts) {
    if (modules.has(contract.module)) {
      throw new Error(`[events-sdk] duplicate module registration: ${contract.module}`);
    }
    modules.set(contract.module, contract);
    for (const em of contract.emits) {
      if (emissionsByTopic.has(em.topic)) {
        throw new Error(
          `[events-sdk] duplicate emission declaration for topic ${em.topic} (module ${contract.module}). Two modules cannot own the same topic.`,
        );
      }
      emissionsByTopic.set(em.topic, em);
      allEms.push({ ...em, module: contract.module });
    }
    for (const sub of contract.subscribes) {
      allSubs.push({ ...sub, module: contract.module });
    }
  }

  return {
    modules,
    findEmission: (topic) => emissionsByTopic.get(topic),
    allSubscriptions: () => allSubs,
    allEmissions: () => allEms,
  };
}

/**
 * Persist the provided contract declarations to integration_contracts. zod
 * schemas are serialized to JSON Schema–ish descriptors (topic + schemaVersion
 * + description) — we do NOT try to capture the full zod AST because (a) zod
 * doesn't serialize cleanly and (b) the TS types are the source of truth. The
 * DB row is purely for runtime discovery, not reconstruction.
 */
export async function registerContracts(
  supabase: SupabaseClient,
  contracts: ReadonlyArray<ContractDeclaration>,
): Promise<void> {
  const rows = contracts.map((c) => ({
    module: c.module,
    version: c.version,
    emits: c.emits.map((e) => ({
      topic: e.topic,
      schemaVersion: e.schemaVersion,
      description: e.description,
    })),
    subscribes: c.subscribes.map((s) => ({
      topicPattern: s.topicPattern,
      handlerUrl: s.handlerUrl ?? null,
      agentId: s.agentId ?? null,
      description: s.description,
    })),
  }));

  // Upsert on (module, version) so repeat boots are idempotent.
  const { error } = await supabase
    .from('integration_contracts')
    .upsert(rows as never, { onConflict: 'module,version' });
  if (error) {
    throw new Error(`[events-sdk] registerContracts failed: ${error.message}`);
  }
}
