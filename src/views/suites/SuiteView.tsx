import SuiteLayout from '../../components/suites/SuiteLayout';
import { getSuite, type SuiteId } from '../../lib/suites/definitions';

interface SuiteViewProps {
  suiteId: SuiteId;
}

/** Generic suite renderer. Looks up the definition by id and hands it to SuiteLayout. */
export default function SuiteView({ suiteId }: SuiteViewProps) {
  const suite = getSuite(suiteId);
  if (!suite) {
    return (
      <div style={{ padding: 24, color: 'var(--text-muted)' }}>
        Suite <code>{suiteId}</code> not registered.
      </div>
    );
  }
  return <SuiteLayout suite={suite} />;
}
