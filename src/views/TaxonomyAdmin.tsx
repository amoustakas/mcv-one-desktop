// Stub — real implementation lands with the content-os taxonomy session PR.
import { EmptyState } from '../components/ui';
import { Tag } from 'lucide-react';

export default function TaxonomyAdmin() {
  return (
    <EmptyState
      icon={<Tag size={24} />}
      title="Taxonomy admin"
      description="The taxonomy-admin surface ships with the content-os PR."
    />
  );
}
