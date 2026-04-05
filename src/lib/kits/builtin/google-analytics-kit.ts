import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

async function gaApi(action: string, params: Record<string, unknown>, ctx: KitExecutionContext, method = 'POST') {
  const r = await ctx.fetch('/api/google-analytics', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...params }) });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'GA error'); }
  return r.json();
}

const runReport: KitToolHandler = async (input, ctx) => {
  const d = await gaApi('run-report', { propertyId: input.propertyId, startDate: input.startDate, endDate: input.endDate, dimensions: input.dimensions, metrics: input.metrics, limit: input.limit }, ctx);
  const rows = d.rows ?? [];
  return { success: true, data: d, displayMarkdown: `## Analytics Report (${rows.length} rows)\n\n\`\`\`json\n${JSON.stringify(rows.slice(0, 10), null, 2)}\n\`\`\`` };
};

const realtime: KitToolHandler = async (input, ctx) => {
  const d = await gaApi('realtime', { propertyId: input.propertyId, dimensions: input.dimensions, metrics: input.metrics }, ctx);
  const activeUsers = d.rows?.[0]?.metricValues?.[0]?.value ?? '0';
  return { success: true, data: d, displayMarkdown: `## Realtime: **${activeUsers} active users**` };
};

const topPages: KitToolHandler = async (input, ctx) => {
  const d = await gaApi('top-pages', { propertyId: input.propertyId }, ctx);
  const rows = d.rows ?? [];
  const lines = rows.slice(0, 15).map((r: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }) =>
    `- **${r.dimensionValues[0]?.value}** — ${Number(r.metricValues[0]?.value).toLocaleString()} views`);
  return { success: true, data: rows, displayMarkdown: `## Top Pages\n\n${lines.join('\n')}` };
};

const trafficSources: KitToolHandler = async (input, ctx) => {
  const d = await gaApi('traffic-sources', { propertyId: input.propertyId }, ctx);
  const rows = d.rows ?? [];
  const lines = rows.slice(0, 15).map((r: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }) =>
    `- **${r.dimensionValues[0]?.value}/${r.dimensionValues[1]?.value}** — ${Number(r.metricValues[0]?.value).toLocaleString()} sessions`);
  return { success: true, data: rows, displayMarkdown: `## Traffic Sources\n\n${lines.join('\n')}` };
};

const gaOverview: KitToolHandler = async (input, ctx) => {
  const d = await gaApi('overview', { propertyId: input.propertyId }, ctx);
  const metrics = d.summary?.rows?.[0]?.metricValues ?? [];
  return { success: true, data: d, displayMarkdown: `## Analytics Overview\n\n- **Active Users (30d):** ${metrics[0]?.value ?? '?'}\n- **Sessions:** ${metrics[1]?.value ?? '?'}\n- **Page Views:** ${metrics[2]?.value ?? '?'}\n- **Realtime Users:** ${d.realtime_users}` };
};

const batchReport: KitToolHandler = async (input, ctx) => {
  const d = await gaApi('batch-report', { requests: input.requests }, ctx);
  return { success: true, data: d, displayMarkdown: `Batch report: ${JSON.stringify(d).slice(0, 500)}` };
};

const funnelReport: KitToolHandler = async (input, ctx) => {
  const d = await gaApi('funnel-report', { steps: input.steps, propertyId: input.propertyId }, ctx);
  return { success: true, data: d, displayMarkdown: `Funnel report: ${JSON.stringify(d).slice(0, 500)}` };
};

const cohortReport: KitToolHandler = async (input, ctx) => {
  const d = await gaApi('cohort-report', { cohortSpec: input.cohortSpec, metrics: input.metrics, propertyId: input.propertyId }, ctx);
  return { success: true, data: d, displayMarkdown: `Cohort report: ${JSON.stringify(d).slice(0, 500)}` };
};

const listMetadata: KitToolHandler = async (input, ctx) => {
  const d = await gaApi('list-metadata', { propertyId: input.propertyId }, ctx);
  return { success: true, data: d, displayMarkdown: `Metadata: ${JSON.stringify(d).slice(0, 500)}` };
};

const listDataStreams: KitToolHandler = async (input, ctx) => {
  const d = await gaApi('list-data-streams', { propertyId: input.propertyId }, ctx);
  return { success: true, data: d, displayMarkdown: `Data streams: ${JSON.stringify(d).slice(0, 500)}` };
};

const listCustomDimensions: KitToolHandler = async (input, ctx) => {
  const d = await gaApi('list-custom-dimensions', { propertyId: input.propertyId }, ctx);
  return { success: true, data: d, displayMarkdown: `Custom dimensions: ${JSON.stringify(d).slice(0, 500)}` };
};

const listAudiences: KitToolHandler = async (input, ctx) => {
  const d = await gaApi('list-audiences', { propertyId: input.propertyId }, ctx);
  return { success: true, data: d, displayMarkdown: `Audiences: ${JSON.stringify(d).slice(0, 500)}` };
};

const listConversionEvents: KitToolHandler = async (input, ctx) => {
  const d = await gaApi('list-conversion-events', { propertyId: input.propertyId }, ctx);
  return { success: true, data: d, displayMarkdown: `Conversion events: ${JSON.stringify(d).slice(0, 500)}` };
};

const landingPages: KitToolHandler = async (input, ctx) => {
  const d = await gaApi('landing-pages', { propertyId: input.propertyId }, ctx);
  return { success: true, data: d, displayMarkdown: `Landing pages: ${JSON.stringify(d).slice(0, 500)}` };
};

export const manifest: KitManifest = {
  id: 'google-analytics', name: 'Google Analytics', version: '2.0.0',
  description: 'Google Analytics (GA4) — reports, realtime, top pages, traffic sources, funnels, cohorts, audiences, conversions, metadata, and data streams.',
  author: 'MCV', capabilities: ['network', 'credentials'], runtime: 'inline', ventureScope: '*',
  instructions: 'Use analytics tools for website traffic analysis, top pages, traffic sources, realtime users, and audience insights. Requires a GA4 propertyId.',
  tools: [
    { name: 'ga_run_report', description: 'Run a custom GA4 report with dimensions and metrics.', input_schema: { type: 'object', properties: { propertyId: { type: 'string' }, startDate: { type: 'string' }, endDate: { type: 'string' }, dimensions: { type: 'string', description: 'Comma-separated: date,pagePath,country' }, metrics: { type: 'string', description: 'Comma-separated: activeUsers,sessions' }, limit: { type: 'number' } }, required: ['propertyId'] } },
    { name: 'ga_realtime', description: 'Get realtime active users.', input_schema: { type: 'object', properties: { propertyId: { type: 'string' } }, required: ['propertyId'] } },
    { name: 'ga_top_pages', description: 'Get top pages by views (30 days).', input_schema: { type: 'object', properties: { propertyId: { type: 'string' } }, required: ['propertyId'] } },
    { name: 'ga_traffic_sources', description: 'Get traffic sources (30 days).', input_schema: { type: 'object', properties: { propertyId: { type: 'string' } }, required: ['propertyId'] } },
    { name: 'ga_overview', description: 'GA4 overview: users, sessions, page views, realtime.', input_schema: { type: 'object', properties: { propertyId: { type: 'string' } }, required: ['propertyId'] } },
    { name: 'ga_batch_report', description: 'Run multiple GA4 reports in a batch.', input_schema: { type: 'object', properties: { requests: { type: 'array', description: 'Array of report request objects' } }, required: ['requests'] } },
    { name: 'ga_funnel_report', description: 'Run a funnel exploration report.', input_schema: { type: 'object', properties: { propertyId: { type: 'string' }, steps: { type: 'array', description: 'Array of funnel step objects' } }, required: ['propertyId', 'steps'] } },
    { name: 'ga_cohort_report', description: 'Run a cohort analysis report.', input_schema: { type: 'object', properties: { propertyId: { type: 'string' }, cohortSpec: { type: 'object', description: 'Cohort specification' }, metrics: { type: 'string', description: 'Comma-separated metrics' } }, required: ['propertyId', 'cohortSpec'] } },
    { name: 'ga_metadata', description: 'List available dimensions and metrics.', input_schema: { type: 'object', properties: { propertyId: { type: 'string' } }, required: ['propertyId'] } },
    { name: 'ga_data_streams', description: 'List data streams for a property.', input_schema: { type: 'object', properties: { propertyId: { type: 'string' } }, required: ['propertyId'] } },
    { name: 'ga_custom_dimensions', description: 'List custom dimensions.', input_schema: { type: 'object', properties: { propertyId: { type: 'string' } }, required: ['propertyId'] } },
    { name: 'ga_audiences', description: 'List configured audiences.', input_schema: { type: 'object', properties: { propertyId: { type: 'string' } }, required: ['propertyId'] } },
    { name: 'ga_conversion_events', description: 'List conversion events.', input_schema: { type: 'object', properties: { propertyId: { type: 'string' } }, required: ['propertyId'] } },
    { name: 'ga_landing_pages', description: 'Get landing page performance.', input_schema: { type: 'object', properties: { propertyId: { type: 'string' } }, required: ['propertyId'] } },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  ga_run_report: runReport, ga_realtime: realtime, ga_top_pages: topPages, ga_traffic_sources: trafficSources, ga_overview: gaOverview,
  ga_batch_report: batchReport, ga_funnel_report: funnelReport, ga_cohort_report: cohortReport,
  ga_metadata: listMetadata, ga_data_streams: listDataStreams, ga_custom_dimensions: listCustomDimensions,
  ga_audiences: listAudiences, ga_conversion_events: listConversionEvents, ga_landing_pages: landingPages,
};
