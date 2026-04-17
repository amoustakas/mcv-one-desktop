import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  AudioLines, Volume2, Mic, Headphones, Radio,
  Music, MessageSquare, Monitor, Sparkles, Check,
} from 'lucide-react';
import { PageShell, PageHeader, GlassCard, EmptyState } from '../components/ui';
import { useDeviceStore } from '../stores/devices';
import type { AudioRoute, DeviceProfile } from '../lib/devices/types';
import { cn } from '../lib/utils';
import VoiceDock from '../components/voice/VoiceDock';
import VoiceProviderComparator from '../components/voice/VoiceProviderComparator';
import type { ProviderName, VentureVoiceConfig } from '@mcv/voice-sdk';

// GoXLR routing inputs and outputs
const INPUTS = [
  { id: 'mic', label: 'Microphone', icon: <Mic size={14} /> },
  { id: 'chat', label: 'Chat', icon: <MessageSquare size={14} /> },
  { id: 'music', label: 'Music', icon: <Music size={14} /> },
  { id: 'game', label: 'Game', icon: <Monitor size={14} /> },
  { id: 'system', label: 'System', icon: <Radio size={14} /> },
  { id: 'sample', label: 'Samples', icon: <Sparkles size={14} /> },
];

const OUTPUTS = [
  { id: 'headphones', label: 'Headphones', icon: <Headphones size={14} /> },
  { id: 'stream', label: 'Stream Mix', icon: <Radio size={14} /> },
  { id: 'line-out', label: 'Line Out', icon: <Volume2 size={14} /> },
  { id: 'chat-mic', label: 'Chat Mic', icon: <MessageSquare size={14} /> },
];

const FADER_SOURCES: Record<string, { label: string; icon: React.ReactNode }> = {
  A: { label: 'Mic', icon: <Mic size={12} /> },
  B: { label: 'Game', icon: <Monitor size={12} /> },
  C: { label: 'Music', icon: <Music size={12} /> },
  D: { label: 'Chat', icon: <MessageSquare size={12} /> },
};

const FADERS = ['A', 'B', 'C', 'D'];

function RoutingMatrix({ routes, onToggle }: {
  routes: Record<string, boolean>;
  onToggle: (input: string, output: string) => void;
}) {
  return (
    <GlassCard className="p-4 overflow-x-auto">
      <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">
        Routing Matrix
      </h3>
      <table className="w-full">
        <thead>
          <tr>
            <th className="w-28" />
            {OUTPUTS.map((out) => (
              <th key={out.id} className="text-center px-3 pb-3">
                <div className="flex flex-col items-center gap-1 text-white/50">
                  {out.icon}
                  <span className="text-[10px] uppercase">{out.label}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {INPUTS.map((inp) => (
            <tr key={inp.id} className="border-t border-white/5">
              <td className="py-2 pr-4">
                <div className="flex items-center gap-2 text-white/50">
                  {inp.icon}
                  <span className="text-xs">{inp.label}</span>
                </div>
              </td>
              {OUTPUTS.map((out) => {
                const key = `${inp.id}:${out.id}`;
                const active = routes[key] ?? false;
                return (
                  <td key={out.id} className="text-center py-2">
                    <button
                      onClick={() => onToggle(inp.id, out.id)}
                      className={cn(
                        'w-8 h-8 rounded-md border transition-all mx-auto',
                        active
                          ? 'bg-cyan-400/30 border-cyan-400/60 shadow-[0_0_8px_rgba(0,240,255,0.15)]'
                          : 'bg-white/[0.02] border-white/10 hover:border-white/20',
                      )}
                    >
                      {active && <div className="w-3 h-3 rounded-full bg-cyan-400 mx-auto" />}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </GlassCard>
  );
}

function MicMonitorPanel() {
  const [gain, setGain] = useState(75);
  const [gate, setGate] = useState(30);
  const [compressor, setCompressor] = useState(50);
  const [eqLow, setEqLow] = useState(50);
  const [eqMid, setEqMid] = useState(50);
  const [eqHigh, setEqHigh] = useState(50);

  const sliders: { label: string; value: number; onChange: (v: number) => void; color: string }[] = [
    { label: 'Gain', value: gain, onChange: setGain, color: '#10B981' },
    { label: 'Gate', value: gate, onChange: setGate, color: '#F59E0B' },
    { label: 'Comp', value: compressor, onChange: setCompressor, color: '#8B5CF6' },
    { label: 'EQ Lo', value: eqLow, onChange: setEqLow, color: '#EF4444' },
    { label: 'EQ Mid', value: eqMid, onChange: setEqMid, color: '#3B82F6' },
    { label: 'EQ Hi', value: eqHigh, onChange: setEqHigh, color: '#00F0FF' },
  ];

  return (
    <GlassCard className="p-4">
      <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">
        Mic Monitor
      </h3>
      <div className="flex justify-center gap-6">
        {sliders.map((s) => (
          <div key={s.label} className="flex flex-col items-center gap-2">
            <span className="text-[10px] text-white/40 font-mono">{s.label}</span>
            <div className="relative w-6 h-28 bg-white/[0.03] rounded-full border border-white/10">
              <div
                className="absolute bottom-0 left-0 right-0 rounded-full transition-all"
                style={{ height: `${s.value}%`, backgroundColor: `${s.color}40` }}
              />
              <input
                type="range"
                min="0"
                max="100"
                value={s.value}
                onChange={(e) => s.onChange(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ns-resize"
                style={{ writingMode: 'vertical-lr', direction: 'rtl' } as React.CSSProperties}
              />
            </div>
            <span className="text-[10px] text-white/30 font-mono">{s.value}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function PresetsPanel({ profiles, onActivate }: {
  profiles: DeviceProfile[];
  onActivate: (profileId: string) => void;
}) {
  const presetsWithGoxlr = profiles.filter((p) => p.goxlrPreset);
  return (
    <GlassCard className="p-4">
      <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
        Presets
      </h3>
      {presetsWithGoxlr.length === 0 ? (
        <p className="text-xs text-white/30 text-center py-4">
          No GoXLR presets saved. Create a profile with a GoXLR preset to see it here.
        </p>
      ) : (
        <div className="space-y-2">
          {presetsWithGoxlr.map((profile) => (
            <button
              key={profile.id}
              onClick={() => onActivate(profile.id)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-md border border-white/10 bg-white/[0.02] hover:border-cyan-400/40 hover:bg-cyan-400/5 transition-all text-left"
            >
              <div>
                <span className="text-sm text-white">{profile.name}</span>
                {profile.goxlrPreset && (
                  <span className="text-xs text-white/30 ml-2">{profile.goxlrPreset}</span>
                )}
              </div>
              <Check size={14} className="text-white/20" />
            </button>
          ))}
        </div>
      )}
    </GlassCard>
  );
}

function FaderControl({ name, value, onChange }: { name: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs text-white/40 font-mono">{name}</span>
      <div className="relative w-8 h-40 bg-white/[0.03] rounded-full border border-white/10">
        <div
          className="absolute bottom-0 left-0 right-0 rounded-full bg-gradient-to-t from-cyan-400/30 to-purple-500/30 transition-all"
          style={{ height: `${value * 100}%` }}
        />
        <input
          type="range"
          min="0"
          max="100"
          value={Math.round(value * 100)}
          onChange={(e) => onChange(Number(e.target.value) / 100)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-ns-resize"
          style={{ writingMode: 'vertical-lr', direction: 'rtl' } as React.CSSProperties}
        />
      </div>
      <span className="text-[10px] text-white/30 font-mono">{Math.round(value * 100)}%</span>
    </div>
  );
}

function EffectsPanel() {
  return (
    <GlassCard className="p-4">
      <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
        Effects
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {['Reverb', 'Echo', 'Pitch', 'Megaphone', 'Robot', 'Hardtune'].map((fx) => (
          <button
            key={fx}
            className="px-3 py-2 rounded-md border border-white/10 bg-white/[0.02] text-xs text-white/50 hover:border-cyan-400/40 hover:text-white/80 transition-all"
          >
            {fx}
          </button>
        ))}
      </div>
    </GlassCard>
  );
}

function SamplerGrid() {
  const banks = ['A', 'B', 'C'];
  const slots = [1, 2, 3, 4];
  return (
    <GlassCard className="p-4">
      <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
        Sampler
      </h3>
      <div className="space-y-3">
        {banks.map((bank) => (
          <div key={bank} className="flex items-center gap-2">
            <span className="text-xs text-white/30 w-6 font-mono">{bank}</span>
            {slots.map((slot) => (
              <button
                key={slot}
                className="flex-1 h-10 rounded-md border border-white/10 bg-white/[0.02] text-xs text-white/30 hover:border-purple-400/40 hover:bg-purple-400/5 transition-all"
              >
                {bank}{slot}
              </button>
            ))}
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function VoicePlaygroundSection() {
  // MCV default voice stack — Gemini Live primary, ElevenLabs+Deepgram fallback.
  // This mirrors docs/voice/PROVIDER-MATRIX.md recommendations.
  const venture: VentureVoiceConfig = useMemo(() => ({
    ventureId: 'mcv',
    primary: 'gemini-live',
    fallback: ['elevenlabs', 'deepgram'],
    monthlySpendCapUsd: 250,
  }), []);

  const providerConfigs = useMemo<Partial<Record<ProviderName, { apiKey?: string }>>>(() => ({
    'gemini-live': { apiKey: import.meta.env.VITE_GOOGLE_AI_KEY },
    'elevenlabs': { apiKey: import.meta.env.VITE_ELEVENLABS_API_KEY },
    'deepgram': { apiKey: import.meta.env.VITE_DEEPGRAM_API_KEY },
    'openai-realtime': { apiKey: import.meta.env.VITE_OPENAI_API_KEY },
  }), []);

  const [transcripts, setTranscripts] = useState<string[]>([]);

  return (
    <GlassCard className="p-4 space-y-4">
      <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
        Voice Playground
      </h3>
      <VoiceDock
        venture={venture}
        providerConfigs={providerConfigs}
        agentPersona={{ tone: 'warm', pace: 'natural', humor: 0.2 }}
        onTranscript={(t) => setTranscripts((prev) => [...prev.slice(-4), t])}
      />
      {transcripts.length > 0 && (
        <div className="space-y-1 text-xs text-white/60 font-mono bg-black/30 rounded p-2">
          {transcripts.map((t, i) => (
            <div key={i} className="truncate">{t}</div>
          ))}
        </div>
      )}
      <div>
        <div className="text-xs uppercase tracking-wider text-white/50 mb-2">
          Provider A/B comparator
        </div>
        <VoiceProviderComparator
          providers={['elevenlabs', 'gemini-live', 'azure-speech']}
          providerConfigs={providerConfigs}
          agentPersona={{ tone: 'warm', pace: 'natural' }}
        />
      </div>
    </GlassCard>
  );
}

export default function AudioRouterView() {
  const { devices, profiles, activeProfileId, addProfile, setActiveProfile } = useDeviceStore();

  // Persist fader values: initialize from active profile or defaults
  const activeProfile = activeProfileId ? profiles[activeProfileId] : null;
  const [faderValues, setFaderValues] = useState<Record<string, number>>({
    A: 0.75, B: 0.6, C: 0.5, D: 0.4,
  });

  // Persist routing: initialize from active profile audioRouting
  const [routes, setRoutes] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (activeProfile?.audioRouting) {
      for (const route of activeProfile.audioRouting.routes) {
        initial[`${route.input}:${route.output}`] = route.enabled;
      }
    }
    return initial;
  });

  // Sync routes back to store whenever they change
  useEffect(() => {
    if (!activeProfile) return;
    const audioRoutes: AudioRoute[] = Object.entries(routes).map(([key, enabled]) => {
      const [input, output] = key.split(':');
      return { input, output, enabled };
    });
    const updated = {
      ...activeProfile,
      audioRouting: { ...activeProfile.audioRouting, routes: audioRoutes },
    };
    addProfile(updated);
    // Intentionally not including activeProfile in deps to avoid infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routes]);

  const toggleRoute = useCallback((input: string, output: string) => {
    const key = `${input}:${output}`;
    setRoutes((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const goxlr = useMemo(
    () => Object.values(devices).find((d) => d.class === 'goxlr'),
    [devices],
  );

  const audioDevices = useMemo(
    () => Object.values(devices).filter((d) => d.class === 'audio-interface'),
    [devices],
  );

  const profileList = useMemo(() => Object.values(profiles), [profiles]);

  const handleActivatePreset = useCallback((profileId: string) => {
    setActiveProfile(profileId);
    const profile = profiles[profileId];
    if (profile?.audioRouting) {
      const loaded: Record<string, boolean> = {};
      for (const route of profile.audioRouting.routes) {
        loaded[`${route.input}:${route.output}`] = route.enabled;
      }
      setRoutes(loaded);
    }
  }, [profiles, setActiveProfile]);

  return (
    <PageShell>
      <PageHeader
        title="Audio Router"
        icon={<AudioLines size={24} />}
      />

      {!goxlr && audioDevices.length === 0 ? (
        <EmptyState
          icon={<AudioLines size={40} />}
          title="No audio devices detected"
          description="Connect a GoXLR mixer or audio interface. The GoXLR utility daemon must be running for full integration."
        />
      ) : null}

      {/* Always show the UI for visual design even without hardware */}
      <div className="space-y-6">
        {/* Voice playground — VoiceDock + VoiceProviderComparator */}
        <VoicePlaygroundSection />

        {/* Faders with source labels */}
        <GlassCard className="p-4">
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">
            Faders
          </h3>
          <div className="flex justify-center gap-8">
            {FADERS.map((name) => {
              const source = FADER_SOURCES[name];
              return (
                <div key={name} className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-1 text-white/30">
                    {source.icon}
                    <span className="text-[10px] font-mono">{source.label}</span>
                  </div>
                  <FaderControl
                    name={name}
                    value={faderValues[name] ?? 0.5}
                    onChange={(v) => setFaderValues((prev) => ({ ...prev, [name]: v }))}
                  />
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Routing matrix — persisted */}
        <RoutingMatrix routes={routes} onToggle={toggleRoute} />

        {/* Mic Monitor */}
        <MicMonitorPanel />

        {/* Presets */}
        <PresetsPanel profiles={profileList} onActivate={handleActivatePreset} />

        {/* Effects + Sampler side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <EffectsPanel />
          <SamplerGrid />
        </div>
      </div>
    </PageShell>
  );
}
