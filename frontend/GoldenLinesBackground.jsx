import React from 'react';

export default function GoldenLinesBackground() {
  const wrapRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const stateRef = React.useRef({ w: 0, h: 0, lines: [], t: 0 });

  React.useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;

    const setup = () => {
      const rect = wrap.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (stateRef.current.w === w && stateRef.current.h === h && canvas.width === w * dpr) return;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Build gentle diagonal lines
      const L = Math.max(12, Math.min(28, Math.floor((w * h) / 70000)));
      const lines = [];
      for (let i = 0; i < L; i++) {
        lines.push({
          y: (h / (L + 1)) * (i + 1) + (Math.random() * 20 - 10),
          amp: 8 + Math.random() * 18,
          speed: 0.004 + Math.random() * 0.006,
          phase: Math.random() * Math.PI * 2,
          tilt: 0.2 + Math.random() * 0.6, // diagonal factor
          width: 0.8 + Math.random() * 0.8,
          glow: 0.3 + Math.random() * 0.5,
          alpha: 0.08 + Math.random() * 0.08,
        });
      }
      stateRef.current = { w, h, lines, t: 0 };
    };

    setup();

    const draw = () => {
      const st = stateRef.current;
      const { w, h } = st;
      st.t += 1;
      // Clean background fully for crispness
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, h);

      // Draw lines
      for (const ln of st.lines) {
        const t = st.t * ln.speed + ln.phase;
        const yBase = ln.y + Math.sin(t) * ln.amp;
        const grad = ctx.createLinearGradient(0, yBase - 10, w, yBase + 10);
        grad.addColorStop(0, 'rgba(166,124,0,0)');
        grad.addColorStop(0.25, `rgba(166,124,0,${ln.alpha * 0.8})`);
        grad.addColorStop(0.5, `rgba(255,215,0,${ln.alpha})`);
        grad.addColorStop(0.75, `rgba(166,124,0,${ln.alpha * 0.8})`);
        grad.addColorStop(1, 'rgba(166,124,0,0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = ln.width;
        ctx.shadowColor = 'rgba(255,215,0,' + (ln.glow * ln.alpha) + ')';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        const segments = 36;
        for (let i = 0; i <= segments; i++) {
          const x = (w / segments) * i;
          const y = yBase + Math.sin(t + i * 0.4) * (ln.amp * 0.35) + x * ln.tilt * 0.02;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    // Resize handling
    let ro;
    const onResize = () => { setup(); };
    if ('ResizeObserver' in window) {
      ro = new ResizeObserver(onResize);
      ro.observe(wrap);
    } else {
      window.addEventListener('resize', onResize);
    }

    return () => {
      cancelAnimationFrame(raf);
      if (ro) ro.disconnect(); else window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div ref={wrapRef} style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
