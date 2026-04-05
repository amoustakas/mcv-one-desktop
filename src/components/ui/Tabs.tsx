import { cn } from '../../lib/utils';

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export default function Tabs({ tabs, active, onChange, className }: TabsProps) {
  return (
    <div className={cn('mcv-tabs', className)}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={cn('mcv-tab', active === tab.id && 'mcv-tab-active')}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
          {tab.count !== undefined && <span className="mcv-tab-count">{tab.count}</span>}
        </button>
      ))}
    </div>
  );
}
