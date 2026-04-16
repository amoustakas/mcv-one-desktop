'use client';
import { useState } from 'react';
import type { StepProps } from '../StepRenderer';

export default function StepFeedbackCapture({ loading, onAdvance }: StepProps) {
  const [score, setScore] = useState<number | null>(null);
  const [note, setNote] = useState('');

  return (
    <div>
      <h1>One last thing.</h1>
      <p className="lede">
        How did that feel? This is optional — but every piece of signal
        sharpens how we onboard the next person.
      </p>
      <div className="wiz-card">
        <label className="wiz-label">How likely are you to recommend us to someone in your position? (0–10)</label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {Array.from({ length: 11 }).map((_, i) => (
            <button
              key={i}
              className={`wiz-venture-tile ${score === i ? 'selected' : ''}`}
              style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
              onClick={() => setScore(i)}
              type="button"
            >
              {i}
            </button>
          ))}
        </div>

        <label className="wiz-label" htmlFor="fb_note">What brought you here? (optional)</label>
        <textarea
          id="fb_note"
          className="wiz-input"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="A quick sentence or two helps us get better."
        />

        <div className="wiz-cta-row">
          <button
            className="wiz-btn wiz-btn-primary"
            disabled={loading}
            onClick={() => void onAdvance({ outputs: { nps: score, note } })}
          >
            Done
          </button>
          <button className="wiz-btn wiz-btn-ghost" disabled={loading} onClick={() => void onAdvance({ status: 'skipped' })}>
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
