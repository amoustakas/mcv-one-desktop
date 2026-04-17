// PeopleView — active human tracking surface.
// The people Tony personally tracks, gathers intel on, and communicates with.
// Distinct from:
//   - ProspectsView (automated onboarding-funnel monitor, Phase 2)
//   - PipelineView (DevOps — Docker / GitHub / Claude sessions)
//   - CRMView (deals / accounts / activity)
//
// Reuses the existing `contacts` table + use-crm hooks — no new schema.
// Agents appear only as subtle "from onboarding" attribution when a contact
// was constructed by a completed journey; never as the primary subject.

import { useMemo, useState } from 'react';
import { UserPlus, Search, X as XIcon, MessageSquare, Sparkles, Mail, Globe, ArrowRight } from 'lucide-react';
import {
  useContacts, useContact, useCreateContact, useUpdateContact, useCreateActivity,
} from '../hooks/use-crm';
import type { Contact } from '../lib/schemas/crm';
import { useNavigation } from '../stores/navigation';
import { PageHeader, PageShell, GlassCard, Badge, EmptyState, Modal } from '../components/ui';

type FilterType = 'all' | 'investor' | 'partner' | 'creator' | 'lead' | 'ecosystem';

const TYPE_COLORS: Record<string, string> = {
  investor: '#6EE7B7',
  partner:  '#A78BFA',
  creator:  '#F472B6',
  lead:     '#FBBF24',
  team:     '#00F5FF',
  ally:     '#C084FC',
  client:   '#10B981',
  vendor:   '#94A3B8',
};

export default function PeopleView() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Contact | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const { data: contacts = [], isLoading } = useContacts();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (contacts as Contact[]).filter((c) => {
      if (filter === 'ecosystem') {
        const meta = ((c as unknown as { metadata?: Record<string, unknown> }).metadata ?? {}) as { prospect_id?: string };
        if (!meta.prospect_id) return false;
      } else if (filter !== 'all' && c.type !== filter) {
        return false;
      }
      if (q && !(c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q))) {
        return false;
      }
      return true;
    });
  }, [contacts, filter, search]);

  const filterChips: Array<{ id: FilterType; label: string; count?: number }> = [
    { id: 'all',       label: 'All',        count: contacts.length },
    { id: 'investor',  label: 'Investors' },
    { id: 'partner',   label: 'Partners' },
    { id: 'creator',   label: 'Creators' },
    { id: 'lead',      label: 'Leads' },
    { id: 'ecosystem', label: '✦ From onboarding' },
  ];

  return (
    <PageShell>
      <PageHeader
        title="People"
        subtitle="People you're actively tracking, gathering intel on, and communicating with. Completed onboarding journeys auto-land here. Agents assist in the background."
      >
        <button
          onClick={() => setAddOpen(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: 'var(--color-brand-electric)', color: 'var(--surface-base)',
            border: 'none', cursor: 'pointer',
          }}
        >
          <UserPlus className="w-4 h-4" /> Add a person
        </button>
      </PageHeader>

      {/* Search */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            style={{
              width: '100%', padding: '8px 12px 8px 32px', borderRadius: 8,
              background: 'var(--surface-elevated)', color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)', fontSize: 13,
            }}
          />
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {filterChips.map((c) => {
          const active = filter === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setFilter(c.id)}
              style={{
                padding: '6px 12px', borderRadius: 20, fontSize: 12,
                background: active ? 'var(--color-brand-electric)' : 'var(--surface-elevated)',
                color: active ? 'var(--surface-base)' : 'var(--text-secondary)',
                border: `1px solid ${active ? 'var(--color-brand-electric)' : 'var(--border-subtle)'}`,
                cursor: 'pointer', fontWeight: active ? 600 : 500,
              }}
            >
              {c.label}{c.count != null ? ` (${c.count})` : ''}
            </button>
          );
        })}
      </div>

      {/* Empty / loading / rows */}
      {isLoading && <p style={{ color: 'var(--text-muted)' }}>Loading people…</p>}
      {!isLoading && filtered.length === 0 && (
        <EmptyState
          title={search || filter !== 'all' ? 'No matches' : 'Nobody in your pipeline yet'}
          description={
            search || filter !== 'all'
              ? 'Try a different search or filter.'
              : 'Click "Add a person" above, or wait for an onboarding journey to complete — completed journeys auto-land here.'
          }
        />
      )}

      {/* Two-column when selected */}
      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 420px' : '1fr', gap: 16 }}>
        <div style={{ display: 'grid', gap: 10 }}>
          {filtered.map((c) => (
            <PersonRow
              key={c.id}
              contact={c}
              selected={selected?.id === c.id}
              onClick={() => setSelected(c)}
            />
          ))}
        </div>

        {selected && (
          <PersonDetail
            contact={selected}
            onClose={() => setSelected(null)}
          />
        )}
      </div>

      <AddPersonModal open={addOpen} onClose={() => setAddOpen(false)} onCreated={(c) => setSelected(c)} />
    </PageShell>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Person row — name dominates, agent attribution absent
// ───────────────────────────────────────────────────────────────────────────

function PersonRow({ contact, selected, onClick }: { contact: Contact; selected: boolean; onClick: () => void }) {
  const accent = TYPE_COLORS[contact.type] ?? '#94A3B8';
  const meta = ((contact as unknown as { metadata?: Record<string, unknown> }).metadata ?? {}) as { prospect_id?: string; track?: string };
  const fromOnboarding = Boolean(meta.prospect_id);

  return (
    <GlassCard onClick={onClick} style={{ cursor: 'pointer', outline: selected ? '1px solid var(--color-brand-electric)' : 'none' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '4px 1fr auto', gap: 14, padding: 14, alignItems: 'center' }}>
        <div style={{ width: 4, height: 52, background: accent, borderRadius: 2 }} />
        <div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
              {contact.name || contact.email}
            </span>
            <Badge>{contact.type}</Badge>
            {contact.lifecycle_stage && <Badge>{contact.lifecycle_stage}</Badge>}
            {fromOnboarding && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600,
                background: 'rgba(110, 231, 183, 0.15)', color: '#6EE7B7',
                border: '1px solid rgba(110, 231, 183, 0.3)',
              }}>
                <Sparkles className="w-3 h-3" /> from onboarding
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 12 }}>
            {contact.email && <span>{contact.email}</span>}
            {contact.lead_score != null && contact.lead_score > 0 && (
              <span>lead score: <b style={{ color: 'var(--text-secondary)' }}>{contact.lead_score}</b></span>
            )}
            {contact.last_contacted && (
              <span>last touch: <b style={{ color: 'var(--text-secondary)' }}>{new Date(contact.last_contacted).toLocaleDateString()}</b></span>
            )}
          </div>
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: 18 }}>→</div>
      </div>
    </GlassCard>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Side panel — intel, activity, next action
// ───────────────────────────────────────────────────────────────────────────

function PersonDetail({ contact, onClose }: { contact: Contact; onClose: () => void }) {
  const { data: detail } = useContact(contact.id);
  const updateContact = useUpdateContact();
  const createActivity = useCreateActivity();
  const selectProspectJourney = useNavigation((s) => s.selectProspectJourney);

  const [notesDraft, setNotesDraft] = useState(contact.notes ?? '');
  const [actTitle, setActTitle] = useState('');
  const [actType, setActType] = useState<'note' | 'call' | 'email' | 'meeting'>('note');

  const activities = (detail?.activities ?? []) as Array<{ id: string; type: string; title: string; created_at: string }>;
  const meta = ((contact as unknown as { metadata?: Record<string, unknown> }).metadata ?? {}) as {
    prospect_id?: string; completion_journey_id?: string; track?: string;
  };

  const saveNotes = async () => {
    if (notesDraft === contact.notes) return;
    await updateContact.mutateAsync({ id: contact.id, notes: notesDraft });
  };

  const logActivity = async () => {
    if (!actTitle.trim()) return;
    await createActivity.mutateAsync({
      type: actType,
      title: actTitle.trim(),
      contact_id: contact.id,
      venture_id: contact.venture_id,
    });
    setActTitle('');
  };

  return (
    <GlassCard>
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 18,
            background: TYPE_COLORS[contact.type] ?? '#94A3B8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, color: 'var(--surface-base)', fontSize: 14,
          }}>
            {(contact.name || contact.email || '?').charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{contact.name || contact.email}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{contact.type}{contact.lifecycle_stage ? ` · ${contact.lifecycle_stage}` : ''}</div>
          </div>
          <button onClick={onClose} aria-label="Close" style={iconBtnStyle}>
            <XIcon size={14} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14, fontSize: 11 }}>
          {contact.email && <a href={`mailto:${contact.email}`} style={chipLinkStyle}><Mail size={11} /> {contact.email}</a>}
          {contact.linkedin_url && <a href={contact.linkedin_url} target="_blank" rel="noreferrer" style={chipLinkStyle}><Globe size={11} /> LinkedIn</a>}
          {contact.twitter_url && <a href={contact.twitter_url} target="_blank" rel="noreferrer" style={chipLinkStyle}><Globe size={11} /> Twitter/X</a>}
        </div>

        {meta.prospect_id && meta.completion_journey_id && (
          <div
            onClick={() => selectProspectJourney(meta.completion_journey_id!)}
            style={{
              marginBottom: 14, padding: '10px 12px', borderRadius: 8,
              background: 'rgba(110, 231, 183, 0.08)',
              border: '1px solid rgba(110, 231, 183, 0.25)',
              display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
            }}
          >
            <Sparkles size={14} style={{ color: '#6EE7B7' }} />
            <div style={{ flex: 1, fontSize: 12 }}>
              <div style={{ fontWeight: 600, color: '#6EE7B7' }}>From onboarding</div>
              <div style={{ color: 'var(--text-muted)' }}>{meta.track ? `${meta.track} journey` : 'View full journey'}</div>
            </div>
            <ArrowRight size={14} style={{ color: '#6EE7B7' }} />
          </div>
        )}

        <label style={sectionLabelStyle}>Intel</label>
        <textarea
          value={notesDraft}
          onChange={(e) => setNotesDraft(e.target.value)}
          onBlur={saveNotes}
          placeholder="Research notes, who they know, what they care about, why they're interesting…"
          rows={4}
          style={{
            width: '100%', padding: '10px 12px', borderRadius: 8,
            background: 'var(--surface-elevated)', color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)', fontSize: 12, fontFamily: 'inherit',
            resize: 'vertical', marginBottom: 14,
          }}
        />

        <label style={sectionLabelStyle}>Log activity</label>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          {(['note', 'call', 'email', 'meeting'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActType(t)}
              style={{
                padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500,
                background: actType === t ? 'var(--color-brand-electric)' : 'var(--surface-elevated)',
                color: actType === t ? 'var(--surface-base)' : 'var(--text-secondary)',
                border: `1px solid ${actType === t ? 'var(--color-brand-electric)' : 'var(--border-subtle)'}`,
                cursor: 'pointer',
              }}
            >
              {t}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            value={actTitle}
            onChange={(e) => setActTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && logActivity()}
            placeholder={`Log a ${actType}…`}
            style={{
              flex: 1, padding: '6px 10px', borderRadius: 6,
              background: 'var(--surface-elevated)', color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)', fontSize: 12,
            }}
          />
          <button onClick={logActivity} disabled={!actTitle.trim()} style={primaryBtnStyle}>Log</button>
        </div>

        {activities.length > 0 && (
          <>
            <div style={{ ...sectionLabelStyle, marginTop: 16 }}>Recent activity</div>
            <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
              {activities.slice(0, 10).map((a) => (
                <div key={a.id} style={{
                  padding: '8px 10px', borderRadius: 6,
                  background: 'var(--surface-elevated)', border: '1px solid var(--border-subtle)',
                  fontSize: 12,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <MessageSquare size={11} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: 10, fontWeight: 600, letterSpacing: 0.5 }}>{a.type}</span>
                    <span style={{ color: 'var(--text-muted)', marginLeft: 'auto', fontSize: 10 }}>
                      {new Date(a.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-primary)' }}>{a.title}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </GlassCard>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Add person modal
// ───────────────────────────────────────────────────────────────────────────

function AddPersonModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (c: Contact) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [type, setType] = useState<'investor' | 'partner' | 'creator' | 'lead' | 'ally'>('lead');
  const [notes, setNotes] = useState('');
  const createContact = useCreateContact();

  const submit = async () => {
    if (!name.trim() && !email.trim()) return;
    const payload: Record<string, unknown> = {
      name: name.trim() || email.trim(),
      type,
      status: 'active',
      source: 'manual',
    };
    if (email.trim()) payload.email = email.trim();
    if (notes.trim()) payload.notes = notes.trim();
    const res = await createContact.mutateAsync(payload as never);
    if (res?.contact) {
      onCreated(res.contact as Contact);
      setName(''); setEmail(''); setType('lead'); setNotes('');
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose} size="md" ariaLabel="Add a person">
      <div style={{ padding: 24, background: 'var(--surface-base)', borderRadius: 12, minWidth: 440 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0, marginBottom: 4 }}>
          Add a person to People
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, marginBottom: 16 }}>
          Track anyone — investors, partners, creators, allies. You can add intel and log touches once they're in.
        </p>

        <label style={sectionLabelStyle}>Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" style={inputStyle} />

        <label style={sectionLabelStyle}>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" style={inputStyle} />

        <label style={sectionLabelStyle}>Type</label>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          {(['investor', 'partner', 'creator', 'lead', 'ally'] as const).map((t) => (
            <button key={t} onClick={() => setType(t)} style={{
              padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
              background: type === t ? (TYPE_COLORS[t] ?? 'var(--color-brand-electric)') : 'var(--surface-elevated)',
              color: type === t ? 'var(--surface-base)' : 'var(--text-secondary)',
              border: `1px solid ${type === t ? (TYPE_COLORS[t] ?? 'var(--color-brand-electric)') : 'var(--border-subtle)'}`,
              cursor: 'pointer',
            }}>{t}</button>
          ))}
        </div>

        <label style={sectionLabelStyle}>Initial intel (optional)</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
          placeholder="Where you met them, why they're interesting, who introduced you…"
          style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
        />

        <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={secondaryBtnStyle}>Cancel</button>
          <button onClick={submit} disabled={(!name.trim() && !email.trim()) || createContact.isPending} style={primaryBtnStyle}>
            {createContact.isPending ? 'Adding…' : 'Add to People'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Style helpers
// ───────────────────────────────────────────────────────────────────────────

const sectionLabelStyle: React.CSSProperties = {
  display: 'block', fontSize: 10, color: 'var(--text-muted)',
  textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600,
  marginTop: 8, marginBottom: 6,
};

const iconBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 24, height: 24, borderRadius: 6,
  background: 'transparent', color: 'var(--text-muted)',
  border: '1px solid var(--border-subtle)', cursor: 'pointer',
};

const chipLinkStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 4,
  padding: '3px 8px', borderRadius: 10,
  background: 'var(--surface-elevated)', color: 'var(--text-secondary)',
  border: '1px solid var(--border-subtle)', textDecoration: 'none',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 6,
  background: 'var(--surface-elevated)', color: 'var(--text-primary)',
  border: '1px solid var(--border-subtle)', fontSize: 13,
  marginBottom: 8,
};

const primaryBtnStyle: React.CSSProperties = {
  padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
  background: 'var(--color-brand-electric)', color: 'var(--surface-base)',
  border: 'none', cursor: 'pointer',
};

const secondaryBtnStyle: React.CSSProperties = {
  padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
  background: 'transparent', color: 'var(--text-secondary)',
  border: '1px solid var(--border-subtle)', cursor: 'pointer',
};
