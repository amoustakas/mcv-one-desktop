// MCVClient — the SDK entry point.
//
// Every instantiation goes through AuthRouter's Biometric Core-Triangle.
// The test gate: MCVClient.create() MUST throw when any of the four
// attestations is missing or fails. This is the "Substance Over Form"
// doctrine in code — you cannot hold a client that hasn't proven legal +
// cryptographic + biometric identity.

import type { AuthRouter } from './auth-router';
import type { AuthenticatedIdentity, CoreTriangleAttestations } from './attestations';

export interface MCVClientOptions {
  /** AuthRouter instance that gates instantiation. */
  authRouter: AuthRouter;
  /** Pre-collected attestations from the client-side verification flow. */
  attestations: Partial<CoreTriangleAttestations>;
  /**
   * Optional Google Application Default Credentials project id.
   * ADC resolution happens inside the services that actually need it
   * (KMS signer, Vertex AI underwriter) — passing it here lets tests and
   * boot paths surface config errors early.
   */
  gcpProject?: string;
}

/**
 * The authenticated, Core-Triangle-gated SDK handle. Holds the resolved
 * identity + any GCP config and will, in later phases, expose the service
 * facades (TokenEngine, OrderRouter, KmsSigner, Oracles, AI).
 *
 * Constructor is private — only `MCVClient.create()` produces instances
 * because authentication is async and must run before object existence.
 */
export class MCVClient {
  readonly identity: AuthenticatedIdentity;
  readonly gcpProject?: string;

  private constructor(identity: AuthenticatedIdentity, gcpProject?: string) {
    this.identity = identity;
    this.gcpProject = gcpProject;
  }

  /**
   * Factory. Runs the AuthRouter gate and returns a ready-to-use client on
   * success. Throws `CoreTriangleAuthError` on any phase failure — callers
   * should catch and surface the specific phase for user feedback.
   */
  static async create(options: MCVClientOptions): Promise<MCVClient> {
    const identity = await options.authRouter.authenticate(options.attestations);
    return new MCVClient(identity, options.gcpProject);
  }

  /** Short identifier suitable for logs / UI */
  get handle(): string {
    return `mcv:${this.identity.userId.slice(0, 8)}`;
  }
}
