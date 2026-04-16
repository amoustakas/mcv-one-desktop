import WizardShell from '@/components/WizardShell';

export default function HomePage() {
  // Default landing — no venture scope, no invite, generic retail-investor track.
  return <WizardShell track="investor_retail" ventureId={null} />;
}
