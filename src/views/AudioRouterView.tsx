import { useState, useMemo } from 'react';
import {
  AudioLines, Volume2, Mic, Headphones, Radio,
  Music, MessageSquare, Monitor, Sparkles,
} from 'lucide-react';
import { PageShell, PageHeader, GlassCard, EmptyState } from '../components/ui';
import { useDeviceStore } from '../stores/devices';
import { cn } from '../lib/utils';

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

const FADERS = ['A', 'B', 'C', 'D'];

function RoutingMatrix() {
  const [routes, setRoutes] = useState<Record<string, boolean>>({});

  function toggleRoute(input: string, output: string) {
    const key = `${input}:${output}`;
    setRoutes((prev) => ({ ...prev, [key]: !prev[key] }));
  }

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
                      onClick={() => toggleRoute(inp.id, out.id)}
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

export default function AudioRouterView() {
  const { devices } = useDeviceStore();
  const [faderValues, setFaderValues] = useState<Record<string, number>>({
    A: 0.75, B: 0.6, C: 0.5, D: 0.4,
  });

  const goxlr = useMemo(
    () => Object.values(devices).find((d) => d.class === 'goxlr'),
    [devices],
  );

  const audioDevices = useMemo(
    () => Object.values(devices).filter((d) => d.class === 'audio-interface'),
    [devices],
  );

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
        {/* Faders */}
        <GlassCard className="p-4">
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">
            Faders
          </h3>
          <div className="flex justify-center gap-8">
            {FADERS.map((name) => (
              <FaderControl
                key={name}
                name={name}
                value={faderValues[name] ?? 0.5}
                onChange={(v) => setFaderValues((prev) => ({ ...prev, [name]: v }))}
              />
            ))}
          </div>
        </GlassCard>

        {/* Routing matrix */}
        <RoutingMatrix />

        {/* Effects + Sampler side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <EffectsPanel />
          <SamplerGrid />
        </div>
      </div>
    </PageShell>
  );
}
