import { useState } from 'react';
import { Link2, Shield, CheckCircle, XCircle, ExternalLink, Copy, RefreshCw } from 'lucide-react';
import type { StorageItem, NFTCertification } from '../../lib/storage/types';
import { verifyOnChain, getSolscanUrl } from '../../lib/storage/certification';

interface Props {
  file: StorageItem;
  certification: NFTCertification;
}

export default function NFTCertificationPanel({ file: _file, certification }: Props) {
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    exists: boolean;
    owner?: string;
    error?: string;
  } | null>(null);

  async function handleVerify() {
    setVerifying(true);
    const result = await verifyOnChain(certification.mintAddress);
    setVerificationResult(result);
    setVerifying(false);
  }

  function copyHash() {
    navigator.clipboard.writeText(certification.contentHash);
  }

  const solscanUrl = getSolscanUrl(certification.mintAddress);
  const shortMint = `${certification.mintAddress.slice(0, 6)}...${certification.mintAddress.slice(-4)}`;
  const shortHash = `${certification.contentHash.slice(0, 12)}...${certification.contentHash.slice(-8)}`;

  return (
    <div className="nft-cert-panel">
      {/* Header */}
      <div className="nft-cert-header">
        <Link2 size={16} style={{ color: 'var(--cyan)' }} />
        <span className="nft-cert-title">Blockchain Certification</span>
      </div>

      {/* Status */}
      <div className="nft-cert-status">
        {certification.chainVerified ? (
          <div className="nft-cert-verified">
            <CheckCircle size={14} style={{ color: 'var(--success)' }} />
            <span>Verified On-Chain</span>
          </div>
        ) : (
          <div className="nft-cert-unverified">
            <Shield size={14} style={{ color: 'var(--warning)' }} />
            <span>Pending Verification</span>
          </div>
        )}
      </div>

      {/* Content Hash */}
      <div className="nft-cert-field">
        <span className="nft-cert-label">Content Hash</span>
        <div className="nft-cert-value-row">
          <code className="nft-cert-hash">{shortHash}</code>
          <button onClick={copyHash} className="nft-cert-copy" title="Copy full hash">
            <Copy size={11} />
          </button>
        </div>
      </div>

      {/* Solana NFT */}
      <div className="nft-cert-field">
        <span className="nft-cert-label">Solana NFT</span>
        <div className="nft-cert-value-row">
          <code className="nft-cert-hash">{shortMint}</code>
          <a href={solscanUrl} target="_blank" rel="noopener noreferrer" className="nft-cert-link">
            <ExternalLink size={11} /> Solscan
          </a>
        </div>
      </div>

      {/* Certified info */}
      <div className="nft-cert-field">
        <span className="nft-cert-label">Certified</span>
        <span className="nft-cert-value">
          {new Date(certification.certifiedAt).toLocaleDateString()} by {certification.certifiedBy}
        </span>
      </div>

      {certification.attributes.parties && certification.attributes.parties.length > 0 && (
        <div className="nft-cert-field">
          <span className="nft-cert-label">Parties</span>
          <span className="nft-cert-value">{certification.attributes.parties.join(', ')}</span>
        </div>
      )}

      {/* Verification checks */}
      {verificationResult && (
        <div className="nft-cert-checks">
          <div className="nft-cert-check">
            {verificationResult.exists ? (
              <CheckCircle size={12} style={{ color: 'var(--success)' }} />
            ) : (
              <XCircle size={12} style={{ color: 'var(--error)' }} />
            )}
            <span>{verificationResult.exists ? 'NFT exists on-chain' : 'NFT not found on-chain'}</span>
          </div>
          <div className="nft-cert-check">
            {certification.chainVerified ? (
              <CheckCircle size={12} style={{ color: 'var(--success)' }} />
            ) : (
              <XCircle size={12} style={{ color: 'var(--warning)' }} />
            )}
            <span>File integrity {certification.chainVerified ? 'verified' : 'pending'}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="nft-cert-actions">
        <button onClick={handleVerify} className="nft-cert-btn" disabled={verifying}>
          <RefreshCw size={12} className={verifying ? 'nft-spin' : ''} />
          {verifying ? 'Verifying...' : 'Verify Again'}
        </button>
      </div>

      <style>{`
        .nft-cert-panel { padding: var(--space-md); background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg); }
        .nft-cert-header { display: flex; align-items: center; gap: 8px; margin-bottom: var(--space-md); }
        .nft-cert-title { font-size: 13px; font-weight: 600; color: var(--text-primary); }
        .nft-cert-status { margin-bottom: var(--space-md); }
        .nft-cert-verified, .nft-cert-unverified { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; }
        .nft-cert-verified { color: var(--success); }
        .nft-cert-unverified { color: var(--warning); }
        .nft-cert-field { margin-bottom: 10px; }
        .nft-cert-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: var(--text-muted); display: block; margin-bottom: 3px; }
        .nft-cert-value { font-size: 12px; color: var(--text-primary); }
        .nft-cert-value-row { display: flex; align-items: center; gap: 6px; }
        .nft-cert-hash { font-size: 11px; font-family: var(--font-mono); color: var(--text-secondary); background: var(--bg-elevated); padding: 2px 6px; border-radius: 3px; }
        .nft-cert-copy { color: var(--text-muted); cursor: pointer; background: none; border: none; padding: 2px; }
        .nft-cert-copy:hover { color: var(--cyan); }
        .nft-cert-link { display: flex; align-items: center; gap: 3px; font-size: 10px; color: var(--cyan); text-decoration: none; }
        .nft-cert-link:hover { text-decoration: underline; }
        .nft-cert-checks { margin-top: var(--space-md); padding: var(--space-sm); background: var(--bg-elevated); border-radius: var(--radius-md); display: flex; flex-direction: column; gap: 6px; }
        .nft-cert-check { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--text-secondary); }
        .nft-cert-actions { margin-top: var(--space-md); display: flex; gap: var(--space-sm); }
        .nft-cert-btn { display: flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: var(--radius-md); font-size: 11px; font-weight: 500; background: var(--bg-elevated); border: 1px solid var(--border); color: var(--text-secondary); cursor: pointer; transition: all 0.15s; }
        .nft-cert-btn:hover { border-color: var(--border-active); color: var(--text-primary); }
        .nft-cert-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        @keyframes nftSpin { to { transform: rotate(360deg); } }
        .nft-spin { animation: nftSpin 0.6s linear infinite; }
      `}</style>
    </div>
  );
}
