'use client';

import { STEPS, TRACKS, type StepName, type TrackName, type ProspectJourney, type ProspectJourneyStep } from '@mcv/onboarding-sdk';

interface Props {
  journey: ProspectJourney | null;
  steps: ProspectJourneyStep[];
  track: TrackName;
}

export function StepperRail({ journey, steps, track }: Props) {
  const stepNames: StepName[] = (journey?.steps as StepName[]) ?? TRACKS[track].steps;
  const currentIdx = journey?.current_step_index ?? 0;

  return (
    <div>
      {stepNames.map((name, idx) => {
        const def = STEPS[name];
        const stepRow = steps.find((s) => s.step_name === name);
        const dotState =
          stepRow?.status === 'completed' ? 'completed'
          : idx === currentIdx ? 'current'
          : 'pending';
        return (
          <div key={`${name}-${idx}`} className={`wiz-rail-step ${idx === currentIdx ? 'wiz-rail-step-active' : ''}`}>
            <div className={`wiz-rail-step-dot ${dotState}`}>
              {dotState === 'completed' ? '✓' : idx + 1}
            </div>
            <div>
              <div className="wiz-rail-step-label">{def?.label ?? name}</div>
              {def?.agent_role !== 'none' && (
                <div className="wiz-rail-step-agent">
                  {def?.agent_role === 'chief_of_staff' && <><span className="handle">@atlas</span> opens</>}
                  {def?.agent_role === 'compliance'     && <><span className="handle">@justice</span> handles</>}
                  {def?.agent_role === 'ir_specialist'  && <>Specialist</>}
                  {def?.agent_role === 'legal'          && <><span className="handle">@ada</span> reviews</>}
                  {def?.agent_role === 'product'        && <><span className="handle">@leo</span> routes</>}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
