import { useRef, useEffect } from 'react';

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    // Matrix-style character set
    const chars = 'MCVONE EDGEIQ AEGIS 01アイウエオカキクケコ░▒▓█∞∑∏∂∆';
    const fontSize = 11;
    let columns = 0;
    let drops: number[] = [];
    let speeds: number[] = [];
    let brightnesses: number[] = [];

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      columns = Math.floor(canvas.width / fontSize);
      drops = Array(columns).fill(0).map(() => Math.random() * -100);
      speeds = Array(columns).fill(0).map(() => 0.3 + Math.random() * 0.7);
      brightnesses = Array(columns).fill(0).map(() => 0.3 + Math.random() * 0.7);
    }

    resize();
    window.addEventListener('resize', resize);

    function draw() {
      if (!canvas || !ctx) return;
      time++;

      // Fade effect — semi-transparent black overlay
      ctx.fillStyle = 'rgba(2, 4, 8, 0.06)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px "JetBrains Mono", monospace`;

      for (let i = 0; i < columns; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Leading character — bright cyan
        const b = brightnesses[i];
        ctx.fillStyle = `rgba(0, 240, 255, ${0.7 * b})`;
        ctx.fillText(char, x, y);

        // Trail characters — dimmer, with purple tint on some
        if (Math.random() > 0.7) {
          const trailChar = chars[Math.floor(Math.random() * chars.length)];
          const trailY = (drops[i] - 1 - Math.floor(Math.random() * 4)) * fontSize;
          const isPurple = Math.random() > 0.85;
          if (isPurple) {
            ctx.fillStyle = `rgba(139, 92, 246, ${0.15 * b})`;
          } else {
            ctx.fillStyle = `rgba(0, 240, 255, ${0.08 * b})`;
          }
          ctx.fillText(trailChar, x, trailY);
        }

        // Advance drop
        drops[i] += speeds[i];

        // Reset when off screen (with randomness for organic feel)
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.98) {
          drops[i] = Math.random() * -20;
          speeds[i] = 0.3 + Math.random() * 0.7;
          brightnesses[i] = 0.3 + Math.random() * 0.7;
        }
      }

      // Subtle scan line effect
      if (time % 120 < 2) {
        const scanY = (time * 3) % canvas.height;
        ctx.fillStyle = 'rgba(0, 240, 255, 0.015)';
        ctx.fillRect(0, scanY, canvas.width, 2);
      }

      animationId = requestAnimationFrame(draw);
    }

    animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        pointerEvents: 'none',
        opacity: 0.4,
      }}
    />
  );
}
