import React from 'react';

/**
 * GoldenHexGridBackground
 * A performant, canvas-based, pulsating hex grid with golden lines and glow.
 *
 * Props:
 * - size: preferred hex radius in px (auto scales by viewport). default: 'auto'
 * - speed: animation speed multiplier. default: 1
 * - bgColor: background color. default: '#000000' (full black)
 * - lowColor: dim line color. default: 'rgba(140,110,10,0.18)'
 * - highColor: bright line color. default: 'rgba(255,215,0,0.30)'
 * - glowColor: glow color. default: 'rgba(255,215,0,0.18)'
 * - lineWidth: base line width in px. default: 0.9
 * - pulseWidth: added line width from pulse. default: 0.9
 * - glowBase: base glow blur. default: 4
 * - glowPulse: added glow blur from pulse. default: 3
 * - opacity: overall canvas opacity (0..1). default: 1
 */
export default function GoldenHexGridBackground({
  size = 'auto',
  speed = 1,
  bgColor = '#000000',
  lowColor = 'rgba(120, 95, 20, 0.08)',
  highColor = 'rgba(255, 215, 0, 0.12)',
  glowColor = 'rgba(255, 215, 0, 0.06)',
  lineWidth = 0.6,
  pulseWidth = 0.25,
  glowBase = 0,
  glowPulse = 0.5,
  opacity = 1,
  className,
  style,
}) {
  const wrapRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const stateRef = React.useRef({ w: 0, h: 0, cells: [], t: 0, s: 32 });

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

      // Density scales with area for performance unless size provided
      const area = w * h;
      const target = typeof size === 'number' && size > 6
        ? size
        : Math.max(20, Math.min(48, Math.floor(Math.sqrt(area) / 26)));
      const s = target; // hex radius (center to vertex)

      const dx = 1.5 * s; // horizontal spacing for pointy-top hexes
      const dy = Math.sqrt(3) * s; // vertical spacing
      const margin = 8;

      const cols = Math.ceil((w - margin * 2) / dx) + 2;
      const rows = Math.ceil((h - margin * 2) / (dy / 2)) + 2; // oversample to fill edges
      const cells = [];
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const cx = margin + c * dx;
          const cy = margin + r * (dy / 2) + (c % 2 ? dy / 4 : 0);
          if (cx < -s || cx > w + s || cy < -s || cy > h + s) continue;
          const phase = (cx * 0.01 + cy * 0.013) % (Math.PI * 2);
          cells.push({ cx, cy, phase });
        }
      }

      stateRef.current = { w, h, cells, t: 0, s };
    };

    const hexPath = (cx, cy, s) => {
      ctx.beginPath();
      const rot = -Math.PI / 2; // pointy-top orientation
      for (let i = 0; i < 6; i++) {
        const a = rot + i * (Math.PI / 3);
        const x = cx + s * Math.cos(a);
        const y = cy + s * Math.sin(a);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
    };

    const draw = () => {
      const st = stateRef.current;
      const { w, h, s } = st;
      st.t += 1;

  // Base
  ctx.globalAlpha = opacity;
  ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, w, h);

  // No vignette: keep pure black background per request

  // Animate subtle drift to feel alive
      const driftX = Math.sin(st.t * 0.0015 * speed) * 0.8;
      const driftY = Math.cos(st.t * 0.0012 * speed) * 0.8;

  // Helper: smoothstep
      const smoothstep = (edge0, edge1, x) => {
        const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
        return t * t * (3 - 2 * t);
      };

      // Draw hex grid
      for (const cell of st.cells) {
        const p = st.t * 0.02 * speed + cell.phase;
        const pulse = 0.5 + 0.5 * Math.sin(p * 0.8);
        const lw = lineWidth + pulse * pulseWidth; // subtle pulsation

        const cx = cell.cx + driftX;
        const cy = cell.cy + driftY;

  // Determine subtle visibility mask to reveal only edges and hide center
  const nx = Math.abs((cx - w * 0.5) / (w * 0.5)); // 0 center -> 1 edges
  const sideMask = smoothstep(0.18, 0.72, nx); // fade in towards edges (a bit wider)
  const alphaMask = sideMask;
  if (alphaMask <= 0.002) continue;

        // Stroke gradient per-hex, very low alpha
  const g = ctx.createLinearGradient(cx - s, cy, cx + s, cy);
  g.addColorStop(0, lowColor);
  g.addColorStop(0.5, highColor);
  g.addColorStop(1, lowColor);

        ctx.strokeStyle = g;
        ctx.lineWidth = lw;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = glowBase + pulse * glowPulse; // typically ~0..0.5

        const sInner = s * (0.985 + 0.015 * Math.sin(p * 0.6));
        hexPath(cx, cy, sInner);
  const prevAlpha = ctx.globalAlpha;
  ctx.globalAlpha = opacity * (0.38 + 0.62 * pulse) * alphaMask * 0.45; // still subtle but more visible
        ctx.stroke();
        ctx.globalAlpha = prevAlpha;
        // No vertex nodes for the subtle look
      }

      // Optional ultra-faint diagonal shadow overlay to emphasize center band
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0.45, 'rgba(0,0,0,0.0)');
      grad.addColorStop(0.50, 'rgba(0,0,0,0.25)');
      grad.addColorStop(0.55, 'rgba(0,0,0,0.0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      raf = requestAnimationFrame(draw);
    };

    setup();
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
    <div
      ref={wrapRef}
      className={className}
      style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', ...style }}
    >
      <canvas ref={canvasRef} />
    </div>
  );
}
