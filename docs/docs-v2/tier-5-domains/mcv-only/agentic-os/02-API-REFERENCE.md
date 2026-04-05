# @mcv/agentic-os — API Reference
## Complete API Documentation

**Package:** `@mcv/agentic-os`  
**Version:** 1.0.0

---

## Table of Contents

1. [NAOS API](#naos-api)
2. [Queen API](#queen-api)
3. [Swarm API](#swarm-api)
4. [HITL API](#hitl-api)
5. [Reasoning API](#reasoning-api)
6. [Memory API](#memory-api)
7. [Prompts API](#prompts-api)
8. [Scouts API](#scouts-api)

---

## NAOS API

### NAOSAgent

The base class for all agents in the NAOS framework.

#### Constructor

```typescript
new NAOSAgent(config: AgentConfig)
```

**Parameters:**
- `config.id` (string): Unique agent identifier
- `config.name` (string): Human-readable agent name
- `config.type` ('queen' | 'ralph' | 'scout' | 'specialist'): Agent type
- `config.description` (string): Agent description
- `config.capabilities` (AgentCapability[]): Agent capabilities
- `config.model` (ModelConfig): LLM configuration
- `config.instruments` (InstrumentConfig[]): Available instruments
- `config.memory` (MemoryConfig): Memory configuration
- `config.constraints` (AgentConstraints): Operational constraints

#### Methods

##### process(request: AgentRequest): Promise<AgentResponse>

Process an incoming request.

```typescript
const response = await agent.process({
  id: 'req_123',
  type: 'task',
  content: 'Generate a report',
  context: { ventureId: 'venture_123' },
  priority: 1,
});
```

**Returns:** `AgentResponse`
- `requestId` (string): Original request ID
- `status` ('success' | 'failed' | 'pending_hitl'): Response status
- `result` (unknown): Response data
- `reasoning` (string[]): Reasoning steps taken
- `tokensUsed` (number): Total tokens consumed
- `duration` (number): Processing time in ms

##### useInstrument(name: string, params: unknown): Promise<unknown>

Execute a registered instrument.

```typescript
const result = await agent.useInstrument('database_query', {
  query: 'SELECT * FROM users WHERE id = $1',
  params: ['user_123'],
});
```

**Throws:** `AgentError` if instrument not found or capability missing

##### hasCapability(capability: AgentCapability): boolean

Check if agent has a specific capability.

```typescript
if (agent.hasCapability('financial')) {
  // Can perform financial operations
}
```

---

### AgentRegistry

Manages agent lifecycle and discovery.

#### Methods

##### register(config: AgentConfig): Promise<NAOSAgent>

Register a new agent.

```typescript
const agent = await registry.register({
  id: 'custom-agent',
  name: 'Custom Agent',
  type: 'specialist',
  capabilities: ['read', 'write'],
  // ...
});
```

##### getAgent(id: string): Promise<NAOSAgent>

Retrieve an active agent by ID.

```typescript
const agent = await registry.getAgent('ralph-smith');
```

**Throws:** `NotFoundError` if agent doesn't exist

##### findAgentsByCapability(capability: AgentCapability): Promise<NAOSAgent[]>

Find all active agents with a specific capability.

```typescript
const financialAgents = await registry.findAgentsByCapability('financial');
```

##### getAgentMetrics(id: string): Promise<AgentMetrics>

Get performance metrics for an agent.

```typescript
const metrics = await registry.getAgentMetrics('ralph-smith');
// {
//   totalRequests: 1523,
//   successfulRequests: 1498,
//   failedRequests: 25,
//   averageLatencyMs: 2340,
//   totalTokensUsed: 4523000,
//   totalCostUSD: 45.23,
//   hitlApprovals: 12,
//   hitlRejections: 3,
// }
```

##### updateAgentStatus(id: string, status: AgentStatus): Promise<void>

Update agent operational status.

```typescript
await registry.updateAgentStatus('ralph-smith', 'paused');
```

---

### Instrument

Represents an executable tool for agents.

#### Constructor

```typescript
new Instrument(definition: InstrumentDefinition)
```

#### Methods

##### execute(input: unknown, context: ExecutionContext): Promise<unknown>

Execute the instrument with validated input.

```typescript
const instrument = new Instrument({
  name: 'send_email',
  description: 'Send an email',
  requiredCapability: 'external',
  inputSchema: z.object({
    to: z.string().email(),
    subject: z.string(),
    body: z.string(),
  }),
  outputSchema: z.object({
    messageId: z.string(),
    status: z.enum(['sent', 'queued']),
  }),
  execute: async (input) => {
    // Implementation
  },
  auditLevel: 'full',
});

const result = await instrument.execute(
  { to: 'user@example.com', subject: 'Hello', body: 'World' },
  executionContext
);
```

##### toToolDefinition(): ToolDefinition

Convert instrument to LLM tool definition format.

```typescript
const toolDef = instrument.toToolDefinition();
// Can be passed to LLM as a tool
```

---

## Queen API

### Queen

The strategic orchestrator agent.

#### Constructor

```typescript
new Queen(config: QueenConfig)
```

**Parameters:**
- `config.planningModel` (ModelConfig): Model for planning tasks
- `config.maxConcurrentTasks` (number): Maximum parallel tasks
- `config.taskTimeout` (Duration): Default task timeout
- `config.escalationRules` (EscalationRule[]): HITL escalation rules

#### Methods

##### handleRequest(request: StrategicRequest): Promise<StrategicResponse>

Process a high-level strategic request.

```typescript
const response = await queen.handleRequest({
  id: 'req_456',
  description: 'Launch marketing campaign for new product',
  context: {
    ventureId: 'venture_123',
    userId: 'user_456',
    budget: 5000,
    deadline: new Date('2026-03-01'),
  },
  priority: 'high',
  constraints: {
    requiresApproval: true,
    channels: ['email', 'social'],
  },
});
```

**Returns:** `StrategicResponse`
```typescript
{
  requestId: string;
  status: 'completed' | 'partial' | 'failed' | 'awaiting_approval';
  tasks: TaskResult[];
  summary: string;
  duration: number;
  costUSD: number;
  hitlDecisions?: HITLDecision[];
}
```

---

### TaskPlanner

Decomposes requests into executable tasks.

#### Methods

##### decompose(request: StrategicRequest, analysis: RequestAnalysis): Promise<Task[]>

Decompose a request into atomic tasks.

```typescript
const tasks = await planner.decompose(request, {
  intent: 'marketing_campaign',
  complexity: 'high',
  domains: ['marketing', 'content', 'analytics'],
  constraints: { budget: 5000 },
});
```

**Returns:** Array of `Task` objects with:
- `id` (string): Unique task ID
- `parentId` (string?): Parent task for subtasks
- `type` (TaskType): Task category
- `title` (string): Task title
- `description` (string): Detailed description
- `targetPod` (RalphPodType): Assigned Ralph pod
- `instruments` (string[]): Required instruments
- `inputs` (Record<string, unknown>): Task inputs
- `dependencies` (string[]): Dependent task IDs
- `priority` (Priority): Execution priority
- `estimatedDurationMs` (number): Estimated duration
- `estimatedCostUSD` (number): Estimated cost

---

### ResourceAllocator

Allocates resources for task execution.

#### Methods

##### allocate(tasks: Task[]): Promise<ResourcePlan>

Create an execution plan with resource allocations.

```typescript
const plan = await allocator.allocate(tasks);
// {
//   assignments: [
//     { taskId: 'task_1', podType: 'growth', podInstance: 'growth-1', ... },
//     { taskId: 'task_2', podType: 'scribe', podInstance: 'scribe-1', ... },
//   ],
//   parallelGroups: [
//     { groupId: 'grp_1', taskIds: ['task_1', 'task_2'], startAfter: [] },
//     { groupId: 'grp_2', taskIds: ['task_3'], startAfter: ['grp_1'] },
//   ],
//   estimatedTotalDuration: 180000,
//   estimatedTotalCost: 0.45,
// }
```

---

## Swarm API

### RalphPod

Specialized execution agent.

#### Constructor

```typescript
new RalphPod(config: RalphPodConfig)
```

**Parameters:**
- `config.podType` (RalphPodType): Pod specialization
- `config.specialization` (string): Detailed specialization description
- `config.defaultInstruments` (string[]): Default available instruments
- `config.maxConcurrentTasks` (number): Concurrent task limit

#### Methods

##### executeTask(task: Task, resources: ResourceRequirements): Promise<TaskResult>

Execute an assigned task.

```typescript
const result = await pod.executeTask(task, {
  maxTokens: 4000,
  maxToolCalls: 10,
  timeoutMs: 300000,
  modelTier: 'standard',
});
```

**Returns:** `TaskResult`
```typescript
{
  taskId: string;
  status: 'completed' | 'failed' | 'partial';
  output: unknown;
  artifacts: Artifact[];
  tokensUsed: number;
  toolCalls: ToolCallRecord[];
  duration: number;
  error?: string;
}
```

##### isBusy(): boolean

Check if pod is currently executing tasks.

---

### SwarmDispatcher

Dispatches tasks to Ralph pods.

#### Methods

##### dispatch(tasks: Task[], allocation: ResourcePlan): Promise<ExecutionResult[]>

Dispatch tasks according to allocation plan.

```typescript
const results = await dispatcher.dispatch(tasks, allocation);
```

**Returns:** Array of `ExecutionResult`
```typescript
{
  taskId: string;
  status: 'completed' | 'failed';
  result?: TaskResult;
  error?: Error;
}
```

---

### WorkerPool

Manages a pool of Ralph workers.

#### Constructor

```typescript
new WorkerPool(config: WorkerPoolConfig)
```

**Parameters:**
- `config.minWorkers` (number): Minimum worker count
- `config.maxWorkers` (number): Maximum worker count
- `config.scaleUpThreshold` (number): Queue depth to trigger scale up
- `config.scaleDownThreshold` (number): Idle time before scale down
- `config.workerIdleTimeoutMs` (number): Worker idle timeout

#### Methods

##### submitTask(task: Task, assignment: TaskAssignment): Promise<TaskResult>

Submit a task to the worker pool.

```typescript
const result = await pool.submitTask(task, assignment);
```

##### getStatus(): PoolStatus

Get current pool status.

```typescript
const status = pool.getStatus();
// {
//   activeWorkers: 5,
//   idleWorkers: 2,
//   queueDepth: 12,
//   processing: 5,
// }
```

---

## HITL API

### HITLGateway

Gateway for human-in-the-loop approvals.

#### Methods

##### requestApproval(params: HITLApprovalParams): Promise<HITLApproval>

Request human approval for tasks.

```typescript
const approval = await hitl.requestApproval({
  requestId: 'req_789',
  tasks: [task1, task2],
  riskAssessment: {
    risks: [{ type: 'financial', level: 'high', description: '...' }],
    overallLevel: 'high',
    requiresApproval: true,
    approvers: [{ role: 'manager', count: 1 }],
  },
  requiredApprovers: [{ role: 'manager', count: 1 }],
  timeout: { hours: 4 },
  context: { amount: 10000, currency: 'USD' },
});
```

**Returns:** `HITLApproval`
```typescript
{
  requestId: string;
  approved: boolean;
  approvers: ApprovalDecision[];
  comments: string;
  conditions?: ApprovalCondition[];
  decidedAt: Date;
}
```

---

### HITLQueue

Manages the queue of pending approvals.

#### Methods

##### enqueue(request: HITLRequest): Promise<void>

Add a request to the approval queue.

##### getStatus(requestId: string): Promise<QueueStatus>

Get the status of a pending request.

```typescript
const status = await queue.getStatus('hitl_123');
// {
//   requestId: 'hitl_123',
//   status: 'pending',
//   approvalCount: 1,
//   rejectionCount: 0,
//   requiredCount: 2,
//   isComplete: false,
//   isEscalated: false,
//   deadline: Date,
// }
```

##### recordDecision(requestId: string, decision: ApprovalDecision): Promise<void>

Record an approver's decision.

```typescript
await queue.recordDecision('hitl_123', {
  approverId: 'user_456',
  approverRole: 'manager',
  decision: 'approve',
  reason: 'Approved per budget guidelines',
  decidedAt: new Date(),
});
```

##### getPendingForApprover(approverId: UserID, ventureId: VentureID): Promise<HITLRequest[]>

Get pending requests for a specific approver.

---

### ApprovalWorkflow

Configurable multi-step approval workflow.

#### Constructor

```typescript
new ApprovalWorkflow(config: ApprovalWorkflowConfig)
```

#### Methods

##### processApproval(stepId: string, decision: ApprovalDecision): Promise<WorkflowResult>

Process an approval decision for a workflow step.

```typescript
const result = await workflow.processApproval('step_1', {
  approverId: 'user_123',
  approverRole: 'manager',
  decision: 'approve',
  decidedAt: new Date(),
});
// { status: 'pending', currentStep: 'step_2' }
// or
// { status: 'approved' }
// or
// { status: 'rejected', reason: '...' }
```

##### getState(): WorkflowState

Get current workflow state.

---

## Reasoning API

### ReasoningEngine

Advanced reasoning capabilities.

#### Constructor

```typescript
new ReasoningEngine(model: ModelConfig)
```

#### Methods

##### reason(problem: string, context: ReasoningContext, config: ReasoningConfig): Promise<ReasoningResult>

Perform structured reasoning on a problem.

```typescript
const result = await engine.reason(
  'What is the optimal pricing strategy for the new product?',
  {
    marketData: { /* ... */ },
    competitorPricing: [10, 15, 20],
    costStructure: { /* ... */ },
  },
  {
    strategy: 'tree-of-thought',
    maxDepth: 4,
    branchingFactor: 3,
    samplingCount: 5,
    evaluationCriteria: [
      { name: 'profitability', weight: 0.4 },
      { name: 'market_share', weight: 0.3 },
      { name: 'feasibility', weight: 0.3 },
    ],
  }
);
```

**Returns:** `ReasoningResult`
```typescript
{
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
```

**Strategies:**
- `chain-of-thought`: Linear step-by-step reasoning
- `tree-of-thought`: Branching exploration with evaluation
- `self-consistency`: Multiple independent paths with voting
- `decomposition`: Problem decomposition into subproblems
- `analogical`: Reasoning by analogy
- `counterfactual`: What-if analysis

---

### ChainOfThought

Step-by-step reasoning implementation.

#### Methods

##### generateSteps(problem: string, context: Record<string, unknown>): Promise<ThoughtStep[]>

Generate reasoning steps for a problem.

```typescript
const steps = await cot.generateSteps(
  'Calculate the ROI of this marketing campaign',
  { campaignCost: 5000, expectedRevenue: 15000 }
);
// [
//   { step: 1, thought: 'First, identify the total investment...', ... },
//   { step: 2, thought: 'Calculate expected revenue increase...', ... },
//   { step: 3, thought: 'ROI = (Revenue - Cost) / Cost * 100...', ... },
// ]
```

---

## Memory API

### MemoryStore

Persistent storage for agent memories.

#### Methods

##### store(entry: MemoryEntryInput): Promise<string>

Store a new memory entry.

```typescript
const memoryId = await store.store({
  agentId: 'ralph-smith',
  type: 'episodic',
  content: {
    event: 'deployment_failure',
    details: { service: 'api', error: 'timeout' },
    resolution: 'Increased timeout, redeployed successfully',
  },
  importance: 0.8,
  accessCount: 0,
  lastAccessed: new Date(),
  createdAt: new Date(),
  tags: ['deployment', 'failure', 'resolved'],
  metadata: { service: 'api' },
});
```

##### retrieve(query: MemoryQuery): Promise<MemoryEntry[]>

Retrieve relevant memories.

```typescript
const memories = await store.retrieve({
  agentId: 'ralph-smith',
  query: 'deployment failures and resolutions',
  types: ['episodic', 'semantic'],
  tags: ['deployment'],
  limit: 10,
  minImportance: 0.5,
  recencyBias: 0.3,
});
```

##### consolidate(agentId: string): Promise<void>

Consolidate episodic memories into semantic knowledge.

```typescript
await store.consolidate('ralph-smith');
```

##### forget(criteria: ForgetCriteria): Promise<number>

Remove memories matching criteria.

```typescript
const deletedCount = await store.forget({
  agentId: 'ralph-smith',
  olderThan: new Date('2025-01-01'),
  minImportance: 0.3,
  types: ['working'],
});
```

---

### EpisodicMemory

Manages episodic (experience-based) memories.

#### Methods

##### startEpisode(agentId: string, type: EpisodeType): string

Start recording a new episode.

```typescript
const episodeId = episodic.startEpisode('ralph-smith', 'task_execution');
```

##### addEvent(event: EpisodeEventInput): void

Add an event to the current episode.

```typescript
episodic.addEvent({
  type: 'tool_call',
  description: 'Queried database for user records',
  data: { query: 'SELECT...', rowCount: 42 },
});
```

##### endEpisode(outcome: EpisodeOutcome): Promise<Episode>

End the current episode and analyze it.

```typescript
const episode = await episodic.endEpisode({
  success: true,
  result: { report: '...' },
  feedback: 'Good job!',
});
```

---

### SemanticMemory

Manages factual knowledge.

#### Methods

##### addFact(fact: SemanticFactInput): Promise<string>

Add a semantic fact.

```typescript
const factId = await semantic.addFact({
  agentId: 'system',
  subject: 'EDGE_token',
  predicate: 'has_total_supply',
  object: '1000000000',
  confidence: 1.0,
  sources: ['tokenomics_doc'],
});
```

##### query(agentId: string, query: string): Promise<SemanticFact[]>

Query semantic memory.

```typescript
const facts = await semantic.query(
  'system',
  'What is the total supply of EDGE tokens?'
);
```

##### inferFacts(agentId: string): Promise<SemanticFact[]>

Apply inference rules to derive new facts.

```typescript
const inferred = await semantic.inferFacts('system');
```

---

## Prompts API

### PromptBank

Manages prompt templates.

#### Methods

##### register(template: PromptTemplateInput): Promise<string>

Register a new prompt template.

```typescript
const templateId = await bank.register({
  name: 'customer_response',
  version: '1.0.0',
  category: 'task',
  description: 'Template for customer service responses',
  template: `You are responding to a customer inquiry.

Customer: {{customer_name}}
Issue: {{issue_description}}

Respond professionally and helpfully.
{{#if include_discount}}
You may offer up to {{max_discount}}% discount.
{{/if}}`,
  variables: [
    { name: 'customer_name', type: 'string', required: true, description: 'Customer name' },
    { name: 'issue_description', type: 'string', required: true, description: 'Issue' },
    { name: 'include_discount', type: 'boolean', required: false, default: false },
    { name: 'max_discount', type: 'number', required: false, default: 10 },
  ],
  examples: [],
  metadata: {
    author: 'support_team',
    tags: ['customer_service', 'response'],
  },
});
```

##### getTemplate(nameOrId: string, version?: string): Promise<PromptTemplate>

Retrieve a template by name or ID.

```typescript
const template = await bank.getTemplate('customer_response');
// or specific version
const templateV2 = await bank.getTemplate('customer_response', '2.0.0');
```

##### render(nameOrId: string, variables: Record<string, unknown>, options?: RenderOptions): Promise<string>

Render a template with variables.

```typescript
const prompt = await bank.render('customer_response', {
  customer_name: 'John Doe',
  issue_description: 'Product arrived damaged',
  include_discount: true,
  max_discount: 15,
});
```

##### search(query: PromptSearchQuery): Promise<PromptTemplate[]>

Search for templates.

```typescript
const templates = await bank.search({
  category: 'task',
  tags: ['customer_service'],
  text: 'response',
});
```

---

### PromptChainExecutor

Executes multi-step prompt chains.

#### Methods

##### execute(chain: PromptChain, initialInput: Record<string, unknown>, context: ExecutionContext): Promise<ChainResult>

Execute a prompt chain.

```typescript
const result = await executor.execute(
  {
    id: 'analysis_chain',
    name: 'Data Analysis Chain',
    description: 'Analyze data and generate insights',
    steps: [
      {
        id: 'extract',
        name: 'Extract Key Metrics',
        promptTemplate: 'extract_metrics',
        inputMapping: [
          { source: 'initial', sourceKey: 'rawData', targetKey: 'data' },
        ],
        outputKey: 'metrics',
      },
      {
        id: 'analyze',
        name: 'Analyze Trends',
        promptTemplate: 'analyze_trends',
        inputMapping: [
          { source: 'step', sourceKey: 'extract', targetKey: 'metrics' },
        ],
        outputKey: 'analysis',
      },
      {
        id: 'recommend',
        name: 'Generate Recommendations',
        promptTemplate: 'generate_recommendations',
        inputMapping: [
          { source: 'step', sourceKey: 'analyze', targetKey: 'analysis' },
          { source: 'initial', sourceKey: 'goals', targetKey: 'businessGoals' },
        ],
        outputKey: 'recommendations',
      },
    ],
    errorHandling: { strategy: 'fail_fast' },
  },
  {
    rawData: [/* data points */],
    goals: ['increase_revenue', 'reduce_churn'],
  },
  executionContext
);

// result.results contains all step outputs
// result.finalOutput is the last step's output
```

---

## Scouts API

### ScoutNetwork

Manages the network of monitoring scouts.

#### Methods

##### deployScout(config: ScoutConfig): Promise<string>

Deploy a new scout.

```typescript
const scoutId = await network.deployScout({
  name: 'API Health Monitor',
  type: 'health',
  target: {
    type: 'service',
    identifier: 'api-gateway',
  },
  schedule: {
    type: 'interval',
    expression: '1m',
  },
  config: {
    collectors: [
      { type: 'http', url: 'https://api.mcv.one/health', method: 'GET' },
    ],
    thresholds: [
      { metric: 'response_time', operator: 'gt', value: 500 },
      { metric: 'status_code', operator: 'ne', value: 200 },
    ],
    alertRules: [
      { condition: { severity: 'high' }, channels: ['slack', 'pagerduty'] },
    ],
  },
});
```

##### runScout(scoutId: string): Promise<ScoutReport>

Manually trigger a scout run.

```typescript
const report = await network.runScout(scoutId);
// {
//   scoutId: '...',
//   runAt: Date,
//   duration: 1234,
//   observationCount: 5,
//   anomalyCount: 0,
//   observations: [...],
//   anomalies: [],
// }
```

##### pauseScout(scoutId: string): Promise<void>

Pause a scout's scheduled runs.

##### resumeScout(scoutId: string): Promise<void>

Resume a paused scout.

##### getScoutStatus(scoutId: string): Promise<Scout>

Get current scout configuration and status.

---

### AnomalyDetector

Detects anomalies in time series data.

#### Constructor

```typescript
new AnomalyDetector(config: AnomalyDetectorConfig)
```

**Parameters:**
- `config.algorithm` ('zscore' | 'iqr' | 'isolation_forest' | 'prophet' | 'lstm')
- `config.sensitivity` (number): 0-1, higher = more sensitive
- `config.windowSize` (number): Data points to consider
- `config.seasonality` (SeasonalityConfig?): Seasonal patterns

#### Methods

##### addDataPoint(point: DataPoint): void

Add a data point to the detector's history.

```typescript
detector.addDataPoint({
  timestamp: new Date(),
  value: 125.5,
  dimensions: { server: 'api-1' },
});
```

##### detect(point: DataPoint): Promise<AnomalyResult | null>

Check if a data point is anomalous.

```typescript
const anomaly = await detector.detect({
  timestamp: new Date(),
  value: 450.0,  // Unusually high
  dimensions: { server: 'api-1' },
});

if (anomaly) {
  console.log(`Anomaly detected: ${anomaly.direction} (score: ${anomaly.score})`);
  // Anomaly detected: high (score: 3.45)
}
```

**Returns:** `AnomalyResult | null`
```typescript
{
  isAnomaly: true;
  score: number;           // How anomalous (algorithm-specific)
  expectedValue?: number;  // What was expected
  expectedRange?: { min: number; max: number };
  direction: 'high' | 'low' | 'unknown';
  confidence: number;      // 0-1
}
```

---

### Monitor

Health monitoring for services and systems.

#### Constructor

```typescript
new Monitor(config: MonitorConfig)
```

#### Methods

##### check(): Promise<MonitorStatus>

Run all health checks.

```typescript
const status = await monitor.check();
// {
//   monitorId: 'mon_123',
//   status: 'healthy',
//   lastCheck: Date,
//   consecutiveFailures: 0,
//   checks: [
//     { checkName: 'http', passed: true, duration: 45 },
//     { checkName: 'database', passed: true, duration: 12 },
//   ],
//   uptime: 99.95,
// }
```

##### getUptime(): number

Get current uptime percentage.

##### getHistory(limit?: number): CheckResult[]

Get recent check history.

---

## Error Types

### AgentError

Base error for agent-related issues.

```typescript
throw new AgentError('Failed to process request', {
  agentId: 'ralph-smith',
  requestId: 'req_123',
  cause: originalError,
});
```

### TaskExecutionError

Error during task execution.

```typescript
throw new TaskExecutionError('Task timed out', taskId, {
  duration: 300000,
  maxDuration: 300000,
});
```

### HITLTimeoutError

HITL approval timed out.

```typescript
throw new HITLTimeoutError(requestId, deadline);
```

### MemoryError

Memory operation failed.

```typescript
throw new MemoryError('No active episode');
```

### ReasoningError

Reasoning process failed.

```typescript
throw new ReasoningError('Max iterations exceeded without conclusion');
```

### ScoutError

Scout operation failed.

```typescript
throw new ScoutError('Unknown collector type: invalid');
```

---

## Type Definitions

### AgentCapability

```typescript
type AgentCapability =
  | 'read'       // Can read data
  | 'write'      // Can write/modify data
  | 'execute'    // Can execute code/workflows
  | 'approve'    // Can approve HITL requests
  | 'delegate'   // Can assign tasks to other agents
  | 'external'   // Can call external APIs
  | 'financial'; // Can perform financial operations
```

### TaskType

```typescript
type TaskType =
  | 'development'
  | 'marketing'
  | 'operations'
  | 'finance'
  | 'content'
  | 'analytics'
  | 'communications'
  | 'security';
```

### RalphPodType

```typescript
type RalphPodType =
  | 'smith'      // Development
  | 'growth'     // Marketing
  | 'director'   // Operations
  | 'ledger'     // Finance
  | 'scribe'     // Content
  | 'oracle'     // Analytics
  | 'herald'     // Communications
  | 'shield';    // Security
```

### MemoryType

```typescript
type MemoryType =
  | 'episodic'     // Specific experiences/events
  | 'semantic'     // Facts and knowledge
  | 'procedural'   // How to do things
  | 'working';     // Short-term context
```

### ReasoningStrategy

```typescript
type ReasoningStrategy =
  | 'chain-of-thought'
  | 'tree-of-thought'
  | 'self-consistency'
  | 'decomposition'
  | 'analogical'
  | 'counterfactual';
```

### ScoutType

```typescript
type ScoutType =
  | 'health'        // System health monitoring
  | 'performance'   // Performance metrics
  | 'security'      // Security scanning
  | 'compliance'    // Compliance checking
  | 'cost'          // Cost monitoring
  | 'quality'       // Quality metrics
  | 'custom';
```

---

*Complete API Reference for @mcv/agentic-os*
