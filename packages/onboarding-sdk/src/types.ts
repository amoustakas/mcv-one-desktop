// Core types for the MCV onboarding system.
// Shapes mirror the prospect_* tables in supabase/migration-prospect-foundation.sql.

export type RoleHint = 'investor' | 'partner' | 'creator' | 'team' | 'ally';
export type SourceChannel = 'landing_page' | 'referral' | 'direct' | 'agent_invite' | 'waitlist';

export type TrackName =
  | 'investor_retail'
  | 'investor_accredited'
  | 'partner'
  | 'creator'
  | 'team_member'
  | 'ally'
  | 'waitlist';

export type StepName =
  | 'intro'
  | 'venture_selection'
  | 'identity_capture'
  | 'kyc_basic'
  | 'kyc_full'
  | 'accreditation_verification'
  | 'agent_assignment'
  | 'venture_demo'
  | 'meeting_scheduling'
  | 'credentials_issued'
  | 'welcome_message'
  | 'feedback_capture';

export type JourneyStatus = 'active' | 'paused' | 'completed' | 'abandoned';
export type StepStatus   = 'pending' | 'in_progress' | 'completed' | 'skipped' | 'failed';

// Which role does the step need an agent to play? Drives the assignment
// matrix below — track + venture + agent_role → agent handle.
export type AgentRole =
  | 'chief_of_staff'      // Atlas
  | 'compliance'          // Justice
  | 'legal'               // Ada
  | 'ir_specialist'       // Amara / Sterling / Nico (venture-scoped)
  | 'growth'              // Hannah / Nico
  | 'product'             // Leo
  | 'engineering'         // Linus
  | 'creative'            // Dieter
  | 'finance'             // Warren
  | 'tokenomics'          // Satoshi
  | 'ops'                 // Hedy
  | 'none';               // no agent (pure input step)

export interface ProspectProfile {
  id: string;
  email: string;
  full_name: string | null;
  country: string | null;
  role_hint: RoleHint | null;
  source_venture_id: string | null;
  source_channel: SourceChannel;
  referrer_user_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ProspectJourney {
  id: string;
  prospect_id: string;
  track: TrackName;
  status: JourneyStatus;
  current_step_index: number;
  steps: StepName[];
  agent_id: string | null;
  started_at: string;
  last_activity_at: string;
  completed_at: string | null;
  metadata: Record<string, unknown>;
}

export interface ProspectJourneyStep {
  id: string;
  journey_id: string;
  step_name: StepName;
  status: StepStatus;
  started_at: string | null;
  completed_at: string | null;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  agent_id: string | null;
  metadata: Record<string, unknown>;
}

export interface ProspectCapture {
  id: string;
  email: string;
  name: string | null;
  venture_id: string | null;
  channel: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

// Step definition shape — pure config, no React component references.
// Components are resolved inside apps/onboarding's StepRenderer.
export interface StepDefinition {
  name: StepName;
  label: string;
  description: string;
  agent_role: AgentRole;
  required: boolean;
  can_skip: boolean;
}

// Track definition — ordered step array + default role-hint.
export interface TrackDefinition {
  name: TrackName;
  label: string;
  description: string;
  steps: StepName[];
  role_hint: RoleHint | null;
}
