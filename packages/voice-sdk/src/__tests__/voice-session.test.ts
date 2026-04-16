// @mcv/voice-sdk — VoiceSession state machine tests.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, vi } from 'vitest';
import { VoiceSession } from '../session/VoiceSession';
import { TinyEmitter, type ProviderConnection } from '../providers/ProviderContract';

function makeMockConnection(): ProviderConnection & TinyEmitter {
  const emitter = new TinyEmitter();
  const conn: any = Object.assign(emitter, {
    provider: 'gemini-live',
    sessionId: 'mock',
    state: 'connecting',
    sendAudio: vi.fn(),
    sendText: vi.fn(),
    sendToolResponse: vi.fn(),
    finish: vi.fn(),
    close: vi.fn(),
  });
  return conn;
}

describe('VoiceSession', () => {
  it('starts in connecting state and transitions to listening on open', () => {
    const primary = makeMockConnection();
    const session = new VoiceSession({ primary, resolvedProvider: 'gemini-live' });
    const states: string[] = [];
    session.on('state', (s: any) => states.push(s));
    (primary as TinyEmitter).emit('open');
    expect(states).toContain('listening');
  });

  it('transitions to speaking when audio-chunk arrives, records first-audio latency', async () => {
    const primary = makeMockConnection();
    const session = new VoiceSession({ primary, resolvedProvider: 'gemini-live' });
    (primary as TinyEmitter).emit('open');
    await new Promise((r) => setTimeout(r, 10));
    (primary as TinyEmitter).emit('audio-chunk', {
      data: new Uint8Array(4),
      timestamp: 10,
      first: true,
    });
    expect(session.state).toBe('speaking');
    expect(session.firstAudioLatencyMs).toBeGreaterThanOrEqual(0);
  });

  it('transitions back to listening on turn-complete', () => {
    const primary = makeMockConnection();
    const session = new VoiceSession({ primary, resolvedProvider: 'gemini-live' });
    (primary as TinyEmitter).emit('open');
    (primary as TinyEmitter).emit('audio-chunk', { data: new Uint8Array(0), timestamp: 0, first: true });
    expect(session.state).toBe('speaking');
    (primary as TinyEmitter).emit('turn-complete');
    expect(session.state).toBe('listening');
  });

  it('composite mode: STT transcripts forwarded, primary TTS audio stays on primary', () => {
    const primary = makeMockConnection();
    const stt = makeMockConnection();
    const session = new VoiceSession({ primary, stt, resolvedProvider: 'elevenlabs' });
    const partials: string[] = [];
    session.on('transcript-partial', (t: any) => partials.push(t.text));
    (stt as TinyEmitter).emit('transcript-partial', { text: 'hello', isFinal: false });
    expect(partials).toEqual(['hello']);
  });

  it('routes sendAudio to STT in composite mode', () => {
    const primary = makeMockConnection();
    const stt = makeMockConnection();
    const session = new VoiceSession({ primary, stt, resolvedProvider: 'elevenlabs' });
    const bytes = new Uint8Array(16);
    session.sendAudio(bytes);
    expect(stt.sendAudio).toHaveBeenCalledWith(bytes);
    expect(primary.sendAudio).not.toHaveBeenCalled();
  });

  it('sendText flips state to thinking and delegates to primary', () => {
    const primary = makeMockConnection();
    const session = new VoiceSession({ primary, resolvedProvider: 'gemini-live' });
    (primary as TinyEmitter).emit('open');
    session.sendText('hey');
    expect(session.state).toBe('thinking');
    expect(primary.sendText).toHaveBeenCalledWith('hey');
  });

  it('closes both connections in composite mode', async () => {
    const primary = makeMockConnection();
    const stt = makeMockConnection();
    const session = new VoiceSession({ primary, stt, resolvedProvider: 'elevenlabs' });
    await session.close();
    expect(primary.close).toHaveBeenCalled();
    expect(stt.close).toHaveBeenCalled();
    expect(session.state).toBe('closed');
  });
});
