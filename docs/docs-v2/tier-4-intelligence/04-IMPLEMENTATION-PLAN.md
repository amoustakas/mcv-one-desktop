# @mcv/intelligence — Implementation Plan
## Phased Development Roadmap

**Package:** `@mcv/intelligence`  
**Classification:** MCV-ONLY  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026

---

## Executive Summary

The `@mcv/intelligence` package is MCV.ONE's AI brain — a sophisticated system for LLM access, embeddings, RAG, knowledge graphs, conversation memory, and embeddable AI widgets. Due to its complexity and the need for extensive external service integration, implementation follows a careful phased approach.

**Total Estimated Effort:** 24-28 weeks  
**Team Size:** 3-4 engineers (2 backend, 1 ML/AI specialist, 1 frontend)  
**Priority:** P0 (Critical Path for AI-powered ventures)

---

## Implementation Phases

### Phase 1: Gateway Foundation (Weeks 1-4)

**Goal:** Establish the core LLM gateway with OpenRouter integration.

#### Week 1: Project Setup & OpenRouter Core

| Task | Effort | Owner | Dependencies |
|------|--------|-------|--------------|
| Initialize package structure | 0.5d | DevOps | None |
| Configure OpenRouter SDK integration | 1d | Backend | Package init |
| Model registry and tier classification | 1d | Backend | OpenRouter SDK |
| Basic chat completion endpoint | 1d | Backend | Model registry |
| Request/response logging | 0.5d | Backend | Chat endpoint |
| Unit test framework setup | 1d | QA | Chat endpoint |

**Deliverables:**
- [ ] Package structure with proper exports
- [ ] OpenRouter authentication working
- [ ] Model registry with 20+ models
- [ ] Basic chat completion functional
- [ ] Request logging to database

#### Week 2: Model Routing & Failover

| Task | Effort | Owner | Dependencies |
|------|--------|-------|--------------|
| Intelligent model router (by task type) | 1.5d | Backend | Model registry |
| Cost-tier routing rules | 1d | Backend | Model router |
| Provider health monitoring | 1d | Backend | OpenRouter SDK |
| Automatic failover logic | 1d | Backend | Health monitoring |
| Fallback model chains | 0.5d | Backend | Failover logic |

**Deliverables:**
- [ ] Route by: task_type, cost_tier, capability
- [ ] Real-time provider health checks
- [ ] Automatic failover to backup models
- [ ] Configurable fallback chains

#### Week 3: Caching & Cost Management

| Task | Effort | Owner | Dependencies |
|------|--------|-------|--------------|
| Prompt caching (Claude/GPT) | 1.5d | Backend | Chat completion |
| Response caching (Redis L1) | 1d | Backend | Chat completion |
| Semantic cache (embedding-based) | 1.5d | Backend | Response cache |
| Per-venture budget tracking | 1d | Backend | Request logging |
| Usage analytics dashboard data | 1d | Backend | Budget tracking |

**Deliverables:**
- [ ] 90% cost reduction on cached prompts
- [ ] L1/L2 response caching
- [ ] Semantic similarity caching
- [ ] Real-time budget enforcement
- [ ] Usage metrics aggregation

#### Week 4: Streaming & Rate Limiting

| Task | Effort | Owner | Dependencies |
|------|--------|-------|--------------|
| SSE streaming implementation | 1.5d | Backend | Chat completion |
| WebSocket streaming support | 1.5d | Backend | SSE streaming |
| Token-based rate limiting | 1d | Backend | Request logging |
| Per-venture concurrency limits | 0.5d | Backend | Rate limiting |
| Backpressure handling | 0.5d | Backend | Streaming |

**Deliverables:**
- [ ] SSE streaming with proper chunking
- [ ] WebSocket streaming option
- [ ] Token-based rate limits (per min/hour/day)
- [ ] Concurrency limits per venture
- [ ] Graceful degradation under load

---

### Phase 2: Context & Embedding (Weeks 5-8)

**Goal:** Build context assembly and vector embedding systems.

#### Week 5: Context Assembly Core

| Task | Effort | Owner | Dependencies |
|------|--------|-------|--------------|
| Context assembly engine | 1.5d | Backend | Gateway core |
| Token counting (tiktoken) | 1d | Backend | Context engine |
| Dynamic context window management | 1d | Backend | Token counting |
| System prompt templates | 1d | Backend | Context engine |
| Variable injection framework | 0.5d | Backend | System prompts |

**Deliverables:**
- [ ] Context assembly pipeline
- [ ] Accurate token counting
- [ ] Auto-truncation for context limits
- [ ] Template-based system prompts
- [ ] Real-time data injection

#### Week 6: Data Injectors

| Task | Effort | Owner | Dependencies |
|------|--------|-------|--------------|
| User profile injector | 1d | Backend | Variable injection |
| Venture context injector | 1d | Backend | Variable injection |
| Temporal context (date/time) | 0.5d | Backend | Variable injection |
| Recent activity injector | 1d | Backend | Variable injection |
| Custom field mapping | 1d | Backend | Variable injection |
| Context priority/ordering | 0.5d | Backend | All injectors |

**Deliverables:**
- [ ] Auto-inject user context
- [ ] Auto-inject venture context
- [ ] Time-aware responses
- [ ] Recent activity awareness
- [ ] Custom context fields

#### Week 7: Embedding Core

| Task | Effort | Owner | Dependencies |
|------|--------|-------|--------------|
| Embedding model integration | 1d | ML | Gateway core |
| Text chunking strategies | 1.5d | ML | Embedding integration |
| Vector store abstraction | 1d | Backend | Embedding integration |
| Pinecone adapter | 1d | Backend | Vector abstraction |
| Qdrant adapter | 1d | Backend | Vector abstraction |

**Deliverables:**
- [ ] OpenAI/Cohere embeddings
- [ ] Semantic/sentence/paragraph chunking
- [ ] Vector store interface
- [ ] Pinecone integration
- [ ] Qdrant integration

#### Week 8: Semantic Search

| Task | Effort | Owner | Dependencies |
|------|--------|-------|--------------|
| Vector similarity search | 1d | ML | Vector store |
| Hybrid search (vector + keyword) | 1.5d | ML | Similarity search |
| Metadata filtering | 1d | Backend | Similarity search |
| Re-ranking with cross-encoder | 1d | ML | Hybrid search |
| Search result caching | 0.5d | Backend | Re-ranking |

**Deliverables:**
- [ ] Vector similarity search
- [ ] Hybrid search mode
- [ ] Filter by metadata
- [ ] Cross-encoder re-ranking
- [ ] Cached search results

---

### Phase 3: RAG & Knowledge (Weeks 9-12)

**Goal:** Build retrieval-augmented generation and knowledge graph.

#### Week 9: RAG Pipeline Core

| Task | Effort | Owner | Dependencies |
|------|--------|-------|--------------|
| Document ingestion pipeline | 1.5d | Backend | Embedding core |
| PDF/DOCX/HTML parsing | 1.5d | Backend | Ingestion pipeline |
| Automatic chunking & embedding | 1d | Backend | Parsing |
| Namespace management | 0.5d | Backend | Chunking |
| Background indexing queue | 0.5d | Backend | Namespace mgmt |

**Deliverables:**
- [ ] Document upload endpoint
- [ ] Multi-format parsing
- [ ] Automatic vectorization
- [ ] Per-venture namespaces
- [ ] Async indexing jobs

#### Week 10: RAG Query Engine

| Task | Effort | Owner | Dependencies |
|------|--------|-------|--------------|
| Query pre-processing | 1d | ML | RAG pipeline |
| Multi-query generation | 1d | ML | Query preprocessing |
| Context retrieval & ranking | 1d | ML | Multi-query |
| Source citation generation | 1d | Backend | Context retrieval |
| Confidence scoring | 1d | ML | Citation generation |

**Deliverables:**
- [ ] Query understanding
- [ ] Query expansion
- [ ] Relevance ranking
- [ ] Inline citations
- [ ] Confidence scores

#### Week 11: Knowledge Graph Core

| Task | Effort | Owner | Dependencies |
|------|--------|-------|--------------|
| Neo4j integration | 1.5d | Backend | Base infrastructure |
| Entity schema design | 1d | Backend | Neo4j integration |
| Entity CRUD operations | 1d | Backend | Entity schema |
| Relation management | 1d | Backend | Entity CRUD |
| Graph traversal queries | 0.5d | Backend | Relation management |

**Deliverables:**
- [ ] Neo4j connection pool
- [ ] Entity type definitions
- [ ] Entity CRUD API
- [ ] Relation CRUD API
- [ ] Cypher query builder

#### Week 12: Knowledge Integration

| Task | Effort | Owner | Dependencies |
|------|--------|-------|--------------|
| Entity extraction from text | 1.5d | ML | Knowledge core |
| Automatic relation inference | 1.5d | ML | Entity extraction |
| Graph-augmented retrieval | 1d | ML | Relation inference |
| Fact verification pipeline | 1d | ML | Graph retrieval |

**Deliverables:**
- [ ] NER from conversations
- [ ] Auto-link entities
- [ ] Graph-enhanced RAG
- [ ] Fact-checking pipeline

---

### Phase 4: Personas & Memory (Weeks 13-16)

**Goal:** Build AI personality system and conversation memory.

#### Week 13: Persona Core

| Task | Effort | Owner | Dependencies |
|------|--------|-------|--------------|
| Persona schema design | 0.5d | Backend | Context assembly |
| Persona CRUD operations | 1d | Backend | Persona schema |
| Voice/tone configuration | 1d | Backend | Persona CRUD |
| Brand guideline injection | 1d | Backend | Voice config |
| Persona switching logic | 0.5d | Backend | Brand guidelines |
| A/B testing framework | 1d | Backend | Persona switching |

**Deliverables:**
- [ ] Persona data model
- [ ] Per-venture personas
- [ ] Voice/tone settings
- [ ] Brand context injection
- [ ] Dynamic persona selection
- [ ] A/B testing support

#### Week 14: Memory Store

| Task | Effort | Owner | Dependencies |
|------|--------|-------|--------------|
| Conversation history storage | 1d | Backend | Base infrastructure |
| Message indexing | 0.5d | Backend | History storage |
| Session management | 1d | Backend | History storage |
| Memory partitioning (short/long) | 1d | Backend | Session management |
| Memory retention policies | 1d | Backend | Partitioning |
| Privacy controls | 0.5d | Backend | Retention policies |

**Deliverables:**
- [ ] Persistent conversation history
- [ ] Fast message retrieval
- [ ] Session boundaries
- [ ] Short/long-term memory
- [ ] Auto-expiration rules
- [ ] User data controls

#### Week 15: Memory Intelligence

| Task | Effort | Owner | Dependencies |
|------|--------|-------|--------------|
| Conversation summarization | 1.5d | ML | Memory store |
| Key fact extraction | 1d | ML | Summarization |
| User preference learning | 1d | ML | Fact extraction |
| Memory recall strategies | 1d | ML | Preference learning |
| Context window optimization | 0.5d | ML | Memory recall |

**Deliverables:**
- [ ] Auto-summarize long conversations
- [ ] Extract and store key facts
- [ ] Learn user preferences
- [ ] Smart memory retrieval
- [ ] Efficient context packing

#### Week 16: Memory Integration

| Task | Effort | Owner | Dependencies |
|------|--------|-------|--------------|
| Memory-augmented prompts | 1d | Backend | Memory intelligence |
| Cross-session continuity | 1d | Backend | Memory prompts |
| Memory search (semantic) | 1d | ML | Memory store |
| Memory visualization API | 1d | Backend | Memory search |
| Memory export/import | 1d | Backend | Visualization |

**Deliverables:**
- [ ] Automatic memory injection
- [ ] Continuous conversations
- [ ] Search past conversations
- [ ] Memory timeline API
- [ ] Data portability

---

### Phase 5: ML Predictions (Weeks 17-20)

**Goal:** Build predictive ML models for business intelligence.

#### Week 17: ML Infrastructure

| Task | Effort | Owner | Dependencies |
|------|--------|-------|--------------|
| Feature store design | 1.5d | ML | Base infrastructure |
| Feature extraction pipeline | 1.5d | ML | Feature store |
| Model registry | 1d | ML | Feature pipeline |
| Prediction service interface | 1d | Backend | Model registry |

**Deliverables:**
- [ ] Feature store schema
- [ ] ETL for feature extraction
- [ ] Model versioning
- [ ] Unified prediction API

#### Week 18: Churn Prediction

| Task | Effort | Owner | Dependencies |
|------|--------|-------|--------------|
| Churn feature engineering | 1.5d | ML | Feature store |
| Model training pipeline | 1.5d | ML | Feature engineering |
| Churn prediction endpoint | 1d | Backend | Model training |
| Risk scoring and segments | 1d | ML | Prediction endpoint |

**Deliverables:**
- [ ] Churn features (usage, engagement, etc.)
- [ ] XGBoost/LightGBM model
- [ ] Real-time predictions
- [ ] Risk tiers (high/medium/low)

#### Week 19: Recommendation Engine

| Task | Effort | Owner | Dependencies |
|------|--------|-------|--------------|
| Collaborative filtering | 1.5d | ML | Feature store |
| Content-based filtering | 1d | ML | Embedding core |
| Hybrid recommendation | 1d | ML | Both filters |
| Recommendation API | 1d | Backend | Hybrid engine |
| Diversity and exploration | 0.5d | ML | Recommendation API |

**Deliverables:**
- [ ] User-item collaborative filtering
- [ ] Content similarity matching
- [ ] Hybrid approach
- [ ] Real-time recommendations
- [ ] Exploration/exploitation balance

#### Week 20: Anomaly Detection

| Task | Effort | Owner | Dependencies |
|------|--------|-------|--------------|
| Metric time series collection | 1d | Backend | Feature store |
| Statistical anomaly detection | 1d | ML | Time series |
| ML-based anomaly detection | 1.5d | ML | Statistical detection |
| Alert generation | 1d | Backend | Anomaly detection |
| False positive tuning | 0.5d | ML | Alert generation |

**Deliverables:**
- [ ] Metric collection pipeline
- [ ] Z-score/IQR detection
- [ ] Isolation Forest/Autoencoder
- [ ] Real-time alerts
- [ ] Tunable sensitivity

---

### Phase 6: Embed Widgets (Weeks 21-24)

**Goal:** Build embeddable AI widgets for external websites.

#### Week 21: Widget Infrastructure

| Task | Effort | Owner | Dependencies |
|------|--------|-------|--------------|
| Embed token system | 1d | Backend | Gateway core |
| Widget configuration API | 1d | Backend | Embed tokens |
| CORS and security setup | 1d | Backend | Config API |
| Widget analytics tracking | 1d | Backend | Security setup |
| Rate limiting per embed | 1d | Backend | Analytics |

**Deliverables:**
- [ ] Secure embed tokens
- [ ] Widget config storage
- [ ] Cross-origin security
- [ ] Usage analytics
- [ ] Per-widget limits

#### Week 22: Chat Widget

| Task | Effort | Owner | Dependencies |
|------|--------|-------|--------------|
| Chat widget React component | 2d | Frontend | Widget infrastructure |
| Streaming UI integration | 1d | Frontend | Chat component |
| Theming/branding support | 1d | Frontend | Chat component |
| Mobile responsive design | 1d | Frontend | Theming |

**Deliverables:**
- [ ] Embeddable chat widget
- [ ] Real-time streaming
- [ ] Custom branding
- [ ] Mobile-friendly

#### Week 23: Search & Voice Widgets

| Task | Effort | Owner | Dependencies |
|------|--------|-------|--------------|
| Search widget component | 1.5d | Frontend | Widget infrastructure |
| Voice widget (Web Speech API) | 1.5d | Frontend | Widget infrastructure |
| Speech-to-text integration | 1d | Frontend | Voice widget |
| Text-to-speech integration | 1d | Frontend | Voice widget |

**Deliverables:**
- [ ] Semantic search widget
- [ ] Voice input widget
- [ ] STT integration
- [ ] TTS integration

#### Week 24: SDK & Documentation

| Task | Effort | Owner | Dependencies |
|------|--------|-------|--------------|
| JavaScript SDK packaging | 1d | Frontend | All widgets |
| React SDK wrapper | 1d | Frontend | JS SDK |
| Vanilla JS loader | 0.5d | Frontend | JS SDK |
| Widget documentation | 1d | Technical Writer | All widgets |
| Integration examples | 0.5d | Frontend | Documentation |
| Widget playground | 1d | Frontend | Examples |

**Deliverables:**
- [ ] npm package (@mcv/embed-sdk)
- [ ] React hooks
- [ ] Script tag loader
- [ ] Complete docs
- [ ] Code examples
- [ ] Interactive playground

---

### Phase 7: Integration & Polish (Weeks 25-28)

**Goal:** System integration, performance optimization, and production readiness.

#### Week 25: Integration Testing

| Task | Effort | Owner | Dependencies |
|------|--------|-------|--------------|
| End-to-end test suite | 2d | QA | All modules |
| Load testing | 1d | QA/DevOps | E2E tests |
| Chaos engineering tests | 1d | DevOps | Load tests |
| Security audit | 1d | Security | All modules |

**Deliverables:**
- [ ] E2E test coverage > 80%
- [ ] Load test benchmarks
- [ ] Failure scenario coverage
- [ ] Security vulnerabilities addressed

#### Week 26: Performance Optimization

| Task | Effort | Owner | Dependencies |
|------|--------|-------|--------------|
| Query optimization | 1d | Backend | Integration tests |
| Caching layer tuning | 1d | Backend | Query optimization |
| Connection pool tuning | 0.5d | Backend | Caching tuning |
| CDN configuration for widgets | 0.5d | DevOps | Widget SDK |
| Latency analysis and fixes | 2d | Backend | All tuning |

**Deliverables:**
- [ ] P50 < 200ms for chat
- [ ] P99 < 2s for RAG queries
- [ ] Cache hit rate > 60%
- [ ] Global widget delivery

#### Week 27: Monitoring & Observability

| Task | Effort | Owner | Dependencies |
|------|--------|-------|--------------|
| Prometheus metrics setup | 1d | DevOps | All modules |
| Grafana dashboards | 1d | DevOps | Metrics |
| Alert rules configuration | 1d | DevOps | Dashboards |
| Distributed tracing | 1d | DevOps | Alert rules |
| Log aggregation | 1d | DevOps | Tracing |

**Deliverables:**
- [ ] Real-time metrics
- [ ] Operations dashboards
- [ ] Automated alerts
- [ ] Request tracing
- [ ] Centralized logging

#### Week 28: Documentation & Launch

| Task | Effort | Owner | Dependencies |
|------|--------|-------|--------------|
| API documentation finalization | 1d | Technical Writer | All APIs |
| Architecture documentation | 1d | Backend | All modules |
| Runbook creation | 1d | DevOps | Monitoring |
| Team knowledge transfer | 1d | All | Documentation |
| Production deployment | 1d | DevOps | All readiness |

**Deliverables:**
- [ ] Complete API docs
- [ ] Architecture diagrams
- [ ] Operational runbooks
- [ ] Team trained
- [ ] Production live

---

## Testing Strategy

### Unit Tests (Required: 90% Coverage)

```typescript
describe('GatewayService', () => {
  describe('chat', () => {
    it('routes to correct model based on task type', async () => {
      const result = await gateway.chat({
        messages: [{ role: 'user', content: 'Analyze this document...' }],
        routing: { taskType: 'analysis' },
      });
      
      expect(result.model).toMatch(/claude|gpt-4/);
    });

    it('fails over to backup model on provider error', async () => {
      mockOpenRouter.setProviderDown('anthropic');
      
      const result = await gateway.chat({
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'claude-3-opus',
      });
      
      expect(result.model).not.toContain('claude');
      expect(result.metadata.failedOver).toBe(true);
    });

    it('respects budget limits', async () => {
      await setVentureBudget(ventureId, { dailyLimit: 0.01 });
      
      await expect(gateway.chat({
        ventureId,
        messages: [{ role: 'user', content: 'Generate a novel...' }],
      })).rejects.toThrow('Budget exceeded');
    });
  });
});

describe('RAGService', () => {
  describe('query', () => {
    it('returns relevant documents with citations', async () => {
      await rag.indexDocument(ventureId, {
        content: 'The MCV Global Consortium was founded in 2024...',
        metadata: { source: 'about.md' },
      });

      const result = await rag.query(ventureId, {
        query: 'When was MCV founded?',
      });

      expect(result.answer).toContain('2024');
      expect(result.citations).toHaveLength(1);
      expect(result.citations[0].source).toBe('about.md');
    });
  });
});
```

### Integration Tests

```typescript
describe('Full RAG Pipeline', () => {
  it('indexes document and answers questions', async () => {
    // Upload document
    const doc = await media.upload(ventureId, pdfBuffer, 'report.pdf');
    
    // Index for RAG
    await rag.indexDocument(ventureId, { assetId: doc.id });
    
    // Wait for indexing
    await waitForIndexing(doc.id);
    
    // Query
    const result = await intelligence.chat({
      ventureId,
      messages: [{ role: 'user', content: 'Summarize the Q4 results' }],
      ragEnabled: true,
    });
    
    expect(result.content).toBeTruthy();
    expect(result.sources).toContainEqual(expect.objectContaining({ assetId: doc.id }));
  });
});

describe('Memory Continuity', () => {
  it('remembers context across sessions', async () => {
    // First session
    const session1 = await memory.createSession(userId);
    await intelligence.chat({
      sessionId: session1.id,
      messages: [{ role: 'user', content: 'My name is Alice and I work at Acme Corp' }],
    });
    
    // End session
    await memory.endSession(session1.id);
    
    // New session, same user
    const session2 = await memory.createSession(userId);
    const result = await intelligence.chat({
      sessionId: session2.id,
      messages: [{ role: 'user', content: 'Where do I work?' }],
    });
    
    expect(result.content).toContain('Acme');
  });
});
```

### Performance Benchmarks

| Operation | Target | Measurement |
|-----------|--------|-------------|
| Chat (non-streaming, simple) | < 500ms TTFT | P50 latency |
| Chat (streaming, first token) | < 200ms | P50 latency |
| Embedding (single text) | < 100ms | P50 latency |
| Vector search (1M vectors) | < 50ms | P50 latency |
| RAG query (end-to-end) | < 2s | P50 latency |
| Knowledge graph query | < 100ms | P50 latency |

---

## Risk Mitigation

### Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| OpenRouter downtime | High | Multi-provider failover, direct API fallbacks |
| Vector DB scaling | Medium | Sharding strategy, index optimization |
| Neo4j performance | Medium | Query optimization, read replicas |
| Cost overruns | High | Budget enforcement, model routing, caching |
| Prompt injection | Critical | Input sanitization, output filtering, guardrails |
| Data leakage in embeddings | High | Venture isolation, namespace separation |

### External Dependencies

| Service | Risk Level | Fallback |
|---------|------------|----------|
| OpenRouter | Low | Direct Anthropic/OpenAI APIs |
| Pinecone | Medium | Qdrant self-hosted |
| Neo4j Aura | Medium | Self-hosted Neo4j |
| Redis Cloud | Low | Upstash or self-hosted |

---

## Team Assignments

| Engineer | Primary Focus | Secondary |
|----------|---------------|-----------|
| Backend Lead | Gateway, Context, Streaming | Integration |
| Backend 2 | RAG, Memory, Personas | Knowledge Graph |
| ML Engineer | Embeddings, Knowledge, ML Predictions | RAG tuning |
| Frontend | Embed Widgets, SDK | Documentation |

---

## Success Criteria

### Phase Gates

| Phase | Gate Criteria |
|-------|---------------|
| Phase 1 | Chat works, failover functional, caching active |
| Phase 2 | Context assembly complete, embeddings generating, search working |
| Phase 3 | RAG answering questions, knowledge graph populated |
| Phase 4 | Personas applied, memory persisting across sessions |
| Phase 5 | Churn predictions active, recommendations serving |
| Phase 6 | Widgets embeddable, SDK published |
| Phase 7 | Performance targets met, monitoring active, production live |

### Quality Metrics

- Unit test coverage: ≥ 90%
- Integration test coverage: ≥ 80%
- P50 latency targets: All passing
- Security scan: No critical vulnerabilities
- Documentation: 100% public API documented
- Cost efficiency: 40% below direct API costs

---

## Related Documentation

- [Package Specification](./01-PACKAGE-SPEC.md)
- [Technical Architecture](./02-TECHNICAL-ARCHITECTURE.md)
- [API Reference](./03-API-REFERENCE.md)

---

*@mcv/intelligence — Implementation Plan v1.0.0*
