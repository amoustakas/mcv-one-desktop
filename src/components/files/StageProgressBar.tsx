import type { FileStage } from '../../lib/storage/types';

const STAGES: FileStage[] = ['concept', 'in-progress', 'review', 'approved', 'published'];
const STAGE_LABELS: Record<FileStage, string> = {
  concept: 'Concept',
  'in-progress': 'In Progress',
  review: 'Review',
  approved: 'Approved',
  published: 'Published',
  superseded: 'Superseded',
};

interface Props {
  stage: FileStage;
  compact?: boolean;
}

export default function StageProgressBar({ stage, compact }: Props) {
  const currentIdx = STAGES.indexOf(stage);
  const progress = currentIdx >= 0 ? ((currentIdx + 1) / STAGES.length) * 100 : 0;

  if (compact) {
    return (
      <div className="stage-compact">
        <div className="stage-compact-bar">
          <div className="stage-compact-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="stage-compact-label">{STAGE_LABELS[stage]}</span>
      </div>
    );
  }

  return (
    <div className="stage-progress">
      <div className="stage-dots">
        {STAGES.map((s, i) => (
          <div key={s} className={`stage-dot ${i < currentIdx ? 'completed' : ''} ${i === currentIdx ? 'current' : ''} ${i > currentIdx ? 'upcoming' : ''}`}>
            <div className="stage-dot-circle" />
            <span className="stage-dot-label">{STAGE_LABELS[s]}</span>
          </div>
        ))}
      </div>
      <div className="stage-track">
        <div className="stage-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
