// src/components/onboarding/WizardShell.tsx
//
// Fullscreen layout chrome for the OnboardingHubView wizard. Three zones:
//
//   [Rail — 320px]  [Main content — fluid]  [no right column by default]
//
// The shell is framework-free — it takes children, the active step, and
// the full gate. Steps render inside a `mcv-onb-content` card with the
// wizard's CSS scope. The layout CSS lives at the bottom of this file so
// the shell is self-contained; we deliberately avoid polluting the
// authenticated app's shell.css with onboarding-only selectors.

import type { ReactNode } from 'react';
import type { OnboardingGate } from '../../hooks/use-onboarding-gate';
import StepperRail from './StepperRail';
import { WIZARD_STEPS } from './stepper-constants';

interface WizardShellProps {
  gate: OnboardingGate;
  onStepClick?: (step: OnboardingGate['activeStep']) => void;
  children: ReactNode;
}

export default function WizardShell({ gate, onStepClick, children }: WizardShellProps) {
  const step = WIZARD_STEPS.find((s) => s.id === gate.activeStep) ?? WIZARD_STEPS[0];
  return (
    <div className="mcv-onb-root">
      <BackgroundOrbs />

      <StepperRail
        activeStep={gate.activeStep}
        stepStatus={gate.stepStatus}
        onStepClick={onStepClick}
      />

      <main className="mcv-onb-main" aria-labelledby="mcv-onb-step-title">
        <header className="mcv-onb-main-header">
          <div className="mcv-onb-step-kicker">
            Step {step.index} of {WIZARD_STEPS.length}
          </div>
          <h1 id="mcv-onb-step-title" className="mcv-onb-step-title">
            {step.label}
          </h1>
          <p className="mcv-onb-step-desc">{step.description}</p>
        </header>

        <section className="mcv-onb-content">{children}</section>
      </main>

      <WizardShellStyles />
    </div>
  );
}

function BackgroundOrbs() {
  // Two soft radial gradient orbs anchored in the background for depth.
  // No motion — onboarding is not the right surface for decorative animation.
  return (
    <div aria-hidden className="mcv-onb-background">
      <div className="mcv-onb-orb mcv-onb-orb-cyan" />
      <div className="mcv-onb-orb mcv-onb-orb-purple" />
    </div>
  );
}

function WizardShellStyles() {
  return (
    <style>{`
      .mcv-onb-root {
        position: fixed;
        inset: 0;
        display: grid;
        grid-template-columns: 320px 1fr;
        background: var(--bg-deep, #060d14);
        color: var(--text-primary, #e6edf3);
        font-family: var(--font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
        overflow: hidden;
      }

      /* ── Ambient background ──────────────────────────────────────────── */
      .mcv-onb-background {
        position: absolute;
        inset: 0;
        pointer-events: none;
        overflow: hidden;
      }
      .mcv-onb-orb {
        position: absolute;
        width: 720px;
        height: 720px;
        border-radius: 50%;
        filter: blur(120px);
        opacity: 0.24;
      }
      .mcv-onb-orb-cyan {
        top: -220px;
        left: -220px;
        background: radial-gradient(circle, rgba(0,245,255,0.55) 0%, rgba(0,245,255,0) 70%);
      }
      .mcv-onb-orb-purple {
        bottom: -260px;
        right: -180px;
        background: radial-gradient(circle, rgba(139,92,246,0.55) 0%, rgba(139,92,246,0) 70%);
      }

      /* ── Rail ────────────────────────────────────────────────────────── */
      .mcv-onb-rail {
        position: relative;
        z-index: 1;
        border-right: 1px solid var(--border, rgba(255,255,255,0.08));
        background: rgba(11, 18, 28, 0.72);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        padding: 28px 24px 20px;
        display: flex;
        flex-direction: column;
        gap: 28px;
      }
      .mcv-onb-rail-header {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .mcv-onb-rail-brand {
        display: flex;
        align-items: baseline;
        gap: 6px;
      }
      .mcv-onb-rail-logo {
        font-size: 22px;
        font-weight: 800;
        color: var(--cyan, #00f5ff);
        letter-spacing: -0.02em;
      }
      .mcv-onb-rail-logo-sub {
        font-size: 11px;
        font-weight: 600;
        color: var(--text-secondary, #a6b2c1);
        letter-spacing: 3px;
      }
      .mcv-onb-rail-tagline {
        font-size: 11px;
        color: var(--text-muted, #6b7a8c);
        text-transform: uppercase;
        letter-spacing: 1.5px;
      }

      .mcv-onb-rail-steps {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
        flex: 1 1 auto;
      }
      .mcv-onb-rail-step {
        position: relative;
      }
      .mcv-onb-rail-step-btn {
        all: unset;
        display: grid;
        grid-template-columns: 28px 1fr;
        gap: 12px;
        align-items: center;
        padding: 10px 10px;
        border-radius: 10px;
        cursor: pointer;
        transition: background 180ms ease, opacity 180ms ease;
        width: 100%;
        box-sizing: border-box;
      }
      .mcv-onb-rail-step-btn:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.04);
      }
      .mcv-onb-rail-step-btn:disabled {
        cursor: default;
        opacity: 0.6;
      }
      .mcv-onb-rail-step-btn:focus-visible {
        outline: 2px solid var(--cyan, #00f5ff);
        outline-offset: 2px;
      }
      .mcv-onb-rail-step.is-active .mcv-onb-rail-step-btn {
        background: rgba(0, 245, 255, 0.08);
      }
      .mcv-onb-rail-step-marker {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid var(--border, rgba(255,255,255,0.12));
        font-size: 12px;
        font-weight: 600;
        color: var(--text-muted, #6b7a8c);
      }
      .mcv-onb-rail-step.status-ready .mcv-onb-rail-step-marker,
      .mcv-onb-rail-step.is-active .mcv-onb-rail-step-marker {
        color: var(--cyan, #00f5ff);
        border-color: rgba(0, 245, 255, 0.6);
        background: rgba(0, 245, 255, 0.08);
      }
      .mcv-onb-rail-step.status-in_progress .mcv-onb-rail-step-marker {
        color: var(--purple, #8b5cf6);
        border-color: rgba(139, 92, 246, 0.6);
        background: rgba(139, 92, 246, 0.1);
      }
      .mcv-onb-rail-step.status-complete .mcv-onb-rail-step-marker {
        color: #10b981;
        border-color: rgba(16, 185, 129, 0.7);
        background: rgba(16, 185, 129, 0.14);
      }
      .mcv-onb-rail-step-index { font-variant-numeric: tabular-nums; }
      .mcv-onb-rail-step-text {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }
      .mcv-onb-rail-step-label {
        font-size: 13px;
        font-weight: 600;
        color: var(--text-primary, #e6edf3);
        letter-spacing: -0.01em;
      }
      .mcv-onb-rail-step-desc {
        font-size: 11px;
        color: var(--text-muted, #6b7a8c);
      }
      .mcv-onb-rail-connector {
        position: absolute;
        left: 23px;
        top: calc(100% - 2px);
        width: 2px;
        height: 6px;
        background: rgba(255, 255, 255, 0.08);
        border-radius: 1px;
      }
      .mcv-onb-rail-connector.is-done { background: rgba(16, 185, 129, 0.5); }

      .mcv-onb-rail-footer {
        border-top: 1px solid var(--border, rgba(255,255,255,0.08));
        padding-top: 16px;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .mcv-onb-rail-footer-kicker {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        color: var(--text-muted, #6b7a8c);
      }
      .mcv-onb-rail-footer-link {
        font-size: 12px;
        color: var(--cyan, #00f5ff);
        text-decoration: none;
      }
      .mcv-onb-rail-footer-link:hover { text-decoration: underline; }

      /* ── Main content column ─────────────────────────────────────────── */
      .mcv-onb-main {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        padding: 56px 72px 72px;
        gap: 28px;
      }
      .mcv-onb-main-header {
        display: flex;
        flex-direction: column;
        gap: 6px;
        max-width: 820px;
      }
      .mcv-onb-step-kicker {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 2px;
        color: var(--cyan, #00f5ff);
        font-weight: 600;
      }
      .mcv-onb-step-title {
        font-size: 36px;
        font-weight: 700;
        letter-spacing: -0.02em;
        color: var(--text-primary, #e6edf3);
        margin: 0;
        line-height: 1.1;
      }
      .mcv-onb-step-desc {
        font-size: 15px;
        color: var(--text-secondary, #a6b2c1);
        margin: 0;
      }
      .mcv-onb-content {
        display: flex;
        flex-direction: column;
        gap: 24px;
        max-width: 1040px;
      }

      /* ── Shared step-surface primitives ──────────────────────────────── */
      .mcv-onb-card {
        background: rgba(11, 18, 28, 0.72);
        border: 1px solid var(--border, rgba(255,255,255,0.08));
        border-radius: 16px;
        padding: 28px;
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
      }
      .mcv-onb-card-title {
        font-size: 18px;
        font-weight: 600;
        margin: 0 0 6px;
        color: var(--text-primary, #e6edf3);
      }
      .mcv-onb-card-sub {
        font-size: 13px;
        color: var(--text-muted, #6b7a8c);
        margin: 0;
      }

      .mcv-onb-cta {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 12px 20px;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 600;
        background: var(--cyan, #00f5ff);
        color: #04121a;
        border: none;
        cursor: pointer;
        transition: transform 120ms ease, box-shadow 180ms ease, opacity 180ms ease;
        box-shadow: 0 10px 30px -10px rgba(0, 245, 255, 0.6);
      }
      .mcv-onb-cta:hover:not(:disabled) { transform: translateY(-1px); }
      .mcv-onb-cta:disabled { opacity: 0.5; cursor: not-allowed; }
      .mcv-onb-cta-ghost {
        background: transparent;
        color: var(--text-secondary, #a6b2c1);
        border: 1px solid var(--border, rgba(255,255,255,0.12));
        box-shadow: none;
      }
      .mcv-onb-cta-ghost:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.04);
        color: var(--text-primary, #e6edf3);
      }

      /* ── Responsive collapse: below 900px, rail flips to a topbar ────── */
      @media (max-width: 900px) {
        .mcv-onb-root {
          grid-template-columns: 1fr;
          grid-template-rows: auto 1fr;
        }
        .mcv-onb-rail {
          flex-direction: row;
          align-items: center;
          gap: 16px;
          padding: 16px;
          border-right: none;
          border-bottom: 1px solid var(--border, rgba(255,255,255,0.08));
          overflow-x: auto;
        }
        .mcv-onb-rail-header,
        .mcv-onb-rail-footer { display: none; }
        .mcv-onb-rail-steps {
          flex-direction: row;
          gap: 4px;
        }
        .mcv-onb-rail-step-desc { display: none; }
        .mcv-onb-rail-connector { display: none; }
        .mcv-onb-main { padding: 28px 20px 48px; }
        .mcv-onb-step-title { font-size: 28px; }
      }
    `}</style>
  );
}
