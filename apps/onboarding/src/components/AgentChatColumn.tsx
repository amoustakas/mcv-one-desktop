'use client';

// AgentChatColumn — STUB for Phase 2. Session B ships the real chat routing
// that will subscribe to session_id = journey.id and stream agent turns here.
// The interface this component needs (journey id, current agent) is already
// in place so the swap will be a surgical replacement.

import type { ProspectJourney } from '@mcv/onboarding-sdk';

interface Props {
  journey: ProspectJourney | null;
}

export function AgentChatColumn({ journey }: Props) {
  return (
    <>
      <div className="wiz-chat-header">
        <div style={{
          width: 36, height: 36, borderRadius: 18,
          background: 'linear-gradient(135deg, var(--brand), var(--brand-accent))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#000', fontWeight: 700,
        }}>A</div>
        <div>
          <div className="wiz-chat-agent-name">Atlas</div>
          <div className="wiz-chat-agent-handle">@atlas · Chief of Staff</div>
        </div>
      </div>

      <div className="wiz-chat-body">
        <div className="wiz-chat-msg">
          Hi — I&rsquo;m Atlas. I run coordination here. Work through the steps on the left and I&rsquo;ll hand you off to the right specialist when we get to that point.
        </div>
        {!journey && (
          <div className="wiz-chat-msg">
            Once you tell me your email we&rsquo;ll have a record and you can pick up where you left off any time.
          </div>
        )}
        {journey && (
          <div className="wiz-chat-msg">
            You&rsquo;re on step <b>{journey.current_step_index + 1}</b> of <b>{journey.steps.length}</b>. Ping me if anything feels off.
          </div>
        )}
      </div>

      <div className="wiz-chat-stub-note">
        Live chat wiring ships in the next session. This column is a placeholder —
        journey id <code>{journey?.id.slice(0, 8) ?? '—'}</code> is already the key
        the chat stream will subscribe to.
      </div>
    </>
  );
}
