# MCV One Voice Provider Comparison Matrix
**Wave 3 Session 13 | Multi-Provider Lego SDK Strategy**

---

## Executive Summary

MCV One ecosystem demands multi-provider flexibility to avoid lock-in while optimizing for latency, quality, cost, and task-specific features. This matrix informs the `@mcv/voice-sdk` architecture: **default to Gemini Live** (included in Google AI Ultra), **ElevenLabs for premium personas**, **Vapi for phone SDR**, and **Deepgram for best-in-class STT**.

---

## Provider Scoring Matrix (1–10 scale)

| Dimension | Gemini Live | ElevenLabs | Vapi | OpenAI Realtime | Deepgram | xAI Grok | Azure Speech |
|-----------|-------------|-----------|------|-----------------|----------|----------|--------------|
| **Latency (p50 first audio)** | 8 | 9 | 6 | 7 | 9 | 10 | 6 |
| **Voice Quality (MOS/naturalness)** | 8 | 10 | 7 | 9 | N/A (STT) | 8 | 7 |
| **Cost/minute** | 0 (included) | 8 (¢10) | 6 ($0.06–0.12/min) | 5 ($0.30) | 9 ($0.0077 STT) | 10 ($0.05) | 7 ($0.06–0.10) |
| **Feature Set** | 9 | 9 | 9 | 8 | 8 | 8 | 8 |
| **SDK Maturity (TS/docs)** | 8 | 9 | 9 | 9 | 9 | 6 | 8 |
| **Licensing (commercial/retention)** | 9 | 8 | 9 | 8 | 9 | 7 | 9 |
| **Browser/WebRTC Viability** | 10 | 9 | 4 | 9 | 8 | 6 | 8 |
| **Phone/PSTN Viability** | 4 | 6 | 10 | 4 | 3 | 5 | 7 |
| **Average Score** | **7.6** | **8.6** | **7.6** | **7.6** | **8.1** | **7.4** | **7.6** |

---

## Provider Profiles

### **Google Gemini Live API**
- **Key Strength**: Included in AI Ultra; bidirectional audio, native function calling, barge-in, 70 languages
- **Latency**: ~250–500ms first audio
- **Cost**: $0 (fixed monthly)
- **Best For**: In-app chat, internal tools, orchestrator pairing with Claude Opus
- **Limitations**: No voice cloning, TTS quality secondary to OpenAI/ElevenLabs
- **SDK**: WebSocket via ephemeral tokens (server or direct client)
- **Licensing**: Commercial use OK; retains audio for 30 days for safety checks

**Recommendation**: **Primary default** for all browser-based ventures. Pair Opus for reasoning, Gemini for voice I/O.

---

### **ElevenLabs Conversational AI**
- **Key Strength**: Premium voice quality, voice cloning, sub-second latency (Flash model), 70+ languages
- **Latency**: <500ms end-to-end
- **Cost**: ¢10/min (Creator/Pro), ¢8/min (Business annual)
- **Best For**: Investor relations, branded personas, high-touch customer experiences
- **Features**: Agent platform with prompt + tools + knowledge base; built-in understanding
- **SDK**: REST + WebSocket; mature TypeScript support
- **Licensing**: Commercial OK; no output retention; voice cloning requires enterprise approval

**Recommendation**: Reserve for **premium use cases** (investor dashboards, founder personas). Fallback for Gemini when quality matters.

---

### **Vapi**
- **Key Strength**: Turnkey phone agents, SIP + Twilio bridging, multi-LLM support
- **Latency**: 500–800ms (phone-optimized, not optimized for sub-100ms)
- **Cost**: $0.06–$0.12/min depending on LLM + voice provider
- **Best For**: Phone-first SDR flows (BetEdge, EdgeIQ outbound sales), call center
- **Features**: Squads (multi-agent), call routing, HIPAA/GDPR compliance, real-time analytics
- **SDK**: REST API, webhooks, minimal client-side code
- **Limitations**: Poor for in-app browser voice (designed for PSTN/SIP)
- **Licensing**: Commercial OK; call recording/retention negotiable

**Recommendation**: **Exclusive for phone/SDR ventures** (BetEdge sales, EdgeIQ prospecting). Don't use for in-app.

---

### **OpenAI Realtime API**
- **Key Strength**: Native speech-to-speech (gpt-realtime), 18.6% better instruction-following, expressive TTS
- **Latency**: ~400–600ms (optimized for quality over speed)
- **Cost**: $0.30/min ($0.06 audio in + $0.24 audio out)
- **Best For**: Nuanced conversations, premium assistants where quality > latency
- **Features**: Function calling, vision capable (images), streaming, temperature control
- **SDK**: WebSocket; excellent TypeScript, Python examples
- **Licensing**: Commercial OK; data retention 30 days for abuse detection

**Recommendation**: **Secondary for quality-first use cases**. Higher cost than Gemini; use when Gemini latency/quality insufficient.

---

### **Deepgram Nova-3**
- **Key Strength**: Best-in-class STT only (5.26% WER), 54.3% better than competitors, <300ms latency
- **Latency**: <300ms, streaming with <1s first partial
- **Cost**: $0.0077/min (STT only; combine with best-in-class TTS provider)
- **Best For**: Accurate transcription layer for power-user composite (STT + external TTS)
- **Features**: Sentiment, topic detection, intent, multilingual code-switching, stream tokens
- **SDK**: WebSocket streaming; mature SDKs across languages
- **Licensing**: Commercial OK; no retention

**Recommendation**: **Composite architecture layer**. Pair Deepgram STT + ElevenLabs TTS for highest fidelity custom agents.

---

### **xAI Grok Voice Agent API**
- **Key Strength**: Cheapest voice ($0.05/min), fastest first audio (<1s), real-time web search built-in
- **Latency**: <1s first audio (claims 5x faster than competitors)
- **Cost**: $0.05/min (lowest in market)
- **Best For**: Cost-sensitive ventures needing web-aware conversation
- **Features**: Real-time search, complex reasoning, function calling, live X/Twitter data
- **Limitations**: New API (2025), limited third-party SDK maturity; search-first design may not suit all use cases
- **Licensing**: Commercial OK; reasonable T&C

**Recommendation**: **Watch-list for future cost parity**. Monitor stability/maturity; use if budget-critical and search feature needed.

---

### **Azure Speech / Azure OpenAI**
- **Key Strength**: Enterprise compliance (HIPAA, FedRAMP, SOC 2), regional data residency, sovereign clouds
- **Latency**: ~600–800ms (secondary to compliance guarantees)
- **Cost**: $0.06–$0.10/min (enterprise negotiable)
- **Best For**: Compliance-heavy ventures (healthcare, government, regulated finance)
- **Features**: STT, TTS, translation, custom voice models, Voice Live (real-time agents)
- **SDK**: Mature; C#, Python, JavaScript, Java
- **Licensing**: Commercial OK; data residency in region; no cross-border retention

**Recommendation**: **Fallback for regulated ventures** (future healthcare, compliance-first ARQ Labs). Avoid unless compliance mandates.

---

## Use-Case Routing Matrix

| Use Case | Primary | Secondary | Fallback |
|----------|---------|-----------|----------|
| **In-app browser chat** | Gemini Live | OpenAI Realtime | ElevenLabs |
| **Investor relations / branded voice** | ElevenLabs | Gemini Live | – |
| **Phone SDR (outbound sales)** | Vapi (any LLM) | – | Azure (HIPAA) |
| **Transcription accuracy** | Deepgram STT | Azure Speech | – |
| **Cost-sensitive default** | Grok ($0.05/min) | Gemini ($0 incl) | Deepgram STT ($0.0077) |
| **Compliance-regulated** | Azure Speech | – | – |
| **Composite (STT + TTS)** | Deepgram + ElevenLabs | – | – |
| **Voice cloning** | ElevenLabs | – | Azure (custom) |
| **Real-time web search** | Grok | – | – |

---

## Per-Venture Recommendations

| Venture | Primary | Rationale |
|---------|---------|-----------|
| **MCV** | Gemini Live | Core platform default; orchestrator-friendly; leverage AI Ultra inclusion |
| **Futurestate** | ElevenLabs + Gemini | Investor relations demands premium voice; fallback to Gemini for cost |
| **BetEdge** | Vapi (Gemini/GPT-4o) | SDR phone flows; Vapi + Twilio integration; pair with low-latency LLM |
| **WarForge** | Gemini Live | Gaming NPC/companion use; barge-in essential; latency critical |
| **mcv.gg** | Gemini Live | Streaming events; interactive; leverage included license |
| **EdgeIQ** | Vapi (outbound) + Gemini (in-app) | Phone prospecting via Vapi; in-app advisor via Gemini |
| **ARQ Labs** | Azure Speech (future) | Plan for compliance; start with Gemini, migrate on regulatory need |

---

## Cost Projection: 100 voice-minutes/day

**Annual cost per provider** (100 min/day × 365 days):

| Provider | Per-Minute | Daily (100 min) | Annual |
|----------|-----------|-----------------|--------|
| Gemini Live | $0.00 | $0.00 | **$0** |
| ElevenLabs (¢10) | $0.10 | $10 | **$3,650** |
| OpenAI Realtime | $0.30 | $30 | **$10,950** |
| Vapi (avg) | $0.09 | $9 | **$3,285** |
| Deepgram STT | $0.0077 | $0.77 | **$281** |
| xAI Grok | $0.05 | $5 | **$1,825** |
| Azure Speech (avg) | $0.08 | $8 | **$2,920** |

**Composite (Deepgram + ElevenLabs TTS)**: $4,000/yr
**Optimal multi-provider stack**: **Gemini + Grok + ElevenLabs** = **$5,475/yr** (quality + cost balance)

---

## Architecture Recommendation

```
┌─────────────────────────────────────┐
│  @mcv/voice-sdk (Router)            │
├─────────────────────────────────────┤
│ Default: Gemini Live (included)     │
│ ├─ Premium personas → ElevenLabs    │
│ ├─ Phone SDR → Vapi                 │
│ ├─ STT layer → Deepgram             │
│ └─ Budget mode → xAI Grok           │
└─────────────────────────────────────┘
```

**Key principle**: Single provider lock-in rejected. SDK abstracts provider choice; ventures pick best fit per task. Compliance ventures fallback to Azure; cost-sensitive to Grok; quality-first to OpenAI/ElevenLabs. Orchestrate all via Claude Opus for reasoning.

---

**Document**: Wave 3 Session 13 Marathon
**Owner**: Tony (Google AI Ultra + Vertex access)
**Next**: SDK implementation + venture rollout plan

---

## Research Sources

- [Google Gemini Live API Docs](https://ai.google.dev/gemini-api/docs/live)
- [ElevenLabs Conversational AI](https://elevenlabs.io/conversational-ai)
- [ElevenLabs Pricing (Feb 2025 Update)](https://elevenlabs.io/blog/we-cut-our-pricing-for-conversational-ai)
- [Vapi Documentation](https://docs.vapi.ai/)
- [OpenAI Realtime API (GA August 2025)](https://openai.com/index/introducing-gpt-realtime/)
- [Deepgram Nova-3 Benchmarks](https://deepgram.com/learn/introducing-nova-3-speech-to-text-api)
- [xAI Grok Voice Agent API Launch](https://medium.com/@CherryZhouTech/xai-launches-grok-voice-agent-api-at-0-05-per-minute-6d0d6ddd553d)
- [Azure Speech Service](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/)
