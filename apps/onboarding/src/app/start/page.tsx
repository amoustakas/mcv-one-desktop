import WizardShell from '@/components/WizardShell';

// Generic entry — shows intro that asks the prospect what brought them,
// and we infer track from their answer. For v0 we default to investor_retail
// and let the agent_assignment step re-route if the role_hint disagrees.
export default function StartPage() {
  return <WizardShell track="investor_retail" ventureId={null} />;
}
