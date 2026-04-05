import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Grid3x3, ChevronLeft, ChevronRight, Settings, Download, Upload } from 'lucide-react';
import { PageShell, PageHeader, GlassCard, EmptyState, Button } from '../components/ui';
import { staggerContainer, fadeInUp } from '../lib/animations';
import { useDeviceStore } from '../stores/devices';
import type { StreamDeckButton, StreamDeckPage } from '../lib/devices/types';
import { cn } from '../lib/utils';

const GRID_LAYOUTS: Record<string, { cols: number; rows: number }> = {
  mini: { cols: 3, rows: 2 },
  mk2: { cols: 5, rows: 3 },
  xl: { cols: 8, rows: 4 },
  plus: { cols: 4, rows: 2 },
  pedal: { cols: 3, rows: 1 },
};

function StreamDeckButtonCell({
  button,
  index,
  onSelect,
  isSelected,
}: {
  button?: StreamDeckButton;
  index: number;
  onSelect: (index: number) => void;
  isSelected: boolean;
}) {
  return (
    <motion.button
      variants={fadeInUp}
      onClick={() => onSelect(index)}
      className={cn(
        'aspect-square rounded-lg border-2 flex flex-col items-center justify-center gap-1 transition-all',
        'hover:border-cyan-400/60 hover:bg-white/5 cursor-pointer',
        isSelected
          ? 'border-cyan-400 bg-cyan-400/10 shadow-[0_0_12px_rgba(0,240,255,0.2)]'
          : 'border-white/10 bg-white/[0.02]',
      )}
      style={button?.color ? { backgroundColor: `${button.color}20` } : undefined}
    >
      {button?.icon ? (
        <img src={button.icon} alt="" className="w-8 h-8 rounded" />
      ) : (
        <span className="text-white/20 text-xs font-mono">{index + 1}</span>
      )}
      {button?.label && (
        <span className="text-[10px] text-white/60 truncate max-w-full px-1">
          {button.label}
        </span>
      )}
    </motion.button>
  );
}

export default function StreamDeckView() {
  const { devices, profiles, activeProfileId } = useDeviceStore();
  const [selectedButton, setSelectedButton] = useState<number | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const streamDecks = useMemo(
    () => Object.values(devices).filter((d) => d.class === 'stream-deck'),
    [devices],
  );

  const activeProfile = activeProfileId ? profiles[activeProfileId] : null;
  const pages = activeProfile?.streamDeckPages ?? [];
  const currentPage = pages[currentPageIndex] as StreamDeckPage | undefined;

  // Determine grid from first connected Stream Deck, fallback to mk2 (15 button)
  const layout = useMemo(() => {
    const deck = streamDecks.find((d) => d.status === 'connected');
    const model = (deck?.model ?? 'mk2').toLowerCase();
    if (model.includes('xl')) return GRID_LAYOUTS.xl;
    if (model.includes('mini')) return GRID_LAYOUTS.mini;
    if (model.includes('plus')) return GRID_LAYOUTS.plus;
    if (model.includes('pedal')) return GRID_LAYOUTS.pedal;
    return GRID_LAYOUTS.mk2;
  }, [streamDecks]);

  const totalButtons = layout.cols * layout.rows;
  const buttonMap = useMemo(() => {
    const map: Record<number, StreamDeckButton> = {};
    for (const btn of currentPage?.buttons ?? []) {
      map[btn.index] = btn;
    }
    return map;
  }, [currentPage]);

  return (
    <PageShell>
      <PageHeader
        title="Stream Deck"
        icon={<Grid3x3 size={24} />}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button variant="ghost" size="sm"><Download size={14} /> Import</Button>
          <Button variant="ghost" size="sm"><Upload size={14} /> Export</Button>
        </div>
      </PageHeader>

      {streamDecks.length === 0 ? (
        <EmptyState
          icon={<Grid3x3 size={40} />}
          title="No Stream Deck connected"
          description="Connect an Elgato Stream Deck via USB. Supported: Mini, MK.2, XL, Plus, Pedal."
        />
      ) : (
        <div className="flex gap-6">
          {/* Button grid */}
          <div className="flex-1">
            {/* Page navigation */}
            {pages.length > 0 && (
              <div className="flex items-center gap-3 mb-4">
                <Button
                  variant="ghost" size="sm"
                  disabled={currentPageIndex <= 0}
                  onClick={() => setCurrentPageIndex((i) => Math.max(0, i - 1))}
                >
                  <ChevronLeft size={14} />
                </Button>
                <span className="text-sm text-white/60">
                  Page {currentPageIndex + 1} of {pages.length}
                  {currentPage?.name && ` — ${currentPage.name}`}
                </span>
                <Button
                  variant="ghost" size="sm"
                  disabled={currentPageIndex >= pages.length - 1}
                  onClick={() => setCurrentPageIndex((i) => Math.min(pages.length - 1, i + 1))}
                >
                  <ChevronRight size={14} />
                </Button>
              </div>
            )}

            {/* Grid */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid gap-3"
              style={{
                gridTemplateColumns: `repeat(${layout.cols}, 1fr)`,
              }}
            >
              {Array.from({ length: totalButtons }, (_, i) => (
                <StreamDeckButtonCell
                  key={i}
                  index={i}
                  button={buttonMap[i]}
                  isSelected={selectedButton === i}
                  onSelect={setSelectedButton}
                />
              ))}
            </motion.div>
          </div>

          {/* Button config panel */}
          <div className="w-72 shrink-0">
            <GlassCard className="p-4">
              {selectedButton !== null ? (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-white">
                    Button {selectedButton + 1}
                  </h3>
                  <div>
                    <label className="text-xs text-white/40 block mb-1">Label</label>
                    <input
                      type="text"
                      className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-1.5 text-sm text-white placeholder:text-white/20 focus:border-cyan-400/50 focus:outline-none"
                      placeholder="Button label..."
                      defaultValue={buttonMap[selectedButton]?.label ?? ''}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 block mb-1">Action</label>
                    <select className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-1.5 text-sm text-white focus:border-cyan-400/50 focus:outline-none">
                      <option value="">No action</option>
                      <option value="navigate">Navigate to view</option>
                      <option value="kit-tool">Execute kit tool</option>
                      <option value="agent-command">Send agent command</option>
                      <option value="webhook">Fire webhook</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-white/40 block mb-1">Color</label>
                    <div className="flex gap-2">
                      {['#00F0FF', '#8B5CF6', '#10B981', '#EF4444', '#F59E0B', '#3B82F6'].map((c) => (
                        <button
                          key={c}
                          className="w-6 h-6 rounded border border-white/10 hover:scale-110 transition-transform"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-white/30 text-sm py-8">
                  <Settings size={24} className="mx-auto mb-2 opacity-50" />
                  Select a button to configure
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      )}
    </PageShell>
  );
}
