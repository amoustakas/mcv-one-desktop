import type { KpiId, SuiteId } from './types';

export const DEFAULT_LOADOUTS: Record<SuiteId, KpiId[]> = {
  'command-center': ['cc_total_users','cc_revenue_mtd','cc_mrr','cc_cash_runway','cc_active_ventures','cc_attention'],
  capital:          ['cap_portfolio_nav','cap_open_rounds','cap_commits_inflight','cap_distributions_due','cap_verified_investors','cap_compliance_alerts'],
  growth:           ['grw_revenue_mtd','grw_users','grw_mrr','grw_cac','grw_ltv','grw_retention'],
  payments:         ['pay_settled_today','pay_inflight','pay_failed','pay_fx_exposure','pay_fees_ytd','pay_tax_forms_due'],
  crm:              ['crm_active_prospects','crm_pipeline_value','crm_conversion_rate','crm_activities_today','crm_new_captures','crm_stale_deals'],
  creative:         ['crt_assets_published','crt_render_queue','crt_awaiting_review','crt_voice_clones','crt_projects_shipping','crt_drafts'],
  engineering:      ['eng_deploys_today','eng_open_prs','eng_test_failures','eng_incidents','eng_uptime_30d','eng_cron_health'],
  operations:       ['ops_open_tasks','ops_blocked','ops_agent_running','ops_epics_inflight','ops_stale_14d','fct_heartbeat'],
  knowledge:        ['knw_docs','knw_research_dossiers','knw_memory_entries','knw_files','knw_rag_queries_today','knw_stale_90d'],
  comms:            ['cm_unread','cm_dms_pending_reply','cm_calendar_today','cm_missed_calls','cm_mentions','cm_scheduled_sends'],
  foundation:       [],
};
