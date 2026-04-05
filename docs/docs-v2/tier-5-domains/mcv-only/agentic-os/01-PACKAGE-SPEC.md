# @mcv/agentic-os — Package Specification
## Tier 5: MCV-Only Domains

**Package:** `@mcv/agentic-os`  
**Classification:** INTERNAL (MCV-Only)  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026

---

## Executive Summary

`@mcv/agentic-os` is the cognitive operating system layer of the MCV.ONE platform. It orchestrates AI agent operations through a hierarchical intelligence architecture featuring the Queen strategic orchestrator, Ralph execution swarms, HITL (Human-in-the-Loop) approval workflows, and autonomous Scout monitoring agents.

**This is the brain of MCV.ONE — where AI decisions are made, tasks decomposed, and human oversight is maintained.**

---

## Strategic Position

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          HUMAN OPERATORS                                     │
│                     (Executives, Managers, Users)                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                              HITL Approvals
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           @mcv/agentic-os                                    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                          QUEEN ORCHESTRATOR                          │    │
│  │           Strategic Planning • Task Decomposition • Routing          │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      │                                       │
│           ┌──────────────────────────┼──────────────────────────┐           │
│           ▼                          ▼                          ▼           │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐       │
│  │  RALPH: SMITH   │     │ RALPH: GROWTH   │     │ RALPH: DIRECTOR │       │
│  │  (Development)  │     │  (Marketing)    │     │  (Operations)   │       │
│  └─────────────────┘     └─────────────────┘     └─────────────────┘       │
│           │                       │                       │                  │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                           SCOUT NETWORK                              │    │
│  │          Monitoring • Anomaly Detection • Data Collection            │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │  NAOS    │ │ MEMORY   │ │ REASONING│ │ PROMPTS  │ │  HITL    │          │
│  │ Framework│ │  System  │ │  Engine  │ │  Bank    │ │ Workflows│          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ depends on
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  @mcv/gateway │ @mcv/kernel │ @mcv/events │ @mcv/intelligence │ @mcv/cdp   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Sub-Modules Overview

| Module | Purpose | Key Exports |
|--------|---------|-------------|
| **naos** | Neural Agent Operating System framework | `NAOSAgent`, `AgentRegistry`, `Instruments` |
| **queen** | Strategic orchestrator and task router | `Queen`, `TaskPlanner`, `ResourceAllocator` |
| **swarm** | Ralph execution pods for task execution | `Swarm`, `RalphPod`, `WorkerPool` |
| **hitl** | Human-in-the-loop approval workflows | `HITLQueue`, `ApprovalWorkflow`, `Escalation` |
| **reasoning** | Advanced reasoning and planning engine | `ReasoningEngine`, `ChainOfThought`, `TreeOfThought` |
| **memory** | Agent memory and learning systems | `MemoryStore`, `EpisodicMemory`, `SemanticMemory` |
| **prompts** | Prompt engineering and instrument bank | `PromptBank`, `Instrument`, `PromptChain` |
| **scouts** | Autonomous monitoring and data collection | `ScoutNetwork`, `Monitor`, `AnomalyDetector` |

---

## Architecture Overview

### NAOS Hierarchy

The Neural Agent Operating System (NAOS) implements a hierarchical multi-agent architecture:

```
┌────────────────────────────────────────────────────────────────┐
│                        LEVEL 3: QUEEN                          │
│     Strategic orchestrator - never executes, only delegates    │
│                                                                │
│  • Receives user/system requests                               │
│  • Decomposes into subtasks                                    │
│  • Routes to appropriate Ralph pods                            │
│  • Monitors progress and adjusts                               │
│  • Requires HITL for high-stakes decisions                     │
└────────────────────────────────────────────────────────────────┘
                              │
                    Task Assignment
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                    LEVEL 2: RALPH SWARM                        │
│      Specialized execution pods with domain expertise          │
│                                                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │  SMITH   │ │  GROWTH  │ │ DIRECTOR │ │  LEDGER  │          │
│  │ Engineer │ │ Marketer │ │ Operator │ │  Finance │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │  SCRIBE  │ │  ORACLE  │ │  HERALD  │ │  SHIELD  │          │
│  │  Content │ │Analytics │ │  Comms   │ │ Security │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
└────────────────────────────────────────────────────────────────┘
                              │
                    Monitoring & Feedback
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                     LEVEL 1: SCOUTS                            │
│        Autonomous watchers - observe, report, never act        │
│                                                                │
│  • System health monitoring                                    │
│  • Anomaly detection                                           │
│  • Data collection and aggregation                             │
│  • Performance metrics                                         │
│  • Security surveillance                                       │
└────────────────────────────────────────────────────────────────┘
```

### Decision Flow

```typescript
// Request lifecycle through NAOS
interface RequestLifecycle {
  // 1. Request enters system
  ingestion: {
    source: 'user' | 'system' | 'scheduled' | 'event';
    ventureId: VentureID;
    priority: Priority;
    context: RequestContext;
  };
  
  // 2. Queen analyzes and plans
  planning: {
    taskDecomposition: Task[];
    resourceAllocation: ResourcePlan;
    riskAssessment: RiskLevel;
    hitlRequired: boolean;
  };
  
  // 3. HITL checkpoint (if required)
  approval?: {
    approvers: UserID[];
    timeout: Duration;
    escalationPath: EscalationRule[];
  };
  
  // 4. Ralph execution
  execution: {
    assignedPod: RalphPodType;
    instruments: Instrument[];
    deadline: Timestamp;
    checkpoints: Checkpoint[];
  };
  
  // 5. Scout monitoring
  monitoring: {
    metricsCollected: Metric[];
    anomaliesDetected: Anomaly[];
    feedbackLoop: Feedback;
  };
  
  // 6. Completion and learning
  completion: {
    result: ExecutionResult;
    trajectory: Trajectory;
    learnings: Learning[];
  };
}
```

---

## Module: naos

### Purpose

The NAOS module provides the foundational framework for building and managing AI agents within the MCV.ONE ecosystem.

### Core Concepts

#### Agents

```typescript
// @mcv/agentic-os/naos/agent.ts
import { z } from 'zod';

export const AgentCapabilitySchema = z.enum([
  'read',       // Can read data
  'write',      // Can write/modify data
  'execute',    // Can execute code/workflows
  'approve',    // Can approve HITL requests
  'delegate',   // Can assign tasks to other agents
  'external',   // Can call external APIs
  'financial',  // Can perform financial operations
]);

export type AgentCapability = z.infer<typeof AgentCapabilitySchema>;

export interface AgentConfig {
  id: string;
  name: string;
  type: 'queen' | 'ralph' | 'scout' | 'specialist';
  description: string;
  capabilities: AgentCapability[];
  model: ModelConfig;
  instruments: InstrumentConfig[];
  memory: MemoryConfig;
  constraints: AgentConstraints;
}

export interface AgentConstraints {
  maxTokensPerTurn: number;
  maxToolCalls: number;
  timeoutMs: number;
  costBudgetUSD: number;
  requiresHITL: HITLTrigger[];
  forbiddenActions: string[];
}

export class NAOSAgent {
  readonly id: string;
  readonly config: AgentConfig;
  private memory: AgentMemory;
  private instruments: Map<string, Instrument>;
  
  constructor(config: AgentConfig) {
    this.id = config.id;
    this.config = config;
    this.memory = new AgentMemory(config.memory);
    this.instruments = this.loadInstruments(config.instruments);
  }
  
  async process(request: AgentRequest): Promise<AgentResponse> {
    // 1. Build context
    const context = await this.buildContext(request);
    
    // 2. Check HITL requirements
    const hitlCheck = this.checkHITLRequirements(request, context);
    if (hitlCheck.required) {
      return this.requestHITLApproval(hitlCheck);
    }
    
    // 3. Execute with reasoning
    const result = await this.executeWithReasoning(request, context);
    
    // 4. Update memory
    await this.memory.store(request, result);
    
    // 5. Record trajectory
    await this.recordTrajectory(request, context, result);
    
    return result;
  }
  
  async useInstrument(name: string, params: unknown): Promise<unknown> {
    const instrument = this.instruments.get(name);
    if (!instrument) {
      throw new AgentError(`Instrument '${name}' not found`);
    }
    
    // Capability check
    if (!this.hasCapability(instrument.requiredCapability)) {
      throw new AgentError(`Agent lacks capability for instrument '${name}'`);
    }
    
    return instrument.execute(params);
  }
  
  hasCapability(capability: AgentCapability): boolean {
    return this.config.capabilities.includes(capability);
  }
}
```

#### Agent Registry

```typescript
// @mcv/agentic-os/naos/registry.ts
export interface AgentRegistration {
  agent: NAOSAgent;
  status: 'active' | 'paused' | 'maintenance' | 'retired';
  metrics: AgentMetrics;
  lastActive: Timestamp;
}

export class AgentRegistry {
  private agents: Map<string, AgentRegistration> = new Map();
  private eventBus: EventBus;
  
  async register(config: AgentConfig): Promise<NAOSAgent> {
    const agent = new NAOSAgent(config);
    
    this.agents.set(agent.id, {
      agent,
      status: 'active',
      metrics: this.initializeMetrics(),
      lastActive: new Date(),
    });
    
    await this.eventBus.emit('agent.registered', { agentId: agent.id });
    
    return agent;
  }
  
  async getAgent(id: string): Promise<NAOSAgent> {
    const registration = this.agents.get(id);
    if (!registration) {
      throw new NotFoundError('Agent', id);
    }
    if (registration.status !== 'active') {
      throw new AgentError(`Agent '${id}' is ${registration.status}`);
    }
    return registration.agent;
  }
  
  async findAgentsByCapability(capability: AgentCapability): Promise<NAOSAgent[]> {
    return Array.from(this.agents.values())
      .filter(r => r.status === 'active' && r.agent.hasCapability(capability))
      .map(r => r.agent);
  }
  
  async getAgentMetrics(id: string): Promise<AgentMetrics> {
    const registration = this.agents.get(id);
    if (!registration) {
      throw new NotFoundError('Agent', id);
    }
    return registration.metrics;
  }
  
  async updateAgentStatus(id: string, status: AgentRegistration['status']): Promise<void> {
    const registration = this.agents.get(id);
    if (!registration) {
      throw new NotFoundError('Agent', id);
    }
    registration.status = status;
    await this.eventBus.emit('agent.status_changed', { agentId: id, status });
  }
}

export interface AgentMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatencyMs: number;
  totalTokensUsed: number;
  totalCostUSD: number;
  hitlApprovals: number;
  hitlRejections: number;
}
```

#### Instruments

```typescript
// @mcv/agentic-os/naos/instruments.ts
export interface InstrumentDefinition {
  name: string;
  description: string;
  requiredCapability: AgentCapability;
  inputSchema: z.ZodSchema;
  outputSchema: z.ZodSchema;
  execute: (input: unknown, context: ExecutionContext) => Promise<unknown>;
  
  // Safety controls
  requiresHITL?: boolean;
  maxCallsPerRequest?: number;
  cooldownMs?: number;
  auditLevel: 'none' | 'basic' | 'full';
}

export class Instrument {
  readonly definition: InstrumentDefinition;
  private callCount: number = 0;
  private lastCallTime: number = 0;
  
  constructor(definition: InstrumentDefinition) {
    this.definition = definition;
  }
  
  async execute(input: unknown, context: ExecutionContext): Promise<unknown> {
    // Validate input
    const validatedInput = this.definition.inputSchema.parse(input);
    
    // Check rate limits
    this.checkRateLimits();
    
    // Execute
    const startTime = Date.now();
    const result = await this.definition.execute(validatedInput, context);
    const duration = Date.now() - startTime;
    
    // Validate output
    const validatedOutput = this.definition.outputSchema.parse(result);
    
    // Audit
    await this.audit(validatedInput, validatedOutput, duration, context);
    
    this.callCount++;
    this.lastCallTime = Date.now();
    
    return validatedOutput;
  }
  
  private checkRateLimits(): void {
    const { maxCallsPerRequest, cooldownMs } = this.definition;
    
    if (maxCallsPerRequest && this.callCount >= maxCallsPerRequest) {
      throw new RateLimitError(`Instrument '${this.definition.name}' call limit exceeded`);
    }
    
    if (cooldownMs && Date.now() - this.lastCallTime < cooldownMs) {
      throw new RateLimitError(`Instrument '${this.definition.name}' on cooldown`);
    }
  }
  
  private async audit(
    input: unknown,
    output: unknown,
    duration: number,
    context: ExecutionContext
  ): Promise<void> {
    if (this.definition.auditLevel === 'none') return;
    
    await context.auditLog.record({
      instrumentName: this.definition.name,
      input: this.definition.auditLevel === 'full' ? input : undefined,
      output: this.definition.auditLevel === 'full' ? output : undefined,
      duration,
      agentId: context.agentId,
      requestId: context.requestId,
      timestamp: new Date(),
    });
  }
}

// Built-in instruments
export const builtInInstruments: InstrumentDefinition[] = [
  {
    name: 'database_query',
    description: 'Execute read-only database queries',
    requiredCapability: 'read',
    inputSchema: z.object({
      query: z.string(),
      params: z.record(z.unknown()).optional(),
    }),
    outputSchema: z.object({
      rows: z.array(z.record(z.unknown())),
      rowCount: z.number(),
    }),
    execute: async (input, context) => {
      // Implementation...
    },
    auditLevel: 'full',
  },
  {
    name: 'send_notification',
    description: 'Send notifications to users',
    requiredCapability: 'external',
    inputSchema: z.object({
      userId: z.string().uuid(),
      channel: z.enum(['email', 'sms', 'push', 'slack']),
      message: z.string(),
    }),
    outputSchema: z.object({
      notificationId: z.string(),
      status: z.enum(['sent', 'queued', 'failed']),
    }),
    execute: async (input, context) => {
      // Implementation...
    },
    requiresHITL: false,
    auditLevel: 'basic',
  },
  {
    name: 'financial_transfer',
    description: 'Initiate financial transfers',
    requiredCapability: 'financial',
    inputSchema: z.object({
      fromAccount: z.string(),
      toAccount: z.string(),
      amount: z.number().positive(),
      currency: z.string(),
      reason: z.string(),
    }),
    outputSchema: z.object({
      transferId: z.string(),
      status: z.enum(['pending_approval', 'approved', 'executed', 'failed']),
    }),
    execute: async (input, context) => {
      // Implementation...
    },
    requiresHITL: true,
    auditLevel: 'full',
  },
];
```

---

## Module: queen

### Purpose

The Queen is the strategic orchestrator of the NAOS hierarchy. She receives high-level requests, decomposes them into actionable tasks, allocates resources, and routes work to appropriate Ralph execution pods.

### Queen Implementation

```typescript
// @mcv/agentic-os/queen/queen.ts
import { NAOSAgent, AgentConfig } from '../naos';
import { TaskPlanner } from './planner';
import { ResourceAllocator } from './allocator';
import { SwarmDispatcher } from '../swarm';
import { HITLGateway } from '../hitl';

export interface QueenConfig extends AgentConfig {
  planningModel: ModelConfig;
  maxConcurrentTasks: number;
  taskTimeout: Duration;
  escalationRules: EscalationRule[];
}

export class Queen extends NAOSAgent {
  private planner: TaskPlanner;
  private allocator: ResourceAllocator;
  private dispatcher: SwarmDispatcher;
  private hitl: HITLGateway;
  
  constructor(config: QueenConfig) {
    super({
      ...config,
      type: 'queen',
      capabilities: ['read', 'delegate', 'approve'],
    });
    
    this.planner = new TaskPlanner(config.planningModel);
    this.allocator = new ResourceAllocator();
    this.dispatcher = new SwarmDispatcher();
    this.hitl = new HITLGateway();
  }
  
  async handleRequest(request: StrategicRequest): Promise<StrategicResponse> {
    const requestId = generateId('req');
    const startTime = Date.now();
    
    try {
      // 1. Analyze request
      const analysis = await this.analyzeRequest(request);
      
      // 2. Decompose into tasks
      const tasks = await this.planner.decompose(request, analysis);
      
      // 3. Assess risks and HITL requirements
      const riskAssessment = await this.assessRisks(tasks);
      
      // 4. Request HITL approval if needed
      if (riskAssessment.requiresApproval) {
        const approval = await this.hitl.requestApproval({
          requestId,
          tasks,
          riskAssessment,
          requiredApprovers: riskAssessment.approvers,
          timeout: this.config.taskTimeout,
        });
        
        if (!approval.approved) {
          return this.buildRejectedResponse(request, approval);
        }
      }
      
      // 5. Allocate resources
      const allocation = await this.allocator.allocate(tasks);
      
      // 6. Dispatch to Ralph swarm
      const executionResults = await this.dispatcher.dispatch(tasks, allocation);
      
      // 7. Aggregate and respond
      return this.aggregateResults(request, executionResults);
      
    } catch (error) {
      await this.handleError(requestId, error);
      throw error;
    } finally {
      await this.recordMetrics(requestId, startTime);
    }
  }
  
  private async analyzeRequest(request: StrategicRequest): Promise<RequestAnalysis> {
    const prompt = this.buildAnalysisPrompt(request);
    
    const response = await this.llm.complete({
      model: this.config.planningModel,
      messages: [
        { role: 'system', content: QUEEN_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      responseFormat: RequestAnalysisSchema,
    });
    
    return RequestAnalysisSchema.parse(response);
  }
  
  private async assessRisks(tasks: Task[]): Promise<RiskAssessment> {
    const risks: Risk[] = [];
    let maxRiskLevel: RiskLevel = 'low';
    
    for (const task of tasks) {
      // Check for high-risk operations
      if (task.instruments.some(i => HIGH_RISK_INSTRUMENTS.includes(i))) {
        risks.push({
          taskId: task.id,
          type: 'high_risk_instrument',
          level: 'high',
          description: `Task uses high-risk instruments`,
        });
        maxRiskLevel = 'high';
      }
      
      // Check for financial operations
      if (task.estimatedCostUSD > COST_THRESHOLD_USD) {
        risks.push({
          taskId: task.id,
          type: 'cost_threshold',
          level: 'medium',
          description: `Task exceeds cost threshold: $${task.estimatedCostUSD}`,
        });
        if (maxRiskLevel === 'low') maxRiskLevel = 'medium';
      }
      
      // Check for external communications
      if (task.type === 'external_communication') {
        risks.push({
          taskId: task.id,
          type: 'external_communication',
          level: 'medium',
          description: 'Task involves external communication',
        });
        if (maxRiskLevel === 'low') maxRiskLevel = 'medium';
      }
    }
    
    return {
      risks,
      overallLevel: maxRiskLevel,
      requiresApproval: maxRiskLevel !== 'low',
      approvers: this.determineApprovers(maxRiskLevel),
    };
  }
  
  private determineApprovers(riskLevel: RiskLevel): ApproverConfig[] {
    switch (riskLevel) {
      case 'low':
        return [];
      case 'medium':
        return [{ role: 'manager', count: 1 }];
      case 'high':
        return [{ role: 'manager', count: 1 }, { role: 'executive', count: 1 }];
      case 'critical':
        return [{ role: 'executive', count: 2 }];
    }
  }
}

const QUEEN_SYSTEM_PROMPT = `You are Queen, the strategic orchestrator of the MCV.ONE agentic operating system.

Your responsibilities:
1. Analyze incoming requests to understand intent and requirements
2. Decompose complex requests into atomic, executable tasks
3. Identify the appropriate Ralph pod for each task
4. Assess risks and flag items requiring human approval
5. Never execute tasks directly - always delegate to Ralph pods
6. Monitor progress and adjust plans as needed

Task Types:
- development: Code changes, deployments (→ Smith)
- marketing: Campaigns, content, analytics (→ Growth)
- operations: Workflows, processes, support (→ Director)
- finance: Transactions, reporting, compliance (→ Ledger)
- content: Writing, editing, translation (→ Scribe)
- analytics: Data analysis, insights, reports (→ Oracle)
- communications: Emails, notifications, outreach (→ Herald)
- security: Access control, audits, incidents (→ Shield)

Risk Levels:
- low: Read-only operations, internal queries
- medium: Data modifications, external API calls
- high: Financial transactions, user data changes
- critical: System configuration, security changes

Always provide clear reasoning for your decisions.`;
```

### Task Planner

```typescript
// @mcv/agentic-os/queen/planner.ts
export interface Task {
  id: string;
  parentId?: string;
  type: TaskType;
  title: string;
  description: string;
  targetPod: RalphPodType;
  instruments: string[];
  inputs: Record<string, unknown>;
  dependencies: string[];
  priority: Priority;
  estimatedDurationMs: number;
  estimatedCostUSD: number;
  deadline?: Timestamp;
}

export type TaskType =
  | 'development'
  | 'marketing'
  | 'operations'
  | 'finance'
  | 'content'
  | 'analytics'
  | 'communications'
  | 'security';

export type RalphPodType =
  | 'smith'      // Development
  | 'growth'     // Marketing
  | 'director'   // Operations
  | 'ledger'     // Finance
  | 'scribe'     // Content
  | 'oracle'     // Analytics
  | 'herald'     // Communications
  | 'shield';    // Security

export class TaskPlanner {
  private model: ModelConfig;
  
  constructor(model: ModelConfig) {
    this.model = model;
  }
  
  async decompose(request: StrategicRequest, analysis: RequestAnalysis): Promise<Task[]> {
    // Use advanced reasoning for complex decomposition
    const decomposition = await this.performDecomposition(request, analysis);
    
    // Validate task graph (no cycles, valid dependencies)
    this.validateTaskGraph(decomposition.tasks);
    
    // Optimize execution order
    const optimizedTasks = this.optimizeExecutionOrder(decomposition.tasks);
    
    // Estimate resources
    return this.estimateResources(optimizedTasks);
  }
  
  private async performDecomposition(
    request: StrategicRequest,
    analysis: RequestAnalysis
  ): Promise<{ tasks: Task[] }> {
    const prompt = `
Request: ${request.description}

Analysis:
- Intent: ${analysis.intent}
- Complexity: ${analysis.complexity}
- Domains: ${analysis.domains.join(', ')}
- Constraints: ${JSON.stringify(analysis.constraints)}

Decompose this request into atomic, executable tasks. For each task:
1. Identify the appropriate Ralph pod
2. List required instruments
3. Specify dependencies on other tasks
4. Estimate duration and cost

Output as JSON array of tasks.
`;

    const response = await this.llm.complete({
      model: this.model,
      messages: [
        { role: 'system', content: PLANNER_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      responseFormat: TaskDecompositionSchema,
    });
    
    return TaskDecompositionSchema.parse(response);
  }
  
  private validateTaskGraph(tasks: Task[]): void {
    const taskIds = new Set(tasks.map(t => t.id));
    
    for (const task of tasks) {
      // Check dependencies exist
      for (const dep of task.dependencies) {
        if (!taskIds.has(dep)) {
          throw new PlanningError(`Task '${task.id}' depends on non-existent task '${dep}'`);
        }
      }
    }
    
    // Check for cycles using topological sort
    if (this.hasCycle(tasks)) {
      throw new PlanningError('Task graph contains cycles');
    }
  }
  
  private hasCycle(tasks: Task[]): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    
    const dfs = (taskId: string): boolean => {
      visited.add(taskId);
      recursionStack.add(taskId);
      
      const task = taskMap.get(taskId)!;
      for (const dep of task.dependencies) {
        if (!visited.has(dep)) {
          if (dfs(dep)) return true;
        } else if (recursionStack.has(dep)) {
          return true;
        }
      }
      
      recursionStack.delete(taskId);
      return false;
    };
    
    for (const task of tasks) {
      if (!visited.has(task.id) && dfs(task.id)) {
        return true;
      }
    }
    
    return false;
  }
  
  private optimizeExecutionOrder(tasks: Task[]): Task[] {
    // Topological sort with priority consideration
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const inDegree = new Map<string, number>();
    const result: Task[] = [];
    
    // Initialize in-degrees
    for (const task of tasks) {
      inDegree.set(task.id, task.dependencies.length);
    }
    
    // Priority queue (tasks with no dependencies)
    const queue = tasks
      .filter(t => t.dependencies.length === 0)
      .sort((a, b) => b.priority - a.priority);
    
    while (queue.length > 0) {
      const task = queue.shift()!;
      result.push(task);
      
      // Update in-degrees
      for (const t of tasks) {
        if (t.dependencies.includes(task.id)) {
          const newDegree = inDegree.get(t.id)! - 1;
          inDegree.set(t.id, newDegree);
          
          if (newDegree === 0) {
            queue.push(t);
            queue.sort((a, b) => b.priority - a.priority);
          }
        }
      }
    }
    
    return result;
  }
  
  private estimateResources(tasks: Task[]): Task[] {
    return tasks.map(task => ({
      ...task,
      estimatedDurationMs: this.estimateDuration(task),
      estimatedCostUSD: this.estimateCost(task),
    }));
  }
  
  private estimateDuration(task: Task): number {
    const baseDurations: Record<TaskType, number> = {
      development: 300000,    // 5 minutes
      marketing: 120000,      // 2 minutes
      operations: 60000,      // 1 minute
      finance: 180000,        // 3 minutes
      content: 240000,        // 4 minutes
      analytics: 180000,      // 3 minutes
      communications: 30000,  // 30 seconds
      security: 120000,       // 2 minutes
    };
    
    return baseDurations[task.type] * (1 + task.instruments.length * 0.2);
  }
  
  private estimateCost(task: Task): number {
    const baseCosts: Record<TaskType, number> = {
      development: 0.10,
      marketing: 0.05,
      operations: 0.02,
      finance: 0.08,
      content: 0.15,
      analytics: 0.06,
      communications: 0.01,
      security: 0.04,
    };
    
    return baseCosts[task.type] * (1 + task.instruments.length * 0.3);
  }
}
```

### Resource Allocator

```typescript
// @mcv/agentic-os/queen/allocator.ts
export interface ResourcePlan {
  assignments: TaskAssignment[];
  parallelGroups: ParallelGroup[];
  estimatedTotalDuration: number;
  estimatedTotalCost: number;
}

export interface TaskAssignment {
  taskId: string;
  podType: RalphPodType;
  podInstance: string;
  priority: number;
  resources: ResourceRequirements;
}

export interface ParallelGroup {
  groupId: string;
  taskIds: string[];
  startAfter: string[];  // Group dependencies
}

export interface ResourceRequirements {
  maxTokens: number;
  maxToolCalls: number;
  timeoutMs: number;
  modelTier: 'economy' | 'standard' | 'premium' | 'reasoning';
}

export class ResourceAllocator {
  private podCapacity: Map<RalphPodType, number> = new Map();
  private currentLoad: Map<string, number> = new Map();
  
  async allocate(tasks: Task[]): Promise<ResourcePlan> {
    const assignments: TaskAssignment[] = [];
    const parallelGroups: ParallelGroup[] = [];
    
    // Group tasks by dependencies
    const groups = this.groupByDependencies(tasks);
    
    for (const group of groups) {
      const groupTasks = tasks.filter(t => group.taskIds.includes(t.id));
      
      for (const task of groupTasks) {
        const assignment = await this.assignTask(task);
        assignments.push(assignment);
      }
      
      parallelGroups.push(group);
    }
    
    return {
      assignments,
      parallelGroups,
      estimatedTotalDuration: this.calculateTotalDuration(assignments, parallelGroups),
      estimatedTotalCost: assignments.reduce((sum, a) => sum + this.calculateCost(a), 0),
    };
  }
  
  private async assignTask(task: Task): Promise<TaskAssignment> {
    const podInstances = await this.getAvailablePods(task.targetPod);
    
    // Select least loaded instance
    const selectedPod = podInstances.reduce((best, pod) => {
      const load = this.currentLoad.get(pod) ?? 0;
      const bestLoad = this.currentLoad.get(best) ?? 0;
      return load < bestLoad ? pod : best;
    });
    
    // Determine resource requirements based on task complexity
    const resources = this.determineResources(task);
    
    // Update load tracking
    this.currentLoad.set(
      selectedPod,
      (this.currentLoad.get(selectedPod) ?? 0) + 1
    );
    
    return {
      taskId: task.id,
      podType: task.targetPod,
      podInstance: selectedPod,
      priority: task.priority,
      resources,
    };
  }
  
  private determineResources(task: Task): ResourceRequirements {
    // Base resources by task type
    const baseResources: Record<TaskType, ResourceRequirements> = {
      development: {
        maxTokens: 8000,
        maxToolCalls: 20,
        timeoutMs: 600000,
        modelTier: 'premium',
      },
      analytics: {
        maxTokens: 4000,
        maxToolCalls: 10,
        timeoutMs: 300000,
        modelTier: 'standard',
      },
      communications: {
        maxTokens: 2000,
        maxToolCalls: 5,
        timeoutMs: 60000,
        modelTier: 'economy',
      },
      // ... other task types
    };
    
    return baseResources[task.type] ?? {
      maxTokens: 4000,
      maxToolCalls: 10,
      timeoutMs: 300000,
      modelTier: 'standard',
    };
  }
  
  private groupByDependencies(tasks: Task[]): ParallelGroup[] {
    const groups: ParallelGroup[] = [];
    const processed = new Set<string>();
    
    while (processed.size < tasks.length) {
      // Find tasks whose dependencies are all processed
      const availableTasks = tasks.filter(t => 
        !processed.has(t.id) &&
        t.dependencies.every(d => processed.has(d))
      );
      
      if (availableTasks.length === 0) {
        throw new AllocationError('Unable to resolve task dependencies');
      }
      
      const groupId = generateId('grp');
      groups.push({
        groupId,
        taskIds: availableTasks.map(t => t.id),
        startAfter: groups.length > 0 ? [groups[groups.length - 1].groupId] : [],
      });
      
      availableTasks.forEach(t => processed.add(t.id));
    }
    
    return groups;
  }
}
```

---

## Module: swarm

### Purpose

The Swarm module manages Ralph execution pods — specialized AI workers that perform the actual work delegated by Queen.

### Ralph Pod Implementation

```typescript
// @mcv/agentic-os/swarm/ralph.ts
export interface RalphPodConfig extends AgentConfig {
  podType: RalphPodType;
  specialization: string;
  defaultInstruments: string[];
  maxConcurrentTasks: number;
}

export class RalphPod extends NAOSAgent {
  readonly podType: RalphPodType;
  private taskQueue: TaskQueue;
  private activeTask: Task | null = null;
  
  constructor(config: RalphPodConfig) {
    super({
      ...config,
      type: 'ralph',
    });
    this.podType = config.podType;
    this.taskQueue = new TaskQueue(config.maxConcurrentTasks);
  }
  
  async executeTask(task: Task, resources: ResourceRequirements): Promise<TaskResult> {
    const taskContext = this.createTaskContext(task, resources);
    
    try {
      // Load task-specific instruments
      const instruments = await this.loadInstruments(task.instruments);
      
      // Execute with reasoning
      const result = await this.executeWithReasoning(task, taskContext, instruments);
      
      // Validate result
      await this.validateResult(result, task);
      
      // Record success
      await this.recordCompletion(task, result, 'success');
      
      return result;
      
    } catch (error) {
      // Record failure
      await this.recordCompletion(task, null, 'failed', error);
      throw error;
    }
  }
  
  private async executeWithReasoning(
    task: Task,
    context: TaskContext,
    instruments: Instrument[]
  ): Promise<TaskResult> {
    const systemPrompt = this.buildSystemPrompt(task);
    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
    ];
    
    // Initial task prompt
    messages.push({
      role: 'user',
      content: this.buildTaskPrompt(task),
    });
    
    let iteration = 0;
    const maxIterations = 10;
    
    while (iteration < maxIterations) {
      iteration++;
      
      // Get LLM response
      const response = await this.llm.complete({
        model: context.resources.modelTier,
        messages,
        tools: instruments.map(i => i.toToolDefinition()),
        maxTokens: context.resources.maxTokens,
      });
      
      // Check if task is complete
      if (response.finishReason === 'stop') {
        return this.parseResult(response.content, task);
      }
      
      // Process tool calls
      if (response.toolCalls && response.toolCalls.length > 0) {
        const toolResults = await this.executeToolCalls(
          response.toolCalls,
          instruments,
          context
        );
        
        messages.push({ role: 'assistant', content: response.content, toolCalls: response.toolCalls });
        messages.push({ role: 'tool', content: JSON.stringify(toolResults) });
      }
    }
    
    throw new TaskExecutionError('Max iterations exceeded', task.id);
  }
  
  private async executeToolCalls(
    toolCalls: ToolCall[],
    instruments: Instrument[],
    context: TaskContext
  ): Promise<ToolResult[]> {
    const results: ToolResult[] = [];
    
    for (const call of toolCalls) {
      const instrument = instruments.find(i => i.definition.name === call.function.name);
      
      if (!instrument) {
        results.push({
          toolCallId: call.id,
          error: `Unknown instrument: ${call.function.name}`,
        });
        continue;
      }
      
      try {
        const result = await instrument.execute(
          JSON.parse(call.function.arguments),
          context.executionContext
        );
        results.push({ toolCallId: call.id, result });
      } catch (error) {
        results.push({ toolCallId: call.id, error: error.message });
      }
    }
    
    return results;
  }
}

// Ralph pod specializations
export const RALPH_PODS: Record<RalphPodType, RalphPodConfig> = {
  smith: {
    id: 'ralph-smith',
    name: 'Smith',
    type: 'ralph',
    podType: 'smith',
    specialization: 'Software development, code generation, debugging, deployments',
    description: 'The engineer - handles all development tasks',
    capabilities: ['read', 'write', 'execute', 'external'],
    defaultInstruments: [
      'code_edit', 'code_review', 'git_operations', 'test_runner',
      'deployment', 'database_migration', 'api_call',
    ],
    maxConcurrentTasks: 3,
  },
  growth: {
    id: 'ralph-growth',
    name: 'Growth',
    type: 'ralph',
    podType: 'growth',
    specialization: 'Marketing campaigns, content strategy, growth analytics',
    description: 'The marketer - handles growth and marketing tasks',
    capabilities: ['read', 'write', 'external'],
    defaultInstruments: [
      'campaign_builder', 'content_generator', 'analytics_query',
      'social_scheduler', 'email_sender', 'ab_test',
    ],
    maxConcurrentTasks: 5,
  },
  director: {
    id: 'ralph-director',
    name: 'Director',
    type: 'ralph',
    podType: 'director',
    specialization: 'Operations, workflows, project management',
    description: 'The operator - handles operational tasks',
    capabilities: ['read', 'write', 'delegate'],
    defaultInstruments: [
      'workflow_builder', 'task_manager', 'calendar_operations',
      'meeting_scheduler', 'document_manager',
    ],
    maxConcurrentTasks: 10,
  },
  ledger: {
    id: 'ralph-ledger',
    name: 'Ledger',
    type: 'ralph',
    podType: 'ledger',
    specialization: 'Financial operations, reporting, compliance',
    description: 'The accountant - handles financial tasks',
    capabilities: ['read', 'financial'],
    defaultInstruments: [
      'invoice_generator', 'payment_processor', 'report_builder',
      'budget_tracker', 'expense_manager',
    ],
    maxConcurrentTasks: 3,
  },
  scribe: {
    id: 'ralph-scribe',
    name: 'Scribe',
    type: 'ralph',
    podType: 'scribe',
    specialization: 'Content creation, editing, translation',
    description: 'The writer - handles content tasks',
    capabilities: ['read', 'write'],
    defaultInstruments: [
      'content_writer', 'editor', 'translator', 'summarizer',
      'seo_optimizer', 'plagiarism_checker',
    ],
    maxConcurrentTasks: 5,
  },
  oracle: {
    id: 'ralph-oracle',
    name: 'Oracle',
    type: 'ralph',
    podType: 'oracle',
    specialization: 'Data analysis, insights, reporting',
    description: 'The analyst - handles analytics tasks',
    capabilities: ['read'],
    defaultInstruments: [
      'data_query', 'visualization_builder', 'insight_generator',
      'trend_analyzer', 'forecast_model',
    ],
    maxConcurrentTasks: 5,
  },
  herald: {
    id: 'ralph-herald',
    name: 'Herald',
    type: 'ralph',
    podType: 'herald',
    specialization: 'Communications, notifications, outreach',
    description: 'The communicator - handles messaging tasks',
    capabilities: ['read', 'external'],
    defaultInstruments: [
      'email_composer', 'notification_sender', 'slack_messenger',
      'sms_sender', 'template_manager',
    ],
    maxConcurrentTasks: 20,
  },
  shield: {
    id: 'ralph-shield',
    name: 'Shield',
    type: 'ralph',
    podType: 'shield',
    specialization: 'Security, access control, incident response',
    description: 'The guardian - handles security tasks',
    capabilities: ['read', 'write'],
    defaultInstruments: [
      'access_auditor', 'threat_scanner', 'incident_reporter',
      'permission_manager', 'compliance_checker',
    ],
    maxConcurrentTasks: 3,
  },
};
```

### Swarm Dispatcher

```typescript
// @mcv/agentic-os/swarm/dispatcher.ts
export class SwarmDispatcher {
  private pods: Map<string, RalphPod> = new Map();
  private taskTracker: TaskTracker;
  private eventBus: EventBus;
  
  async dispatch(
    tasks: Task[],
    allocation: ResourcePlan
  ): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = [];
    
    // Process parallel groups in order
    for (const group of allocation.parallelGroups) {
      const groupTasks = tasks.filter(t => group.taskIds.includes(t.id));
      const groupAssignments = allocation.assignments.filter(
        a => group.taskIds.includes(a.taskId)
      );
      
      // Execute group in parallel
      const groupResults = await Promise.allSettled(
        groupTasks.map(async (task, index) => {
          const assignment = groupAssignments[index];
          return this.executeTask(task, assignment);
        })
      );
      
      // Process results
      for (const [index, result] of groupResults.entries()) {
        const task = groupTasks[index];
        
        if (result.status === 'fulfilled') {
          results.push({
            taskId: task.id,
            status: 'completed',
            result: result.value,
          });
        } else {
          results.push({
            taskId: task.id,
            status: 'failed',
            error: result.reason,
          });
        }
      }
    }
    
    return results;
  }
  
  private async executeTask(
    task: Task,
    assignment: TaskAssignment
  ): Promise<TaskResult> {
    const pod = await this.getPod(assignment.podInstance);
    
    // Emit start event
    await this.eventBus.emit('task.started', {
      taskId: task.id,
      podId: pod.id,
      timestamp: new Date(),
    });
    
    try {
      const result = await pod.executeTask(task, assignment.resources);
      
      // Emit completion event
      await this.eventBus.emit('task.completed', {
        taskId: task.id,
        podId: pod.id,
        result,
        timestamp: new Date(),
      });
      
      return result;
      
    } catch (error) {
      // Emit failure event
      await this.eventBus.emit('task.failed', {
        taskId: task.id,
        podId: pod.id,
        error,
        timestamp: new Date(),
      });
      
      throw error;
    }
  }
  
  private async getPod(podInstance: string): Promise<RalphPod> {
    let pod = this.pods.get(podInstance);
    
    if (!pod) {
      // Create or fetch pod
      const config = this.getPodConfig(podInstance);
      pod = new RalphPod(config);
      this.pods.set(podInstance, pod);
    }
    
    return pod;
  }
}
```

### Worker Pool

```typescript
// @mcv/agentic-os/swarm/pool.ts
export interface WorkerPoolConfig {
  minWorkers: number;
  maxWorkers: number;
  scaleUpThreshold: number;    // Queue depth to trigger scale up
  scaleDownThreshold: number;  // Idle time before scale down
  workerIdleTimeoutMs: number;
}

export class WorkerPool {
  private workers: Map<string, RalphPod> = new Map();
  private taskQueue: PriorityQueue<QueuedTask>;
  private config: WorkerPoolConfig;
  
  constructor(config: WorkerPoolConfig) {
    this.config = config;
    this.taskQueue = new PriorityQueue((a, b) => b.priority - a.priority);
    this.initializeWorkers();
  }
  
  async submitTask(task: Task, assignment: TaskAssignment): Promise<TaskResult> {
    return new Promise((resolve, reject) => {
      this.taskQueue.enqueue({
        task,
        assignment,
        resolve,
        reject,
        enqueuedAt: Date.now(),
      });
      
      this.processQueue();
    });
  }
  
  private async processQueue(): Promise<void> {
    // Check for available workers
    const availableWorkers = this.getAvailableWorkers();
    
    if (availableWorkers.length === 0 && this.canScaleUp()) {
      await this.scaleUp();
    }
    
    // Assign tasks to workers
    while (this.taskQueue.size > 0 && availableWorkers.length > 0) {
      const worker = availableWorkers.shift()!;
      const queuedTask = this.taskQueue.dequeue()!;
      
      this.executeOnWorker(worker, queuedTask);
    }
  }
  
  private async executeOnWorker(
    worker: RalphPod,
    queuedTask: QueuedTask
  ): Promise<void> {
    try {
      const result = await worker.executeTask(
        queuedTask.task,
        queuedTask.assignment.resources
      );
      queuedTask.resolve(result);
    } catch (error) {
      queuedTask.reject(error);
    } finally {
      this.processQueue();
    }
  }
  
  private getAvailableWorkers(): RalphPod[] {
    return Array.from(this.workers.values()).filter(w => !w.isBusy());
  }
  
  private canScaleUp(): boolean {
    return (
      this.workers.size < this.config.maxWorkers &&
      this.taskQueue.size >= this.config.scaleUpThreshold
    );
  }
  
  private async scaleUp(): Promise<void> {
    const workerId = generateId('wrk');
    const config = { /* worker config */ };
    const worker = new RalphPod(config);
    this.workers.set(workerId, worker);
  }
  
  private async scaleDown(workerId: string): Promise<void> {
    const worker = this.workers.get(workerId);
    if (worker && !worker.isBusy()) {
      await worker.shutdown();
      this.workers.delete(workerId);
    }
  }
}
```

---

## Module: hitl

### Purpose

The HITL (Human-in-the-Loop) module manages approval workflows for high-risk operations, ensuring human oversight of critical AI decisions.

### HITL Gateway

```typescript
// @mcv/agentic-os/hitl/gateway.ts
export interface HITLRequest {
  id: string;
  requestId: string;
  type: HITLRequestType;
  title: string;
  description: string;
  tasks: Task[];
  riskAssessment: RiskAssessment;
  requiredApprovers: ApproverConfig[];
  requestedBy: string;  // Agent or user
  ventureId: VentureID;
  deadline: Timestamp;
  context: Record<string, unknown>;
  createdAt: Timestamp;
}

export type HITLRequestType =
  | 'task_approval'
  | 'financial_approval'
  | 'data_access'
  | 'external_communication'
  | 'configuration_change'
  | 'escalation';

export interface HITLApproval {
  requestId: string;
  approved: boolean;
  approvers: ApprovalDecision[];
  comments: string;
  conditions?: ApprovalCondition[];
  decidedAt: Timestamp;
}

export interface ApprovalDecision {
  approverId: UserID;
  approverRole: string;
  decision: 'approve' | 'reject' | 'delegate';
  reason?: string;
  decidedAt: Timestamp;
}

export class HITLGateway {
  private queue: HITLQueue;
  private notifier: HITLNotifier;
  private escalationManager: EscalationManager;
  
  async requestApproval(params: {
    requestId: string;
    tasks: Task[];
    riskAssessment: RiskAssessment;
    requiredApprovers: ApproverConfig[];
    timeout: Duration;
    context?: Record<string, unknown>;
  }): Promise<HITLApproval> {
    const hitlRequest = await this.createRequest(params);
    
    // Add to queue
    await this.queue.enqueue(hitlRequest);
    
    // Notify approvers
    await this.notifier.notifyApprovers(hitlRequest);
    
    // Wait for approval with timeout
    const approval = await this.waitForApproval(hitlRequest, params.timeout);
    
    // Record decision
    await this.recordDecision(hitlRequest, approval);
    
    return approval;
  }
  
  private async createRequest(params: {
    requestId: string;
    tasks: Task[];
    riskAssessment: RiskAssessment;
    requiredApprovers: ApproverConfig[];
    context?: Record<string, unknown>;
  }): Promise<HITLRequest> {
    return {
      id: generateId('hitl'),
      requestId: params.requestId,
      type: this.determineRequestType(params.tasks),
      title: this.generateTitle(params.tasks),
      description: this.generateDescription(params.tasks, params.riskAssessment),
      tasks: params.tasks,
      riskAssessment: params.riskAssessment,
      requiredApprovers: params.requiredApprovers,
      requestedBy: getContext().user?.id ?? 'system',
      ventureId: getContext().venture.id,
      deadline: addDuration(new Date(), params.timeout),
      context: params.context ?? {},
      createdAt: new Date(),
    };
  }
  
  private async waitForApproval(
    request: HITLRequest,
    timeout: Duration
  ): Promise<HITLApproval> {
    const timeoutMs = durationToMs(timeout);
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      const status = await this.queue.getStatus(request.id);
      
      if (status.isComplete) {
        return this.buildApproval(request, status);
      }
      
      // Check for escalation
      if (this.shouldEscalate(request, status)) {
        await this.escalationManager.escalate(request);
      }
      
      // Poll interval
      await sleep(1000);
    }
    
    // Timeout - trigger escalation or auto-reject
    return this.handleTimeout(request);
  }
  
  private shouldEscalate(request: HITLRequest, status: QueueStatus): boolean {
    const timeRemaining = request.deadline.getTime() - Date.now();
    const escalationThreshold = 0.25;  // 25% time remaining
    const totalTime = request.deadline.getTime() - request.createdAt.getTime();
    
    return timeRemaining < totalTime * escalationThreshold && !status.isEscalated;
  }
  
  private async handleTimeout(request: HITLRequest): Promise<HITLApproval> {
    // Check escalation rules
    const escalationRule = request.riskAssessment.escalationRules?.find(
      r => r.trigger === 'timeout'
    );
    
    if (escalationRule?.action === 'auto_approve') {
      return {
        requestId: request.id,
        approved: true,
        approvers: [{
          approverId: 'system' as UserID,
          approverRole: 'system',
          decision: 'approve',
          reason: 'Auto-approved due to timeout',
          decidedAt: new Date(),
        }],
        comments: 'Auto-approved due to timeout per escalation rules',
        decidedAt: new Date(),
      };
    }
    
    // Default: reject on timeout
    return {
      requestId: request.id,
      approved: false,
      approvers: [],
      comments: 'Rejected due to approval timeout',
      decidedAt: new Date(),
    };
  }
}
```

### Approval Workflow

```typescript
// @mcv/agentic-os/hitl/workflow.ts
export interface ApprovalWorkflowConfig {
  name: string;
  steps: ApprovalStep[];
  parallelApprovals: boolean;
  quorum?: QuorumConfig;
  escalation: EscalationConfig;
}

export interface ApprovalStep {
  id: string;
  name: string;
  approverRoles: string[];
  requiredCount: number;
  timeoutMs: number;
  conditions?: ApprovalCondition[];
}

export interface QuorumConfig {
  type: 'majority' | 'unanimous' | 'threshold';
  threshold?: number;  // For 'threshold' type
}

export interface EscalationConfig {
  enabled: boolean;
  rules: EscalationRule[];
}

export interface EscalationRule {
  trigger: 'timeout' | 'rejection' | 'conflict';
  action: 'escalate' | 'auto_approve' | 'auto_reject' | 'notify';
  escalateTo?: string[];  // Roles to escalate to
  delayMs?: number;
}

export class ApprovalWorkflow {
  private config: ApprovalWorkflowConfig;
  private state: WorkflowState;
  
  constructor(config: ApprovalWorkflowConfig) {
    this.config = config;
    this.state = this.initializeState();
  }
  
  async processApproval(
    stepId: string,
    decision: ApprovalDecision
  ): Promise<WorkflowResult> {
    const step = this.config.steps.find(s => s.id === stepId);
    if (!step) {
      throw new WorkflowError(`Unknown step: ${stepId}`);
    }
    
    // Record decision
    this.state.decisions.push(decision);
    
    // Check step completion
    const stepDecisions = this.state.decisions.filter(d => d.stepId === stepId);
    const approvals = stepDecisions.filter(d => d.decision === 'approve');
    const rejections = stepDecisions.filter(d => d.decision === 'reject');
    
    if (rejections.length > 0 && !this.config.parallelApprovals) {
      return this.handleRejection(step, rejections[0]);
    }
    
    if (approvals.length >= step.requiredCount) {
      return this.advanceWorkflow(step);
    }
    
    // Check quorum
    if (this.config.quorum) {
      const quorumResult = this.checkQuorum(stepDecisions);
      if (quorumResult.decided) {
        return quorumResult.result;
      }
    }
    
    return { status: 'pending', currentStep: step.id };
  }
  
  private checkQuorum(decisions: ApprovalDecision[]): {
    decided: boolean;
    result?: WorkflowResult;
  } {
    const { quorum } = this.config;
    if (!quorum) return { decided: false };
    
    const approvals = decisions.filter(d => d.decision === 'approve').length;
    const rejections = decisions.filter(d => d.decision === 'reject').length;
    const total = decisions.length;
    
    switch (quorum.type) {
      case 'majority':
        if (approvals > total / 2) {
          return { decided: true, result: { status: 'approved' } };
        }
        if (rejections > total / 2) {
          return { decided: true, result: { status: 'rejected' } };
        }
        break;
        
      case 'unanimous':
        if (rejections > 0) {
          return { decided: true, result: { status: 'rejected' } };
        }
        break;
        
      case 'threshold':
        const threshold = quorum.threshold ?? 0.5;
        if (approvals / total >= threshold) {
          return { decided: true, result: { status: 'approved' } };
        }
        break;
    }
    
    return { decided: false };
  }
  
  private advanceWorkflow(completedStep: ApprovalStep): WorkflowResult {
    const stepIndex = this.config.steps.findIndex(s => s.id === completedStep.id);
    
    if (stepIndex === this.config.steps.length - 1) {
      // Final step completed
      return { status: 'approved' };
    }
    
    // Move to next step
    const nextStep = this.config.steps[stepIndex + 1];
    this.state.currentStep = nextStep.id;
    
    return { status: 'pending', currentStep: nextStep.id };
  }
  
  private handleRejection(
    step: ApprovalStep,
    rejection: ApprovalDecision
  ): WorkflowResult {
    // Check escalation rules
    const escalationRule = this.config.escalation.rules.find(
      r => r.trigger === 'rejection'
    );
    
    if (escalationRule?.action === 'escalate') {
      return {
        status: 'escalated',
        escalatedTo: escalationRule.escalateTo,
        reason: rejection.reason,
      };
    }
    
    return { status: 'rejected', reason: rejection.reason };
  }
}
```

### HITL Queue

```typescript
// @mcv/agentic-os/hitl/queue.ts
export class HITLQueue {
  private db: Database;
  private redis: Redis;
  private pubsub: PubSub;
  
  async enqueue(request: HITLRequest): Promise<void> {
    // Store in database
    await this.db.insert(hitlRequests).values({
      id: request.id,
      requestId: request.requestId,
      type: request.type,
      title: request.title,
      description: request.description,
      tasks: request.tasks,
      riskAssessment: request.riskAssessment,
      requiredApprovers: request.requiredApprovers,
      status: 'pending',
      ventureId: request.ventureId,
      deadline: request.deadline,
      createdAt: request.createdAt,
    });
    
    // Add to Redis sorted set for fast lookup
    await this.redis.zadd(
      `hitl:queue:${request.ventureId}`,
      request.deadline.getTime(),
      request.id
    );
    
    // Publish event
    await this.pubsub.publish('hitl.request.created', request);
  }
  
  async getStatus(requestId: string): Promise<QueueStatus> {
    const request = await this.db.query.hitlRequests.findFirst({
      where: eq(hitlRequests.id, requestId),
      with: { decisions: true },
    });
    
    if (!request) {
      throw new NotFoundError('HITL Request', requestId);
    }
    
    const approvals = request.decisions.filter(d => d.decision === 'approve');
    const rejections = request.decisions.filter(d => d.decision === 'reject');
    const requiredCount = request.requiredApprovers.reduce(
      (sum, a) => sum + a.count,
      0
    );
    
    return {
      requestId,
      status: request.status,
      approvalCount: approvals.length,
      rejectionCount: rejections.length,
      requiredCount,
      isComplete: approvals.length >= requiredCount || rejections.length > 0,
      isEscalated: request.status === 'escalated',
      deadline: request.deadline,
    };
  }
  
  async recordDecision(
    requestId: string,
    decision: ApprovalDecision
  ): Promise<void> {
    await this.db.insert(hitlDecisions).values({
      id: generateId('dec'),
      requestId,
      approverId: decision.approverId,
      approverRole: decision.approverRole,
      decision: decision.decision,
      reason: decision.reason,
      decidedAt: decision.decidedAt,
    });
    
    // Check if workflow is complete
    const status = await this.getStatus(requestId);
    if (status.isComplete) {
      await this.markComplete(requestId, status);
    }
    
    // Publish event
    await this.pubsub.publish('hitl.decision.recorded', {
      requestId,
      decision,
      status,
    });
  }
  
  async getPendingForApprover(
    approverId: UserID,
    ventureId: VentureID
  ): Promise<HITLRequest[]> {
    const approverRoles = await this.getApproverRoles(approverId, ventureId);
    
    return this.db.query.hitlRequests.findMany({
      where: and(
        eq(hitlRequests.ventureId, ventureId),
        eq(hitlRequests.status, 'pending'),
        // Complex filter for requiredApprovers containing approverRoles
      ),
      orderBy: asc(hitlRequests.deadline),
    });
  }
}
```

---

## Module: reasoning

### Purpose

The Reasoning module provides advanced reasoning capabilities including chain-of-thought, tree-of-thought, and other structured reasoning patterns.

### Reasoning Engine

```typescript
// @mcv/agentic-os/reasoning/engine.ts
export type ReasoningStrategy =
  | 'chain-of-thought'
  | 'tree-of-thought'
  | 'self-consistency'
  | 'decomposition'
  | 'analogical'
  | 'counterfactual';

export interface ReasoningConfig {
  strategy: ReasoningStrategy;
  maxDepth: number;
  branchingFactor: number;  // For tree-of-thought
  samplingCount: number;    // For self-consistency
  evaluationCriteria: EvaluationCriterion[];
}

export interface ReasoningResult {
  conclusion: string;
  confidence: number;
  reasoning: ReasoningStep[];
  alternativePaths?: ReasoningPath[];
  metadata: {
    strategy: ReasoningStrategy;
    tokenUsage: number;
    duration: number;
  };
}

export class ReasoningEngine {
  private model: ModelConfig;
  private evaluator: ReasoningEvaluator;
  
  constructor(model: ModelConfig) {
    this.model = model;
    this.evaluator = new ReasoningEvaluator();
  }
  
  async reason(
    problem: string,
    context: ReasoningContext,
    config: ReasoningConfig
  ): Promise<ReasoningResult> {
    switch (config.strategy) {
      case 'chain-of-thought':
        return this.chainOfThought(problem, context, config);
      case 'tree-of-thought':
        return this.treeOfThought(problem, context, config);
      case 'self-consistency':
        return this.selfConsistency(problem, context, config);
      case 'decomposition':
        return this.decomposition(problem, context, config);
      default:
        throw new ReasoningError(`Unknown strategy: ${config.strategy}`);
    }
  }
  
  private async chainOfThought(
    problem: string,
    context: ReasoningContext,
    config: ReasoningConfig
  ): Promise<ReasoningResult> {
    const prompt = `
Problem: ${problem}

Context:
${JSON.stringify(context, null, 2)}

Think through this step by step:
1. First, understand what is being asked
2. Identify the key factors and constraints
3. Consider possible approaches
4. Work through the most promising approach
5. Verify the solution
6. State your conclusion with confidence level

Format your response as:
STEP 1: [Understanding]
STEP 2: [Key factors]
STEP 3: [Possible approaches]
STEP 4: [Working through solution]
STEP 5: [Verification]
CONCLUSION: [Your answer]
CONFIDENCE: [0-100]%
`;

    const response = await this.llm.complete({
      model: this.model,
      messages: [
        { role: 'system', content: REASONING_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
    });
    
    return this.parseChainOfThoughtResponse(response);
  }
  
  private async treeOfThought(
    problem: string,
    context: ReasoningContext,
    config: ReasoningConfig
  ): Promise<ReasoningResult> {
    const root: ThoughtNode = {
      id: 'root',
      thought: problem,
      children: [],
      score: 0,
      depth: 0,
    };
    
    // BFS exploration
    const queue: ThoughtNode[] = [root];
    const explored: ThoughtNode[] = [];
    
    while (queue.length > 0 && explored.length < 100) {
      const node = queue.shift()!;
      
      if (node.depth >= config.maxDepth) {
        explored.push(node);
        continue;
      }
      
      // Generate child thoughts
      const children = await this.generateThoughts(
        node,
        context,
        config.branchingFactor
      );
      
      // Evaluate and score children
      for (const child of children) {
        child.score = await this.evaluator.evaluate(child, context, config.evaluationCriteria);
        node.children.push(child);
      }
      
      // Add top children to queue (beam search)
      const topChildren = children
        .sort((a, b) => b.score - a.score)
        .slice(0, config.branchingFactor);
      
      queue.push(...topChildren);
      explored.push(node);
    }
    
    // Find best path
    const bestPath = this.findBestPath(root);
    
    return {
      conclusion: bestPath[bestPath.length - 1].thought,
      confidence: bestPath[bestPath.length - 1].score,
      reasoning: bestPath.map(n => ({
        step: n.depth,
        thought: n.thought,
        score: n.score,
      })),
      alternativePaths: this.findAlternativePaths(root, bestPath),
      metadata: {
        strategy: 'tree-of-thought',
        tokenUsage: this.tokenCounter.count,
        duration: Date.now() - startTime,
      },
    };
  }
  
  private async selfConsistency(
    problem: string,
    context: ReasoningContext,
    config: ReasoningConfig
  ): Promise<ReasoningResult> {
    // Generate multiple independent reasoning paths
    const paths = await Promise.all(
      Array(config.samplingCount).fill(null).map(() =>
        this.chainOfThought(problem, context, {
          ...config,
          strategy: 'chain-of-thought',
        })
      )
    );
    
    // Aggregate conclusions
    const conclusionCounts = new Map<string, number>();
    for (const path of paths) {
      const normalized = this.normalizeConclusion(path.conclusion);
      conclusionCounts.set(
        normalized,
        (conclusionCounts.get(normalized) ?? 0) + 1
      );
    }
    
    // Find majority conclusion
    const [majorityConclusion, count] = Array.from(conclusionCounts.entries())
      .sort((a, b) => b[1] - a[1])[0];
    
    const confidence = count / config.samplingCount;
    
    return {
      conclusion: majorityConclusion,
      confidence,
      reasoning: paths.map(p => p.reasoning).flat(),
      alternativePaths: paths.filter(p => 
        this.normalizeConclusion(p.conclusion) !== majorityConclusion
      ).map(p => ({ steps: p.reasoning })),
      metadata: {
        strategy: 'self-consistency',
        tokenUsage: paths.reduce((sum, p) => sum + p.metadata.tokenUsage, 0),
        duration: Date.now() - startTime,
      },
    };
  }
  
  private async generateThoughts(
    parent: ThoughtNode,
    context: ReasoningContext,
    count: number
  ): Promise<ThoughtNode[]> {
    const prompt = `
Current thought: ${parent.thought}

Context:
${JSON.stringify(context, null, 2)}

Generate ${count} distinct next thoughts that could follow from the current thought.
Each thought should explore a different direction or approach.

Format as JSON array:
[
  { "thought": "...", "rationale": "..." },
  ...
]
`;

    const response = await this.llm.complete({
      model: this.model,
      messages: [
        { role: 'system', content: THOUGHT_GENERATION_PROMPT },
        { role: 'user', content: prompt },
      ],
      responseFormat: { type: 'json_array' },
    });
    
    const thoughts = JSON.parse(response);
    
    return thoughts.map((t: any, i: number) => ({
      id: `${parent.id}-${i}`,
      thought: t.thought,
      rationale: t.rationale,
      children: [],
      score: 0,
      depth: parent.depth + 1,
      parent,
    }));
  }
}
```

### Chain of Thought

```typescript
// @mcv/agentic-os/reasoning/cot.ts
export class ChainOfThought {
  async generateSteps(
    problem: string,
    context: Record<string, unknown>
  ): Promise<ThoughtStep[]> {
    const steps: ThoughtStep[] = [];
    let currentThought = problem;
    
    while (steps.length < 10) {
      const nextStep = await this.generateNextStep(currentThought, steps, context);
      
      if (nextStep.isConclusion) {
        steps.push(nextStep);
        break;
      }
      
      steps.push(nextStep);
      currentThought = nextStep.thought;
    }
    
    return steps;
  }
  
  private async generateNextStep(
    currentThought: string,
    previousSteps: ThoughtStep[],
    context: Record<string, unknown>
  ): Promise<ThoughtStep> {
    const prompt = `
Current state: ${currentThought}

Previous reasoning:
${previousSteps.map((s, i) => `${i + 1}. ${s.thought}`).join('\n')}

What is the next logical step in solving this problem?
If you have reached a conclusion, indicate so.

Response format:
{
  "thought": "Your next thought",
  "reasoning": "Why this follows from the previous step",
  "isConclusion": true/false
}
`;

    const response = await this.llm.complete({
      model: 'claude-sonnet',
      messages: [{ role: 'user', content: prompt }],
      responseFormat: ThoughtStepSchema,
    });
    
    return ThoughtStepSchema.parse(response);
  }
}
```

---

## Module: memory

### Purpose

The Memory module provides persistent storage and retrieval of agent experiences, learnings, and contextual information.

### Memory Store

```typescript
// @mcv/agentic-os/memory/store.ts
export interface MemoryEntry {
  id: string;
  agentId: string;
  type: MemoryType;
  content: unknown;
  embedding: number[];
  importance: number;
  accessCount: number;
  lastAccessed: Timestamp;
  createdAt: Timestamp;
  expiresAt?: Timestamp;
  tags: string[];
  metadata: Record<string, unknown>;
}

export type MemoryType =
  | 'episodic'     // Specific experiences/events
  | 'semantic'     // Facts and knowledge
  | 'procedural'   // How to do things
  | 'working';     // Short-term context

export interface MemoryQuery {
  agentId: string;
  query: string;
  types?: MemoryType[];
  tags?: string[];
  limit?: number;
  minImportance?: number;
  recencyBias?: number;  // 0-1, how much to favor recent memories
}

export class MemoryStore {
  private vectorStore: VectorStore;
  private db: Database;
  
  async store(entry: Omit<MemoryEntry, 'id' | 'embedding'>): Promise<string> {
    // Generate embedding
    const embedding = await this.embed(entry.content);
    
    const id = generateId('mem');
    
    // Store in vector store
    await this.vectorStore.upsert({
      id,
      values: embedding,
      metadata: {
        agentId: entry.agentId,
        type: entry.type,
        importance: entry.importance,
        tags: entry.tags,
        createdAt: entry.createdAt.toISOString(),
      },
    });
    
    // Store full entry in database
    await this.db.insert(memories).values({
      id,
      ...entry,
      embedding,
    });
    
    return id;
  }
  
  async retrieve(query: MemoryQuery): Promise<MemoryEntry[]> {
    // Generate query embedding
    const queryEmbedding = await this.embed(query.query);
    
    // Search vector store
    const results = await this.vectorStore.query({
      vector: queryEmbedding,
      topK: (query.limit ?? 10) * 2,  // Fetch extra for filtering
      filter: {
        agentId: query.agentId,
        type: query.types ? { $in: query.types } : undefined,
        tags: query.tags ? { $containsAny: query.tags } : undefined,
        importance: query.minImportance ? { $gte: query.minImportance } : undefined,
      },
    });
    
    // Fetch full entries
    const memories = await this.db.query.memories.findMany({
      where: inArray(memories.id, results.matches.map(m => m.id)),
    });
    
    // Apply recency bias and re-rank
    const ranked = this.rankWithRecency(
      memories,
      results.matches,
      query.recencyBias ?? 0.3
    );
    
    // Update access counts
    await this.updateAccessCounts(ranked.slice(0, query.limit));
    
    return ranked.slice(0, query.limit);
  }
  
  private rankWithRecency(
    memories: MemoryEntry[],
    vectorResults: VectorMatch[],
    recencyBias: number
  ): MemoryEntry[] {
    const now = Date.now();
    const maxAge = 30 * 24 * 60 * 60 * 1000;  // 30 days
    
    return memories
      .map(mem => {
        const vectorMatch = vectorResults.find(r => r.id === mem.id)!;
        const age = now - mem.createdAt.getTime();
        const recencyScore = Math.max(0, 1 - age / maxAge);
        
        const combinedScore = 
          vectorMatch.score * (1 - recencyBias) +
          recencyScore * recencyBias;
        
        return { ...mem, score: combinedScore };
      })
      .sort((a, b) => b.score - a.score);
  }
  
  async consolidate(agentId: string): Promise<void> {
    // Find related episodic memories
    const episodic = await this.db.query.memories.findMany({
      where: and(
        eq(memories.agentId, agentId),
        eq(memories.type, 'episodic'),
        gt(memories.accessCount, 3),
      ),
    });
    
    // Cluster similar memories
    const clusters = await this.clusterMemories(episodic);
    
    // Generate semantic memories from clusters
    for (const cluster of clusters) {
      if (cluster.memories.length >= 3) {
        const semantic = await this.synthesizeSemantic(cluster);
        await this.store({
          agentId,
          type: 'semantic',
          content: semantic,
          importance: cluster.averageImportance,
          accessCount: 0,
          lastAccessed: new Date(),
          createdAt: new Date(),
          tags: this.extractCommonTags(cluster.memories),
          metadata: { sourceMemories: cluster.memories.map(m => m.id) },
        });
      }
    }
  }
  
  async forget(criteria: ForgetCriteria): Promise<number> {
    const toDelete = await this.db.query.memories.findMany({
      where: and(
        eq(memories.agentId, criteria.agentId),
        criteria.olderThan ? lt(memories.createdAt, criteria.olderThan) : undefined,
        criteria.minImportance ? lt(memories.importance, criteria.minImportance) : undefined,
        criteria.types ? inArray(memories.type, criteria.types) : undefined,
      ),
    });
    
    // Delete from vector store
    await this.vectorStore.delete(toDelete.map(m => m.id));
    
    // Delete from database
    await this.db.delete(memories).where(
      inArray(memories.id, toDelete.map(m => m.id))
    );
    
    return toDelete.length;
  }
}
```

### Episodic Memory

```typescript
// @mcv/agentic-os/memory/episodic.ts
export interface Episode {
  id: string;
  agentId: string;
  type: EpisodeType;
  summary: string;
  events: EpisodeEvent[];
  outcome: EpisodeOutcome;
  learnings: string[];
  importance: number;
  emotionalValence: number;  // -1 to 1
  startedAt: Timestamp;
  endedAt: Timestamp;
}

export type EpisodeType =
  | 'task_execution'
  | 'user_interaction'
  | 'error_recovery'
  | 'learning_moment';

export interface EpisodeEvent {
  timestamp: Timestamp;
  type: string;
  description: string;
  data?: unknown;
}

export interface EpisodeOutcome {
  success: boolean;
  result?: unknown;
  error?: string;
  feedback?: string;
}

export class EpisodicMemory {
  private store: MemoryStore;
  private currentEpisode: Episode | null = null;
  
  startEpisode(agentId: string, type: EpisodeType): string {
    const id = generateId('ep');
    
    this.currentEpisode = {
      id,
      agentId,
      type,
      summary: '',
      events: [],
      outcome: { success: false },
      learnings: [],
      importance: 0.5,
      emotionalValence: 0,
      startedAt: new Date(),
      endedAt: new Date(),
    };
    
    return id;
  }
  
  addEvent(event: Omit<EpisodeEvent, 'timestamp'>): void {
    if (!this.currentEpisode) {
      throw new MemoryError('No active episode');
    }
    
    this.currentEpisode.events.push({
      ...event,
      timestamp: new Date(),
    });
  }
  
  async endEpisode(outcome: EpisodeOutcome): Promise<Episode> {
    if (!this.currentEpisode) {
      throw new MemoryError('No active episode');
    }
    
    this.currentEpisode.outcome = outcome;
    this.currentEpisode.endedAt = new Date();
    
    // Generate summary and learnings
    const analysis = await this.analyzeEpisode(this.currentEpisode);
    this.currentEpisode.summary = analysis.summary;
    this.currentEpisode.learnings = analysis.learnings;
    this.currentEpisode.importance = analysis.importance;
    this.currentEpisode.emotionalValence = analysis.emotionalValence;
    
    // Store in memory
    await this.store.store({
      agentId: this.currentEpisode.agentId,
      type: 'episodic',
      content: this.currentEpisode,
      importance: this.currentEpisode.importance,
      accessCount: 0,
      lastAccessed: new Date(),
      createdAt: new Date(),
      tags: this.extractTags(this.currentEpisode),
      metadata: { episodeType: this.currentEpisode.type },
    });
    
    const episode = this.currentEpisode;
    this.currentEpisode = null;
    
    return episode;
  }
  
  private async analyzeEpisode(episode: Episode): Promise<{
    summary: string;
    learnings: string[];
    importance: number;
    emotionalValence: number;
  }> {
    const prompt = `
Analyze this agent episode:

Type: ${episode.type}
Events:
${episode.events.map(e => `- ${e.timestamp}: ${e.description}`).join('\n')}

Outcome: ${episode.outcome.success ? 'Success' : 'Failure'}
${episode.outcome.error ? `Error: ${episode.outcome.error}` : ''}
${episode.outcome.feedback ? `Feedback: ${episode.outcome.feedback}` : ''}

Provide:
1. A brief summary (1-2 sentences)
2. Key learnings (what should be remembered for future)
3. Importance score (0-1)
4. Emotional valence (-1 negative to 1 positive)

Format as JSON.
`;

    const response = await this.llm.complete({
      model: 'claude-sonnet',
      messages: [{ role: 'user', content: prompt }],
      responseFormat: EpisodeAnalysisSchema,
    });
    
    return EpisodeAnalysisSchema.parse(response);
  }
}
```

### Semantic Memory

```typescript
// @mcv/agentic-os/memory/semantic.ts
export interface SemanticFact {
  id: string;
  agentId: string;
  subject: string;
  predicate: string;
  object: string;
  confidence: number;
  sources: string[];
  validFrom?: Timestamp;
  validUntil?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export class SemanticMemory {
  private store: MemoryStore;
  private knowledgeGraph: KnowledgeGraph;
  
  async addFact(fact: Omit<SemanticFact, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = generateId('fact');
    
    // Check for contradictions
    const contradictions = await this.findContradictions(fact);
    if (contradictions.length > 0) {
      await this.resolveContradictions(fact, contradictions);
    }
    
    // Store in knowledge graph
    await this.knowledgeGraph.addTriple(
      fact.subject,
      fact.predicate,
      fact.object,
      { confidence: fact.confidence, sources: fact.sources }
    );
    
    // Store in memory
    await this.store.store({
      agentId: fact.agentId,
      type: 'semantic',
      content: fact,
      importance: fact.confidence,
      accessCount: 0,
      lastAccessed: new Date(),
      createdAt: new Date(),
      tags: [fact.subject, fact.predicate, fact.object],
      metadata: { factType: 'triple' },
    });
    
    return id;
  }
  
  async query(
    agentId: string,
    query: string
  ): Promise<SemanticFact[]> {
    // Try structured query first
    const structuredQuery = await this.parseQuery(query);
    
    if (structuredQuery) {
      return this.knowledgeGraph.query(structuredQuery);
    }
    
    // Fall back to semantic search
    const memories = await this.store.retrieve({
      agentId,
      query,
      types: ['semantic'],
      limit: 10,
    });
    
    return memories.map(m => m.content as SemanticFact);
  }
  
  async inferFacts(agentId: string): Promise<SemanticFact[]> {
    // Get existing facts
    const facts = await this.getAllFacts(agentId);
    
    // Apply inference rules
    const inferred: SemanticFact[] = [];
    
    for (const rule of INFERENCE_RULES) {
      const matches = this.matchRule(rule, facts);
      for (const match of matches) {
        const newFact = this.applyRule(rule, match);
        if (!this.factExists(newFact, facts) && !this.factExists(newFact, inferred)) {
          inferred.push(newFact);
        }
      }
    }
    
    // Store inferred facts
    for (const fact of inferred) {
      await this.addFact(fact);
    }
    
    return inferred;
  }
  
  private async findContradictions(
    newFact: Omit<SemanticFact, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<SemanticFact[]> {
    // Find facts with same subject and predicate but different object
    return this.knowledgeGraph.query({
      subject: newFact.subject,
      predicate: newFact.predicate,
      object: { $ne: newFact.object },
    });
  }
  
  private async resolveContradictions(
    newFact: Omit<SemanticFact, 'id' | 'createdAt' | 'updatedAt'>,
    contradictions: SemanticFact[]
  ): Promise<void> {
    for (const existing of contradictions) {
      // Compare confidence and recency
      if (newFact.confidence > existing.confidence) {
        // New fact wins - mark old as invalid
        await this.knowledgeGraph.updateTriple(
          existing.subject,
          existing.predicate,
          existing.object,
          { validUntil: new Date() }
        );
      } else {
        // Existing fact wins - don't add new fact
        throw new ContradictionError(
          `Fact contradicts existing knowledge with higher confidence`,
          { newFact, existing }
        );
      }
    }
  }
}

const INFERENCE_RULES = [
  {
    name: 'transitivity',
    pattern: [
      { subject: '?A', predicate: 'is_a', object: '?B' },
      { subject: '?B', predicate: 'is_a', object: '?C' },
    ],
    conclusion: { subject: '?A', predicate: 'is_a', object: '?C' },
  },
  {
    name: 'inheritance',
    pattern: [
      { subject: '?A', predicate: 'is_a', object: '?B' },
      { subject: '?B', predicate: 'has_property', object: '?P' },
    ],
    conclusion: { subject: '?A', predicate: 'has_property', object: '?P' },
  },
];
```

---

## Module: prompts

### Purpose

The Prompts module manages the prompt engineering infrastructure, including the instrument bank, prompt chains, and versioned prompt templates.

### Prompt Bank

```typescript
// @mcv/agentic-os/prompts/bank.ts
export interface PromptTemplate {
  id: string;
  name: string;
  version: string;
  category: PromptCategory;
  description: string;
  template: string;
  variables: PromptVariable[];
  examples: PromptExample[];
  metadata: {
    author: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    usageCount: number;
    averageRating: number;
    tags: string[];
  };
  constraints: {
    maxTokens?: number;
    requiredCapabilities?: AgentCapability[];
    allowedModels?: string[];
  };
}

export type PromptCategory =
  | 'system'
  | 'task'
  | 'reasoning'
  | 'formatting'
  | 'safety'
  | 'persona'
  | 'tool_use';

export interface PromptVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  default?: unknown;
  validation?: z.ZodSchema;
}

export interface PromptExample {
  input: Record<string, unknown>;
  output: string;
  notes?: string;
}

export class PromptBank {
  private templates: Map<string, PromptTemplate> = new Map();
  private versionHistory: Map<string, PromptTemplate[]> = new Map();
  
  async register(template: Omit<PromptTemplate, 'id'>): Promise<string> {
    const id = generateId('pmt');
    
    const fullTemplate: PromptTemplate = {
      ...template,
      id,
      metadata: {
        ...template.metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0,
        averageRating: 0,
      },
    };
    
    this.templates.set(id, fullTemplate);
    
    // Track version history
    const history = this.versionHistory.get(template.name) ?? [];
    history.push(fullTemplate);
    this.versionHistory.set(template.name, history);
    
    return id;
  }
  
  async getTemplate(
    nameOrId: string,
    version?: string
  ): Promise<PromptTemplate> {
    // Try by ID first
    if (this.templates.has(nameOrId)) {
      return this.templates.get(nameOrId)!;
    }
    
    // Try by name
    const history = this.versionHistory.get(nameOrId);
    if (!history || history.length === 0) {
      throw new NotFoundError('Prompt template', nameOrId);
    }
    
    if (version) {
      const specific = history.find(t => t.version === version);
      if (!specific) {
        throw new NotFoundError('Prompt template version', `${nameOrId}@${version}`);
      }
      return specific;
    }
    
    // Return latest
    return history[history.length - 1];
  }
  
  async render(
    nameOrId: string,
    variables: Record<string, unknown>,
    options?: { version?: string }
  ): Promise<string> {
    const template = await this.getTemplate(nameOrId, options?.version);
    
    // Validate variables
    for (const variable of template.variables) {
      const value = variables[variable.name];
      
      if (value === undefined) {
        if (variable.required) {
          throw new ValidationError(`Missing required variable: ${variable.name}`);
        }
        variables[variable.name] = variable.default;
      }
      
      if (variable.validation && value !== undefined) {
        variable.validation.parse(value);
      }
    }
    
    // Render template
    let rendered = template.template;
    
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      const stringValue = typeof value === 'object' 
        ? JSON.stringify(value, null, 2) 
        : String(value);
      rendered = rendered.replaceAll(placeholder, stringValue);
    }
    
    // Update usage count
    template.metadata.usageCount++;
    
    return rendered;
  }
  
  async search(query: {
    category?: PromptCategory;
    tags?: string[];
    text?: string;
  }): Promise<PromptTemplate[]> {
    let results = Array.from(this.templates.values());
    
    if (query.category) {
      results = results.filter(t => t.category === query.category);
    }
    
    if (query.tags && query.tags.length > 0) {
      results = results.filter(t => 
        query.tags!.some(tag => t.metadata.tags.includes(tag))
      );
    }
    
    if (query.text) {
      const searchText = query.text.toLowerCase();
      results = results.filter(t =>
        t.name.toLowerCase().includes(searchText) ||
        t.description.toLowerCase().includes(searchText) ||
        t.template.toLowerCase().includes(searchText)
      );
    }
    
    return results.sort((a, b) => b.metadata.usageCount - a.metadata.usageCount);
  }
}

// Core system prompts
export const CORE_PROMPTS: Omit<PromptTemplate, 'id'>[] = [
  {
    name: 'queen_system',
    version: '1.0.0',
    category: 'system',
    description: 'System prompt for the Queen orchestrator',
    template: `You are Queen, the strategic orchestrator of the MCV.ONE agentic operating system.

Your role: Analyze requests, decompose into tasks, and delegate to Ralph pods.
You NEVER execute tasks directly - you plan and delegate.

Available Ralph pods:
{{available_pods}}

Current context:
- Venture: {{venture_name}}
- User: {{user_name}}
- Time: {{current_time}}

Constraints:
- Maximum concurrent tasks: {{max_concurrent}}
- Task timeout: {{task_timeout}}

When responding:
1. Analyze the request thoroughly
2. Identify required capabilities
3. Decompose into atomic tasks
4. Assign to appropriate Ralph pods
5. Flag anything requiring human approval`,
    variables: [
      { name: 'available_pods', type: 'string', required: true, description: 'List of available Ralph pods' },
      { name: 'venture_name', type: 'string', required: true, description: 'Current venture name' },
      { name: 'user_name', type: 'string', required: false, default: 'Unknown', description: 'User name' },
      { name: 'current_time', type: 'string', required: true, description: 'Current timestamp' },
      { name: 'max_concurrent', type: 'number', required: false, default: 10, description: 'Max concurrent tasks' },
      { name: 'task_timeout', type: 'string', required: false, default: '30m', description: 'Task timeout' },
    ],
    examples: [],
    metadata: {
      author: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0,
      averageRating: 0,
      tags: ['queen', 'orchestration', 'system'],
    },
    constraints: {
      allowedModels: ['claude-opus', 'claude-sonnet', 'gpt-4'],
    },
  },
  {
    name: 'ralph_smith_system',
    version: '1.0.0',
    category: 'system',
    description: 'System prompt for Ralph Smith (development pod)',
    template: `You are Smith, the engineering Ralph pod in the MCV.ONE agentic system.

Specialization: Software development, code generation, debugging, deployments

Available instruments:
{{instruments}}

Guidelines:
- Write clean, well-documented code
- Follow the venture's coding standards
- Test your changes before reporting completion
- Use git for all code changes
- Never commit directly to main/master

Current task context:
{{task_context}}

When complete, report:
1. What was done
2. Files changed
3. Tests run
4. Any issues encountered`,
    variables: [
      { name: 'instruments', type: 'string', required: true, description: 'Available instruments' },
      { name: 'task_context', type: 'string', required: true, description: 'Current task context' },
    ],
    examples: [],
    metadata: {
      author: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0,
      averageRating: 0,
      tags: ['ralph', 'smith', 'development', 'system'],
    },
    constraints: {
      requiredCapabilities: ['read', 'write', 'execute'],
    },
  },
];
```

### Prompt Chains

```typescript
// @mcv/agentic-os/prompts/chains.ts
export interface PromptChain {
  id: string;
  name: string;
  description: string;
  steps: ChainStep[];
  errorHandling: ErrorHandlingStrategy;
}

export interface ChainStep {
  id: string;
  name: string;
  promptTemplate: string;
  inputMapping: InputMapping[];
  outputKey: string;
  conditions?: StepCondition[];
  retryPolicy?: RetryPolicy;
}

export interface InputMapping {
  source: 'initial' | 'step';
  sourceKey: string;
  targetKey: string;
  transform?: (value: unknown) => unknown;
}

export interface StepCondition {
  type: 'value_check' | 'step_result' | 'custom';
  config: Record<string, unknown>;
}

export class PromptChainExecutor {
  private bank: PromptBank;
  
  async execute(
    chain: PromptChain,
    initialInput: Record<string, unknown>,
    context: ExecutionContext
  ): Promise<ChainResult> {
    const results: Map<string, unknown> = new Map();
    results.set('initial', initialInput);
    
    for (const step of chain.steps) {
      // Check conditions
      if (step.conditions && !this.checkConditions(step.conditions, results)) {
        continue;
      }
      
      try {
        // Build step input
        const stepInput = this.buildStepInput(step.inputMapping, results);
        
        // Render prompt
        const prompt = await this.bank.render(step.promptTemplate, stepInput);
        
        // Execute
        const output = await this.executeStep(prompt, context);
        
        // Store result
        results.set(step.id, output);
        
      } catch (error) {
        if (step.retryPolicy) {
          const retryResult = await this.retryStep(step, results, context);
          results.set(step.id, retryResult);
        } else {
          throw new ChainExecutionError(`Step '${step.name}' failed`, { step, error });
        }
      }
    }
    
    return {
      success: true,
      results: Object.fromEntries(results),
      finalOutput: results.get(chain.steps[chain.steps.length - 1].id),
    };
  }
  
  private buildStepInput(
    mappings: InputMapping[],
    results: Map<string, unknown>
  ): Record<string, unknown> {
    const input: Record<string, unknown> = {};
    
    for (const mapping of mappings) {
      const source = mapping.source === 'initial'
        ? results.get('initial')
        : results.get(mapping.sourceKey);
      
      let value = (source as Record<string, unknown>)?.[mapping.sourceKey];
      
      if (mapping.transform) {
        value = mapping.transform(value);
      }
      
      input[mapping.targetKey] = value;
    }
    
    return input;
  }
  
  private async executeStep(
    prompt: string,
    context: ExecutionContext
  ): Promise<unknown> {
    const response = await context.llm.complete({
      messages: [{ role: 'user', content: prompt }],
    });
    
    return response.content;
  }
  
  private checkConditions(
    conditions: StepCondition[],
    results: Map<string, unknown>
  ): boolean {
    for (const condition of conditions) {
      switch (condition.type) {
        case 'value_check':
          const value = results.get(condition.config.stepId as string);
          if (value !== condition.config.expectedValue) {
            return false;
          }
          break;
          
        case 'step_result':
          if (!results.has(condition.config.requiredStep as string)) {
            return false;
          }
          break;
      }
    }
    
    return true;
  }
}
```

---

## Module: scouts

### Purpose

The Scouts module provides autonomous monitoring agents that observe system behavior, collect data, and detect anomalies without taking action.

### Scout Network

```typescript
// @mcv/agentic-os/scouts/network.ts
export interface Scout {
  id: string;
  name: string;
  type: ScoutType;
  target: ScoutTarget;
  schedule: ScoutSchedule;
  config: ScoutConfig;
  status: 'active' | 'paused' | 'error';
  lastRun?: Timestamp;
  nextRun?: Timestamp;
}

export type ScoutType =
  | 'health'        // System health monitoring
  | 'performance'   // Performance metrics
  | 'security'      // Security scanning
  | 'compliance'    // Compliance checking
  | 'cost'          // Cost monitoring
  | 'quality'       // Quality metrics
  | 'custom';

export interface ScoutTarget {
  type: 'system' | 'venture' | 'agent' | 'service' | 'external';
  identifier: string;
  scope?: Record<string, unknown>;
}

export interface ScoutSchedule {
  type: 'cron' | 'interval' | 'event';
  expression: string;  // Cron expression or interval like "5m"
  timezone?: string;
}

export interface ScoutConfig {
  collectors: CollectorConfig[];
  thresholds: ThresholdConfig[];
  alertRules: AlertRule[];
}

export class ScoutNetwork {
  private scouts: Map<string, Scout> = new Map();
  private scheduler: ScoutScheduler;
  private alertManager: AlertManager;
  
  async deployScout(config: Omit<Scout, 'id' | 'status'>): Promise<string> {
    const id = generateId('sct');
    
    const scout: Scout = {
      ...config,
      id,
      status: 'active',
    };
    
    this.scouts.set(id, scout);
    
    // Schedule scout runs
    await this.scheduler.schedule(scout);
    
    return id;
  }
  
  async runScout(scoutId: string): Promise<ScoutReport> {
    const scout = this.scouts.get(scoutId);
    if (!scout) {
      throw new NotFoundError('Scout', scoutId);
    }
    
    const startTime = Date.now();
    const observations: Observation[] = [];
    const anomalies: Anomaly[] = [];
    
    try {
      // Run collectors
      for (const collector of scout.config.collectors) {
        const data = await this.runCollector(collector, scout.target);
        observations.push(...data);
      }
      
      // Check thresholds
      for (const observation of observations) {
        const threshold = scout.config.thresholds.find(
          t => t.metric === observation.metric
        );
        
        if (threshold && this.exceedsThreshold(observation, threshold)) {
          anomalies.push({
            id: generateId('anm'),
            scoutId,
            observation,
            threshold,
            severity: this.determineSeverity(observation, threshold),
            detectedAt: new Date(),
          });
        }
      }
      
      // Process alerts
      for (const anomaly of anomalies) {
        await this.processAlerts(scout, anomaly);
      }
      
      // Update scout state
      scout.lastRun = new Date();
      scout.status = 'active';
      
      return {
        scoutId,
        runAt: new Date(),
        duration: Date.now() - startTime,
        observationCount: observations.length,
        anomalyCount: anomalies.length,
        observations,
        anomalies,
      };
      
    } catch (error) {
      scout.status = 'error';
      throw error;
    }
  }
  
  private async runCollector(
    collector: CollectorConfig,
    target: ScoutTarget
  ): Promise<Observation[]> {
    switch (collector.type) {
      case 'metrics':
        return this.collectMetrics(collector, target);
      case 'logs':
        return this.collectLogs(collector, target);
      case 'api':
        return this.collectFromAPI(collector, target);
      case 'database':
        return this.collectFromDatabase(collector, target);
      default:
        throw new ScoutError(`Unknown collector type: ${collector.type}`);
    }
  }
  
  private async collectMetrics(
    collector: CollectorConfig,
    target: ScoutTarget
  ): Promise<Observation[]> {
    const metrics = await this.metricsClient.query({
      target: target.identifier,
      metrics: collector.metrics,
      timeRange: collector.timeRange ?? '5m',
    });
    
    return metrics.map(m => ({
      metric: m.name,
      value: m.value,
      unit: m.unit,
      timestamp: m.timestamp,
      dimensions: m.dimensions,
    }));
  }
  
  private exceedsThreshold(
    observation: Observation,
    threshold: ThresholdConfig
  ): boolean {
    const value = observation.value as number;
    
    switch (threshold.operator) {
      case 'gt': return value > threshold.value;
      case 'gte': return value >= threshold.value;
      case 'lt': return value < threshold.value;
      case 'lte': return value <= threshold.value;
      case 'eq': return value === threshold.value;
      case 'ne': return value !== threshold.value;
      case 'between':
        return value >= threshold.min! && value <= threshold.max!;
      case 'outside':
        return value < threshold.min! || value > threshold.max!;
      default:
        return false;
    }
  }
  
  private determineSeverity(
    observation: Observation,
    threshold: ThresholdConfig
  ): Severity {
    const value = observation.value as number;
    const thresholdValue = threshold.value;
    const deviation = Math.abs(value - thresholdValue) / thresholdValue;
    
    if (deviation > 0.5) return 'critical';
    if (deviation > 0.3) return 'high';
    if (deviation > 0.15) return 'medium';
    return 'low';
  }
  
  private async processAlerts(scout: Scout, anomaly: Anomaly): Promise<void> {
    for (const rule of scout.config.alertRules) {
      if (this.matchesAlertRule(anomaly, rule)) {
        await this.alertManager.send({
          scoutId: scout.id,
          scoutName: scout.name,
          anomaly,
          rule,
          timestamp: new Date(),
        });
      }
    }
  }
}
```

### Anomaly Detector

```typescript
// @mcv/agentic-os/scouts/anomaly.ts
export interface AnomalyDetectorConfig {
  algorithm: AnomalyAlgorithm;
  sensitivity: number;  // 0-1
  windowSize: number;   // Number of data points
  seasonality?: SeasonalityConfig;
}

export type AnomalyAlgorithm =
  | 'zscore'
  | 'iqr'
  | 'isolation_forest'
  | 'prophet'
  | 'lstm';

export class AnomalyDetector {
  private config: AnomalyDetectorConfig;
  private history: DataPoint[] = [];
  
  constructor(config: AnomalyDetectorConfig) {
    this.config = config;
  }
  
  addDataPoint(point: DataPoint): void {
    this.history.push(point);
    
    // Maintain window size
    if (this.history.length > this.config.windowSize) {
      this.history.shift();
    }
  }
  
  async detect(point: DataPoint): Promise<AnomalyResult | null> {
    this.addDataPoint(point);
    
    if (this.history.length < this.config.windowSize * 0.5) {
      // Not enough data
      return null;
    }
    
    switch (this.config.algorithm) {
      case 'zscore':
        return this.detectZScore(point);
      case 'iqr':
        return this.detectIQR(point);
      case 'isolation_forest':
        return this.detectIsolationForest(point);
      case 'prophet':
        return this.detectProphet(point);
      default:
        throw new AnomalyError(`Unknown algorithm: ${this.config.algorithm}`);
    }
  }
  
  private detectZScore(point: DataPoint): AnomalyResult | null {
    const values = this.history.map(p => p.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
    );
    
    if (stdDev === 0) return null;
    
    const zScore = (point.value - mean) / stdDev;
    const threshold = 3 - (this.config.sensitivity * 2);  // 1-3 based on sensitivity
    
    if (Math.abs(zScore) > threshold) {
      return {
        isAnomaly: true,
        score: Math.abs(zScore),
        expectedValue: mean,
        expectedRange: { min: mean - threshold * stdDev, max: mean + threshold * stdDev },
        direction: zScore > 0 ? 'high' : 'low',
        confidence: Math.min(1, Math.abs(zScore) / 5),
      };
    }
    
    return null;
  }
  
  private detectIQR(point: DataPoint): AnomalyResult | null {
    const sorted = [...this.history.map(p => p.value)].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    
    const multiplier = 1.5 + (1 - this.config.sensitivity) * 1.5;  // 1.5-3 based on sensitivity
    const lowerBound = q1 - multiplier * iqr;
    const upperBound = q3 + multiplier * iqr;
    
    if (point.value < lowerBound || point.value > upperBound) {
      const median = sorted[Math.floor(sorted.length / 2)];
      return {
        isAnomaly: true,
        score: point.value < lowerBound 
          ? (lowerBound - point.value) / iqr
          : (point.value - upperBound) / iqr,
        expectedValue: median,
        expectedRange: { min: lowerBound, max: upperBound },
        direction: point.value < lowerBound ? 'low' : 'high',
        confidence: 0.8,
      };
    }
    
    return null;
  }
  
  private async detectIsolationForest(point: DataPoint): Promise<AnomalyResult | null> {
    // Use ML model for isolation forest
    const features = this.extractFeatures(point);
    const score = await this.mlModel.predict('isolation_forest', features);
    
    const threshold = 0.5 + (this.config.sensitivity * 0.3);
    
    if (score > threshold) {
      return {
        isAnomaly: true,
        score,
        confidence: score,
        direction: 'unknown',
      };
    }
    
    return null;
  }
  
  private extractFeatures(point: DataPoint): number[] {
    const values = this.history.map(p => p.value);
    const recent = values.slice(-10);
    
    return [
      point.value,
      this.mean(values),
      this.stdDev(values),
      this.mean(recent),
      this.stdDev(recent),
      point.value - this.mean(values),
      Math.abs(point.value - values[values.length - 1]),
    ];
  }
  
  private mean(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
  
  private stdDev(values: number[]): number {
    const m = this.mean(values);
    return Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - m, 2), 0) / values.length);
  }
}
```

### Monitor

```typescript
// @mcv/agentic-os/scouts/monitor.ts
export interface MonitorConfig {
  name: string;
  target: MonitorTarget;
  checks: HealthCheck[];
  interval: number;
  timeout: number;
  consecutiveFailures: number;
  notifications: NotificationConfig[];
}

export interface HealthCheck {
  name: string;
  type: 'http' | 'tcp' | 'database' | 'custom';
  config: Record<string, unknown>;
  expectedResult?: unknown;
}

export interface MonitorStatus {
  monitorId: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  lastCheck: Timestamp;
  consecutiveFailures: number;
  checks: CheckResult[];
  uptime: number;  // Percentage
}

export class Monitor {
  private config: MonitorConfig;
  private status: MonitorStatus;
  private checkHistory: CheckResult[] = [];
  
  constructor(config: MonitorConfig) {
    this.config = config;
    this.status = {
      monitorId: generateId('mon'),
      status: 'unknown',
      lastCheck: new Date(),
      consecutiveFailures: 0,
      checks: [],
      uptime: 100,
    };
  }
  
  async check(): Promise<MonitorStatus> {
    const results: CheckResult[] = [];
    
    for (const healthCheck of this.config.checks) {
      const result = await this.runCheck(healthCheck);
      results.push(result);
    }
    
    // Update status
    const allPassed = results.every(r => r.passed);
    const anyPassed = results.some(r => r.passed);
    
    if (allPassed) {
      this.status.status = 'healthy';
      this.status.consecutiveFailures = 0;
    } else if (anyPassed) {
      this.status.status = 'degraded';
      this.status.consecutiveFailures++;
    } else {
      this.status.status = 'unhealthy';
      this.status.consecutiveFailures++;
    }
    
    this.status.lastCheck = new Date();
    this.status.checks = results;
    
    // Update history and uptime
    this.checkHistory.push(...results);
    this.updateUptime();
    
    // Send notifications if needed
    if (this.status.consecutiveFailures >= this.config.consecutiveFailures) {
      await this.notify();
    }
    
    return this.status;
  }
  
  private async runCheck(check: HealthCheck): Promise<CheckResult> {
    const startTime = Date.now();
    
    try {
      let result: unknown;
      
      switch (check.type) {
        case 'http':
          result = await this.httpCheck(check.config);
          break;
        case 'tcp':
          result = await this.tcpCheck(check.config);
          break;
        case 'database':
          result = await this.databaseCheck(check.config);
          break;
        case 'custom':
          result = await this.customCheck(check.config);
          break;
      }
      
      const passed = check.expectedResult 
        ? this.compareResult(result, check.expectedResult)
        : true;
      
      return {
        checkName: check.name,
        passed,
        duration: Date.now() - startTime,
        result,
        error: undefined,
        timestamp: new Date(),
      };
      
    } catch (error) {
      return {
        checkName: check.name,
        passed: false,
        duration: Date.now() - startTime,
        result: undefined,
        error: error.message,
        timestamp: new Date(),
      };
    }
  }
  
  private async httpCheck(config: Record<string, unknown>): Promise<unknown> {
    const response = await fetch(config.url as string, {
      method: (config.method as string) ?? 'GET',
      headers: config.headers as Record<string, string>,
      signal: AbortSignal.timeout(this.config.timeout),
    });
    
    return {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers),
    };
  }
  
  private async tcpCheck(config: Record<string, unknown>): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const socket = new net.Socket();
      
      socket.setTimeout(this.config.timeout);
      
      socket.connect(config.port as number, config.host as string, () => {
        socket.destroy();
        resolve({ connected: true });
      });
      
      socket.on('error', reject);
      socket.on('timeout', () => reject(new Error('Connection timeout')));
    });
  }
  
  private async databaseCheck(config: Record<string, unknown>): Promise<unknown> {
    const result = await db.execute(sql`SELECT 1 as health`);
    return { healthy: result.rows.length > 0 };
  }
  
  private updateUptime(): void {
    const recentChecks = this.checkHistory.slice(-1000);
    const successfulChecks = recentChecks.filter(c => c.passed).length;
    this.status.uptime = (successfulChecks / recentChecks.length) * 100;
  }
  
  private async notify(): Promise<void> {
    for (const notificationConfig of this.config.notifications) {
      await this.notificationService.send({
        type: 'monitor_alert',
        target: notificationConfig.target,
        data: {
          monitorName: this.config.name,
          status: this.status,
          message: `Monitor ${this.config.name} is ${this.status.status}`,
        },
      });
    }
  }
}
```

---

## Dependencies

### Internal Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@mcv/kernel` | workspace:* | Core primitives |
| `@mcv/gateway` | workspace:* | LLM interface |
| `@mcv/events` | workspace:* | Event streaming |
| `@mcv/intelligence` | workspace:* | AI utilities |
| `@mcv/cdp` | workspace:* | Customer data |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `zod` | ^3.22.x | Schema validation |
| `@pinecone-database/pinecone` | ^2.x | Vector storage |
| `bullmq` | ^5.x | Task queuing |
| `ioredis` | ^5.x | Redis client |
| `cron-parser` | ^4.x | Cron parsing |

---

## Package Exports

```typescript
// @mcv/agentic-os/index.ts

// NAOS Framework
export { NAOSAgent, AgentRegistry, Instrument } from './naos';
export type { AgentConfig, AgentCapability, InstrumentDefinition } from './naos';

// Queen Orchestrator
export { Queen, TaskPlanner, ResourceAllocator } from './queen';
export type { Task, TaskType, RalphPodType, ResourcePlan } from './queen';

// Ralph Swarm
export { RalphPod, SwarmDispatcher, WorkerPool } from './swarm';
export type { RalphPodConfig, TaskResult, ExecutionResult } from './swarm';
export { RALPH_PODS } from './swarm/ralph';

// HITL
export { HITLGateway, HITLQueue, ApprovalWorkflow } from './hitl';
export type { HITLRequest, HITLApproval, ApprovalDecision } from './hitl';

// Reasoning
export { ReasoningEngine, ChainOfThought } from './reasoning';
export type { ReasoningStrategy, ReasoningResult } from './reasoning';

// Memory
export { MemoryStore, EpisodicMemory, SemanticMemory } from './memory';
export type { MemoryEntry, MemoryType, Episode, SemanticFact } from './memory';

// Prompts
export { PromptBank, PromptChainExecutor } from './prompts';
export type { PromptTemplate, PromptChain } from './prompts';
export { CORE_PROMPTS } from './prompts/bank';

// Scouts
export { ScoutNetwork, AnomalyDetector, Monitor } from './scouts';
export type { Scout, ScoutType, Anomaly, MonitorStatus } from './scouts';
```

---

## Related Documentation

- [naos Module Details](./naos/MODULE.md)
- [queen Module Details](./queen/MODULE.md)
- [swarm Module Details](./swarm/MODULE.md)
- [hitl Module Details](./hitl/MODULE.md)
- [reasoning Module Details](./reasoning/MODULE.md)
- [memory Module Details](./memory/MODULE.md)
- [prompts Module Details](./prompts/MODULE.md)
- [scouts Module Details](./scouts/MODULE.md)

---

*@mcv/agentic-os — The Cognitive Layer of MCV.ONE*
