// MCV One — NFT Certification for Blockchain-Verified Documents
// Uses Web Crypto API for SHA-256 hashing, Solana for on-chain certification

import type { NFTCertification, StorageItem } from './types';

/**
 * Generate SHA-256 hash of file content using Web Crypto API.
 */
export async function hashFileContent(data: Blob): Promise<string> {
  const buffer = await data.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify a file's content hash matches its on-chain certification.
 */
export async function verifyFileIntegrity(
  data: Blob,
  certification: NFTCertification,
): Promise<{ valid: boolean; currentHash: string; certifiedHash: string }> {
  const currentHash = await hashFileContent(data);
  return {
    valid: currentHash === certification.contentHash,
    currentHash,
    certifiedHash: certification.contentHash,
  };
}

/**
 * Check if an NFT exists on-chain by mint address.
 * Returns basic verification status.
 */
export async function verifyOnChain(mintAddress: string): Promise<{
  exists: boolean;
  owner?: string;
  metadataUri?: string;
  error?: string;
}> {
  try {
    // Use Solana RPC to check the account
    const rpcUrl = 'https://api.mainnet-beta.solana.com';
    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getAccountInfo',
        params: [mintAddress, { encoding: 'jsonParsed' }],
      }),
    });
    const data = await res.json();
    if (data.result?.value) {
      return {
        exists: true,
        owner: data.result.value.owner,
      };
    }
    return { exists: false };
  } catch (err) {
    return { exists: false, error: err instanceof Error ? err.message : 'Verification failed' };
  }
}

/**
 * Build the certification metadata for an NFT mint.
 * This prepares the data but doesn't actually mint — minting requires
 * a connected wallet and the MCV Anchor program.
 */
export function buildCertificationMetadata(
  file: StorageItem,
  contentHash: string,
  certifiedBy: string,
  parties?: string[],
): Omit<NFTCertification, 'mintAddress' | 'metadataUri' | 'chainVerified'> {
  return {
    fileId: file.id,
    contentHash,
    certifiedAt: new Date().toISOString(),
    certifiedBy,
    collectionAddress: undefined,
    attributes: {
      document_type: inferDocumentType(file),
      venture: file.ventureId || 'mcv',
      parties,
    },
  };
}

function inferDocumentType(file: StorageItem): string {
  const mime = file.mimeType || '';
  const name = file.name.toLowerCase();
  if (name.includes('contract') || name.includes('agreement')) return 'contract';
  if (name.includes('certificate') || name.includes('cert')) return 'certificate';
  if (mime.includes('pdf') && (name.includes('term') || name.includes('legal'))) return 'agreement';
  return 'asset';
}

/**
 * Get Solscan URL for a mint address.
 */
export function getSolscanUrl(mintAddress: string, cluster: 'mainnet' | 'devnet' = 'mainnet'): string {
  const base = 'https://solscan.io/token';
  return cluster === 'devnet'
    ? `${base}/${mintAddress}?cluster=devnet`
    : `${base}/${mintAddress}`;
}
