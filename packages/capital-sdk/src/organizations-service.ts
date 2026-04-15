// @mcv/capital-sdk/organizations-service — counterparty orgs (funds, family offices, launchpad projects)

import type { SupabaseClient } from '@supabase/supabase-js';
import { CreateOrganizationInput, type Organization, type OrgType } from './types';

export function mapOrgRow(row: Record<string, unknown>): Organization {
  const asArr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
  return {
    id: row.id as string,
    ventureId: row.venture_id as string,
    name: row.name as string,
    legalName: (row.legal_name as string) ?? null,
    slug: row.slug as string,
    website: (row.website as string) ?? null,
    logoUrl: (row.logo_url as string) ?? null,
    description: (row.description as string) ?? null,
    orgType: row.org_type as OrgType,
    industry: (row.industry as string) ?? null,
    headquarters: (row.headquarters as string) ?? null,
    jurisdiction: (row.jurisdiction as string) ?? null,
    employeeCount: (row.employee_count as string) ?? null,
    foundedYear: row.founded_year === null || row.founded_year === undefined ? null : Number(row.founded_year),
    aum: row.aum === null || row.aum === undefined ? null : Number(row.aum),
    typicalCheckSize: (row.typical_check_size as string) ?? null,
    investmentFocus: asArr<string>(row.investment_focus),
    investmentStage: asArr<string>(row.investment_stage),
    isRaisingProject: Boolean(row.is_raising_project),
    projectStatus: (row.project_status as string) ?? null,
    totalContactCount: Number(row.total_contact_count ?? 0),
    totalCommittedUsd: Number(row.total_committed_usd ?? 0),
    tags: asArr<string>(row.tags),
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    deletedAt: (row.deleted_at as string) ?? null,
  };
}

export interface OrganizationsService {
  createOrganization(input: CreateOrganizationInput): Promise<Organization>;
  getOrganization(id: string): Promise<Organization | null>;
  getBySlug(ventureId: string, slug: string): Promise<Organization | null>;
  listOrganizations(ventureId: string, filters?: { orgType?: OrgType; isRaisingProject?: boolean; limit?: number }): Promise<Organization[]>;
  listLaunchpadProjects(filters?: { projectStatus?: string }): Promise<Organization[]>;
  updateOrganization(id: string, updates: Partial<CreateOrganizationInput>): Promise<Organization>;
  deleteOrganization(id: string): Promise<void>;
}

export interface OrganizationsServiceOptions {
  supabase: SupabaseClient | null;
}

export function createOrganizationsService({ supabase }: OrganizationsServiceOptions): OrganizationsService {
  return {
    async createOrganization(input) {
      if (!supabase) throw new Error('Supabase client not available');
      const validated = CreateOrganizationInput.parse(input);
      const row = {
        venture_id: validated.ventureId,
        name: validated.name,
        slug: validated.slug,
        legal_name: validated.legalName ?? null,
        website: validated.website ?? null,
        logo_url: validated.logoUrl ?? null,
        description: validated.description ?? null,
        org_type: validated.orgType,
        industry: validated.industry ?? null,
        headquarters: validated.headquarters ?? null,
        jurisdiction: validated.jurisdiction ?? null,
        aum: validated.aum ?? null,
        typical_check_size: validated.typicalCheckSize ?? null,
        investment_focus: validated.investmentFocus,
        investment_stage: validated.investmentStage,
        is_raising_project: validated.isRaisingProject,
        project_status: validated.isRaisingProject ? 'onboarding' : null,
        tags: validated.tags,
        metadata: validated.metadata,
      };
      const { data, error } = await supabase
        .from('capital_organizations')
        .insert(row)
        .select()
        .single();
      if (error) throw new Error(`Failed to create org: ${error.message}`);
      return mapOrgRow(data);
    },

    async getOrganization(id) {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('capital_organizations')
        .select()
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle();
      if (error) throw new Error(`Failed: ${error.message}`);
      return data ? mapOrgRow(data) : null;
    },

    async getBySlug(ventureId, slug) {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('capital_organizations')
        .select()
        .eq('venture_id', ventureId)
        .eq('slug', slug)
        .is('deleted_at', null)
        .maybeSingle();
      if (error) throw new Error(`Failed: ${error.message}`);
      return data ? mapOrgRow(data) : null;
    },

    async listOrganizations(ventureId, filters) {
      if (!supabase) return [];
      let q = supabase
        .from('capital_organizations')
        .select()
        .eq('venture_id', ventureId)
        .is('deleted_at', null)
        .order('total_committed_usd', { ascending: false })
        .limit(filters?.limit ?? 100);
      if (filters?.orgType) q = q.eq('org_type', filters.orgType);
      if (filters?.isRaisingProject !== undefined) q = q.eq('is_raising_project', filters.isRaisingProject);
      const { data, error } = await q;
      if (error) throw new Error(`Failed: ${error.message}`);
      return (data ?? []).map(mapOrgRow);
    },

    async listLaunchpadProjects(filters) {
      if (!supabase) return [];
      let q = supabase
        .from('capital_organizations')
        .select()
        .eq('is_raising_project', true)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (filters?.projectStatus) q = q.eq('project_status', filters.projectStatus);
      const { data, error } = await q;
      if (error) throw new Error(`Failed: ${error.message}`);
      return (data ?? []).map(mapOrgRow);
    },

    async updateOrganization(id, updates) {
      if (!supabase) throw new Error('Supabase client not available');
      const row: Record<string, unknown> = {};
      if (updates.name !== undefined) row.name = updates.name;
      if (updates.legalName !== undefined) row.legal_name = updates.legalName;
      if (updates.website !== undefined) row.website = updates.website;
      if (updates.logoUrl !== undefined) row.logo_url = updates.logoUrl;
      if (updates.description !== undefined) row.description = updates.description;
      if (updates.orgType !== undefined) row.org_type = updates.orgType;
      if (updates.industry !== undefined) row.industry = updates.industry;
      if (updates.headquarters !== undefined) row.headquarters = updates.headquarters;
      if (updates.jurisdiction !== undefined) row.jurisdiction = updates.jurisdiction;
      if (updates.aum !== undefined) row.aum = updates.aum;
      if (updates.typicalCheckSize !== undefined) row.typical_check_size = updates.typicalCheckSize;
      if (updates.investmentFocus !== undefined) row.investment_focus = updates.investmentFocus;
      if (updates.investmentStage !== undefined) row.investment_stage = updates.investmentStage;
      if (updates.tags !== undefined) row.tags = updates.tags;
      if (updates.metadata !== undefined) row.metadata = updates.metadata;
      row.updated_at = new Date().toISOString();
      const { data, error } = await supabase
        .from('capital_organizations')
        .update(row)
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(`Failed: ${error.message}`);
      return mapOrgRow(data);
    },

    async deleteOrganization(id) {
      if (!supabase) throw new Error('Supabase client not available');
      const { error } = await supabase
        .from('capital_organizations')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw new Error(`Failed: ${error.message}`);
    },
  };
}
