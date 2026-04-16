'use client';
import type { StepProps } from '../StepRenderer';

export default function StepMeetingScheduling({ loading, onAdvance }: StepProps) {
  return (
    <div>
      <h1>Book time.</h1>
      <p className="lede">
        A proper call gets you further than any dashboard. We&rsquo;ll ship a
        native scheduler shortly — for now your specialist sends the link.
      </p>
      <div className="wiz-card">
        <div className="wiz-card-agent">
          <div className="wiz-card-agent-avatar">A</div>
          <div>
            <div className="wiz-card-agent-name">Amara Reeves</div>
            <div className="wiz-card-agent-title">Investor Relations Chief · @amara</div>
          </div>
        </div>
        <p className="wiz-card-agent-line">
          &ldquo;Our embedded calendar ships next session. In the meantime, your
          assigned specialist will send you a Cal.com link when they reach out
          — and if you want time with Tony directly, flag it and I&rsquo;ll
          make it happen.&rdquo;
        </p>
        <div className="wiz-cta-row">
          <button className="wiz-btn wiz-btn-primary" disabled={loading} onClick={() => void onAdvance({ status: 'skipped' })}>
            Works for me →
          </button>
        </div>
      </div>
    </div>
  );
}
