// Stub — real implementation lands with the content-os blog session PR.
// Referenced from App.tsx switch-case; renders a neutral placeholder so
// routing resolves while the real view is out of tree.
import { EmptyState } from '../components/ui';
import { FileText } from 'lucide-react';

export default function BlogAdmin() {
  return (
    <EmptyState
      icon={<FileText size={24} />}
      title="Blog admin"
      description="The blog-admin surface ships with the content-os PR."
    />
  );
}
