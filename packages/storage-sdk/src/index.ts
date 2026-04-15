// @mcv/storage-sdk — unified file storage abstraction.
//
// v0.1.0: lifted from app/src/lib/storage. Same surface, now portable.
// All provider functions take a `KitExecutionContext` (from @mcv/kits-sdk)
// so the same provider can be invoked from a kit handler or from a
// venture's own code.
//
// Modules:
//   /types          — StorageItem, StorageProvider, AuditEntry, etc.
//   /orchestrator   — provider-routing wrappers (listFiles, readFile, ...)
//   /audit          — audit log read/write
//   /certification  — NFT certification verify + url helpers
//   /ai-pipeline    — analyzeFile, generateBrief, semanticSearch
//   /providers/*    — supabase | local | gdrive

export * from './types';
export * from './orchestrator';
export * from './audit';
export * from './certification';
export * from './ai-pipeline';

export const MCV_STORAGE_SDK_VERSION = '0.1.0' as const;
