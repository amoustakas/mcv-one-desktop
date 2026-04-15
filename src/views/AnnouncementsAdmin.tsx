// Stub — real implementation lands with the content-os announcements session PR.
import { EmptyState } from '../components/ui';
import { Megaphone } from 'lucide-react';

export default function AnnouncementsAdmin() {
  return (
    <EmptyState
      icon={<Megaphone size={24} />}
      title="Announcements admin"
      description="The announcements-admin surface ships with the content-os PR."
    />
  );
}
