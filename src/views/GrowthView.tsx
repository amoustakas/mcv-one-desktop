import { useState, useMemo, useCallback } from 'react';
import {
  TrendingUp, DollarSign, Megaphone, Users, Target,
  Plus, Trash2, Archive, Download, Edit3, X,
} from 'lucide-react';
import { useNavigation } from '../stores/navigation';
import { ventures } from '../lib/ventures';
import {
  useCampaigns, useCreateCampaign, useUpdateCampaign, useDeleteCampaign,
} from '../hooks/use-campaigns';
import {
  PageHeader, PageShell, Button, GlassCard, GridLayout,
  KpiCard, WidgetContainer, Badge, DataTable, TableToolbar, Pagination,
} from '../components/ui';
import { McvAreaChart, McvDonutChart } from '../components/charts';
import { formatMoney, formatCompact, formatPercentage } from '../lib/utils';
import type { Campaign } from '../lib/api/campaigns';
import type { SortState } from '../components/ui/DataTable';

/* ── colour maps ── */
const STATUS_BADGE: Record<string, { color: string; label: string }> = {
  active:    { color: 'var(--cyan)',    label: 'Active' },
  paused:    { color: 'var(--warning)', label: 'Paused' },
  completed: { color: 'var(--success)', label: 'Done' },
  draft:     { color: 'var(--text-muted)', label: 'Draft' },
  planned:   { color: 'var(--purple)',  label: 'Planned' },
};

const CHANNEL_COLORS: Record<string, string> = {
  social:   '#3B82F6',
  email:    '#10B981',
  seo:      '#8B5CF6',
  paid:     '#F59E0B',
  content:  '#00F5FF',
  pr:       '#EC4899',
  events:   '#EF4444',
  referral: '#6366F1',
};

// @ts-ignore
const _VENTURE_COLOR_MAP = Object.fromEntries(ventures.map(v => [v.id, v.color]));

const PAGE_SIZE = 25;

/* ── mock 7-day budget trend data generator ── */
function buildAreaData(campaigns: Campaign[]) {
  const ventureIds = [...new Set(campaigns.map(c => c.venture_id).filter(Boolean))];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Build per-venture daily budgets with slight variance for realistic chart
  return days.map((day, di) => {
    const row: Record<string, unknown> = { day };
    for (const vid of ventureIds) {
      const ventureCamps = campaigns.filter(c => c.venture_id === vid);
      const base = ventureCamps.reduce((s, c) => s + (c.budget || 0), 0) / 7;
      // Deterministic but varied multiplier per day/venture
      const variance = 0.7 + 0.6 * Math.abs(Math.sin(di * 1.7 + vid.charCodeAt(0)));
      row[vid] = Math.round(base * variance);
    }
    return row;
  });
}

function buildDonutData(campaigns: Campaign[]) {
  const channelMap: Record<string, number> = {};
  for (const c of campaigns) {
    const ch = c.channel || 'other';
    channelMap[ch] = (channelMap[ch] || 0) + 1;
  }
  return Object.entries(channelMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: CHANNEL_COLORS[name] || 'var(--text-muted)',
    }));
}

/* ── table helpers ── */
function computeROI(c: Campaign): number {
  if (!c.budget || c.budget === 0) return 0;
  // ROI = (revenue proxy from conversions - spent) / budget
  const revenue = (c.conversions || 0) * 50; // $50 per conversion proxy
  return ((revenue - (c.spent || 0)) / c.budget) * 100;
}

function sortCampaigns(data: Campaign[], sort: SortState): Campaign[] {
  const sorted = [...data];
  const dir = sort.direction === 'asc' ? 1 : -1;
  sorted.sort((a, b) => {
    let va: number | string;
    let vb: number | string;
    switch (sort.key) {
      case 'budget': va = a.budget || 0; vb = b.budget || 0; break;
      case 'reach': va = a.reach || 0; vb = b.reach || 0; break;
      case 'conversions': va = a.conversions || 0; vb = b.conversions || 0; break;
      case 'roi': va = computeROI(a); vb = computeROI(b); break;
      case 'name': va = a.name.toLowerCase(); vb = b.name.toLowerCase(); break;
      default: va = 0; vb = 0;
    }
    if (va < vb) return -1 * dir;
    if (va > vb) return 1 * dir;
    return 0;
  });
  return sorted;
}

/* ═══════════════════════════════════════════════════════════════ */
export default function GrowthView() {
  /* ── state ── */
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', type: 'marketing', channel: 'social', status: 'draft',
    venture_id: '', budget: 0, description: '', start_date: '', end_date: '',
  });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortState, setSortState] = useState<SortState>({ key: 'budget', direction: 'desc' });
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const { mode, activeVenture } = useNavigation();
  const ventureId = mode === 'venture' ? activeVenture || undefined : undefined;
  const { data: campaigns = [], isLoading, refetch } = useCampaigns(ventureId);
  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign();
  const deleteCampaign = useDeleteCampaign();

  /* ── mutations ── */
  const handleCreate = useCallback(async () => {
    if (!form.name.trim()) return;
    await createCampaign.mutateAsync({
      ...form,
      venture_id: form.venture_id || (mode === 'venture' ? activeVenture : ''),
    } as Partial<Campaign>);
    setForm({ name: '', type: 'marketing', channel: 'social', status: 'draft', venture_id: '', budget: 0, description: '', start_date: '', end_date: '' });
    setShowAdd(false);
  }, [form, mode, activeVenture, createCampaign]);

  const handleUpdate = useCallback(async (id: string, updates: Partial<Campaign>) => {
    await updateCampaign.mutateAsync({ id, ...updates });
    setEditId(null);
  }, [updateCampaign]);

  const handleDelete = useCallback(async (id: string) => {
    await deleteCampaign.mutateAsync(id);
  }, [deleteCampaign]);

  const handleBulkDelete = useCallback(async () => {
    for (const id of selectedKeys) {
      await deleteCampaign.mutateAsync(id);
    }
    setSelectedKeys(new Set());
  }, [selectedKeys, deleteCampaign]);

  const handleBulkArchive = useCallback(async () => {
    for (const id of selectedKeys) {
      await updateCampaign.mutateAsync({ id, status: 'completed' });
    }
    setSelectedKeys(new Set());
  }, [selectedKeys, updateCampaign]);

  const handleBulkExport = useCallback(() => {
    const rows = campaigns.filter(c => selectedKeys.has(c.id));
    const csv = [
      'Name,Channel,Status,Budget,Reach,Conversions,Venture',
      ...rows.map(c =>
        `"${c.name}",${c.channel},${c.status},${c.budget},${c.reach},${c.conversions},${c.venture_id}`
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'campaigns-export.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [campaigns, selectedKeys]);

  /* ── KPIs ── */
  const totalBudget = useMemo(() => campaigns.reduce((s, c) => s + (c.budget || 0), 0), [campaigns]);
  const activeCampaigns = useMemo(() => campaigns.filter(c => c.status === 'active').length, [campaigns]);
  const totalReach = useMemo(() => campaigns.reduce((s, c) => s + (c.reach || 0) + (c.impressions || 0), 0), [campaigns]);
  const avgConversion = useMemo(() => {
    const withBudget = campaigns.filter(c => c.budget > 0);
    if (!withBudget.length) return 0;
    return withBudget.reduce((s, c) => {
      const rate = c.reach > 0 ? (c.conversions / c.reach) * 100 : 0;
      return s + rate;
    }, 0) / withBudget.length;
  }, [campaigns]);

  /* ── chart data ── */
  const areaData = useMemo(() => buildAreaData(campaigns), [campaigns]);
  const areaKeys = useMemo(() => {
    const vids = [...new Set(campaigns.map(c => c.venture_id).filter(Boolean))];
    return vids.map(vid => {
      const v = ventures.find(vn => vn.id === vid);
      return { key: vid, color: v?.color || 'var(--cyan)', label: v?.name || vid };
    });
  }, [campaigns]);
  const donutData = useMemo(() => buildDonutData(campaigns), [campaigns]);

  /* ── filtered + sorted + paginated campaigns ── */
  const filtered = useMemo(() => {
    if (!search.trim()) return campaigns;
    const q = search.toLowerCase();
    return campaigns.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.channel?.toLowerCase().includes(q) ||
      c.status?.toLowerCase().includes(q) ||
      c.venture_id?.toLowerCase().includes(q)
    );
  }, [campaigns, search]);

  const sorted = useMemo(() => sortCampaigns(filtered, sortState), [filtered, sortState]);
  const totalFiltered = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = useMemo(
    () => sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [sorted, safePage],
  );

  /* ── sparkline data generators (deterministic from campaign data) ── */
  const budgetSparkline = useMemo(() => {
    if (!campaigns.length) return undefined;
    const base = totalBudget / 7;
    return [0.6, 0.72, 0.85, 0.78, 0.92, 0.88, 1.0].map(m => Math.round(base * m));
  }, [campaigns, totalBudget]);

  const reachSparkline = useMemo(() => {
    if (!campaigns.length) return undefined;
    const base = totalReach / 7;
    return [0.5, 0.65, 0.7, 0.82, 0.76, 0.95, 1.0].map(m => Math.round(base * m));
  }, [campaigns, totalReach]);

  /* ── table columns ── */
  const columns = useMemo(() => [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      minWidth: 180,
      render: (_: unknown, row: Campaign) => (
        <span className="gv-cell-name">
          <span className="gv-channel-dot" style={{ background: CHANNEL_COLORS[row.channel] || 'var(--text-muted)' }} />
          <span className="gv-name-text">{row.name}</span>
        </span>
      ),
    },
    {
      key: 'channel',
      header: 'Channel',
      width: 90,
      render: (_: unknown, row: Campaign) => (
        <span className="gv-channel-label" style={{ color: CHANNEL_COLORS[row.channel] || 'var(--text-muted)' }}>
          {row.channel}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: 90,
      render: (_: unknown, row: Campaign) => {
        const s = STATUS_BADGE[row.status] || { color: 'var(--text-muted)', label: row.status };
        return <Badge color={s.color} size="sm">{s.label}</Badge>;
      },
    },
    {
      key: 'budget',
      header: 'Budget',
      width: 90,
      sortable: true,
      align: 'right' as const,
      render: (_: unknown, row: Campaign) => (
        <span className="gv-mono">{formatMoney(row.budget || 0)}</span>
      ),
    },
    {
      key: 'reach',
      header: 'Reach',
      width: 85,
      sortable: true,
      align: 'right' as const,
      render: (_: unknown, row: Campaign) => (
        <span className="gv-mono gv-muted">{formatCompact(row.reach || 0)}</span>
      ),
    },
    {
      key: 'conversions',
      header: 'Conv.',
      width: 70,
      sortable: true,
      align: 'right' as const,
      render: (_: unknown, row: Campaign) => (
        <span className="gv-mono gv-muted">{formatCompact(row.conversions || 0)}</span>
      ),
    },
    {
      key: 'roi',
      header: 'ROI %',
      width: 80,
      sortable: true,
      align: 'right' as const,
      render: (_: unknown, row: Campaign) => {
        const roi = computeROI(row);
        const color = roi > 0 ? 'var(--success)' : roi < 0 ? 'var(--error)' : 'var(--text-muted)';
        return <span className="gv-mono" style={{ color }}>{formatPercentage(roi, 1)}</span>;
      },
    },
    {
      key: 'venture_id',
      header: 'Venture',
      width: 100,
      render: (_: unknown, row: Campaign) => {
        const v = ventures.find(vn => vn.id === row.venture_id);
        if (!v) return <span className="gv-muted">--</span>;
        return (
          <span className="gv-venture-tag" style={{ color: v.color }}>
            <span className="gv-venture-icon" style={{ background: `${v.color}20`, color: v.color }}>{v.icon}</span>
            {v.name}
          </span>
        );
      },
    },
    {
      key: '_actions',
      header: '',
      width: 60,
      render: (_: unknown, row: Campaign) => {
        if (editId === row.id) {
          return (
            <Button variant="ghost" size="sm" onClick={() => setEditId(null)}>
              <X size={11} />
            </Button>
          );
        }
        return (
          <span className="gv-row-actions">
            <Button variant="ghost" size="sm" onClick={() => setEditId(row.id)}>
              <Edit3 size={11} />
            </Button>
            <Button variant="danger" size="sm" onClick={() => handleDelete(row.id)}>
              <Trash2 size={11} />
            </Button>
          </span>
        );
      },
    },
  ], [editId, handleDelete]);

  /* ── inline edit row (rendered below the table row when editing) ── */
  const editingCampaign = editId ? campaigns.find(c => c.id === editId) : null;

  /* ═══════════════════════ RENDER ═══════════════════════ */
  return (
    <PageShell scroll>
      <PageHeader
        icon={<TrendingUp size={20} />}
        title="Growth Studio"
        loading={isLoading}
        onRefresh={() => refetch()}
      >
        <Button
          variant="primary"
          size="sm"
          icon={<Plus size={13} />}
          onClick={() => setShowAdd(!showAdd)}
        >
          New Campaign
        </Button>
      </PageHeader>

      {/* ── Add Campaign Form ── */}
      {showAdd && (
        <GlassCard className="gv-add-form">
          <input
            placeholder="Campaign name *"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className="gv-input"
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
          <select value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value })} className="gv-select">
            {Object.keys(CHANNEL_COLORS).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="gv-select">
            {Object.keys(STATUS_BADGE).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={form.venture_id} onChange={e => setForm({ ...form, venture_id: e.target.value })} className="gv-select">
            <option value="">All ventures</option>
            {ventures.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          <input
            type="number"
            placeholder="Budget"
            value={form.budget || ''}
            onChange={e => setForm({ ...form, budget: parseFloat(e.target.value) || 0 })}
            className="gv-input gv-input-narrow"
          />
          <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="gv-input gv-input-date" />
          <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="gv-input gv-input-date" />
          <Button variant="primary" size="sm" onClick={handleCreate} loading={createCampaign.isPending}>Create</Button>
        </GlassCard>
      )}

      {/* ══════════ TOP SECTION: KPIs + Charts ══════════ */}
      <GridLayout cols={4} gap="sm">
        <KpiCard
          title="Total Budget"
          value={formatMoney(totalBudget)}
          icon={<DollarSign size={14} />}
          change={12.4}
          trend="up"
          sparklineData={budgetSparkline}
          isLoading={isLoading}
          variant="neural"
        />
        <KpiCard
          title="Active Campaigns"
          value={activeCampaigns}
          icon={<Megaphone size={14} />}
          change={activeCampaigns > 0 ? 8.2 : 0}
          trend={activeCampaigns > 0 ? 'up' : 'flat'}
          isLoading={isLoading}
          variant="neural"
        />
        <KpiCard
          title="Total Reach"
          value={formatCompact(totalReach)}
          icon={<Users size={14} />}
          change={23.7}
          trend="up"
          sparklineData={reachSparkline}
          isLoading={isLoading}
          variant="neural"
        />
        <KpiCard
          title="Avg. Conversion"
          value={formatPercentage(avgConversion, 2)}
          icon={<Target size={14} />}
          change={avgConversion > 2 ? 5.1 : -1.2}
          isLoading={isLoading}
          variant="neural"
        />
      </GridLayout>

      {/* ── Chart Row ── */}
      <div className="gv-chart-row">
        <WidgetContainer
          title="Budget Allocation Trend"
          subtitle="7-day by venture"
          icon={<DollarSign size={14} />}
          variant="glass"
          className="gv-chart-widget"
        >
          {areaKeys.length > 0 ? (
            <McvAreaChart
              data={areaData}
              dataKeys={areaKeys}
              xAxisKey="day"
              height={220}
              showLegend
              showGrid
            />
          ) : (
            <div className="gv-chart-empty">No campaign data to chart</div>
          )}
        </WidgetContainer>

        <WidgetContainer
          title="Channel Breakdown"
          subtitle={`${donutData.length} channels`}
          icon={<Megaphone size={14} />}
          variant="glass"
          className="gv-chart-widget"
        >
          {donutData.length > 0 ? (
            <McvDonutChart
              data={donutData}
              size={220}
              centerValue={String(campaigns.length)}
              centerLabel="Campaigns"
              showLegend
            />
          ) : (
            <div className="gv-chart-empty">No campaign data to chart</div>
          )}
        </WidgetContainer>
      </div>

      {/* ══════════ BOTTOM SECTION: Campaign DataTable ══════════ */}
      <div className="gv-table-section">
        <TableToolbar
          searchValue={search}
          onSearchChange={(v) => { setSearch(v); setPage(1); }}
          searchPlaceholder="Search campaigns..."
          selectedCount={selectedKeys.size}
          onClearSelection={() => setSelectedKeys(new Set())}
          bulkActions={[
            { label: 'Delete', icon: <Trash2 size={12} />, onClick: handleBulkDelete, variant: 'danger' },
            { label: 'Archive', icon: <Archive size={12} />, onClick: handleBulkArchive },
            { label: 'Export', icon: <Download size={12} />, onClick: handleBulkExport },
          ]}
          actions={
            <Button variant="secondary" size="sm" icon={<Plus size={12} />} onClick={() => setShowAdd(true)}>
              New Campaign
            </Button>
          }
        />

        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <DataTable
          data={paged as any}
          columns={columns as any}
          rowKey="id"
          isLoading={isLoading}
          selectable
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
          sortState={sortState}
          onSortChange={(s) => { setSortState(s); setPage(1); }}
          rowHeight={44}
          maxHeight={560}
          emptyMessage="No campaigns found. Create your first growth initiative above."
          className="gv-datatable"
        />

        {/* ── Inline Edit Bar ── */}
        {editingCampaign && (
          <GlassCard className="gv-edit-bar">
            <span className="gv-edit-label">Editing: <strong>{editingCampaign.name}</strong></span>
            <input
              type="number"
              defaultValue={editingCampaign.reach}
              className="gv-input gv-input-narrow"
              placeholder="Reach"
              onBlur={e => handleUpdate(editingCampaign.id, { reach: parseInt(e.target.value) || 0 })}
            />
            <input
              type="number"
              defaultValue={editingCampaign.conversions}
              className="gv-input gv-input-narrow"
              placeholder="Conv"
              onBlur={e => handleUpdate(editingCampaign.id, { conversions: parseInt(e.target.value) || 0 })}
            />
            <input
              type="number"
              defaultValue={editingCampaign.budget}
              className="gv-input gv-input-narrow"
              placeholder="Budget"
              onBlur={e => handleUpdate(editingCampaign.id, { budget: parseFloat(e.target.value) || 0 })}
            />
            <select
              className="gv-select"
              defaultValue={editingCampaign.status}
              onChange={e => handleUpdate(editingCampaign.id, { status: e.target.value })}
            >
              {Object.keys(STATUS_BADGE).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <Button variant="ghost" size="sm" onClick={() => setEditId(null)}><X size={12} /> Close</Button>
          </GlassCard>
        )}

        <Pagination
          page={safePage}
          pageSize={PAGE_SIZE}
          total={totalFiltered}
          onPageChange={setPage}
        />
      </div>

      {/* ═══════════════ view-scoped styles ═══════════════ */}
      <style>{`
        /* ── Add Form ── */
        .gv-add-form {
          display: flex;
          gap: 6px;
          padding: 10px 14px;
          align-items: center;
          flex-wrap: wrap;
          margin: 0 20px;
        }
        .gv-input {
          padding: 6px 10px;
          background: var(--bg-input);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text-primary);
          font-size: 12px;
          flex: 1;
          min-width: 100px;
          transition: border-color 0.15s ease;
        }
        .gv-input:focus {
          border-color: var(--cyan);
          outline: none;
          box-shadow: 0 0 0 1px var(--cyan)20;
        }
        .gv-input-narrow { max-width: 100px; flex: 0 0 auto; }
        .gv-input-date { max-width: 140px; flex: 0 0 auto; }
        .gv-select {
          padding: 6px 8px;
          background: var(--bg-input);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          font-size: 11px;
          cursor: pointer;
        }

        /* ── Chart Row ── */
        .gv-chart-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          padding: 0 20px;
          margin-bottom: 4px;
        }
        @media (max-width: 1100px) {
          .gv-chart-row { grid-template-columns: 1fr; }
        }
        .gv-chart-widget { min-height: 280px; }
        .gv-chart-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 180px;
          color: var(--text-muted);
          font-size: 12px;
        }

        /* ── Table Section ── */
        .gv-table-section {
          padding: 0 20px 20px;
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .gv-datatable {
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        /* ── Table Cell Styles ── */
        .gv-cell-name {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }
        .gv-channel-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .gv-name-text {
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .gv-channel-label {
          font-size: 11px;
          text-transform: capitalize;
          font-weight: 500;
        }
        .gv-mono {
          font-family: var(--font-mono);
          font-size: 11px;
        }
        .gv-muted { color: var(--text-muted); }
        .gv-venture-tag {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 500;
        }
        .gv-venture-icon {
          width: 18px;
          height: 18px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: 700;
          flex-shrink: 0;
        }
        .gv-row-actions {
          display: flex;
          gap: 2px;
          opacity: 0;
          transition: opacity 0.12s ease;
        }
        .mcv-table-row:hover .gv-row-actions { opacity: 1; }

        /* ── Inline Edit Bar ── */
        .gv-edit-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          margin-top: 4px;
          border-left: 2px solid var(--cyan);
        }
        .gv-edit-label {
          font-size: 11px;
          color: var(--text-secondary);
          white-space: nowrap;
          margin-right: 4px;
        }
        .gv-edit-label strong {
          color: var(--text-primary);
        }

        /* ── 4K density ── */
        @media (min-width: 2560px) {
          .gv-chart-row { grid-template-columns: 1fr 1fr; gap: 16px; }
          .gv-chart-widget { min-height: 320px; }
        }
      `}</style>
    </PageShell>
  );
}
