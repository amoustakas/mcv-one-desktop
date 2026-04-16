'use client';

// WizardShell — three-column wizard layout.
// Left: StepperRail (agent-illustrated per-step progress)
// Center: StepRenderer (active step)
// Right: AgentChatColumn (stub this session; Session B wires the chat)

import { useCallback, useEffect, useState } from 'react';
import { StepperRail } from './StepperRail';
import { StepRenderer } from './StepRenderer';
import { AgentChatColumn } from './AgentChatColumn';
import { callProspectApi } from '@/lib/api';
import { getVentureBrand } from '@/lib/brand';
import type { ProspectJourney, ProspectJourneyStep, StepStatus, TrackName } from '@mcv/onboarding-sdk';

// Server→client initial-state shape. May include a resumed journey or just
// a track + venture hint for a fresh start.
export interface WizardInitialState {
  journey?: ProspectJourney | null;
  steps?: ProspectJourneyStep[] | null;
  ventureId?: string | null;
  track: TrackName;
  inviteToken?: string | null;
  // Email prefill from ?prefill=... query param on invite links.
  prefillEmail?: string | null;
  assignedAgent?: { handle: string; full_name: string; title: string; accent_color: string | null } | null;
  stepAgents?: Array<{ step_name: string; handle: string; full_name: string; title: string } | null>;
}

export default function WizardShell(props: WizardInitialState) {
  const [journey, setJourney] = useState<ProspectJourney | null>(props.journey ?? null);
  const [steps, setSteps] = useState<ProspectJourneyStep[]>(props.steps ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const brand = getVentureBrand(props.ventureId);
  const brandStyle = {
    '--brand': brand.brand,
    '--brand-accent': brand.brandAccent,
  } as React.CSSProperties;

  // Resume journey state on mount if we have an id (deep-link safe).
  useEffect(() => {
    if (journey?.id) {
      void refreshJourney(journey.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshJourney = useCallback(async (id: string) => {
    try {
      const data = await callProspectApi<{ journey: ProspectJourney; steps: ProspectJourneyStep[] }>({
        action: 'get_journey',
        id,
      });
      setJourney(data.journey);
      setSteps(data.steps);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const startJourney = useCallback(async (payload: {
    email: string;
    full_name?: string;
    country?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await callProspectApi<{ journey: ProspectJourney }>({
        action: 'start_journey',
        track: props.track,
        venture_id: props.ventureId,
        ...payload,
      });
      setJourney(data.journey);
      await refreshJourney(data.journey.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [props.track, props.ventureId, refreshJourney]);

  const advanceStep = useCallback(async (opts: {
    status?: StepStatus;
    outputs?: Record<string, unknown>;
  } = {}) => {
    if (!journey) return;
    setLoading(true);
    setError(null);
    try {
      await callProspectApi({
        action: 'advance_step',
        journey_id: journey.id,
        status: opts.status ?? 'completed',
        outputs: opts.outputs ?? {},
      });
      await refreshJourney(journey.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [journey, refreshJourney]);

  return (
    <div className="wiz-shell" style={brandStyle}>
      <aside className="wiz-rail">
        <div className="wiz-rail-header">Welcome to</div>
        <div className="wiz-rail-title">{brand.name}</div>
        <div className="wiz-rail-sub">{brand.tagline}</div>
        <hr className="wiz-hr" />
        <StepperRail journey={journey} steps={steps} track={props.track} />
      </aside>

      <main className="wiz-main">
        {error && (
          <div className="wiz-card" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
            {error}
          </div>
        )}
        <StepRenderer
          journey={journey}
          steps={steps}
          track={props.track}
          ventureId={props.ventureId}
          prefillEmail={props.prefillEmail ?? null}
          loading={loading}
          onStart={startJourney}
          onAdvance={advanceStep}
        />
      </main>

      <aside className="wiz-chat">
        <AgentChatColumn journey={journey} />
      </aside>
    </div>
  );
}
