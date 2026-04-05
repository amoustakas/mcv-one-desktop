import { useState, useRef, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { cn, generateId } from '../../lib/utils';

type FilterOperator = 'eq' | 'neq' | 'contains' | 'gt' | 'lt' | 'between' | 'in';
type FilterFieldType = 'text' | 'number' | 'date' | 'select' | 'boolean';

interface FilterFieldDef {
  key: string;
  label: string;
  type: FilterFieldType;
  options?: { value: string; label: string }[];
}

interface FilterCondition {
  id: string;
  field: string;
  operator: FilterOperator;
  value: string;
}

interface FilterBuilderProps {
  fields: FilterFieldDef[];
  conditions: FilterCondition[];
  onChange: (conditions: FilterCondition[]) => void;
  className?: string;
}

const OPERATORS_BY_TYPE: Record<FilterFieldType, { value: FilterOperator; label: string }[]> = {
  text: [
    { value: 'contains', label: 'contains' },
    { value: 'eq', label: 'equals' },
    { value: 'neq', label: 'not equals' },
  ],
  number: [
    { value: 'eq', label: '=' },
    { value: 'neq', label: '!=' },
    { value: 'gt', label: '>' },
    { value: 'lt', label: '<' },
    { value: 'between', label: 'between' },
  ],
  date: [
    { value: 'eq', label: 'on' },
    { value: 'gt', label: 'after' },
    { value: 'lt', label: 'before' },
    { value: 'between', label: 'between' },
  ],
  select: [
    { value: 'eq', label: 'is' },
    { value: 'neq', label: 'is not' },
    { value: 'in', label: 'any of' },
  ],
  boolean: [
    { value: 'eq', label: 'is' },
  ],
};

const OPERATOR_LABELS: Record<FilterOperator, string> = {
  eq: '=',
  neq: '!=',
  contains: '~',
  gt: '>',
  lt: '<',
  between: '<>',
  in: 'in',
};

export default function FilterBuilder({
  fields,
  conditions,
  onChange,
  className,
}: FilterBuilderProps) {
  const [open, setOpen] = useState(false);
  const [newField, setNewField] = useState('');
  const [newOp, setNewOp] = useState<FilterOperator>('eq');
  const [newValue, setNewValue] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const selectedFieldDef = fields.find((f) => f.key === newField);
  const operators = selectedFieldDef ? OPERATORS_BY_TYPE[selectedFieldDef.type] : [];

  const handleFieldChange = (key: string) => {
    setNewField(key);
    const fDef = fields.find((f) => f.key === key);
    if (fDef) {
      const ops = OPERATORS_BY_TYPE[fDef.type];
      setNewOp(ops[0]?.value ?? 'eq');
    }
    setNewValue('');
  };

  const handleAdd = () => {
    if (!newField || !newValue) return;
    const condition: FilterCondition = {
      id: generateId('flt'),
      field: newField,
      operator: newOp,
      value: newValue,
    };
    onChange([...conditions, condition]);
    setNewField('');
    setNewOp('eq');
    setNewValue('');
    setOpen(false);
  };

  const handleRemove = (id: string) => {
    onChange(conditions.filter((c) => c.id !== id));
  };

  const getFieldLabel = (key: string) => fields.find((f) => f.key === key)?.label ?? key;

  return (
    <div className={cn('mcv-filter-bar', className)} style={{ position: 'relative' }}>
      {conditions.map((c) => (
        <span key={c.id} className="mcv-filter-pill">
          <span className="mcv-filter-pill-field">{getFieldLabel(c.field)}</span>
          <span className="mcv-filter-pill-op">{OPERATOR_LABELS[c.operator]}</span>
          <span className="mcv-filter-pill-value">{c.value}</span>
          <button
            className="mcv-filter-pill-remove"
            onClick={() => handleRemove(c.id)}
            type="button"
            aria-label={`Remove filter ${getFieldLabel(c.field)}`}
          >
            <X size={10} />
          </button>
        </span>
      ))}

      <div ref={dropdownRef} style={{ position: 'relative' }}>
        <button
          className="mcv-filter-add"
          onClick={() => setOpen((o) => !o)}
          type="button"
        >
          <Plus size={12} />
          Add filter
        </button>

        {open && (
          <div className="mcv-filter-dropdown">
            <div className="mcv-filter-row">
              <select
                value={newField}
                onChange={(e) => handleFieldChange(e.target.value)}
                style={{ flex: 1 }}
              >
                <option value="">Field...</option>
                {fields.map((f) => (
                  <option key={f.key} value={f.key}>{f.label}</option>
                ))}
              </select>
            </div>

            {newField && (
              <>
                <div className="mcv-filter-row">
                  <select
                    value={newOp}
                    onChange={(e) => setNewOp(e.target.value as FilterOperator)}
                    style={{ flex: 1 }}
                  >
                    {operators.map((op) => (
                      <option key={op.value} value={op.value}>{op.label}</option>
                    ))}
                  </select>
                </div>

                <div className="mcv-filter-row">
                  {selectedFieldDef?.type === 'select' && selectedFieldDef.options ? (
                    <select
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      style={{ flex: 1 }}
                    >
                      <option value="">Select...</option>
                      {selectedFieldDef.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : selectedFieldDef?.type === 'boolean' ? (
                    <select
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      style={{ flex: 1 }}
                    >
                      <option value="">Select...</option>
                      <option value="true">True</option>
                      <option value="false">False</option>
                    </select>
                  ) : (
                    <input
                      type={selectedFieldDef?.type === 'number' ? 'number' : selectedFieldDef?.type === 'date' ? 'date' : 'text'}
                      placeholder="Value..."
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                      style={{ flex: 1 }}
                    />
                  )}
                </div>

                <div className="mcv-filter-row" style={{ justifyContent: 'flex-end', marginBottom: 0 }}>
                  <button
                    className="mcv-btn mcv-btn-ghost mcv-btn-sm"
                    onClick={() => setOpen(false)}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className="mcv-btn mcv-btn-primary mcv-btn-sm"
                    onClick={handleAdd}
                    disabled={!newValue}
                    type="button"
                  >
                    Apply
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export type { FilterOperator, FilterFieldType, FilterFieldDef, FilterCondition, FilterBuilderProps };
