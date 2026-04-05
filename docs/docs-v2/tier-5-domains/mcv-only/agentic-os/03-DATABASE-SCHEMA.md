# @mcv/agentic-os — Database Schema
## Complete Data Model Reference

**Package:** `@mcv/agentic-os`  
**Classification:** INTERNAL (MCV-Only)  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026

---

## Overview

This document defines the complete database schema for the Agentic Operating System. The schema supports the NAOS hierarchy (Queen, Ralph, Scouts), HITL workflows, prompt management, and agent memory systems.

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           AGENTIC-OS DATABASE SCHEMA                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  AGENTS & REGISTRY                    TASKS & EXECUTION                          │
│  ┌──────────────────┐                ┌──────────────────┐                       │
│  │  naos_agents     │                │  naos_tasks      │                       │
│  │  ────────────    │                │  ──────────      │                       │
│  │  id              │◄───────────────│  agent_id        │                       │
│  │  type            │                │  parent_task_id  │◄─┐                    │
│  │  name            │                │  status          │  │                    │
│  │  capabilities    │                │  type            │  │                    │
│  │  config          │                │  priority        │──┘                    │
│  │  status          │                │  input/output    │                       │
│  └────────┬─────────┘                └────────┬─────────┘                       │
│           │                                   │                                  │
│           │ has metrics                       │ produces                         │
│           ▼                                   ▼                                  │
│  ┌──────────────────┐                ┌──────────────────┐                       │
│  │  naos_agent_     │                │  naos_task_      │                       │
│  │  metrics         │                │  events          │                       │
│  └──────────────────┘                └──────────────────┘                       │
│                                                                                  │
│  HITL WORKFLOWS                       MEMORY & LEARNING                          │
│  ┌──────────────────┐                ┌──────────────────┐                       │
│  │  naos_hitl_      │                │  naos_memory_    │                       │
│  │  requests        │                │  entries         │                       │
│  │  ────────────    │                │  ────────────    │                       │
│  │  id              │                │  id              │                       │
│  │  request_type    │                │  agent_id        │                       │
│  │  tasks           │                │  memory_type     │                       │
│  │  risk_level      │                │  content         │                       │
│  │  status          │                │  embedding       │                       │
│  └────────┬─────────┘                └──────────────────┘                       │
│           │                                                                      │
│           │ has                       PROMPTS & INSTRUMENTS                      │
│           ▼                          ┌──────────────────┐                       │
│  ┌──────────────────┐                │  naos_prompts    │                       │
│  │  naos_hitl_      │                │  ────────────    │                       │
│  │  approvals       │                │  id              │                       │
│  │  ────────────    │                │  name            │                       │
│  │  request_id      │                │  category        │                       │
│  │  approver_id     │                │  template        │                       │
│  │  decision        │                │  variables       │                       │
│  │  decided_at      │                └──────────────────┘                       │
│  └──────────────────┘                                                           │
│                                      ┌──────────────────┐                       │
│  TRAJECTORIES                        │  naos_           │                       │
│  ┌──────────────────┐                │  instruments     │                       │
│  │  naos_           │                │  ────────────    │                       │
│  │  trajectories    │                │  id              │                       │
│  │  ────────────    │                │  name            │                       │
│  │  id              │                │  definition      │                       │
│  │  task_id         │                │  capability      │                       │
│  │  steps           │                └──────────────────┘                       │
│  │  outcome         │                                                           │
│  │  reward_signal   │                                                           │
│  └──────────────────┘                                                           │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Tables

### Agents & Registry

```sql
-- ============================================================================
-- NAOS AGENTS
-- Core agent definitions and configurations
-- ============================================================================

CREATE TYPE naos_agent_type AS ENUM ('queen', 'ralph', 'scout', 'specialist');
CREATE TYPE naos_agent_status AS ENUM ('active', 'paused', 'maintenance', 'retired');
CREATE TYPE naos_capability AS ENUM (
  'read', 'write', 'execute', 'approve', 'delegate', 'external', 'financial'
);

CREATE TABLE naos_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id UUID NOT NULL REFERENCES ventures(id),
  
  -- Identity
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  type naos_agent_type NOT NULL,
  description TEXT,
  
  -- Configuration
  capabilities naos_capability[] NOT NULL DEFAULT '{}',
  model_config JSONB NOT NULL DEFAULT '{}',
  /*
    model_config: {
      defaultModel: "claude-sonnet",
      tier: "standard",
      maxTokensPerTurn: 4000,
      maxToolCalls: 10,
      temperature: 0.7
    }
  */
  
  -- Instruments (tools this agent can use)
  instruments TEXT[] NOT NULL DEFAULT '{}',
  
  -- Constraints
  constraints JSONB NOT NULL DEFAULT '{}',
  /*
    constraints: {
      maxTokensPerTurn: 8000,
      maxToolCalls: 20,
      timeoutMs: 300000,
      costBudgetUSD: 10.0,
      requiresHITL: ["financial_transfer", "external_communication"],
      forbiddenActions: ["delete_user", "modify_billing"]
    }
  */
  
  -- Memory configuration
  memory_config JSONB DEFAULT '{}',
  /*
    memory_config: {
      enabled: true,
      episodicRetention: "30d",
      semanticIndexing: true,
      maxWorkingMemory: 10
    }
  */
  
  -- System prompt
  system_prompt TEXT,
  
  -- Status
  status naos_agent_status DEFAULT 'active',
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(venture_id, slug)
);

CREATE INDEX idx_naos_agents_venture ON naos_agents(venture_id);
CREATE INDEX idx_naos_agents_type ON naos_agents(type);
CREATE INDEX idx_naos_agents_status ON naos_agents(status);

-- ============================================================================
-- NAOS AGENT METRICS
-- Performance and usage tracking per agent
-- ============================================================================

CREATE TABLE naos_agent_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES naos_agents(id) ON DELETE CASCADE,
  
  -- Time period
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  period_type VARCHAR(10) NOT NULL, -- 'hour', 'day', 'week', 'month'
  
  -- Request metrics
  total_requests INTEGER DEFAULT 0,
  successful_requests INTEGER DEFAULT 0,
  failed_requests INTEGER DEFAULT 0,
  avg_latency_ms INTEGER,
  p95_latency_ms INTEGER,
  
  -- Token/cost metrics
  total_tokens_used BIGINT DEFAULT 0,
  total_cost_usd DECIMAL(10, 4) DEFAULT 0,
  
  -- HITL metrics
  hitl_requests INTEGER DEFAULT 0,
  hitl_approvals INTEGER DEFAULT 0,
  hitl_rejections INTEGER DEFAULT 0,
  
  -- Tool usage
  tool_calls INTEGER DEFAULT 0,
  tool_call_breakdown JSONB DEFAULT '{}',
  /*
    tool_call_breakdown: {
      "database_query": 150,
      "send_email": 23,
      "api_call": 45
    }
  */
  
  -- Quality metrics
  avg_task_completion_rate DECIMAL(5, 4),
  avg_user_satisfaction DECIMAL(3, 2),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(agent_id, period_type, period_start)
);

CREATE INDEX idx_naos_agent_metrics_agent ON naos_agent_metrics(agent_id);
CREATE INDEX idx_naos_agent_metrics_period ON naos_agent_metrics(period_start);
```

### Tasks & Execution

```sql
-- ============================================================================
-- NAOS TASKS
-- Task definitions and execution tracking
-- ============================================================================

CREATE TYPE naos_task_status AS ENUM (
  'pending', 'queued', 'assigned', 'running', 'waiting_hitl',
  'completed', 'failed', 'cancelled', 'timeout'
);

CREATE TYPE naos_task_type AS ENUM (
  'development', 'marketing', 'operations', 'finance',
  'content', 'analytics', 'communications', 'security'
);

CREATE TYPE naos_priority AS ENUM ('critical', 'high', 'medium', 'low');

CREATE TABLE naos_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id UUID NOT NULL REFERENCES ventures(id),
  
  -- Hierarchy
  parent_task_id UUID REFERENCES naos_tasks(id),
  root_task_id UUID REFERENCES naos_tasks(id),
  
  -- Assignment
  assigned_agent_id UUID REFERENCES naos_agents(id),
  target_pod_type VARCHAR(50), -- 'smith', 'growth', 'director', etc.
  
  -- Task definition
  title VARCHAR(500) NOT NULL,
  description TEXT,
  type naos_task_type NOT NULL,
  priority naos_priority DEFAULT 'medium',
  
  -- Instruments needed
  instruments TEXT[] DEFAULT '{}',
  
  -- Dependencies
  dependencies UUID[] DEFAULT '{}', -- Other task IDs
  
  -- Input/Output
  input JSONB NOT NULL DEFAULT '{}',
  output JSONB,
  
  -- Execution context
  context JSONB DEFAULT '{}',
  
  -- Status
  status naos_task_status DEFAULT 'pending',
  
  -- Estimates
  estimated_duration_ms INTEGER,
  estimated_cost_usd DECIMAL(10, 4),
  
  -- Actual metrics
  actual_duration_ms INTEGER,
  actual_cost_usd DECIMAL(10, 4),
  tokens_used INTEGER,
  tool_calls_made INTEGER,
  
  -- Timing
  queued_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  deadline TIMESTAMPTZ,
  
  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  -- HITL
  requires_hitl BOOLEAN DEFAULT false,
  hitl_request_id UUID,
  
  -- Audit
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_naos_tasks_venture ON naos_tasks(venture_id);
CREATE INDEX idx_naos_tasks_parent ON naos_tasks(parent_task_id);
CREATE INDEX idx_naos_tasks_agent ON naos_tasks(assigned_agent_id);
CREATE INDEX idx_naos_tasks_status ON naos_tasks(status);
CREATE INDEX idx_naos_tasks_type ON naos_tasks(type);
CREATE INDEX idx_naos_tasks_created ON naos_tasks(created_at);

-- ============================================================================
-- NAOS TASK EVENTS
-- Event log for task execution
-- ============================================================================

CREATE TYPE naos_task_event_type AS ENUM (
  'created', 'queued', 'assigned', 'started', 'progress',
  'tool_called', 'tool_result', 'hitl_requested', 'hitl_completed',
  'completed', 'failed', 'cancelled', 'retried', 'timeout'
);

CREATE TABLE naos_task_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES naos_tasks(id) ON DELETE CASCADE,
  
  -- Event details
  event_type naos_task_event_type NOT NULL,
  
  -- Progress tracking
  progress_percent INTEGER, -- 0-100
  progress_message TEXT,
  
  -- Event data
  data JSONB DEFAULT '{}',
  /*
    For tool_called: { tool: "database_query", input: {...} }
    For tool_result: { tool: "database_query", output: {...}, duration_ms: 123 }
    For progress: { step: 3, total_steps: 5, message: "Processing..." }
  */
  
  -- Timing
  timestamp TIMESTAMPTZ DEFAULT now(),
  duration_ms INTEGER
);

CREATE INDEX idx_naos_task_events_task ON naos_task_events(task_id);
CREATE INDEX idx_naos_task_events_type ON naos_task_events(event_type);
CREATE INDEX idx_naos_task_events_timestamp ON naos_task_events(timestamp);

-- ============================================================================
-- NAOS TASK QUEUES
-- Queue management for task distribution
-- ============================================================================

CREATE TABLE naos_task_queues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id UUID NOT NULL REFERENCES ventures(id),
  
  -- Queue definition
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Target
  target_pod_type VARCHAR(50), -- null = any
  target_agent_id UUID REFERENCES naos_agents(id),
  
  -- Configuration
  max_concurrent INTEGER DEFAULT 10,
  priority_weight INTEGER DEFAULT 1,
  processing_timeout_ms INTEGER DEFAULT 300000,
  
  -- Rate limiting
  rate_limit_per_minute INTEGER,
  rate_limit_per_hour INTEGER,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_paused BOOLEAN DEFAULT false,
  
  -- Stats
  pending_count INTEGER DEFAULT 0,
  processing_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(venture_id, slug)
);
```

### HITL Workflows

```sql
-- ============================================================================
-- NAOS HITL REQUESTS
-- Human-in-the-loop approval requests
-- ============================================================================

CREATE TYPE naos_hitl_request_type AS ENUM (
  'task_approval', 'financial_approval', 'data_access',
  'external_communication', 'configuration_change', 'escalation'
);

CREATE TYPE naos_hitl_status AS ENUM (
  'pending', 'approved', 'rejected', 'expired', 'cancelled'
);

CREATE TYPE naos_risk_level AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TABLE naos_hitl_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id UUID NOT NULL REFERENCES ventures(id),
  
  -- Reference
  request_type naos_hitl_request_type NOT NULL,
  source_task_id UUID REFERENCES naos_tasks(id),
  source_agent_id UUID REFERENCES naos_agents(id),
  
  -- Request details
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  
  -- Risk assessment
  risk_level naos_risk_level NOT NULL,
  risk_factors JSONB DEFAULT '[]',
  /*
    risk_factors: [
      { type: "cost_threshold", description: "Cost exceeds $500", severity: "high" },
      { type: "external_api", description: "Calls external service", severity: "medium" }
    ]
  */
  
  -- Tasks being approved
  tasks JSONB NOT NULL DEFAULT '[]',
  /*
    tasks: [
      { id: "uuid", title: "Send email campaign", type: "marketing", estimatedCost: 0.50 }
    ]
  */
  
  -- Approval requirements
  required_approvers JSONB NOT NULL DEFAULT '[]',
  /*
    required_approvers: [
      { role: "manager", count: 1 },
      { role: "executive", count: 1 }
    ]
  */
  
  -- Context for approvers
  context JSONB DEFAULT '{}',
  
  -- Status
  status naos_hitl_status DEFAULT 'pending',
  
  -- Timing
  deadline TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  
  -- Outcome
  final_decision naos_hitl_status,
  final_comments TEXT,
  conditions JSONB, -- Conditions attached to approval
  
  -- Escalation
  escalated_at TIMESTAMPTZ,
  escalation_reason TEXT
);

CREATE INDEX idx_naos_hitl_requests_venture ON naos_hitl_requests(venture_id);
CREATE INDEX idx_naos_hitl_requests_status ON naos_hitl_requests(status);
CREATE INDEX idx_naos_hitl_requests_task ON naos_hitl_requests(source_task_id);
CREATE INDEX idx_naos_hitl_requests_deadline ON naos_hitl_requests(deadline);

-- ============================================================================
-- NAOS HITL APPROVALS
-- Individual approval decisions
-- ============================================================================

CREATE TYPE naos_approval_decision AS ENUM ('approve', 'reject', 'delegate', 'abstain');

CREATE TABLE naos_hitl_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES naos_hitl_requests(id) ON DELETE CASCADE,
  
  -- Approver
  approver_id UUID NOT NULL,
  approver_role VARCHAR(50) NOT NULL,
  approval_level INTEGER NOT NULL,
  
  -- Decision
  decision naos_approval_decision,
  comments TEXT,
  conditions JSONB, -- Conditions for approval
  
  -- Delegation
  delegated_to UUID,
  delegation_reason TEXT,
  
  -- Timing
  due_date TIMESTAMPTZ,
  decided_at TIMESTAMPTZ,
  reminder_sent_at TIMESTAMPTZ,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending',
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_naos_hitl_approvals_request ON naos_hitl_approvals(request_id);
CREATE INDEX idx_naos_hitl_approvals_approver ON naos_hitl_approvals(approver_id);
CREATE INDEX idx_naos_hitl_approvals_status ON naos_hitl_approvals(status);

-- ============================================================================
-- NAOS HITL ESCALATION RULES
-- Automatic escalation configuration
-- ============================================================================

CREATE TABLE naos_hitl_escalation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id UUID NOT NULL REFERENCES ventures(id),
  
  -- Rule definition
  name VARCHAR(200) NOT NULL,
  description TEXT,
  
  -- Trigger conditions
  trigger_conditions JSONB NOT NULL,
  /*
    trigger_conditions: {
      afterHours: 24,
      riskLevels: ["high", "critical"],
      requestTypes: ["financial_approval"]
    }
  */
  
  -- Escalation action
  escalation_action JSONB NOT NULL,
  /*
    escalation_action: {
      type: "add_approver",
      targetRole: "executive",
      notifyChannels: ["email", "slack"]
    }
  */
  
  -- Priority
  priority INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Memory & Learning

```sql
-- ============================================================================
-- NAOS MEMORY ENTRIES
-- Agent memory storage
-- ============================================================================

CREATE TYPE naos_memory_type AS ENUM (
  'episodic',    -- Specific events/experiences
  'semantic',    -- Facts and knowledge
  'procedural',  -- How to do things
  'working'      -- Current context
);

CREATE TYPE naos_memory_status AS ENUM ('active', 'archived', 'superseded', 'deleted');

CREATE TABLE naos_memory_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id UUID NOT NULL REFERENCES ventures(id),
  agent_id UUID REFERENCES naos_agents(id),
  
  -- Memory classification
  memory_type naos_memory_type NOT NULL,
  category VARCHAR(100),
  
  -- Content
  content TEXT NOT NULL,
  summary TEXT,
  
  -- Source
  source_type VARCHAR(50) NOT NULL, -- 'task', 'conversation', 'explicit', 'inferred'
  source_id UUID,
  
  -- Relevance
  importance DECIMAL(3, 2) DEFAULT 0.5, -- 0.0 to 1.0
  confidence DECIMAL(3, 2) DEFAULT 1.0,
  
  -- Vector embedding for semantic search
  embedding vector(3072),
  
  -- Relationships
  related_entities JSONB DEFAULT '[]',
  /*
    related_entities: [
      { type: "user", id: "uuid", name: "John" },
      { type: "task", id: "uuid" }
    ]
  */
  
  -- Tags for filtering
  tags TEXT[] DEFAULT '{}',
  
  -- Validity
  valid_from TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ,
  
  -- Access tracking
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  
  -- Status
  status naos_memory_status DEFAULT 'active',
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_naos_memory_venture ON naos_memory_entries(venture_id);
CREATE INDEX idx_naos_memory_agent ON naos_memory_entries(agent_id);
CREATE INDEX idx_naos_memory_type ON naos_memory_entries(memory_type);
CREATE INDEX idx_naos_memory_status ON naos_memory_entries(status);
CREATE INDEX idx_naos_memory_embedding ON naos_memory_entries 
  USING ivfflat (embedding vector_cosine_ops);

-- ============================================================================
-- NAOS TRAJECTORIES
-- Execution trajectories for learning
-- ============================================================================

CREATE TYPE naos_trajectory_outcome AS ENUM ('success', 'partial', 'failure');

CREATE TABLE naos_trajectories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id UUID NOT NULL REFERENCES ventures(id),
  task_id UUID NOT NULL REFERENCES naos_tasks(id),
  agent_id UUID NOT NULL REFERENCES naos_agents(id),
  
  -- Task context
  task_type naos_task_type NOT NULL,
  task_input JSONB NOT NULL,
  
  -- Execution steps
  steps JSONB NOT NULL DEFAULT '[]',
  /*
    steps: [
      {
        step: 1,
        action: "tool_call",
        tool: "database_query",
        input: {...},
        output: {...},
        reasoning: "Need to fetch user data first",
        duration_ms: 150
      },
      {
        step: 2,
        action: "llm_completion",
        prompt_tokens: 500,
        completion_tokens: 200,
        reasoning: "Analyzing retrieved data"
      }
    ]
  */
  
  -- Outcome
  outcome naos_trajectory_outcome NOT NULL,
  task_output JSONB,
  error_message TEXT,
  
  -- Metrics
  total_duration_ms INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  total_tool_calls INTEGER NOT NULL,
  total_cost_usd DECIMAL(10, 4) NOT NULL,
  
  -- Reward signal for learning
  reward_signal DECIMAL(3, 2), -- -1.0 to 1.0
  reward_components JSONB DEFAULT '{}',
  /*
    reward_components: {
      task_completion: 0.8,
      efficiency: 0.6,
      cost_optimization: 0.9,
      user_satisfaction: 0.7
    }
  */
  
  -- Feedback
  human_feedback TEXT,
  human_rating INTEGER, -- 1-5
  
  -- Flags
  is_exemplar BOOLEAN DEFAULT false, -- Good example to learn from
  is_failure_case BOOLEAN DEFAULT false, -- Example of what not to do
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_naos_trajectories_venture ON naos_trajectories(venture_id);
CREATE INDEX idx_naos_trajectories_task ON naos_trajectories(task_id);
CREATE INDEX idx_naos_trajectories_agent ON naos_trajectories(agent_id);
CREATE INDEX idx_naos_trajectories_outcome ON naos_trajectories(outcome);
CREATE INDEX idx_naos_trajectories_exemplar ON naos_trajectories(is_exemplar) WHERE is_exemplar = true;
```

### Prompts & Instruments

```sql
-- ============================================================================
-- NAOS PROMPTS
-- Prompt bank for agents
-- ============================================================================

CREATE TYPE naos_prompt_status AS ENUM ('draft', 'active', 'deprecated');

CREATE TABLE naos_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id UUID REFERENCES ventures(id), -- null = system-wide
  
  -- Identity
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Categorization
  category VARCHAR(50) NOT NULL, -- 'system', 'task', 'tool', 'guard', 'format'
  subcategory VARCHAR(50),
  tags TEXT[] DEFAULT '{}',
  
  -- Template
  template TEXT NOT NULL,
  
  -- Variables
  variables JSONB DEFAULT '[]',
  /*
    variables: [
      { name: "user_name", type: "string", required: true },
      { name: "task_list", type: "array", required: false }
    ]
  */
  
  -- Model hints
  recommended_models TEXT[] DEFAULT '{}',
  max_tokens INTEGER,
  temperature DECIMAL(3, 2),
  
  -- Versioning
  version INTEGER DEFAULT 1,
  parent_id UUID REFERENCES naos_prompts(id),
  
  -- Status
  status naos_prompt_status DEFAULT 'draft',
  
  -- Metrics
  usage_count INTEGER DEFAULT 0,
  avg_quality_score DECIMAL(3, 2),
  
  -- Audit
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(venture_id, slug, version)
);

CREATE INDEX idx_naos_prompts_venture ON naos_prompts(venture_id);
CREATE INDEX idx_naos_prompts_category ON naos_prompts(category);
CREATE INDEX idx_naos_prompts_status ON naos_prompts(status);

-- ============================================================================
-- NAOS PROMPT CHAINS
-- Chained prompt sequences
-- ============================================================================

CREATE TABLE naos_prompt_chains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id UUID REFERENCES ventures(id),
  
  -- Identity
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Chain definition
  steps JSONB NOT NULL DEFAULT '[]',
  /*
    steps: [
      {
        order: 1,
        promptId: "uuid",
        inputMapping: { "context": "$.previous.output" },
        outputKey: "analysis"
      },
      {
        order: 2,
        promptId: "uuid",
        inputMapping: { "analysis": "$.analysis" },
        outputKey: "decision"
      }
    ]
  */
  
  -- Execution config
  continue_on_error BOOLEAN DEFAULT false,
  max_iterations INTEGER DEFAULT 10,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(venture_id, slug)
);

-- ============================================================================
-- NAOS INSTRUMENTS
-- Tool definitions for agents
-- ============================================================================

CREATE TABLE naos_instruments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id UUID REFERENCES ventures(id), -- null = system-wide
  
  -- Identity
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  
  -- Capability requirement
  required_capability naos_capability NOT NULL,
  
  -- Schema
  input_schema JSONB NOT NULL,
  output_schema JSONB NOT NULL,
  
  -- Implementation
  handler_type VARCHAR(50) NOT NULL, -- 'builtin', 'http', 'grpc', 'code'
  handler_config JSONB NOT NULL,
  /*
    For builtin:
      { builtin: "database_query" }
    
    For http:
      { url: "https://api.example.com/v1/action", method: "POST", headers: {...} }
    
    For code:
      { function: "executeCustomLogic", module: "custom-instruments" }
  */
  
  -- Safety controls
  requires_hitl BOOLEAN DEFAULT false,
  max_calls_per_request INTEGER DEFAULT 10,
  cooldown_ms INTEGER DEFAULT 0,
  audit_level VARCHAR(10) DEFAULT 'basic', -- 'none', 'basic', 'full'
  
  -- Rate limits
  rate_limit_per_minute INTEGER,
  rate_limit_per_hour INTEGER,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metrics
  total_calls BIGINT DEFAULT 0,
  avg_duration_ms INTEGER,
  success_rate DECIMAL(5, 4),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(venture_id, slug)
);

CREATE INDEX idx_naos_instruments_venture ON naos_instruments(venture_id);
CREATE INDEX idx_naos_instruments_capability ON naos_instruments(required_capability);
```

### Scout Network

```sql
-- ============================================================================
-- NAOS SCOUTS
-- Monitoring and data collection agents
-- ============================================================================

CREATE TYPE naos_scout_type AS ENUM (
  'system_health', 'anomaly_detection', 'data_collection',
  'performance', 'security', 'compliance'
);

CREATE TABLE naos_scouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id UUID NOT NULL REFERENCES ventures(id),
  
  -- Identity
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  scout_type naos_scout_type NOT NULL,
  
  -- Configuration
  config JSONB NOT NULL DEFAULT '{}',
  /*
    config: {
      schedule: "*/5 * * * *",  // Every 5 minutes
      targets: ["api_latency", "error_rate", "database_connections"],
      thresholds: {
        error_rate: { warning: 0.01, critical: 0.05 },
        latency_p95: { warning: 500, critical: 1000 }
      },
      alertChannels: ["slack", "email"]
    }
  */
  
  -- Schedule
  schedule_cron VARCHAR(100),
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Stats
  total_runs BIGINT DEFAULT 0,
  alerts_generated BIGINT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- NAOS SCOUT OBSERVATIONS
-- Data collected by scouts
-- ============================================================================

CREATE TYPE naos_observation_severity AS ENUM ('info', 'warning', 'error', 'critical');

CREATE TABLE naos_scout_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scout_id UUID NOT NULL REFERENCES naos_scouts(id) ON DELETE CASCADE,
  venture_id UUID NOT NULL REFERENCES ventures(id),
  
  -- Observation
  observation_type VARCHAR(100) NOT NULL,
  severity naos_observation_severity DEFAULT 'info',
  
  -- Data
  metrics JSONB NOT NULL DEFAULT '{}',
  /*
    metrics: {
      api_latency_p50: 45,
      api_latency_p95: 120,
      api_latency_p99: 350,
      error_rate: 0.002,
      request_count: 15234
    }
  */
  
  -- Anomalies detected
  anomalies JSONB DEFAULT '[]',
  /*
    anomalies: [
      {
        metric: "error_rate",
        value: 0.08,
        expected: 0.01,
        deviation: 7.0,
        severity: "critical"
      }
    ]
  */
  
  -- Alert status
  alert_generated BOOLEAN DEFAULT false,
  alert_id UUID,
  
  -- Timing
  observed_at TIMESTAMPTZ DEFAULT now(),
  
  -- Raw data for debugging
  raw_data JSONB
);

CREATE INDEX idx_naos_scout_observations_scout ON naos_scout_observations(scout_id);
CREATE INDEX idx_naos_scout_observations_venture ON naos_scout_observations(venture_id);
CREATE INDEX idx_naos_scout_observations_time ON naos_scout_observations(observed_at);
CREATE INDEX idx_naos_scout_observations_severity ON naos_scout_observations(severity);

-- ============================================================================
-- NAOS ALERTS
-- Alerts generated by scouts
-- ============================================================================

CREATE TYPE naos_alert_status AS ENUM ('open', 'acknowledged', 'resolved', 'snoozed');

CREATE TABLE naos_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id UUID NOT NULL REFERENCES ventures(id),
  scout_id UUID REFERENCES naos_scouts(id),
  observation_id UUID REFERENCES naos_scout_observations(id),
  
  -- Alert details
  title VARCHAR(500) NOT NULL,
  description TEXT,
  severity naos_observation_severity NOT NULL,
  
  -- Status
  status naos_alert_status DEFAULT 'open',
  
  -- Handling
  acknowledged_by UUID,
  acknowledged_at TIMESTAMPTZ,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  
  -- Snooze
  snoozed_until TIMESTAMPTZ,
  
  -- Notification tracking
  notifications_sent JSONB DEFAULT '[]',
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_naos_alerts_venture ON naos_alerts(venture_id);
CREATE INDEX idx_naos_alerts_status ON naos_alerts(status);
CREATE INDEX idx_naos_alerts_severity ON naos_alerts(severity);
CREATE INDEX idx_naos_alerts_created ON naos_alerts(created_at);
```

---

## Indexes & Performance

```sql
-- ============================================================================
-- ADDITIONAL INDEXES FOR PERFORMANCE
-- ============================================================================

-- Composite indexes for common queries
CREATE INDEX idx_naos_tasks_venture_status 
  ON naos_tasks(venture_id, status, created_at DESC);

CREATE INDEX idx_naos_tasks_agent_status 
  ON naos_tasks(assigned_agent_id, status);

CREATE INDEX idx_naos_hitl_requests_venture_status 
  ON naos_hitl_requests(venture_id, status, deadline);

CREATE INDEX idx_naos_memory_agent_type_status 
  ON naos_memory_entries(agent_id, memory_type, status);

-- Partial indexes for active records
CREATE INDEX idx_naos_agents_active 
  ON naos_agents(venture_id, type) 
  WHERE status = 'active';

CREATE INDEX idx_naos_tasks_pending 
  ON naos_tasks(venture_id, priority, created_at) 
  WHERE status IN ('pending', 'queued');

CREATE INDEX idx_naos_hitl_pending 
  ON naos_hitl_requests(deadline) 
  WHERE status = 'pending';

-- GIN indexes for JSONB queries
CREATE INDEX idx_naos_tasks_input_gin ON naos_tasks USING gin(input);
CREATE INDEX idx_naos_agents_config_gin ON naos_agents USING gin(constraints);
CREATE INDEX idx_naos_memory_entities_gin ON naos_memory_entries USING gin(related_entities);
```

---

## Migrations

```sql
-- ============================================================================
-- MIGRATION: Initial Schema
-- Version: 001
-- ============================================================================

BEGIN;

-- Create all enums
CREATE TYPE naos_agent_type AS ENUM ('queen', 'ralph', 'scout', 'specialist');
-- ... (all other enums)

-- Create all tables
-- ... (all CREATE TABLE statements)

-- Create all indexes
-- ... (all CREATE INDEX statements)

-- Insert system defaults
INSERT INTO naos_instruments (name, slug, description, required_capability, input_schema, output_schema, handler_type, handler_config)
VALUES 
  ('Database Query', 'database_query', 'Execute read-only database queries', 'read', 
   '{"type":"object","properties":{"query":{"type":"string"}}}',
   '{"type":"object","properties":{"rows":{"type":"array"}}}',
   'builtin', '{"builtin":"database_query"}'),
  ('Send Notification', 'send_notification', 'Send notifications to users', 'external',
   '{"type":"object","properties":{"userId":{"type":"string"},"message":{"type":"string"}}}',
   '{"type":"object","properties":{"notificationId":{"type":"string"}}}',
   'builtin', '{"builtin":"send_notification"}');

COMMIT;
```

---

## Related Documentation

- [01-PACKAGE-SPEC.md](./01-PACKAGE-SPEC.md) — Package overview
- [02-TECHNICAL-ARCHITECTURE.md](./02-TECHNICAL-ARCHITECTURE.md) — System design
- [04-EXAMPLES.md](./04-EXAMPLES.md) — Usage examples

---

*@mcv/agentic-os — Database Schema v1.0*
