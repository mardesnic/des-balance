import { useEffect, useRef } from 'react';

const COUNT = 160;

// Pieces take the theme's colors, plus a few festive ones.
const themeColors = () => {
  const style = getComputedStyle(document.documentElement);
  return [
    ...['--accent', '--wrong', '--selected'].map((v) =>
      style.getPropertyValue(v).trim()
    ),
    '#fde68a',
    '#f472b6',
    '#a7f3d0',
    '#6366f1',
  ].filter(Boolean);
};

// Confetti that drops from the top of the screen once, then calls onDone
// when the last piece has fallen off the bottom.
export function Confetti({ onDone }: { onDone: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext('2d');
    if (!el || !ctx || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      done.current();
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      el.width = innerWidth * dpr;
      el.height = innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const colors = themeColors();
    const pieces = Array.from({ length: COUNT }, () => ({
      x: Math.random() * innerWidth,
      y: -20 - Math.random() * innerHeight * 0.6, // staggered start above the top
      w: 6 + Math.random() * 6,
      h: 8 + Math.random() * 8,
      vy: 120 + Math.random() * 160, // px per second
      sway: 20 + Math.random() * 40,
      phase: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 12, // radians per second
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    const start = performance.now();
    let frame = requestAnimationFrame(function draw(now) {
      const t = (now - start) / 1000;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      let falling = 0;
      for (const p of pieces) {
        const y = p.y + p.vy * t + 40 * t * t;
        if (y > innerHeight + 20) continue;
        falling++;
        const x = p.x + Math.sin(p.phase + t * 2) * p.sway;
        const angle = p.phase + p.spin * t;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        // Squash the width as it turns, like paper flipping over.
        ctx.scale(Math.cos(angle * 1.5), 1);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (falling) frame = requestAnimationFrame(draw);
      else done.current();
    });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvas} className='confetti' aria-hidden='true' />;
}
