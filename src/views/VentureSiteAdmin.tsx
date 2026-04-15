// Stub — real implementation lands with the venture-sites session PR.
import { EmptyState } from '../components/ui';
import { Globe } from 'lucide-react';

export default function VentureSiteAdmin() {
  return (
    <EmptyState
      icon={<Globe size={24} />}
      title="Venture site admin"
      description="The venture-site-admin surface ships with the venture-sites PR."
    />
  );
}
