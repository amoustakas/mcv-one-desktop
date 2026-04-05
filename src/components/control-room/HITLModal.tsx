import { useState } from 'react';
import { createPortal } from 'react-dom';
import { ShieldCheck, AlertTriangle, Check, X, Edit3 } from 'lucide-react';
import { useHITL } from '../../stores/hitl';
import Button from '../ui/Button';

// ---------------------------------------------------------------------------
// HITLModal — operator approval overlay for tool execution intercepts
// ---------------------------------------------------------------------------

export default function HITLModal() {
  const { pendingRequests, respond } = useHITL();
  const [editMode, setEditMode] = useState(false);
  const [editedJson, setEditedJson] = useState('');

  const request = pendingRequests[0];
  if (!request) return null;

  const handleApprove = () => {
    respond(request.id, 'approved');
    setEditMode(false);
  };

  const handleReject = () => {
    respond(request.id, 'rejected');
    setEditMode(false);
  };

  const handleModify = () => {
    if (!editMode) {
      setEditedJson(JSON.stringify(request.input, null, 2));
      setEditMode(true);
      return;
    }

    try {
      const parsed = JSON.parse(editedJson);
      respond(request.id, 'modified', parsed);
      setEditMode(false);
    } catch {
      // Invalid JSON — don't submit
    }
  };

  const modal = (
    <div className="mcv-hitl-overlay" onClick={(e) => { if (e.target === e.currentTarget) handleReject(); }}>
      <div className="mcv-hitl-modal">
        {/* Header */}
        <div className="mcv-hitl-header">
          <ShieldCheck size={20} style={{ color: 'var(--warning)' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 'var(--text-base)' }}>
              Human Approval Required
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              {request.reason}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <AlertTriangle size={14} style={{ color: 'var(--warning)' }} />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--warning)' }}>
              {pendingRequests.length > 1 ? `+${pendingRequests.length - 1} more` : ''}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="mcv-hitl-body">
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 4 }}>Tool</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--cyan)' }}>
              {request.kitId}/{request.toolName}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Input Payload</span>
              {editMode && (
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--warning)' }}>Editing</span>
              )}
            </div>
            {editMode ? (
              <textarea
                className="mcv-hitl-json-editor"
                value={editedJson}
                onChange={(e) => setEditedJson(e.target.value)}
                spellCheck={false}
              />
            ) : (
              <pre className="mcv-inspector-json">
                {JSON.stringify(request.input, null, 2)}
              </pre>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mcv-hitl-footer">
          <Button size="sm" variant="ghost" onClick={handleReject}>
            <X size={14} /> Reject
          </Button>
          <Button size="sm" variant="secondary" onClick={handleModify}>
            <Edit3 size={14} /> {editMode ? 'Submit Modified' : 'Modify'}
          </Button>
          <Button size="sm" variant="primary" onClick={handleApprove}>
            <Check size={14} /> Approve
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
