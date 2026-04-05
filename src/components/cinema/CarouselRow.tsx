import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { staggerContainer } from '../../lib/animations';
import type { LucideIcon } from 'lucide-react';

interface CarouselRowProps {
  title: string;
  icon?: LucideIcon;
  accentColor?: string;
  onSeeAll?: () => void;
  children: React.ReactNode;
}

export default function CarouselRow({ title, icon: Icon, accentColor, onSeeAll, children }: CarouselRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  function checkScroll() {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) el.addEventListener('scroll', checkScroll, { passive: true });
    return () => el?.removeEventListener('scroll', checkScroll);
  }, [children]);

  function scroll(dir: 'left' | 'right') {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  }

  return (
    <div className="carousel-row" style={{ '--carousel-accent': accentColor || 'var(--cyan)' } as React.CSSProperties}>
      <div className="carousel-header">
        <div className="carousel-title-group">
          {Icon && <Icon size={16} style={{ color: 'var(--carousel-accent)' }} />}
          <h3 className="carousel-title">{title}</h3>
        </div>
        {onSeeAll && (
          <button className="carousel-see-all" onClick={onSeeAll}>
            See All <ChevronRight size={12} />
          </button>
        )}
      </div>

      <div className="carousel-track-wrapper">
        {canScrollLeft && (
          <button className="carousel-arrow carousel-arrow-left" onClick={() => scroll('left')}>
            <ChevronLeft size={18} />
          </button>
        )}

        <motion.div
          className="carousel-track"
          ref={scrollRef}
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          {children}
        </motion.div>

        {canScrollRight && (
          <button className="carousel-arrow carousel-arrow-right" onClick={() => scroll('right')}>
            <ChevronRight size={18} />
          </button>
        )}

        {canScrollLeft && <div className="carousel-fade carousel-fade-left" />}
        {canScrollRight && <div className="carousel-fade carousel-fade-right" />}
      </div>
    </div>
  );
}
