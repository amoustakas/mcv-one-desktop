import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Share2, Sparkles } from 'lucide-react';
import StorageProviderBadge from '../files/StorageProviderBadge';
import type { StorageProviderId } from '../../lib/storage/types';

interface SpotlightItem {
  id: string;
  title: string;
  subtitle: string;
  aiSummary?: string;
  thumbnail?: string;
  provider: StorageProviderId;
  ventureLabel?: string;
  ventureColor?: string;
}

interface Props {
  items: SpotlightItem[];
  onOpen?: (id: string) => void;
  onShare?: (id: string) => void;
  onAiBrief?: (id: string) => void;
}

export default function HeroSpotlight({ items, onOpen, onShare, onAiBrief }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const advance = useCallback(() => {
    if (items.length <= 1) return;
    setActiveIndex(i => (i + 1) % items.length);
  }, [items.length]);

  useEffect(() => {
    if (paused || items.length <= 1) return;
    const timer = setInterval(advance, 8000);
    return () => clearInterval(timer);
  }, [paused, advance, items.length]);

  if (items.length === 0) return null;
  const item = items[activeIndex];

  return (
    <div
      className="hero-spotlight"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={item.id}
          className="hero-spotlight-inner"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          {item.thumbnail && (
            <div className="hero-spotlight-bg" style={{ backgroundImage: `url(${item.thumbnail})` }} />
          )}
          <div className="hero-spotlight-gradient" />

          <div className="hero-spotlight-content">
            {item.ventureLabel && (
              <span className="hero-venture-badge" style={{ borderColor: item.ventureColor }}>
                {item.ventureLabel}
              </span>
            )}
            <h2 className="hero-title">{item.title}</h2>
            <p className="hero-subtitle">{item.subtitle}</p>
            {item.aiSummary && <p className="hero-summary">{item.aiSummary}</p>}
            <div className="hero-actions">
              <button className="hero-btn hero-btn-primary" onClick={() => onOpen?.(item.id)}>
                <ExternalLink size={14} /> Open
              </button>
              <button className="hero-btn" onClick={() => onShare?.(item.id)}>
                <Share2 size={14} /> Share
              </button>
              <button className="hero-btn" onClick={() => onAiBrief?.(item.id)}>
                <Sparkles size={14} /> AI Brief
              </button>
            </div>
          </div>

          <div className="hero-provider">
            <StorageProviderBadge provider={item.provider} />
          </div>
        </motion.div>
      </AnimatePresence>

      {items.length > 1 && (
        <div className="hero-dots">
          {items.map((_, i) => (
            <button
              key={i}
              className={`hero-dot ${i === activeIndex ? 'active' : ''}`}
              onClick={() => setActiveIndex(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
