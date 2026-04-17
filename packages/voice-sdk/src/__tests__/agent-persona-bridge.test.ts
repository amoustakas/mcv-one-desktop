// @mcv/voice-sdk — agent_persona.voice_profile bridge tests.

import { describe, it, expect } from 'vitest';
import {
  personaProfileToBaseParams,
  personaProfileToParams,
  type AgentVoiceProfile,
} from '../integrations/agent-persona-bridge';

describe('agent-persona-bridge', () => {
  it('maps warm+natural defaults', () => {
    const p = personaProfileToBaseParams({ tone: 'warm', pace: 'natural' });
    expect(p.paceWpm).toBe(150);
    expect(p.stability).toBeCloseTo(0.5);
    expect(p.style).toBeCloseTo(0.55);
    expect(p.pitch).toBeCloseTo(1.0);
  });

  it('maps authoritative to higher stability, lower pitch', () => {
    const p = personaProfileToBaseParams({ tone: 'authoritative', pace: 'measured' });
    expect(p.paceWpm).toBe(130);
    expect(p.stability).toBeCloseTo(0.75);
    expect(p.pitch).toBeLessThan(1);
  });

  it('humor lifts style, hedges lift stability (clamped to 1)', () => {
    const p = personaProfileToBaseParams({ tone: 'playful', humor: 1, hedges: 1 });
    expect(p.style).toBeLessThanOrEqual(1);
    expect(p.stability).toBeLessThanOrEqual(1);
    expect((p.style ?? 0)).toBeGreaterThan(0.75);
  });

  it('surfaces signature_phrases in systemPrompt', () => {
    const p = personaProfileToBaseParams({ tone: 'warm', signature_phrases: ['As I see it'] });
    expect(p.systemPrompt).toContain('As I see it');
  });

  it('uses explicit voice_id when provided', () => {
    const profile: AgentVoiceProfile = { tone: 'warm', voice_id: 'custom-voice-123' };
    const p = personaProfileToBaseParams(profile);
    expect(p.voiceId).toBe('custom-voice-123');
  });

  it('picks Gemini voice by tone when profile has no voice_id', () => {
    const p = personaProfileToParams({ tone: 'authoritative' }, 'gemini-live');
    expect(p.voiceId).toBe('Charon');
    const warm = personaProfileToParams({ tone: 'warm' }, 'gemini-live');
    expect(warm.voiceId).toBe('Aoede');
  });

  it('picks OpenAI Realtime voice by tone', () => {
    const p = personaProfileToParams({ tone: 'playful' }, 'openai-realtime');
    expect(p.voiceId).toBe('sage');
  });

  it('picks Azure voice by tone', () => {
    const p = personaProfileToParams({ tone: 'stern' }, 'azure-speech');
    expect(p.voiceId).toContain('en-US-');
  });

  it('Deepgram gets language only', () => {
    const p = personaProfileToParams({ tone: 'warm' }, 'deepgram');
    expect(p.voiceId).toBeUndefined();
    expect(p.language).toBe('en');
  });

  it('ElevenLabs adds similarity default', () => {
    const p = personaProfileToParams({ tone: 'warm', voice_id: 'rachel' }, 'elevenlabs');
    expect(p.voiceId).toBe('rachel');
    expect(p.similarity).toBeCloseTo(0.75);
  });
});
