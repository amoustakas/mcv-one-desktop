# Google AI Credentials — Reference Map

Tony holds Google AI Ultra + full Google Cloud / Vertex AI access. This doc
maps which credential reaches which surface. **No secrets in this doc** —
just provenance + scoping guidance.

## Two populations of Google AI credentials

Google exposes overlapping model surfaces through two different credential
mechanisms. They have different quotas, billing, and security models.

### A. Google AI Studio API keys — `GOOGLE_AI_STUDIO_API_KEY`

Use for:
- Gemini Live API (realtime voice in `@mcv/voice-sdk` GeminiLiveProvider)
- Gemini 2.5 Flash (agent memory summarization, high-volume code gen)
- Gemini text-embedding-004 (already used in content-embed pipeline)
- Imagen 3 via Google AI Studio route

Scoping: single API key. No IAM fine-grained control. Fastest to provision,
appropriate for low-risk workloads.

Obtain: https://aistudio.google.com/apikey

### B. Vertex AI service account — `GOOGLE_APPLICATION_CREDENTIALS` + `GOOGLE_CLOUD_PROJECT`

Use for:
- Production Gemini 2.5 Pro (long-context doc analysis, legal template drafting)
- Vertex AI Agent Builder + Vertex Search (if used)
- Ralph-loop code generation with volume controls
- Any workload where IAM audit trails matter (enterprise, compliance-gated)

Scoping: service account with *least privilege*. For the marathon we need:
- `roles/aiplatform.user` on the project
- `roles/discoveryengine.viewer` (Vertex Search, if used)

**Do NOT** grant:
- `roles/owner` or `roles/editor`
- `roles/iam.serviceAccountTokenCreator` (impersonation)

Obtain: https://console.cloud.google.com/iam-admin/serviceaccounts → create
→ download JSON → store path in `GOOGLE_APPLICATION_CREDENTIALS` env.

## Model routing across the marathon

| Task | Credential | Model |
|------|-----------|-------|
| Voice agent runtime (primary) | A | `gemini-2.5-flash-live` via Gemini Live API |
| Agent memory summarization | A | `gemini-2.5-flash` |
| Content OS embeddings | A | `text-embedding-004` (768-dim) |
| Long-context doc analysis | B | `gemini-2.5-pro` on Vertex |
| Ralph-loop code gen (high volume) | B | `gemini-2.5-flash` on Vertex |
| Image generation | A | Imagen 3 |

## Environment variables (NO SECRETS — reference only)

```
# Google AI Studio (VITE_ prefix for browser exposure when needed)
VITE_GOOGLE_AI_KEY=          # Browser-safe for non-privileged reads
GOOGLE_AI_STUDIO_API_KEY=    # Server-side, never exposed to browser

# Vertex AI (server-side only, never browser)
GOOGLE_CLOUD_PROJECT=        # Project ID, e.g. "mcv-one-production"
GOOGLE_APPLICATION_CREDENTIALS=  # Absolute path to service account JSON (local dev)
                                  # OR base64-encoded JSON contents (Vercel env)
```

On Vercel:
- Use `vercel env add GOOGLE_APPLICATION_CREDENTIALS_JSON` with the full JSON
  string base64-encoded, then decode at app boot and write to `/tmp/gcp.json`.
  Set `GOOGLE_APPLICATION_CREDENTIALS=/tmp/gcp.json` in the same env.

## Quota + cost controls

Google AI Ultra includes generous quota for Gemini Live + Flash. For the
marathon's Wave 3 voice testbed (comparing providers side-by-side):

- Default Tony's ventures to Gemini Live as primary provider (lowest marginal cost)
- Only route to ElevenLabs ConvAI / Vapi / OpenAI Realtime for premium use
  cases (investor-facing voices, phone calls, model-diversity testing)
- `@mcv/voice-sdk` VoiceRouter enforces per-venture quota caps (future work)

## Status

| Field | Value |
|---|---|
| `GOOGLE_AI_STUDIO_API_KEY` | PENDING — Wave 0.4 |
| Vertex service account | PENDING — Wave 0.4 |
| DID reference | n/a (Google stack doesn't anchor on MCV DID) |
| First voice test | Pending (Wave 3.3 Desktop playground) |

## Related docs

- [MCV DID root](DID-ROOT.md) — signing rails are independent of Google AI
- Marathon plan: `C:\Users\moust\.claude\plans\shimmering-exploring-petal.md`
