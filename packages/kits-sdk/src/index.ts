// @mcv/kits-sdk — Agent-First Kit primitives.
//
// v0.1.0: portable substrate of the MCV orchestration shell.
//   - Types: KitManifest, KitToolSchema, KitInstance, ToolCallResult,
//     KitExecutionContext, plus telemetry, HITL, file/cache types
//   - Permissions: capability-based, localStorage-backed
//   - Sandbox: Web Worker isolation with SSRF-safe fetch proxy
//             (apps configure the worker factory once at startup)
//   - Bridge: runtime dispatcher (inline / worker / serverless)
//   - Shared Context: kit-to-kit key-value store (local + server sync)
//   - Registry Client: discover / install / publish kits
//
// What's NOT here yet (lives in app/src/lib/kits/ until DI boundaries
// are factored out):
//   - loader.ts       — hardcodes 70+ builtin kit imports
//   - orchestrator.ts — tightly coupled to telemetry / google / hitl
//   - kit-notifications.ts — bound to UI store

export * from './types';
export * from './permissions';
export * from './sandbox';
export * from './bridge';
export * from './shared-context';
export * from './registry-client';

export const MCV_KITS_SDK_VERSION = '0.1.0' as const;
