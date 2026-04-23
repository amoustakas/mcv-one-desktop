// VerifiableBuild — reproducible Solana program deploy wrapper.
//
// Wraps the `solana-verify` CLI (https://github.com/Ellipsis-Labs/solana-verifiable-build)
// which reproduces a program build byte-for-byte from its source commit
// and publishes the verification PDA to Solscan / Solana.FM. Every program
// deployment in the SDK goes through here — no unverified binaries allowed.
//
// This module returns the verification *descriptor* — the command + PDA
// registration shape. It does NOT itself spawn the CLI (that's the runtime
// layer's job); staying CLI-free lets the config be constructed inside
// Confidential Space where spawning arbitrary binaries is disallowed.

import type { PublicKey } from '@solana/web3.js';

export interface VerifiableBuildInput {
  /** Program pubkey to register the verification PDA for. */
  programId: PublicKey;
  /** Git URL of the repo the binary was built from (https:// or git+ssh). */
  sourceRepoUrl: string;
  /** Full commit SHA the binary was built from. */
  sourceCommitSha: string;
  /** Relative path within the repo to the program source (e.g. "programs/my-program"). */
  sourcePath: string;
  /** Optional build-args (e.g. --features) passed to solana-verify. */
  buildArgs?: string[];
  /** Docker image tag to pin the reproducible build environment. */
  dockerImageTag?: string;
  /** Network the program lives on. */
  network: 'mainnet-beta' | 'devnet' | 'testnet';
}

export interface VerifiableBuildDescriptor {
  programId: PublicKey;
  /** The exact solana-verify subcommand + args the runtime should run. */
  cliCommand: string[];
  /** Expected public registration URL that resolves after success. */
  expectedRegistrationUrl: string;
  /** Canonical signature emitted to event_log on success. */
  expectedEventTopic: 'marketplace.program.verified';
}

/**
 * Build the verification descriptor. Pure function — no side effects, no
 * network calls. Runtime layer consumes the cliCommand array.
 */
export function buildVerifiableBuildDescriptor(
  input: VerifiableBuildInput,
): VerifiableBuildDescriptor {
  const commandParts: string[] = [
    'solana-verify',
    'verify-from-repo',
    '--program-id', input.programId.toBase58(),
    '--url', resolveUrl(input.network),
    '--commit-hash', input.sourceCommitSha,
    '--library-path', input.sourcePath,
  ];
  if (input.dockerImageTag) {
    commandParts.push('--base-image', input.dockerImageTag);
  }
  if (input.buildArgs && input.buildArgs.length > 0) {
    commandParts.push('--', ...input.buildArgs);
  }
  commandParts.push(input.sourceRepoUrl);

  return {
    programId: input.programId,
    cliCommand: commandParts,
    expectedRegistrationUrl: `https://solscan.io/account/${input.programId.toBase58()}`,
    expectedEventTopic: 'marketplace.program.verified',
  };
}

function resolveUrl(network: VerifiableBuildInput['network']): string {
  switch (network) {
    case 'mainnet-beta': return 'https://api.mainnet-beta.solana.com';
    case 'devnet':       return 'https://api.devnet.solana.com';
    case 'testnet':      return 'https://api.testnet.solana.com';
  }
}
