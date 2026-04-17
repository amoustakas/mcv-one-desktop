import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, fadeInUp } from '../lib/animations';
import {
  Users, Plus, Trash2, Mail, Building, DollarSign, TrendingUp,
  ArrowRight, Phone, Globe, X, Edit3, Save, MessageSquare,
  Calendar, Tag, Activity, FileText, ChevronRight, Clock, Search, Filter,
  PhoneCall, Video, StickyNote, Send, Link,
} from 'lucide-react';
import { useNavigation } from '../stores/navigation';
import { ventures } from '../lib/ventures';
import { useToast } from '../components/Toasts';
import {
  useContacts, useContact, useCreateContact, useUpdateContact, useDeleteContact,
  useDeals, useCreateDeal, useUpdateDeal, useDeleteDeal,
  useActivities, useCreateActivity,
  useAccounts, useCreateAccount, useDeleteAccount,
  usePipelineStats,
} from '../hooks/use-crm';
import type { Contact } from '../lib/schemas/crm';
import { Button, GlassCard, Badge, StatCard, Tabs, EmptyState, GridLayout, BulkActionBar, Tooltip, Dialog, DialogActions, FormField, Input, Select } from '../components/ui';
import { SuiteShell } from '../components/suite';
import type { BulkAction } from '../components/ui';
import { Tag as TagIcon, ArrowRightCircle, AlertTriangle, Sparkles } from 'lucide-react';
import { timeAgo, formatMoney, formatDate, cn } from '../lib/utils';
import ContextCommsMenu from '../components/ContextCommsMenu';
import InvestorsPanel from '../components/crm/InvestorsPanel';

// ── Constants ──
const TYPE_COLORS: Record<string, string> = { lead: '#F59E0B', prospect: '#00F0FF', client: '#10B981', partner: '#8B5CF6', investor: '#3B82F6', vendor: '#6B7280' };
const STAGE_COLORS: Record<string, string> = { discovery: '#6B7280', qualification: '#00F0FF', proposal: '#F59E0B', negotiation: '#8B5CF6', closed_won: '#10B981', closed_lost: '#EF4444' };
const ACTIVITY_ICONS: Record<string, typeof Phone> = { call: PhoneCall, email: Send, meeting: Video, note: StickyNote, task: FileText };
const ACTIVITY_COLORS: Record<string, string> = { call: '#10B981', email: '#3B82F6', meeting: '#8B5CF6', note: '#F59E0B', task: '#00F0FF' };
const ACCOUNT_TYPE_COLORS: Record<string, string> = { prospect: '#F59E0B', customer: '#10B981', partner: '#8B5CF6', vendor: '#3B82F6', churned: '#EF4444' };

const CRM_TABS = [
  { id: 'contacts', label: 'Contacts' },
  { id: 'accounts', label: 'Accounts' },
  { id: 'deals', label: 'Deals' },
  { id: 'pipeline', label: 'Pipeline' },
  { id: 'activities', label: 'Activity' },
  { id: 'investors', label: 'Investors' },
];

// ═══════════════════════════════════════════
// Contact Detail Panel (right side drawer)
// ═══════════════════════════════════════════
// Reverse-link banner: shown when this contact was created by the
// completion-effects hook (Phase 2 onboarding journey). Reads journey id
// from contact.metadata.completion_journey_id (set by runJourneyCompletionEffects).
function FromOnboardingLink({ contact }: { contact: Contact }) {
  const meta = (contact.metadata ?? {}) as {
    prospect_id?: string; completion_journey_id?: string; track?: string;
  };
  if (!meta.prospect_id || !meta.completion_journey_id) return null;

  const selectProspectJourney = useNavigation((s) => s.selectProspectJourney);

  return (
    <div
      onClick={() => selectProspectJourney(meta.completion_journey_id!)}
      style={{
        marginTop: 10, padding: '10px 12px', borderRadius: 8,
        background: 'rgba(110, 231, 183, 0.08)',
        border: '1px solid rgba(110, 231, 183, 0.25)',
        display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
        transition: 'background 0.15s ease',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(110, 231, 183, 0.14)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(110, 231, 183, 0.08)'; }}
    >
      <Sparkles size={14} style={{ color: '#6EE7B7', flexShrink: 0 }} />
      <div style={{ flex: 1, fontSize: 12 }}>
        <div style={{ fontWeight: 600, color: '#6EE7B7' }}>From onboarding</div>
        <div style={{ color: 'var(--text-muted)' }}>
          Created by completed{meta.track ? ` ${meta.track}` : ''} journey · click to view
        </div>
      </div>
      <ArrowRight size={14} style={{ color: '#6EE7B7' }} />
    </div>
  );
}

function ContactDetail({ contact, onClose, onDelete }: {
  contact: Contact; onClose: () => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(contact);
  const [newTag, setNewTag] = useState('');
  const [actForm, setActForm] = useState({ type: 'note', title: '' });

  const { data: contactData } = useContact(contact.id);
  const activities = contactData?.activities || [];
  const deals = contactData?.deals || [];
  const updateContact = useUpdateContact();
  const createActivity = useCreateActivity();

  // Reset form when contact changes
  useEffect(() => { setForm(contact); setEditing(false); }, [contact.id]);

  async function handleSave() {
    const result = await updateContact.mutateAsync({ id: form.id, name: form.name, email: form.email, phone: form.phone, company: form.company, role: form.role, type: form.type, notes: form.notes, tags: form.tags, linkedin_url: form.linkedin_url, twitter_url: form.twitter_url });
    if (result.contact) setEditing(false);
  }

  async function handleAddTag() {
    if (!newTag.trim()) return;
    const tags = [...(form.tags || []), newTag.trim()];
    setForm({ ...form, tags });
    setNewTag('');
    updateContact.mutate({ id: form.id, tags });
  }

  function removeTag(t: string) {
    const tags = (form.tags || []).filter(x => x !== t);
    setForm({ ...form, tags });
    updateContact.mutate({ id: form.id, tags });
  }

  async function handleLogActivity() {
    if (!actForm.title.trim()) return;
    await createActivity.mutateAsync({ ...actForm, contact_id: contact.id, venture_id: contact.venture_id });
    setActForm({ type: 'note', title: '' });
  }

  const ventureObj = ventures.find(v => v.id === contact.venture_id);

  return (
    <motion.div
      className="cd-panel"
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="cd-header">
        <div className="cd-header-left">
          <span className="cd-avatar" style={{ background: TYPE_COLORS[contact.type] || '#6B7280' }}>
            {contact.name.charAt(0).toUpperCase()}
          </span>
          <div>
            {editing ? (
              <input className="cd-name-edit" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} autoFocus />
            ) : (
              <span className="cd-name">{contact.name}</span>
            )}
            <span className="cd-company">{contact.company || 'No company'}{contact.role && ` · ${contact.role}`}</span>
          </div>
        </div>
        <div className="cd-header-actions">
          {editing ? (
            <Button variant="primary" size="sm" icon={<Save size={12} />} onClick={handleSave}>Save</Button>
          ) : (
            <Button variant="ghost" size="sm" icon={<Edit3 size={12} />} onClick={() => setEditing(true)}>Edit</Button>
          )}
          <Button variant="ghost" size="sm" onClick={onClose}><X size={14} /></Button>
        </div>
      </div>

      <div className="cd-body">
        {/* Info Section */}
        <div className="cd-section">
          <div className="cd-info-grid">
            <div className="cd-info-row">
              <Mail size={12} />
              {editing ? <input className="cd-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email" /> : <span>{contact.email || '—'}</span>}
            </div>
            <div className="cd-info-row">
              <Phone size={12} />
              {editing ? <input className="cd-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Phone" /> : <span>{contact.phone || '—'}</span>}
            </div>
            <div className="cd-info-row">
              <Building size={12} />
              {editing ? <input className="cd-input" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="Company" /> : <span>{contact.company || '—'}</span>}
            </div>
            <div className="cd-info-row">
              <Link size={12} />
              {editing ? <input className="cd-input" value={form.linkedin_url || ''} onChange={e => setForm({ ...form, linkedin_url: e.target.value })} placeholder="LinkedIn URL" /> : (
                contact.linkedin_url ? <a href={contact.linkedin_url} target="_blank" rel="noreferrer" className="cd-link">LinkedIn Profile</a> : <span>—</span>
              )}
            </div>
            <div className="cd-info-row">
              <Globe size={12} />
              {editing ? <input className="cd-input" value={form.twitter_url || ''} onChange={e => setForm({ ...form, twitter_url: e.target.value })} placeholder="X/Twitter URL" /> : (
                contact.twitter_url ? <a href={contact.twitter_url} target="_blank" rel="noreferrer" className="cd-link">X Profile</a> : <span>—</span>
              )}
            </div>
          </div>

          <div className="cd-meta-row">
            <Badge color={TYPE_COLORS[contact.type]} variant="outline">
              {editing ? (
                <select className="cd-sel" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  {Object.keys(TYPE_COLORS).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              ) : contact.type}
            </Badge>
            {ventureObj && <Badge color={ventureObj.color} variant="outline">{ventureObj.name}</Badge>}
            <span className="cd-time-badge"><Clock size={10} /> Added {timeAgo(contact.created_at)}</span>
            {contact.last_contacted && <span className="cd-time-badge"><MessageSquare size={10} /> Last contact {timeAgo(contact.last_contacted)}</span>}
          </div>

          {/* Phase 2 reverse-link: this contact was constructed by a completed
              onboarding journey. Surface the link so user can jump back. */}
          <FromOnboardingLink contact={contact} />
        </div>

        {/* Tags */}
        <div className="cd-section">
          <span className="cd-section-label"><Tag size={11} /> Tags</span>
          <div className="cd-tags">
            {(form.tags || []).map(t => (
              <span key={t} className="cd-tag">{t}<button className="cd-tag-x" onClick={() => removeTag(t)}>×</button></span>
            ))}
            <div className="cd-tag-add">
              <input className="cd-tag-input" value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddTag()} placeholder="Add tag..." />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="cd-section">
          <span className="cd-section-label"><FileText size={11} /> Notes</span>
          {editing ? (
            <textarea className="cd-textarea" value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} rows={4} />
          ) : (
            <p className="cd-notes">{contact.notes || 'No notes yet.'}</p>
          )}
        </div>

        {/* Deals */}
        {deals.length > 0 && (
          <div className="cd-section">
            <span className="cd-section-label"><DollarSign size={11} /> Deals ({deals.length})</span>
            <div className="cd-deals-list">
              {deals.map(d => (
                <div key={d.id} className="cd-deal-item">
                  <span className="cd-deal-stage" style={{ color: STAGE_COLORS[d.stage] }}>{d.stage.replace('_', ' ')}</span>
                  <span className="cd-deal-title">{d.title}</span>
                  <span className="cd-deal-val">{formatMoney(d.value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Log Activity */}
        <div className="cd-section">
          <span className="cd-section-label"><Activity size={11} /> Log Activity</span>
          <div className="cd-act-form">
            <select className="cd-sel" value={actForm.type} onChange={e => setActForm({ ...actForm, type: e.target.value })}>
              <option value="note">Note</option>
              <option value="call">Call</option>
              <option value="email">Email</option>
              <option value="meeting">Meeting</option>
              <option value="task">Task</option>
            </select>
            <input className="cd-input flex" value={actForm.title} onChange={e => setActForm({ ...actForm, title: e.target.value })} onKeyDown={e => e.key === 'Enter' && handleLogActivity()} placeholder={`Log a ${actForm.type}...`} />
            <Button variant="primary" size="sm" icon={<Plus size={12} />} onClick={handleLogActivity}>Log</Button>
          </div>
        </div>

        {/* Activity Timeline */}
        {activities.length > 0 && (
          <div className="cd-section">
            <span className="cd-section-label"><Clock size={11} /> Timeline ({activities.length})</span>
            <div className="cd-timeline">
              {activities.map(a => {
                const Icon = ACTIVITY_ICONS[a.type] || StickyNote;
                return (
                  <div key={a.id} className="cd-tl-item">
                    <div className="cd-tl-icon" style={{ background: `${ACTIVITY_COLORS[a.type] || '#6B7280'}20`, color: ACTIVITY_COLORS[a.type] || '#6B7280' }}>
                      <Icon size={11} />
                    </div>
                    <div className="cd-tl-content">
                      <span className="cd-tl-title">{a.title}</span>
                      {a.description && <span className="cd-tl-desc">{a.description}</span>}
                    </div>
                    <span className="cd-tl-time">{timeAgo(a.created_at)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Danger Zone */}
        <div className="cd-section cd-danger">
          <Button variant="danger" size="sm" icon={<Trash2 size={12} />} onClick={() => { onDelete(contact.id); onClose(); }}>Delete Contact</Button>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════
// Main CRM View
// ═══════════════════════════════════════════
export default function CRMView() {
  const [tab, setTab] = useState<'contacts' | 'deals' | 'accounts' | 'activities' | 'pipeline' | 'investors'>('contacts');
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const [form, setForm] = useState({ name: '', email: '', company: '', role: '', type: 'lead', phone: '', venture_id: '' });
  const [dealForm, setDealForm] = useState({ title: '', value: 0, stage: 'discovery', venture_id: '', contact_id: '', probability: 20, expected_close: '' });
  const [accountForm, setAccountForm] = useState({ name: '', domain: '', industry: '', size: '', type: 'prospect', venture_id: '' });
  const { mode, activeVenture } = useNavigation();
  const consumeCrmContactId = useNavigation((s) => s.consumeCrmContactId);
  const { toast } = useToast();

  const ventureFilter = mode === 'venture' ? activeVenture : undefined;
  const { data: contacts = [], isLoading: loading, refetch } = useContacts(ventureFilter || undefined);
  const [pendingJumpEmail, setPendingJumpEmail] = useState<string | null>(() => {
    try {
      const v = sessionStorage.getItem('mcv-crm-jumpto-email');
      if (v) sessionStorage.removeItem('mcv-crm-jumpto-email');
      return v;
    } catch { return null; }
  });
  const [selectedDealIds, setSelectedDealIds] = useState<string[]>([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);

  const toggleDealSelected = (id: string) => {
    setSelectedDealIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };
  const [draggingDealId, setDraggingDealId] = useState<string | null>(null);
  const [dealDropTarget, setDealDropTarget] = useState<string | null>(null);

  const handleDealDrop = (newStage: string) => {
    if (!draggingDealId) return;
    const d = deals.find((x) => x.id === draggingDealId);
    if (d && d.stage !== newStage) {
      updateDealMut.mutate({ id: draggingDealId, stage: newStage });
      toast('success', `${d.title} → ${newStage.replace(/_/g, ' ')}`);
    }
    setDraggingDealId(null);
    setDealDropTarget(null);
  };
  const toggleAccountSelected = (id: string) => {
    setSelectedAccountIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };
  const { data: deals = [] } = useDeals(ventureFilter || undefined);
  const { data: activities = [] } = useActivities(ventureFilter || undefined);
  const { data: accounts = [] } = useAccounts(ventureFilter || undefined);
  const { data: pipelineData = [] } = usePipelineStats(ventureFilter || undefined);

  const createContactMut = useCreateContact();
  const updateContactMut = useUpdateContact();
  const deleteContactMut = useDeleteContact();
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);

  const toggleContactSelected = (id: string) => {
    setSelectedContactIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  // Cross-surface jump: if another view stashed an email in sessionStorage,
  // open that contact's detail panel as soon as the contacts list resolves.
  useEffect(() => {
    if (!pendingJumpEmail || contacts.length === 0) return;
    const match = contacts.find((c: Contact) => c.email?.toLowerCase() === pendingJumpEmail);
    if (match) {
      setTab('contacts');
      setSelectedContact(match);
      toast('info', `Opened ${match.name} from Command Center`);
    } else {
      // No exact match — surface as a search filter so user sees nearest results
      setTab('contacts');
      setSearch(pendingJumpEmail);
      toast('info', `No exact contact for ${pendingJumpEmail} — filtered list`);
    }
    setPendingJumpEmail(null);
  }, [pendingJumpEmail, contacts, toast]);

  // Cross-surface jump #2: navigation pointer set by ProspectProfileView's
  // "Open in CRM" CTA. Consume + clear on mount once contacts are loaded.
  useEffect(() => {
    if (contacts.length === 0) return;
    const id = consumeCrmContactId();
    if (!id) return;
    const match = contacts.find((c: Contact) => c.id === id);
    if (match) {
      setTab('contacts');
      setSelectedContact(match);
      toast('info', `Opened ${match.name} from onboarding journey`);
    }
  }, [contacts, consumeCrmContactId, toast]);

  // Bulk-action prompts moved to a single in-app Dialog. The action handler
  // stages the work in `bulkPrompt` (mode + ids + initial value), the Dialog
  // collects/validates input, and `runBulkPrompt` dispatches to the right
  // mutation. This replaces 3 sequential window.prompt() calls — also lets
  // us validate type values via a Select instead of free-text + check.
  type BulkPromptMode = 'tag' | 'contact-type' | 'account-type';
  const [bulkPrompt, setBulkPrompt] = useState<{ mode: BulkPromptMode; ids: string[] } | null>(null);
  const [bulkPromptValue, setBulkPromptValue] = useState('');
  const [bulkPromptBusy, setBulkPromptBusy] = useState(false);

  const openBulkPrompt = (mode: BulkPromptMode, ids: string[]) => {
    setBulkPromptValue(mode === 'tag' ? '' : (mode === 'contact-type' ? 'lead' : 'prospect'));
    setBulkPrompt({ mode, ids });
  };

  const runBulkPrompt = async () => {
    if (!bulkPrompt) return;
    const v = bulkPromptValue.trim();
    if (!v) return;
    setBulkPromptBusy(true);
    try {
      if (bulkPrompt.mode === 'tag') {
        for (const id of bulkPrompt.ids) {
          const c = contacts.find((x: Contact) => x.id === id);
          if (!c) continue;
          const tags = Array.from(new Set([...(c.tags || []), v]));
          try { await updateContactMut.mutateAsync({ id, tags }); } catch { /* skip */ }
        }
        toast('success', `Tagged ${bulkPrompt.ids.length} contact${bulkPrompt.ids.length === 1 ? '' : 's'} with "${v}"`);
      } else if (bulkPrompt.mode === 'contact-type') {
        for (const id of bulkPrompt.ids) {
          try { await updateContactMut.mutateAsync({ id, type: v as Contact['type'] }); } catch { /* skip */ }
        }
        toast('success', `Updated ${bulkPrompt.ids.length} contact${bulkPrompt.ids.length === 1 ? '' : 's'} to ${v}`);
      } else {
        for (const id of bulkPrompt.ids) {
          try {
            await fetch('/api/crm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update-account', id, type: v }) });
          } catch { /* skip */ }
        }
        toast('success', `Updated ${bulkPrompt.ids.length} account${bulkPrompt.ids.length === 1 ? '' : 's'} to ${v}`);
      }
      setBulkPrompt(null);
    } finally {
      setBulkPromptBusy(false);
    }
  };
  const createDealMut = useCreateDeal();
  const updateDealMut = useUpdateDeal();
  const deleteDealMut = useDeleteDeal();
  const createAccountMut = useCreateAccount();
  const deleteAccountMut = useDeleteAccount();

  async function handleCreateContact() {
    if (!form.name.trim()) return;
    await createContactMut.mutateAsync({ ...form, venture_id: form.venture_id || (mode === 'venture' ? activeVenture : null) || '' });
    toast('success', `Contact "${form.name}" created`);
    setForm({ name: '', email: '', company: '', role: '', type: 'lead', phone: '', venture_id: '' }); setShowAdd(false);
  }

  async function handleCreateDeal() {
    if (!dealForm.title.trim()) return;
    await createDealMut.mutateAsync({ ...dealForm, venture_id: dealForm.venture_id || (mode === 'venture' ? activeVenture : null) || '', contact_id: dealForm.contact_id || '' });
    toast('success', `Deal "${dealForm.title}" created`);
    setDealForm({ title: '', value: 0, stage: 'discovery', venture_id: '', contact_id: '', probability: 20, expected_close: '' }); setShowAdd(false);
  }

  function handleDeleteContact(id: string) {
    deleteContactMut.mutate(id);
    if (selectedContact?.id === id) setSelectedContact(null);
    toast('info', 'Contact deleted');
  }

  const contactBulkActions: BulkAction[] = [
    {
      id: 'tag',
      label: 'Add Tag',
      icon: <TagIcon size={12} />,
      onRun: (ids) => openBulkPrompt('tag', ids),
    },
    {
      id: 'change-type',
      label: 'Change Type',
      icon: <ArrowRightCircle size={12} />,
      onRun: (ids) => {
        openBulkPrompt('contact-type', ids);
        // Empty body — actual mutation happens in runBulkPrompt below.
        return Promise.resolve();
      },
    },
    {
      id: 'export',
      label: 'Export CSV',
      icon: <FileText size={12} />,
      onRun: (ids) => {
        const rows = contacts
          .filter((c: Contact) => ids.includes(c.id))
          .map((c: Contact) =>
            [c.name, c.email || '', c.company || '', c.role || '', c.type, c.phone || '', (c.tags || []).join('; ')]
              .map((v) => `"${String(v).replace(/"/g, '""')}"`)
              .join(','),
          );
        const csv = ['"Name","Email","Company","Role","Type","Phone","Tags"', ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `contacts-export-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast('success', `Exported ${ids.length} contacts to CSV`);
      },
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 size={12} />,
      danger: true,
      confirm: true,
      onRun: async (ids) => {
        for (const id of ids) {
          try { await deleteContactMut.mutateAsync(id); } catch { /* skip */ }
        }
        if (selectedContact && ids.includes(selectedContact.id)) setSelectedContact(null);
        toast('info', `Deleted ${ids.length} contact${ids.length === 1 ? '' : 's'}`);
      },
    },
  ];

  function handleUpdateDealStage(dealId: string, newStage: string) {
    updateDealMut.mutate({ id: dealId, stage: newStage });
    toast('info', `Deal moved to ${newStage.replace(/_/g, ' ')}`);
  }

  function handleDeleteDeal(id: string) {
    deleteDealMut.mutate(id);
  }

  async function handleCreateAccount() {
    if (!accountForm.name.trim()) return;
    await createAccountMut.mutateAsync({ ...accountForm, venture_id: accountForm.venture_id || (mode === 'venture' ? activeVenture : null) || '' });
    toast('success', `Account "${accountForm.name}" created`);
    setAccountForm({ name: '', domain: '', industry: '', size: '', type: 'prospect', venture_id: '' }); setShowAdd(false);
  }

  function handleDeleteAccount(id: string) {
    deleteAccountMut.mutate(id);
  }

  // Bulk action defs for Deals (kanban) and Accounts (table)
  const dealBulkActions: BulkAction[] = [
    {
      id: 'advance-stage',
      label: 'Advance Stage',
      icon: <ArrowRight size={12} />,
      onRun: async (ids) => {
        const stages = Object.keys(STAGE_COLORS);
        for (const id of ids) {
          const d = deals.find((x) => x.id === id);
          if (!d) continue;
          const idx = stages.indexOf(d.stage);
          if (idx >= 0 && idx < stages.length - 1) {
            try { await updateDealMut.mutateAsync({ id, stage: stages[idx + 1] }); } catch { /* skip */ }
          }
        }
        toast('success', `Advanced ${ids.length} deal${ids.length === 1 ? '' : 's'}`);
      },
    },
    {
      id: 'won',
      label: 'Mark Won',
      icon: <DollarSign size={12} />,
      confirm: 'Mark selected deals as closed_won?',
      onRun: async (ids) => {
        for (const id of ids) {
          try { await updateDealMut.mutateAsync({ id, stage: 'closed_won' }); } catch { /* skip */ }
        }
        toast('success', `${ids.length} deal${ids.length === 1 ? '' : 's'} won 🎉`);
      },
    },
    {
      id: 'lost',
      label: 'Mark Lost',
      icon: <X size={12} />,
      onRun: async (ids) => {
        for (const id of ids) {
          try { await updateDealMut.mutateAsync({ id, stage: 'closed_lost' }); } catch { /* skip */ }
        }
        toast('info', `${ids.length} deal${ids.length === 1 ? '' : 's'} closed lost`);
      },
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 size={12} />,
      danger: true,
      confirm: true,
      onRun: async (ids) => {
        for (const id of ids) {
          try { await deleteDealMut.mutateAsync(id); } catch { /* skip */ }
        }
        toast('info', `Deleted ${ids.length} deal${ids.length === 1 ? '' : 's'}`);
      },
    },
  ];

  const accountBulkActions: BulkAction[] = [
    {
      id: 'change-type',
      label: 'Change Type',
      icon: <ArrowRightCircle size={12} />,
      onRun: (ids) => {
        openBulkPrompt('account-type', ids);
        return Promise.resolve();
      },
    },
    {
      id: 'export',
      label: 'Export CSV',
      icon: <FileText size={12} />,
      onRun: (ids) => {
        const rows = accounts
          .filter((a) => ids.includes(a.id))
          .map((a) => [a.name, a.domain || '', a.industry || '', a.type, a.size || '', String(a.health_score ?? '')]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));
        const csv = ['"Name","Domain","Industry","Type","Size","Health"', ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `accounts-export-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast('success', `Exported ${ids.length} accounts`);
      },
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 size={12} />,
      danger: true,
      confirm: true,
      onRun: async (ids) => {
        for (const id of ids) {
          try { await deleteAccountMut.mutateAsync(id); } catch { /* skip */ }
        }
        toast('info', `Deleted ${ids.length} account${ids.length === 1 ? '' : 's'}`);
      },
    },
  ];

  // Filtered contacts
  const filteredContacts = contacts.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.company?.toLowerCase().includes(search.toLowerCase()) && !c.email?.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter !== 'all' && c.type !== typeFilter) return false;
    return true;
  });

  const pipeline = deals.reduce((s, d) => s + (d.value || 0), 0);
  const wonValue = deals.filter(d => d.stage === 'closed_won').reduce((s, d) => s + (d.value || 0), 0);
  const activeDeals = deals.filter(d => !d.stage.startsWith('closed')).length;

  return (
    <SuiteShell
      suite="crm"
      title="CRM"
      subtitle="Universal relationship OS — investors, customers, operators, partners, advisors, vendors. One pipeline per archetype."
      icon={<Users size={20} />}
      loading={loading}
      onRefresh={() => refetch()}
      headerActions={
        <>
          {tab === 'contacts' && (
            <div className="crm-search-bar">
              <Search size={12} />
              <input className="crm-search-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contacts..." />
            </div>
          )}
          {tab === 'contacts' && (
            <div className="crm-filter">
              <Filter size={11} />
              <select className="crm-filter-sel" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                <option value="all">All Types</option>
                {Object.keys(TYPE_COLORS).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          )}
          {tab !== 'activities' && tab !== 'pipeline' && (
            <Button variant="secondary" size="sm" icon={<Plus size={13} />} onClick={() => setShowAdd(!showAdd)}>
              {tab === 'contacts' ? 'Contact' : tab === 'accounts' ? 'Account' : 'Deal'}
            </Button>
          )}
        </>
      }
    >
      <Tabs
        tabs={CRM_TABS.map(t => ({
          ...t,
          count: t.id === 'contacts' ? contacts.length :
                 t.id === 'accounts' ? accounts.length :
                 t.id === 'deals' ? deals.length :
                 t.id === 'activities' ? activities.length : undefined,
        }))}
        active={tab}
        onChange={(id) => { setTab(id as typeof tab); setShowAdd(false); }}
      />

      {/* Add Forms */}
      {showAdd && tab === 'contacts' && (
        <GlassCard className="crm-form">
          <input placeholder="Name *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="crm-input" onKeyDown={e => e.key === 'Enter' && handleCreateContact()} autoFocus />
          <input placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="crm-input" />
          <input placeholder="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="crm-input" />
          <input placeholder="Company" value={form.company} onChange={e => setForm({...form, company: e.target.value})} className="crm-input" />
          <input placeholder="Role" value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="crm-input" />
          <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="crm-sel">
            {Object.keys(TYPE_COLORS).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={form.venture_id} onChange={e => setForm({...form, venture_id: e.target.value})} className="crm-sel">
            <option value="">All ventures</option>
            {ventures.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          <Button variant="primary" size="sm" onClick={handleCreateContact}>Add Contact</Button>
        </GlassCard>
      )}
      {showAdd && tab === 'deals' && (
        <GlassCard className="crm-form">
          <input placeholder="Deal title *" value={dealForm.title} onChange={e => setDealForm({...dealForm, title: e.target.value})} className="crm-input" onKeyDown={e => e.key === 'Enter' && handleCreateDeal()} autoFocus />
          <input placeholder="Value" type="number" value={dealForm.value || ''} onChange={e => setDealForm({...dealForm, value: parseFloat(e.target.value) || 0})} className="crm-input" style={{ maxWidth: 120 }} />
          <select value={dealForm.stage} onChange={e => setDealForm({...dealForm, stage: e.target.value})} className="crm-sel">
            {Object.keys(STAGE_COLORS).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          <select value={dealForm.contact_id} onChange={e => setDealForm({...dealForm, contact_id: e.target.value})} className="crm-sel">
            <option value="">No contact</option>
            {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input placeholder="Probability %" type="number" value={dealForm.probability} onChange={e => setDealForm({...dealForm, probability: parseInt(e.target.value) || 0})} className="crm-input" style={{ maxWidth: 100 }} />
          <input type="date" value={dealForm.expected_close} onChange={e => setDealForm({...dealForm, expected_close: e.target.value})} className="crm-input" style={{ maxWidth: 150 }} />
          <Button variant="primary" size="sm" onClick={handleCreateDeal}>Add Deal</Button>
        </GlassCard>
      )}

      {showAdd && tab === 'accounts' && (
        <GlassCard className="crm-form">
          <input placeholder="Company name *" value={accountForm.name} onChange={e => setAccountForm({...accountForm, name: e.target.value})} className="crm-input" onKeyDown={e => e.key === 'Enter' && handleCreateAccount()} autoFocus />
          <input placeholder="Domain" value={accountForm.domain} onChange={e => setAccountForm({...accountForm, domain: e.target.value})} className="crm-input" />
          <input placeholder="Industry" value={accountForm.industry} onChange={e => setAccountForm({...accountForm, industry: e.target.value})} className="crm-input" />
          <select value={accountForm.size} onChange={e => setAccountForm({...accountForm, size: e.target.value})} className="crm-sel">
            <option value="">Size</option>
            <option value="1-10">1-10</option><option value="11-50">11-50</option><option value="51-200">51-200</option>
            <option value="201-500">201-500</option><option value="501-1000">501-1000</option><option value="1000+">1000+</option>
          </select>
          <select value={accountForm.type} onChange={e => setAccountForm({...accountForm, type: e.target.value})} className="crm-sel">
            {Object.keys(ACCOUNT_TYPE_COLORS).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <Button variant="primary" size="sm" onClick={handleCreateAccount}>Add Account</Button>
        </GlassCard>
      )}

      {/* Content Area + Optional Detail Panel */}
      <div className="crm-layout">
        <div className="crm-body">
          {/* ── Contacts Tab ── */}
          {tab === 'contacts' && (
            <div className="crm-table">
              <div className="crm-table-header">
                <span className="crm-col-check">
                  <input
                    type="checkbox"
                    checked={filteredContacts.length > 0 && selectedContactIds.length === filteredContacts.length}
                    ref={(el) => { if (el) el.indeterminate = selectedContactIds.length > 0 && selectedContactIds.length < filteredContacts.length; }}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedContactIds(filteredContacts.map((c: Contact) => c.id));
                      else setSelectedContactIds([]);
                    }}
                    aria-label="Select all visible contacts"
                    style={{ accentColor: 'var(--cyan)' }}
                  />
                </span>
                <span>Name</span><span>Company</span><span>Type</span><span>Email</span><span>Tags</span><span>Last Contact</span><span></span>
              </div>
              <motion.div variants={staggerContainer} initial="hidden" animate="show">
                {filteredContacts.map(c => (
                  <motion.div
                    key={c.id}
                    variants={fadeInUp}
                    className={`crm-table-row crm-row-hoverlift ${selectedContact?.id === c.id ? 'selected' : ''} ${selectedContactIds.includes(c.id) ? 'crm-row-bulk-selected' : ''}`}
                    onClick={() => setSelectedContact(c)}
                    whileHover={{ y: -2, boxShadow: '0 4px 20px rgba(0,245,255,0.08)' }}
                    transition={{ duration: 0.15 }}
                  >
                    <span className="crm-col-check" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedContactIds.includes(c.id)}
                        onChange={() => toggleContactSelected(c.id)}
                        aria-label={`Select ${c.name}`}
                        style={{ accentColor: 'var(--cyan)' }}
                      />
                    </span>
                    <span className="crm-name">
                      <span className="crm-avatar-sm" style={{ background: TYPE_COLORS[c.type] || '#6B7280' }}>{c.name.charAt(0).toUpperCase()}</span>
                      {c.name}{c.role && <span className="crm-role">{c.role}</span>}
                      <ContextCommsMenu contact={{ name: c.name, email: c.email, phone: c.phone }} />
                    </span>
                    <span className="crm-company"><Building size={10} /> {c.company || '—'}</span>
                    <Badge color={TYPE_COLORS[c.type]} variant="outline">{c.type}</Badge>
                    <span className="crm-email">{c.email ? <><Mail size={10} /> {c.email}</> : '—'}</span>
                    <span className="crm-tags-cell">
                      {(c.tags || []).slice(0, 2).map(t => <span key={t} className="crm-tag-mini">{t}</span>)}
                      {(c.tags || []).length > 2 && <span className="crm-tag-more">+{c.tags.length - 2}</span>}
                    </span>
                    <span className="crm-time">{c.last_contacted ? timeAgo(c.last_contacted) : '—'}</span>
                    <button className="crm-row-action" onClick={e => { e.stopPropagation(); setSelectedContact(c); }}><ChevronRight size={13} /></button>
                  </motion.div>
                ))}
              </motion.div>
              {filteredContacts.length === 0 && !loading && <EmptyState icon={<Users size={20} />} title="No contacts match your search." />}

              <BulkActionBar
                selectedIds={selectedContactIds}
                onClear={() => setSelectedContactIds([])}
                actions={contactBulkActions}
                totalCount={filteredContacts.length}
                onSelectAll={() => setSelectedContactIds(filteredContacts.map((c: Contact) => c.id))}
                placement="floating"
                label={(n) => `${n} contact${n === 1 ? '' : 's'} selected`}
              />
            </div>
          )}

          {/* ── Deals Tab ── */}
          {tab === 'deals' && (
            <div className="crm-deals-board">
              <BulkActionBar
                selectedIds={selectedDealIds}
                onClear={() => setSelectedDealIds([])}
                actions={dealBulkActions}
                totalCount={deals.length}
                onSelectAll={() => setSelectedDealIds(deals.map((d) => d.id))}
                placement="floating"
                label={(n) => `${n} deal${n === 1 ? '' : 's'} selected`}
              />
              {Object.entries(STAGE_COLORS).map(([stage, color]) => {
                const stageDeals = deals.filter(d => d.stage === stage);
                const stageVal = stageDeals.reduce((s, d) => s + (d.value || 0), 0);
                const stages = Object.keys(STAGE_COLORS);
                return (
                  <div
                    key={stage}
                    className={cn('crm-deal-col', dealDropTarget === stage && 'crm-deal-col-droptarget')}
                    onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDealDropTarget(stage); }}
                    onDragLeave={(e) => { if (e.currentTarget === e.target) setDealDropTarget(null); }}
                    onDrop={() => handleDealDrop(stage)}
                  >
                    <div className="crm-deal-col-header" style={{ borderBottomColor: color }}>
                      <span>{stage.replace(/_/g, ' ')}</span>
                      <span className="crm-deal-col-count">{stageDeals.length} &middot; {formatMoney(stageVal)}</span>
                    </div>
                    <motion.div className="crm-deal-col-cards" variants={staggerContainer} initial="hidden" animate="show">
                      {stageDeals.map(d => (
                        <motion.div
                          key={d.id}
                          variants={fadeInUp}
                          whileHover={{ y: -2, boxShadow: '0 4px 20px rgba(0,245,255,0.08)' }}
                          transition={{ duration: 0.15 }}
                          draggable
                          onDragStart={(e) => { setDraggingDealId(d.id); (e as unknown as React.DragEvent).dataTransfer.effectAllowed = 'move'; }}
                          onDragEnd={() => { setDraggingDealId(null); setDealDropTarget(null); }}
                        >
                          <GlassCard className={cn('crm-deal-card', selectedDealIds.includes(d.id) && 'crm-deal-card-selected', draggingDealId === d.id && 'crm-deal-card-dragging')}>
                            <div className="crm-deal-card-top">
                              <input
                                type="checkbox"
                                className="crm-deal-check"
                                checked={selectedDealIds.includes(d.id)}
                                onChange={() => toggleDealSelected(d.id)}
                                onClick={(e) => e.stopPropagation()}
                                aria-label={`Select deal ${d.title}`}
                              />
                              <span className="crm-deal-title">{d.title}</span>
                              <button className="crm-deal-del" onClick={() => handleDeleteDeal(d.id)}><Trash2 size={10} /></button>
                            </div>
                            <span className="crm-deal-val">{formatMoney(d.value)}</span>
                            <span className="crm-deal-stage-badge" style={{ background: `${color}20`, color, borderColor: `${color}40` }}>{stage.replace(/_/g, ' ')}</span>
                            {d.probability > 0 && <div className="crm-deal-prob"><div className="crm-deal-prob-bar" style={{ width: `${d.probability}%`, background: color }} /><span>{d.probability}%</span></div>}
                            {d.contacts && <span className="crm-deal-contact"><Users size={9} /> {d.contacts.name}</span>}
                            {d.expected_close && <span className="crm-deal-date"><Calendar size={9} /> {formatDate(d.expected_close)}</span>}
                            {d.venture_id && <span className="crm-deal-venture">{d.venture_id}</span>}
                            {/* Stage movers */}
                            <div className="crm-deal-movers">
                              {stages.indexOf(stage) > 0 && (
                                <button className="crm-deal-move" onClick={() => handleUpdateDealStage(d.id, stages[stages.indexOf(stage) - 1])}>← {stages[stages.indexOf(stage) - 1].replace(/_/g, ' ')}</button>
                              )}
                              {stages.indexOf(stage) < stages.length - 1 && (
                                <button className="crm-deal-move" onClick={() => handleUpdateDealStage(d.id, stages[stages.indexOf(stage) + 1])}>{stages[stages.indexOf(stage) + 1].replace(/_/g, ' ')} →</button>
                              )}
                            </div>
                          </GlassCard>
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Activities Tab ── */}
          {tab === 'activities' && (
            <div className="crm-activities">
              {activities.length === 0 && !loading && <EmptyState icon={<Activity size={20} />} title="No activities yet" description="Open a contact to log your first interaction." />}
              {(() => {
                // Group activities by relative day label (Today / Yesterday / Older dates)
                const groups: { label: string; rows: typeof activities }[] = [];
                const today = new Date(); today.setHours(0, 0, 0, 0);
                const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
                let lastLabel = '';
                for (const a of activities) {
                  const ts = a.created_at ? new Date(a.created_at) : null;
                  let label = 'Unknown';
                  if (ts) {
                    const d = new Date(ts); d.setHours(0, 0, 0, 0);
                    if (d.getTime() === today.getTime()) label = 'Today';
                    else if (d.getTime() === yesterday.getTime()) label = 'Yesterday';
                    else label = ts.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: ts.getFullYear() === today.getFullYear() ? undefined : 'numeric' });
                  }
                  if (label !== lastLabel) {
                    groups.push({ label, rows: [] });
                    lastLabel = label;
                  }
                  groups[groups.length - 1].rows.push(a);
                }
                return groups.map((g) => (
                  <div key={g.label} className="crm-act-group">
                    <div className="crm-act-divider">
                      <span className="crm-act-divider-label">{g.label}</span>
                      <span className="crm-act-divider-count">{g.rows.length}</span>
                      <div className="crm-act-divider-line" />
                    </div>
                    {g.rows.map((a) => {
                      const Icon = ACTIVITY_ICONS[a.type] || StickyNote;
                      const color = ACTIVITY_COLORS[a.type] || '#6B7280';
                      return (
                        <div key={a.id} className="crm-act-row">
                          <div className="crm-act-icon" style={{ background: `${color}20`, color }}>
                            <Icon size={13} />
                          </div>
                          <div className="crm-act-info">
                            <span className="crm-act-title">{a.title}</span>
                            {a.description && <span className="crm-act-desc">{a.description}</span>}
                            <span className="crm-act-meta">
                              <span className="crm-act-type" style={{ color }}>{a.type}</span>
                              {a.contacts?.name && <span>· {a.contacts.name}</span>}
                              {a.venture_id && <span>· {a.venture_id}</span>}
                            </span>
                          </div>
                          <span className="crm-act-time">{timeAgo(a.created_at)}</span>
                        </div>
                      );
                    })}
                  </div>
                ));
              })()}
            </div>
          )}

          {/* ── Accounts Tab ── */}
          {tab === 'accounts' && (
            <div className="crm-table">
              <div className="crm-table-header" style={{ gridTemplateColumns: '24px 1.5fr 1fr 100px 80px 80px 60px 30px' }}>
                <span className="crm-col-check">
                  <input
                    type="checkbox"
                    checked={accounts.length > 0 && selectedAccountIds.length === accounts.length}
                    ref={(el) => { if (el) el.indeterminate = selectedAccountIds.length > 0 && selectedAccountIds.length < accounts.length; }}
                    onChange={(e) => { if (e.target.checked) setSelectedAccountIds(accounts.map((a) => a.id)); else setSelectedAccountIds([]); }}
                    aria-label="Select all visible accounts"
                    style={{ accentColor: 'var(--cyan)' }}
                  />
                </span>
                <span>Company</span><span>Industry</span><span>Type</span><span>Size</span><span>Health</span><span>Added</span><span></span>
              </div>
              {accounts.map(ac => (
                <div key={ac.id} className={cn('crm-table-row', selectedAccountIds.includes(ac.id) && 'crm-row-bulk-selected')} style={{ gridTemplateColumns: '24px 1.5fr 1fr 100px 80px 80px 60px 30px' }}>
                  <span className="crm-col-check" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedAccountIds.includes(ac.id)}
                      onChange={() => toggleAccountSelected(ac.id)}
                      aria-label={`Select ${ac.name}`}
                      style={{ accentColor: 'var(--cyan)' }}
                    />
                  </span>
                  <span className="crm-name">
                    <span className="crm-avatar-sm" style={{ background: ACCOUNT_TYPE_COLORS[ac.type] || '#6B7280' }}>{ac.name.charAt(0).toUpperCase()}</span>
                    {ac.name}{ac.domain && <span className="crm-role">{ac.domain}</span>}
                  </span>
                  <span className="crm-company">{ac.industry || '—'}</span>
                  <Badge color={ACCOUNT_TYPE_COLORS[ac.type]} variant="outline">{ac.type}</Badge>
                  <span className="crm-time">{ac.size || '—'}</span>
                  <span className="crm-health-bar"><div className="crm-health-fill" style={{ width: `${ac.health_score || 50}%`, background: (ac.health_score || 50) > 70 ? '#10B981' : (ac.health_score || 50) > 40 ? '#F59E0B' : '#EF4444' }} /><span>{ac.health_score || 50}</span></span>
                  <span className="crm-time">{timeAgo(ac.created_at)}</span>
                  <button className="crm-row-action" onClick={() => handleDeleteAccount(ac.id)}><Trash2 size={11} /></button>
                </div>
              ))}
              {accounts.length === 0 && !loading && <EmptyState icon={<Building size={20} />} title="No accounts yet" description="Add your first company/organization above." />}

              <BulkActionBar
                selectedIds={selectedAccountIds}
                onClear={() => setSelectedAccountIds([])}
                actions={accountBulkActions}
                totalCount={accounts.length}
                onSelectAll={() => setSelectedAccountIds(accounts.map((a) => a.id))}
                placement="floating"
                label={(n) => `${n} account${n === 1 ? '' : 's'} selected`}
              />
            </div>
          )}

          {/* ── Pipeline Analytics Tab ── */}
          {tab === 'pipeline' && (
            <div className="crm-pipeline-view">
              <div className="crm-pipe-header-row">
                <h3 className="crm-pipe-title">Pipeline Analytics</h3>
                <span className="crm-pipe-total">Total pipeline: {formatMoney(pipelineData.reduce((s, p) => s + p.totalValue, 0))}</span>
              </div>
              <div className="crm-pipe-stages">
                {pipelineData.map(p => {
                  const maxVal = Math.max(...pipelineData.map(x => x.totalValue), 1);
                  // Per-stage enrichment computed from deals array — avg deal
                  // size + count of deals "at risk" (open >30 days, not yet won/lost)
                  const stageDeals = deals.filter(d => d.stage === p.stage);
                  const avgDeal = p.count > 0 ? p.totalValue / p.count : 0;
                  const now = Date.now();
                  const atRisk = stageDeals.filter(d => {
                    if (p.stage === 'closed_won' || p.stage === 'closed_lost') return false;
                    const created = d.created_at ? new Date(d.created_at).getTime() : now;
                    return (now - created) > 30 * 864e5;
                  }).length;
                  return (
                    <div key={p.stage} className="crm-pipe-stage">
                      <div className="crm-pipe-stage-header">
                        <span className="crm-pipe-stage-name" style={{ color: STAGE_COLORS[p.stage] }}>{p.stage.replace(/_/g, ' ')}</span>
                        <span className="crm-pipe-stage-count">{p.count} deals</span>
                      </div>
                      <div className="crm-pipe-bar-track">
                        <div className="crm-pipe-bar-fill" style={{ width: `${(p.totalValue / maxVal) * 100}%`, background: STAGE_COLORS[p.stage] }} />
                      </div>
                      <div className="crm-pipe-stage-vals">
                        <span>Total: {formatMoney(p.totalValue)}</span>
                        <span>Weighted: {formatMoney(p.weightedValue)}</span>
                      </div>
                      <div className="crm-pipe-chips">
                        <span className="crm-pipe-chip">Avg {formatMoney(avgDeal)}</span>
                        {atRisk > 0 && (
                          <Tooltip content={`${atRisk} deals open >30 days in this stage — review for stalled progress`}>
                            <span className="crm-pipe-chip crm-pipe-chip-warn">
                              <AlertTriangle size={9} /> {atRisk} stalled
                            </span>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="crm-pipe-summary">
                <div className="crm-pipe-sum-card">
                  <span className="crm-pipe-sum-val">{formatMoney(pipelineData.filter(p => !p.stage.startsWith('closed')).reduce((s, p) => s + p.totalValue, 0))}</span>
                  <span className="crm-pipe-sum-label">Open Pipeline</span>
                </div>
                <div className="crm-pipe-sum-card">
                  <span className="crm-pipe-sum-val">{formatMoney(pipelineData.filter(p => !p.stage.startsWith('closed')).reduce((s, p) => s + p.weightedValue, 0))}</span>
                  <span className="crm-pipe-sum-label">Weighted Pipeline</span>
                </div>
                <div className="crm-pipe-sum-card">
                  <span className="crm-pipe-sum-val" style={{ color: '#10B981' }}>{formatMoney(pipelineData.find(p => p.stage === 'closed_won')?.totalValue || 0)}</span>
                  <span className="crm-pipe-sum-label">Won Revenue</span>
                </div>
                <div className="crm-pipe-sum-card">
                  <span className="crm-pipe-sum-val" style={{ color: '#EF4444' }}>{formatMoney(pipelineData.find(p => p.stage === 'closed_lost')?.totalValue || 0)}</span>
                  <span className="crm-pipe-sum-label">Lost Revenue</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Investors Tab (EdgeIQ Capital) ── */}
          {tab === 'investors' && <InvestorsPanel />}
        </div>

        {/* Contact Detail Panel */}
        <AnimatePresence>
          {selectedContact && tab === 'contacts' && (
            <ContactDetail
              key={selectedContact.id}
              contact={selectedContact}
              onClose={() => setSelectedContact(null)}
              onDelete={handleDeleteContact}
            />
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .crm { height:100%; display:flex; flex-direction:column; overflow:hidden; }
        .crm-kpis-gradient-border {
          margin: 0 20px;
          padding-top: 3px;
          border-radius: var(--radius-md);
          background: linear-gradient(90deg, var(--cyan), var(--purple), var(--cyan));
          background-size: 200% 100%;
          animation: crm-gradient-shift 6s ease infinite;
        }
        .crm-kpis-gradient-border > div {
          background: var(--bg-deep);
          border-radius: var(--radius-md);
        }
        @keyframes crm-gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .crm-kpis-grid { padding:10px 20px; }
        .crm-row-hoverlift { will-change: transform; }
        .crm-deal-stage-badge {
          font-size: 9px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 2px 8px;
          border-radius: var(--radius-full);
          border: 1px solid;
          width: fit-content;
        }

        .crm-search-bar { display:flex; align-items:center; gap:6px; padding:4px 10px; background:var(--bg-input); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text-muted); }
        .crm-search-input { background:none; border:none; color:var(--text-primary); font-size:11px; width:140px; outline:none; }
        .crm-filter { display:flex; align-items:center; gap:4px; color:var(--text-muted); }
        .crm-filter-sel { background:var(--bg-input); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text-secondary); font-size:10px; padding:4px 6px; }

        .crm-form { display:flex; gap:6px; padding:10px; margin:0 20px; border-radius:var(--radius-md); align-items:center; flex-wrap:wrap; }
        .crm-input { padding:6px 10px; background:var(--bg-input); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text-primary); font-size:12px; flex:1; min-width:100px; }
        .crm-input:focus { border-color:var(--border-active); outline:none; }
        .crm-sel { padding:6px 8px; background:var(--bg-input); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text-secondary); font-size:11px; }
        .crm-layout { flex:1; display:flex; overflow:hidden; padding:8px 20px 0; gap:0; }
        .crm-body { flex:1; overflow:hidden; min-width:0; }

        /* Contact Table */
        .crm-table { overflow-y:auto; height:100%; }
        .crm-table-header { display:grid; grid-template-columns:24px 1.5fr 1fr 80px 1.2fr 100px 80px 30px; gap:8px; padding:6px 12px; font-size:10px; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; border-bottom:1px solid var(--border); position:sticky; top:0; background:var(--bg-deep); z-index:1; align-items:center; }
        .crm-table-row { display:grid; grid-template-columns:24px 1.5fr 1fr 80px 1.2fr 100px 80px 30px; gap:8px; padding:8px 12px; border-bottom:1px solid var(--border); align-items:center; font-size:12px; transition:background 0.1s; cursor:pointer; }
        .crm-table-row:hover { background:var(--bg-card); }
        .crm-table-row.selected { background:rgba(0,240,255,0.05); border-left:2px solid var(--cyan); }
        .crm-row-bulk-selected { background: rgba(0, 240, 255, 0.06) !important; box-shadow: inset 0 0 0 1px rgba(0, 240, 255, 0.25); }
        .crm-col-check { display: inline-flex; align-items: center; justify-content: center; }
        .crm-col-check input { cursor: pointer; }
        .crm-deal-card-selected { border-color: var(--cyan) !important; background: rgba(0, 240, 255, 0.04); box-shadow: inset 0 0 0 1px var(--cyan); }
        .crm-deal-check { accent-color: var(--cyan); cursor: pointer; flex-shrink: 0; margin-right: 4px; }
        .crm-act-group { display: flex; flex-direction: column; gap: 4px; }
        .crm-act-divider { display: flex; align-items: center; gap: 8px; padding: 12px 4px 4px; }
        .crm-act-divider-label { font-size: 10px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
        .crm-act-divider-count { font-size: 9px; color: var(--text-muted); font-family: var(--font-mono); padding: 1px 6px; background: var(--bg-card); border-radius: var(--radius-full); border: 1px solid var(--border); }
        .crm-act-divider-line { flex: 1; height: 1px; background: var(--border); }
        .crm-pipe-chips { display: flex; gap: 4px; margin-top: 6px; flex-wrap: wrap; }
        .crm-pipe-chip { display: inline-flex; align-items: center; gap: 4px; font-size: 9px; font-weight: 600; padding: 2px 8px; border-radius: var(--radius-full); border: 1px solid var(--border); color: var(--text-muted); background: var(--bg-card); }
        .crm-pipe-chip-warn { color: var(--warning); border-color: rgba(245, 158, 11, 0.3); }
        .crm-deal-card { cursor: grab; }
        .crm-deal-card:active { cursor: grabbing; }
        .crm-deal-card-dragging { opacity: 0.4; transform: rotate(1deg); }
        .crm-deal-col { transition: background var(--transition-fast); }
        .crm-deal-col-droptarget { background: rgba(0, 240, 255, 0.04); box-shadow: inset 0 0 0 2px var(--border-active); }
        .crm-name { font-weight:500; display:flex; align-items:center; gap:8px; }
        .crm-avatar-sm { width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; color:var(--bg-deep); flex-shrink:0; }
        .crm-role { font-size:10px; color:var(--text-muted); margin-left:4px; }
        .crm-company { font-size:11px; color:var(--text-secondary); display:flex; align-items:center; gap:4px; }
        .crm-email { font-size:11px; color:var(--text-muted); display:flex; align-items:center; gap:4px; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
        .crm-tags-cell { display:flex; gap:3px; align-items:center; }
        .crm-tag-mini { font-size:9px; padding:1px 5px; background:var(--bg-elevated); border-radius:3px; color:var(--text-muted); }
        .crm-tag-more { font-size:9px; color:var(--text-muted); }
        .crm-time { font-size:10px; color:var(--text-muted); font-family:var(--font-mono); }
        .crm-row-action { color:var(--text-muted); opacity:0; transition:opacity 0.1s; }
        .crm-table-row:hover .crm-row-action { opacity:1; }
        /* Deal Board */
        .crm-deals-board { display:grid; grid-template-columns:repeat(6,1fr); gap:1px; background:var(--border); height:100%; overflow:hidden; }
        .crm-deal-col { background:var(--bg-deep); display:flex; flex-direction:column; }
        .crm-deal-col-header { padding:6px 8px; font-size:10px; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.3px; border-bottom:2px solid; display:flex; justify-content:space-between; flex-shrink:0; }
        .crm-deal-col-count { font-family:var(--font-mono); font-size:9px; }
        .crm-deal-col-cards { flex:1; overflow-y:auto; padding:4px; display:flex; flex-direction:column; gap:4px; }
        .crm-deal-card { padding:10px; border-radius:var(--radius-sm); display:flex; flex-direction:column; gap:4px; }
        .crm-deal-card-top { display:flex; justify-content:space-between; align-items:flex-start; }
        .crm-deal-title { font-size:11px; font-weight:500; flex:1; }
        .crm-deal-del { color:var(--text-muted); opacity:0; transition:opacity 0.1s; }
        .crm-deal-card:hover .crm-deal-del { opacity:1; }
        .crm-deal-del:hover { color:var(--error); }
        .crm-deal-val { font-size:13px; font-weight:700; font-family:var(--font-mono); color:var(--success); }
        .crm-deal-prob { display:flex; align-items:center; gap:6px; }
        .crm-deal-prob-bar { height:3px; border-radius:2px; }
        .crm-deal-prob span { font-size:9px; color:var(--text-muted); font-family:var(--font-mono); }
        .crm-deal-contact { font-size:10px; color:var(--text-muted); display:flex; align-items:center; gap:4px; }
        .crm-deal-date { font-size:9px; color:var(--text-muted); display:flex; align-items:center; gap:3px; }
        .crm-deal-venture { font-size:9px; color:var(--text-muted); background:var(--bg-surface); padding:1px 4px; border-radius:2px; width:fit-content; }
        .crm-deal-movers { display:flex; gap:3px; margin-top:4px; opacity:0; transition:opacity 0.15s; }
        .crm-deal-card:hover .crm-deal-movers { opacity:1; }
        .crm-deal-move { font-size:8px; padding:2px 6px; background:var(--bg-surface); border:1px solid var(--border); border-radius:3px; color:var(--text-muted); white-space:nowrap; }
        .crm-deal-move:hover { color:var(--cyan); border-color:var(--border-active); }

        /* Activities Tab */
        .crm-activities { overflow-y:auto; height:100%; display:flex; flex-direction:column; gap:1px; }
        .crm-act-row { display:flex; align-items:flex-start; gap:10px; padding:10px 12px; border-bottom:1px solid var(--border); transition:background 0.1s; }
        .crm-act-row:hover { background:var(--bg-card); }
        .crm-act-icon { width:30px; height:30px; border-radius:var(--radius-sm); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .crm-act-info { flex:1; min-width:0; display:flex; flex-direction:column; gap:2px; }
        .crm-act-title { font-size:12px; font-weight:500; }
        .crm-act-desc { font-size:11px; color:var(--text-muted); }
        .crm-act-meta { font-size:10px; color:var(--text-muted); display:flex; gap:6px; }
        .crm-act-type { font-size:9px; font-weight:600; text-transform:uppercase; }
        .crm-act-time { font-size:10px; color:var(--text-muted); font-family:var(--font-mono); flex-shrink:0; }

        /* ── Contact Detail Panel ── */
        .cd-panel { width:380px; flex-shrink:0; border-left:1px solid var(--border); display:flex; flex-direction:column; overflow:hidden; background:var(--bg-surface); }
        .cd-header { display:flex; justify-content:space-between; align-items:center; padding:12px 14px; border-bottom:1px solid var(--border); flex-shrink:0; }
        .cd-header-left { display:flex; align-items:center; gap:10px; }
        .cd-avatar { width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:700; color:var(--bg-deep); flex-shrink:0; }
        .cd-name { display:block; font-size:14px; font-weight:600; }
        .cd-name-edit { background:var(--bg-input); border:1px solid var(--border-active); border-radius:var(--radius-sm); color:var(--text-primary); font-size:13px; font-weight:600; padding:2px 6px; width:160px; }
        .cd-company { display:block; font-size:10px; color:var(--text-muted); }
        .cd-header-actions { display:flex; gap:4px; }
        .cd-body { flex:1; overflow-y:auto; padding:12px 14px; display:flex; flex-direction:column; gap:16px; }
        .cd-section { display:flex; flex-direction:column; gap:6px; }
        .cd-section-label { font-size:10px; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; display:flex; align-items:center; gap:5px; }

        .cd-info-grid { display:flex; flex-direction:column; gap:6px; }
        .cd-info-row { display:flex; align-items:center; gap:8px; font-size:12px; color:var(--text-secondary); }
        .cd-info-row svg { color:var(--text-muted); flex-shrink:0; }
        .cd-input { padding:4px 8px; background:var(--bg-input); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text-primary); font-size:12px; flex:1; }
        .cd-input:focus { border-color:var(--border-active); outline:none; }
        .cd-input.flex { flex:1; }
        .cd-link { color:var(--cyan); font-size:11px; text-decoration:none; }
        .cd-link:hover { text-decoration:underline; }
        .cd-sel { padding:3px 6px; background:var(--bg-input); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text-secondary); font-size:11px; }

        .cd-meta-row { display:flex; flex-wrap:wrap; gap:6px; margin-top:4px; }
        .cd-time-badge { font-size:9px; color:var(--text-muted); display:flex; align-items:center; gap:3px; }

        .cd-tags { display:flex; flex-wrap:wrap; gap:4px; }
        .cd-tag { font-size:10px; padding:2px 8px; background:var(--bg-elevated); border:1px solid var(--border); border-radius:var(--radius-full); color:var(--text-secondary); display:flex; align-items:center; gap:4px; }
        .cd-tag-x { font-size:12px; color:var(--text-muted); cursor:pointer; line-height:1; }
        .cd-tag-x:hover { color:var(--error); }
        .cd-tag-add { display:inline-flex; }
        .cd-tag-input { padding:2px 8px; background:var(--bg-input); border:1px solid var(--border); border-radius:var(--radius-full); color:var(--text-primary); font-size:10px; width:80px; }
        .cd-tag-input:focus { border-color:var(--border-active); outline:none; width:120px; }

        .cd-textarea { padding:6px 8px; background:var(--bg-input); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text-primary); font-size:12px; resize:vertical; font-family:inherit; }
        .cd-textarea:focus { border-color:var(--border-active); outline:none; }
        .cd-notes { font-size:12px; color:var(--text-muted); line-height:1.5; }

        .cd-deals-list { display:flex; flex-direction:column; gap:3px; }
        .cd-deal-item { display:flex; align-items:center; gap:8px; padding:6px 8px; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-sm); }
        .cd-deal-stage { font-size:9px; font-weight:600; text-transform:uppercase; flex-shrink:0; }
        .cd-deal-title { font-size:11px; flex:1; }
        .cd-deal-val { font-size:11px; font-weight:700; font-family:var(--font-mono); color:var(--success); }

        .cd-act-form { display:flex; gap:4px; }

        .cd-timeline { display:flex; flex-direction:column; gap:0; }
        .cd-tl-item { display:flex; align-items:flex-start; gap:8px; padding:6px 0; border-bottom:1px solid var(--border); }
        .cd-tl-item:last-child { border-bottom:none; }
        .cd-tl-icon { width:24px; height:24px; border-radius:var(--radius-sm); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .cd-tl-content { flex:1; min-width:0; }
        .cd-tl-title { font-size:11px; font-weight:500; display:block; }
        .cd-tl-desc { font-size:10px; color:var(--text-muted); display:block; }
        .cd-tl-time { font-size:9px; color:var(--text-muted); font-family:var(--font-mono); flex-shrink:0; }

        .cd-danger { border-top:1px solid var(--border); padding-top:12px; margin-top:8px; }

        /* Account Health Bar */
        .crm-health-bar { display:flex; align-items:center; gap:6px; }
        .crm-health-bar .crm-health-fill { height:4px; border-radius:2px; flex:1; background:var(--bg-elevated); overflow:hidden; position:relative; }
        .crm-health-fill { height:100%; border-radius:2px; transition:width 0.3s; }
        .crm-health-bar span { font-size:10px; font-family:var(--font-mono); color:var(--text-muted); width:24px; }

        /* Pipeline Analytics */
        .crm-pipeline-view { height:100%; overflow-y:auto; padding:8px 0; display:flex; flex-direction:column; gap:16px; }
        .crm-pipe-header-row { display:flex; justify-content:space-between; align-items:center; }
        .crm-pipe-title { font-family:var(--font-display); font-size:14px; font-weight:600; }
        .crm-pipe-total { font-size:12px; color:var(--text-muted); font-family:var(--font-mono); }
        .crm-pipe-stages { display:flex; flex-direction:column; gap:10px; }
        .crm-pipe-stage { padding:10px 12px; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-md); }
        .crm-pipe-stage-header { display:flex; justify-content:space-between; margin-bottom:6px; }
        .crm-pipe-stage-name { font-size:12px; font-weight:600; text-transform:capitalize; }
        .crm-pipe-stage-count { font-size:10px; color:var(--text-muted); font-family:var(--font-mono); }
        .crm-pipe-bar-track { height:6px; background:var(--bg-elevated); border-radius:3px; overflow:hidden; margin-bottom:6px; }
        .crm-pipe-bar-fill { height:100%; border-radius:3px; transition:width 0.3s; }
        .crm-pipe-stage-vals { display:flex; gap:16px; font-size:10px; color:var(--text-muted); font-family:var(--font-mono); }
        .crm-pipe-summary { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
        .crm-pipe-sum-card { padding:14px; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-md); text-align:center; }
        .crm-pipe-sum-val { display:block; font-family:var(--font-mono); font-size:1.1rem; font-weight:700; color:var(--text-primary); }
        .crm-pipe-sum-label { display:block; font-size:9px; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; margin-top:4px; }

      `}</style>

      <Dialog
        open={!!bulkPrompt}
        onClose={() => (bulkPromptBusy ? null : setBulkPrompt(null))}
        size="sm"
        title={
          bulkPrompt?.mode === 'tag' ? 'Add tag to selected contacts' :
          bulkPrompt?.mode === 'contact-type' ? 'Change contact type' :
          'Change account type'
        }
        description={`${bulkPrompt?.ids.length ?? 0} item${bulkPrompt?.ids.length === 1 ? '' : 's'} selected`}
        footer={
          <DialogActions>
            <Button variant="secondary" size="sm" onClick={() => setBulkPrompt(null)} disabled={bulkPromptBusy}>Cancel</Button>
            <Button
              variant="primary"
              size="sm"
              loading={bulkPromptBusy}
              disabled={!bulkPromptValue.trim()}
              onClick={runBulkPrompt}
            >
              Apply to {bulkPrompt?.ids.length ?? 0}
            </Button>
          </DialogActions>
        }
      >
        {bulkPrompt?.mode === 'tag' && (
          <FormField label="Tag" hint="Added to each contact's existing tag list — duplicates are skipped">
            <Input
              value={bulkPromptValue}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBulkPromptValue(e.target.value)}
              placeholder="e.g. q4-prospect"
              autoFocus
            />
          </FormField>
        )}
        {bulkPrompt?.mode === 'contact-type' && (
          <FormField label="New type">
            <Select
              value={bulkPromptValue}
              onChange={(v) => setBulkPromptValue(v)}
              options={['lead', 'prospect', 'client', 'partner', 'investor', 'vendor'].map((t) => ({
                value: t,
                label: t,
                icon: <span style={{ width: 8, height: 8, borderRadius: '50%', background: TYPE_COLORS[t] || '#888', display: 'inline-block' }} />,
              }))}
            />
          </FormField>
        )}
        {bulkPrompt?.mode === 'account-type' && (
          <FormField label="New type">
            <Select
              value={bulkPromptValue}
              onChange={(v) => setBulkPromptValue(v)}
              options={Object.keys(ACCOUNT_TYPE_COLORS).map((t) => ({
                value: t,
                label: t,
                icon: <span style={{ width: 8, height: 8, borderRadius: '50%', background: ACCOUNT_TYPE_COLORS[t], display: 'inline-block' }} />,
              }))}
            />
          </FormField>
        )}
      </Dialog>
    </SuiteShell>
  );
}
