import React, { useState, useEffect, Suspense } from "react";
import ReactDOM from "react-dom";
import { useMobileDetection } from "./utils/deviceDetection";

// Lazy-load heavier views to shrink initial bundle
const AdminPanel = React.lazy(() => import("./AdminPanel"));
const PageBuilder = React.lazy(() => import("./PageBuilder"));
const AuthForm = React.lazy(() => import("./AuthForm"));
const ContactForm = React.lazy(() => import("./ContactForm"));
const ArcadePage = React.lazy(() => import("./ArcadePage"));
const WhatsAppWidget = React.lazy(() => import("./WhatsAppWidget"));
const Prices = React.lazy(() => import("./Prices"));
const MobileApp = React.lazy(() => import("./MobileApp"));
import logo from "./media/pics/logo.png";
import GoldenLinesBackground from "./GoldenLinesBackground";
// Removed GoldenHexGridBackground background component
import ErrorBoundary from "./ErrorBoundary";
// Portal-based Modal for image preview
function ImageModal({ url, onClose }) {
  return ReactDOM.createPortal(
    <>
      <style>{`
        .modal-img-anim {
          animation: modalScaleIn 0.33s cubic-bezier(.4,2,.6,1) both;
        }
        @keyframes modalScaleIn {
          0% { transform: scale(0.7); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fadein" onClick={onClose}>
        <img
          src={url}
          alt="Preview"
          className="modal-img-anim"
          style={{
            maxHeight: '90vh',
            maxWidth: '90vw',
            borderRadius: '1.2rem',
            objectFit: 'contain',
            boxShadow: '0 0 32px #000',
            border: '4px solid #ffd700',
            width: 'auto',
            height: 'auto',
            display: 'block',
          }}
        />
      </div>
    </>,
    document.body
  );
}

// Main navigation menu items
const menuItems = [
  { key: "home", label: "Home" },
  { key: "prices", label: "Prices" },
  { key: "creations", label: "Creations" },
  { key: "education", label: "Education" },
  { key: "work", label: "Work History" },
  { key: "gallery", label: "Gallery" },
  { key: "contact", label: "Contact" },
];

// Left sidebar menu items
const leftMenuItems = [
  { key: "placeholder2", label: "Infra Map" },
  { key: "placeholder1", label: "Sysadmin Dashboard" },
  { key: "arcade", label: "Arcade", href: "/arcade.html" },
];

const adminLeftMenuItems = [
  { key: "admin-users", label: "Users" },
  { key: "admin-pages", label: "Edit Pages" },
];

const lorem = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque euismod, nisi eu consectetur consectetur, nisl nisi consectetur nisi, euismod euismod nisi nisi euismod. Pellentesque euismod, nisi eu consectetur consectetur, nisl nisi consectetur nisi, euismod euismod nisi nisi euismod. Vivamus euismod, nisi eu consectetur consectetur, nisl nisi consectetur nisi, euismod euismod nisi nisi euismod. Pellentesque euismod, nisi eu consectetur consectetur, nisl nisi consectetur nisi, euismod euismod nisi nisi euismod.

Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.`;
const loremLong = Array(30).fill(lorem).join(" ");


function DynamicPage({ pageKey, emptyLabel }) {
  const [blocks, setBlocks] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    let isMounted = true;
    async function fetchPage() {
      setLoading(true);
      try {
        // Do not send Authorization header for public fetch
        const res = await fetch(`/api/pages/${pageKey}`);
        if (res.ok) {
          const data = await res.json();
          if (data.content) {
            const parsed = JSON.parse(data.content);
            if (isMounted) setBlocks(parsed);
          } else {
            if (isMounted) setBlocks(null);
          }
        } else {
          if (isMounted) setBlocks(null);
        }
      } catch {
        if (isMounted) setBlocks(null);
      }
      setLoading(false);
    }
    fetchPage();
    return () => { isMounted = false; };
  }, [pageKey]);

  if (loading) return <div className="text-gold">Loading...</div>;
  if (!blocks || !Array.isArray(blocks) || blocks.length === 0) return (
    <div className="text-gold text-center py-8">
      <div className="text-4xl mb-4">{emptyLabel || "No content."}</div>
      <div className="text-lg">{`It seems there's no content available for this section yet. Check back later!`}</div>
    </div>
  );
  // Use setModalImg from App via props
  const setModalImg = window.setModalImgGlobal;
  // Helper to open contact with optional overrides
  const openContact = (overrides) => {
    try {
      window.dispatchEvent(new CustomEvent('open-order', { detail: overrides || null }));
    } catch {}
  };

  function useContainerWidth() {
    const ref = React.useRef(null);
    const [w, setW] = React.useState(0);
    React.useEffect(() => {
      function onResize(){ if (ref.current) setW(ref.current.clientWidth); }
      onResize();
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }, []);
    return [ref, w];
  }

  function RenderBlock(b, key) {
    return b.type === "text" ? (
      <div key={key} className="mb-2 w-full" style={{fontSize: '1.1rem', border: '1px solid transparent'}} dangerouslySetInnerHTML={{ __html: b.content }} />
    ) : b.type === "image" ? (
      <img key={key} src={b.url} alt="" style={{ width: (b.width || 400) + "px", maxWidth: "100%", cursor: 'pointer', border: '1px solid transparent' }} className="my-2 mx-auto hover:scale-105 transition-transform" onClick={() => setModalImg(b.url)} />
    ) : b.type === "video" ? (
      <video key={key} controls src={b.url} style={{ width: (b.width || 640) + "px", maxWidth: "100%", border: '1px solid transparent' }} className="my-2 mx-auto" />
    ) : b.type === "audio" ? (
      <audio key={key} controls src={b.url} style={{ width: '100%', border: '1px solid transparent' }} className="my-2" />
    ) : b.type === "gallery" ? (
      <div key={key} className="flex flex-wrap gap-2 justify-center">
        {(b.images || []).map((url, i) => url && (
          <img key={i} src={url} alt="" style={{ width: '180px', maxWidth: '100%', cursor: 'pointer', border: '1px solid transparent' }} className="my-2 hover:scale-105 transition-transform" onClick={() => setModalImg(url)} />
        ))}
      </div>
    ) : b.type === "button" ? (
      <button key={key} className="order-btn w-56" onClick={() => {
        if (b.action === 'url' && b.url) {
          const target = b.newTab ? '_blank' : '_self';
          window.open(b.url, target);
          return;
        }
        openContact({ title: b.subject || 'Contact', subject: b.subject, message: b.message });
      }}>{b.label || 'Button'}</button>
    ) : null;
  }

  function PanelLayoutView({ block }) {
    const [ref, width] = useContainerWidth();
    const cols = block.cols ?? 12;
    const rowHeight = block.rowHeight ?? 30;
    const [mx, my] = block.margin ?? [10,10];
    const colWidth = cols > 0 ? Math.max(1, (width - (cols - 1) * mx) / cols) : width;
    const layout = Array.isArray(block.layout) ? block.layout : [];
    const panels = block.panels || {};
    return (
      <div ref={ref} className="relative w-full" style={{ minHeight: 80 }}>
        {layout.map(item => {
          const left = item.x * (colWidth + mx);
          const top = item.y * (rowHeight + my);
          const wPx = item.w * colWidth + (item.w - 1) * mx;
          const hPx = item.h * rowHeight + (item.h - 1) * my;
          return (
            <div key={item.i} className="absolute border border-gold bg-black/70 rounded-sm overflow-auto" style={{ left, top, width: wPx, height: hPx }}>
              <div className="p-2 flex flex-col gap-2">
                {(panels[item.i]?.blocks || []).map((ib, idx) => RenderBlock(ib, `${item.i}-${idx}`))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-4 p-4 items-center text-center"
      style={{
        border: '1px solid transparent',
        minHeight: '120px',
        width: '120%',
        maxWidth: '1400px',
        marginLeft: '5%',
        marginRight: 'auto',
        marginTop: '40px',
        boxSizing: 'border-box',
      }}
    >
      {blocks.map((block, idx) =>
        block.type === 'panelLayout' ? (
          <PanelLayoutView key={idx} block={block} />
        ) : (
          RenderBlock(block, idx)
        )
      )}
    </div>
  );
}

function SysadminDashboard() {
  const [sys, setSys] = React.useState(null);
  const [procs, setProcs] = React.useState([]);
  const [checks, setChecks] = React.useState({});
  const [authError, setAuthError] = React.useState(null);
  const [demo, setDemo] = React.useState(false);
  React.useEffect(() => {
    let alive = true;
    async function loadAll() {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const [sysRes, procRes] = await Promise.all([
          fetch('/api/metrics/system', { headers }),
          fetch('/api/metrics/processes?limit=10', { headers }),
        ]);
        if (sysRes.status === 401 || sysRes.status === 403 || procRes.status === 401 || procRes.status === 403) {
          if (!alive) return;
          // Public-safe demo data fallback
          setDemo(true);
          setAuthError(null);
          setSys({
            cpu_percent: 37,
            memory: { total: 8e9, available: 5.2e9, percent: 35, used: 2.8e9, free: 5.2e9 },
            disks: [
              { device: '/dev/sda1', mountpoint: '/', fstype: 'ext4', total: 64e9, used: 24e9, free: 40e9, percent: 37 },
              { device: '/dev/sdb1', mountpoint: '/data', fstype: 'ext4', total: 256e9, used: 128e9, free: 128e9, percent: 50 },
            ],
            boot_time: Date.now()/1000 - 86400 * 5,
            load_avg: [0.42, 0.38, 0.35],
            pid_count: 143,
          });
          setProcs([
            { pid: 101, name: 'node', username: 'www-data', cpu_percent: 12.5, memory_percent: 1.2 },
            { pid: 202, name: 'python3', username: 'api', cpu_percent: 8.3, memory_percent: 2.1 },
            { pid: 303, name: 'postgres', username: 'postgres', cpu_percent: 4.1, memory_percent: 3.4 },
            { pid: 404, name: 'nginx', username: 'root', cpu_percent: 2.7, memory_percent: 0.6 },
            { pid: 505, name: 'redis-server', username: 'redis', cpu_percent: 1.8, memory_percent: 0.4 },
          ]);
          return;
        }
        const sysData = await sysRes.json();
        const procData = await procRes.json();
        if (alive) { setSys(sysData); setProcs(procData); setAuthError(null); setDemo(false); }
      } catch {}
    }
    loadAll();
    const t = setInterval(loadAll, 5000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  async function runChecks() {
    if (demo) {
      setChecks({ ssh: { open: true }, httpItsusi: { ok: true, status_code: 200 }, httpLocal: { ok: true, status_code: 200 } });
      return;
    }
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const [ssh, httpItsusi, httpLocal] = await Promise.all([
      fetch('/api/checks/port?host=127.0.0.1&port=22', { headers }).then(r=>r.json()).catch(()=>({ok:false})),
      fetch('/api/checks/http?url=https://itsusi.eu', { headers }).then(r=>r.json()).catch(()=>({ok:false})),
      fetch('/api/checks/http?url=http://192.168.0.90/health', { headers }).then(r=>r.json()).catch(()=>({ok:false})),
    ]);
    setChecks({ ssh, httpItsusi, httpLocal });
  }

  React.useEffect(() => { runChecks(); }, [demo]);

  return (
    <div className="w-full p-4 flex flex-col items-center">
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-4" style={{ transform: 'translateX(10%)' }}>
        <div className="text-3xl font-bold text-center">Sysadmin Dashboard {demo && <span className="text-xs align-middle text-gold/70">(Demo)</span>}</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-gold p-3 bg-black">
          <div className="text-gold/70">CPU</div>
          <div className="text-4xl">{sys ? `${sys.cpu_percent}%` : '—'}</div>
        </div>
        <div className="border border-gold p-3 bg-black">
          <div className="text-gold/70">Memory</div>
          <div className="text-xl">{sys ? `${(sys.memory.used/1e9).toFixed(1)} / ${(sys.memory.total/1e9).toFixed(1)} GB (${sys.memory.percent}%)` : '—'}</div>
        </div>
        <div className="border border-gold p-3 bg-black">
          <div className="text-gold/70">Uptime</div>
          <div className="text-xl">{sys ? new Date(sys.boot_time*1000).toLocaleString() : '—'}</div>
        </div>
        </div>
        <div className="border border-gold p-3 bg-black">
        <div className="text-xl mb-2">Disks</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sys?.disks?.map((d,i)=> (
            <div key={i} className="border border-gold p-2">
              <div className="text-gold/70">{d.device} — {d.mountpoint}</div>
              <div>{(d.used/1e9).toFixed(1)} / {(d.total/1e9).toFixed(1)} GB ({d.percent}%)</div>
              <div className="w-full bg-gold/10 h-2 mt-1">
                <div className="bg-gold h-2" style={{ width: `${d.percent}%` }}/>
              </div>
            </div>
          ))}
        </div>
        </div>
        <div className="border border-gold p-3 bg-black">
        <div className="text-xl mb-2">Top processes (CPU)</div>
        <div className="text-sm grid grid-cols-6 gap-2 border-b border-gold/30 pb-1">
          <div>PID</div><div>Name</div><div>User</div><div>CPU%</div><div>Mem%</div><div></div>
        </div>
        {procs.map(p => (
          <div key={p.pid} className="text-sm grid grid-cols-6 gap-2 py-1 border-b border-gold/10">
            <div>{p.pid}</div>
            <div className="truncate" title={p.name}>{p.name}</div>
            <div className="truncate" title={p.username}>{p.username}</div>
            <div>{p.cpu_percent?.toFixed?.(1) ?? p.cpu_percent}</div>
            <div>{p.memory_percent?.toFixed?.(1) ?? p.memory_percent}</div>
            <div></div>
          </div>
        ))}
        </div>
        <div className="border border-gold p-3 bg-black">
        <div className="text-xl mb-2">Service checks</div>
        <div className="flex gap-3 flex-wrap">
          <div className={`border p-2 ${checks.ssh?.open ? 'border-green-500' : 'border-red-500'}`}>SSH 127.0.0.1:22 — {checks.ssh?.open ? 'Open' : 'Closed'}</div>
          <div className={`border p-2 ${checks.httpItsusi?.ok ? 'border-green-500' : 'border-red-500'}`}>itsusi.eu — {checks.httpItsusi?.status_code || checks.httpItsusi?.error || '—'}</div>
          <div className={`border p-2 ${checks.httpLocal?.ok ? 'border-green-500' : 'border-red-500'}`}>Backend /health — {checks.httpLocal?.status_code || checks.httpLocal?.error || '—'}</div>
          <button className="header-btn" onClick={runChecks}>Re-run</button>
        </div>
        </div>
      </div>
    </div>
  );
}

function useAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function AnimatedInfraCanvas({ ok, width = 720, height = 420, name = 'infra-main', planetNames = [], planetsCount = 6, visitors = [] }) {
  const ref = React.useRef(null);
  const stateRef = React.useRef(null);
  React.useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    canvas.id = name;
    canvas.setAttribute('data-name', name);
  // ensure no visible border on canvas
  canvas.style.border = 'none';
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = width / 2;
    const cy = height / 2;
    // Render zoom and padding (keep planets away from edges)
    const zoom = 1.2; // was 1.4
    const rScale = 1.35; // slightly smaller bodies for clearance
    const pad = 40; // screen padding in px
    const SX = (x) => cx + (x - cx) * zoom;
    const SY = (y) => cy + (y - cy) * zoom;

  // Initialize simulation state (once per canvas size change)
  if (!stateRef.current || stateRef.current.w !== width || stateRef.current.h !== height || stateRef.current.N !== Math.max(3, planetsCount | 0)) {
      const rand = (min, max) => Math.random() * (max - min) + min;
      const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
      const stars = Array.from({ length: Math.floor((width * height) / 6000) }, () => ({
        x: rand(0, width), y: rand(0, height), r: rand(0.4, 1.4), b: rand(0.25, 0.7), s: rand(0.0002, 0.0015), p: Math.random() * Math.PI * 2, tw: 0,
      }));
  const colors = ['#9ddcff', '#ffd59c', '#ff9cc8', '#a0ffa0', '#e0a0ff', '#9ce2ff'];
      const G = 10;
      const sun = { type: 'sun', x: cx, y: cy, vx: 0, vy: 0, m: 2800, r: Math.max(28, Math.min(42, Math.min(width, height) * 0.045)) };
      // Compute safe maximum orbital radius so drawn orbit (with zoom) fits inside canvas minus padding
      const maxOrbitDraw = Math.min(width, height) / 2 - pad;
      const maxOrbitR = Math.max(100, (maxOrbitDraw / zoom) - (sun.r * rScale) - 10);
  const N = Math.max(3, planetsCount | 0);
      const minR = Math.max(160, sun.r * 3); // keep planets away from sun; sparser inner system
      const bodies = [sun];
      // create evenly spaced orbits with slight jitter for sparsity
  const V = Array.isArray(visitors) ? visitors.slice(0, Math.max(0, N)) : [];
      for (let i = 0; i < N; i++) {
        const baseR = minR + ((i + 1) * (Math.max(minR + 40, maxOrbitR) - minR)) / (N + 1);
        const R = Math.max(minR, Math.min(maxOrbitR, baseR + rand(-20, 20)));
        const ang = rand(0, Math.PI * 2);
        const x = cx + Math.cos(ang) * R;
        const y = cy + Math.sin(ang) * R;
        const vCirc = Math.sqrt((G * sun.m) / R);
        const vx = -Math.sin(ang) * vCirc;
        const vy = Math.cos(ang) * vCirc;
        const m = rand(4, 10);
        const r = Math.max(4, m * 0.9);
  const vis = V[i];
  const osLetter = vis?.os && typeof vis.os === 'string' ? vis.os[0]?.toUpperCase?.() : undefined;
  const nameP = `u-${i + 1}`;
        const color = pick(colors);
        const trail = [];
        // multiple moons for richer look
        const moons = [];
        const moonCount = Math.random() < 0.85 ? (1 + Math.floor(Math.random() * 3)) : 0;
        for (let k = 0; k < moonCount; k++) {
          moons.push({ ang: rand(0, Math.PI * 2), r: rand(12, 28) + k * 6, speed: rand(0.0025, 0.0065) * (1 - k * 0.15), size: rand(1.8, 3.8), alive: true, respawn: 0 });
        }
  bodies.push({ type: 'planet', x, y, vx, vy, m, r, color, name: nameP, orbitR: R, active: true, respawn: 0, trail, moons, explosion: [], os: osLetter, isSelf: !!vis?.self, isReal: !!vis && !vis?.sim });
      }
      const anomalies = [];
      // asteroid belts
      const scaleFac = Math.sqrt((width * height) / (960 * 540));
      const belts = [
        {
          r: minR + (maxOrbitR - minR) * 0.5,
          thickness: 22,
          particles: Array.from({ length: Math.floor(180 * scaleFac) }, () => ({ ang: rand(0, Math.PI * 2), rad: rand(-11, 11), speed: rand(0.001, 0.003), size: rand(0.5, 1.2), hue: rand(40, 65) })),
        },
        {
          r: minR + (maxOrbitR - minR) * 0.85,
          thickness: 28,
          particles: Array.from({ length: Math.floor(220 * scaleFac) }, () => ({ ang: rand(0, Math.PI * 2), rad: rand(-14, 14), speed: rand(0.0006, 0.0018), size: rand(0.4, 1.0), hue: rand(200, 220) })),
        },
      ];
      const plasma = {
        layers: Array.from({ length: 6 }, (_, i) => ({
          amp: 2 + i * 1.2, freq: 2 + (i % 3), speed: 0.002 + i * 0.0015, thickness: 0.6 + i * 0.35, radiusMul: 1.05 + i * 0.06, alpha: Math.max(0.06, 0.16 - i * 0.02), phase: Math.random() * Math.PI * 2,
        })),
        flares: [],
      };
  stateRef.current = { t: 0, w: width, h: height, N, stars, bodies, G, anomalies, belts, plasma, blackHoles: [], cfg: { zoom, rScale, pad, maxOrbitR, minR } };
    }

    let raf;
    const step = () => {
      const st = stateRef.current; if (!st) return;
      const { zoom, rScale, pad, maxOrbitR } = st.cfg || { zoom, rScale, pad, maxOrbitR: Math.min(width, height)/2 };
      st.t += 1;
      // Background
      ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, width, height);
      // Stars
      for (const s of st.stars) {
        s.p += s.s; if (s.tw > 0) s.tw -= 1; else if (Math.random() < 0.001) s.tw = Math.floor(150 + Math.random() * 220);
        const baseA = 0.28 + 0.22 * Math.sin(s.p);
        const amp = s.tw > 0 ? 1.4 : 1.0;
        const a = Math.min(1, Math.max(0, baseA * amp * s.b));
        ctx.fillStyle = `rgba(255,215,0,${a})`;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r * (s.tw > 0 ? 1.05 : 1.0), 0, Math.PI * 2); ctx.fill();
      }

      // Anomalies
      if (st.t % 420 === 0 && st.anomalies.length < 2) st.anomalies.push({ x: Math.random() * width, y: Math.random() * height, life: 0, ttl: 1100 });
      for (let i = st.anomalies.length - 1; i >= 0; i--) {
        const a = st.anomalies[i]; a.life += 1; const alpha = 0.22 * (1 - a.life / a.ttl);
        for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(a.x, a.y, 40 + ((st.t + k * 36) % 170), 0, Math.PI * 2); ctx.strokeStyle = `rgba(156, 39, 176, ${Math.max(0, alpha)})`; ctx.lineWidth = 1; ctx.stroke(); }
        if (a.life >= a.ttl) st.anomalies.splice(i, 1);
      }

      // Black hole spawner (outside solar system ring but within canvas)
      const maxDrawR = (Math.min(width, height) / 2 - (st.cfg?.pad || 40)) / (st.cfg?.zoom || 1.2) - 8;
      const ringMin = Math.min(maxDrawR - 6, (st.cfg?.maxOrbitR || 200) + 40);
      const ringMax = maxDrawR - 2;
      if (ringMax > ringMin && st.t % 1800 === 0 && (st.blackHoles?.length || 0) < 2) {
        const a = Math.random() * Math.PI * 2;
        const R = ringMin + Math.random() * (ringMax - ringMin);
        const bx = cx + Math.cos(a) * R; const by = cy + Math.sin(a) * R;
        const targetIdx = 1 + Math.floor(Math.random() * Math.max(1, st.bodies.length - 1));
        st.blackHoles.push({ x: bx, y: by, m: 1200, r: 14, life: 0, ttl: 3600, target: targetIdx, dust: [] });
      }

      // Render black holes and update their dust
      if (st.blackHoles && st.blackHoles.length) {
        for (let i = st.blackHoles.length - 1; i >= 0; i--) {
          const bh = st.blackHoles[i];
          bh.life += 1; if (bh.life > bh.ttl) { st.blackHoles.splice(i, 1); continue; }
          // Accretion dust update
          if (bh.dust.length < 200) {
            bh.dust.push({ ang: Math.random() * Math.PI * 2, rad: bh.r + 10 + Math.random() * 30, speed: 0.01 + Math.random() * 0.015, fade: 1.0 });
          }
          for (let k = bh.dust.length - 1; k >= 0; k--) {
            const d = bh.dust[k]; d.ang += d.speed; d.rad -= 0.01; d.fade *= 0.999; if (d.rad <= bh.r + 2 || d.fade < 0.05) bh.dust.splice(k, 1);
          }
          // Draw BH
          ctx.save();
          ctx.beginPath(); ctx.fillStyle = '#000'; ctx.arc(SX(bh.x), SY(bh.y), bh.r, 0, Math.PI * 2); ctx.fill();
          // ring
          ctx.globalCompositeOperation = 'lighter';
          ctx.strokeStyle = 'rgba(130,130,255,0.35)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(SX(bh.x), SY(bh.y), bh.r + 5, 0, Math.PI * 2); ctx.stroke();
          // swirl dust
          for (const d of bh.dust) {
            const dx = Math.cos(d.ang) * d.rad; const dy = Math.sin(d.ang) * d.rad;
            ctx.fillStyle = `rgba(200,200,255,${0.25 * d.fade})`;
            ctx.fillRect(SX(bh.x + dx), SY(bh.y + dy), 1.5, 1.5);
          }
          ctx.restore();
        }
      }

      // Asteroid belts (rendered with zoom)
      if (st.belts) {
        for (const belt of st.belts) {
          for (const p of belt.particles) {
            p.ang += p.speed;
            const r = belt.r + p.rad;
            const x = cx + Math.cos(p.ang) * r;
            const y = cy + Math.sin(p.ang) * r;
            const alpha = 0.22 + 0.12 * Math.sin(st.t * 0.01 + p.ang * 3.0);
            ctx.fillStyle = `hsla(${p.hue}, 100%, 66%, ${alpha})`;
            ctx.beginPath();
            ctx.arc(SX(x), SY(y), p.size * rScale * 0.9, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Sun base
      const sun = st.bodies[0];
      const pulse = 1.6 * Math.sin(st.t * 0.012);
      const coreGrad = ctx.createRadialGradient(sun.x, sun.y, 4, sun.x, sun.y, sun.r * rScale);
      coreGrad.addColorStop(0, ok ? '#fff176' : '#ff8a65');
      coreGrad.addColorStop(1, '#0a0a0a');
      ctx.beginPath(); ctx.fillStyle = coreGrad; ctx.arc(sun.x, sun.y, sun.r * rScale + pulse * 0.2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 3; ctx.stroke();
      // Sun label
      ctx.fillStyle = '#ffd700'; ctx.font = '13px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText('VM', sun.x, sun.y - sun.r * rScale - 6);

      // Plasma-like corona layers
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.translate(sun.x, sun.y);
      for (const layer of st.plasma.layers) {
        const baseR = sun.r * layer.radiusMul * rScale;
        const rot = st.t * layer.speed + layer.phase;
        ctx.strokeStyle = `rgba(255, 200, 64, ${layer.alpha})`;
        ctx.lineWidth = layer.thickness;
        for (let seg = 0; seg < 24; seg++) {
          const th0 = (seg / 24) * Math.PI * 2 + rot;
          const th1 = th0 + 0.18;
          const wob = Math.sin(th0 * layer.freq + rot) * layer.amp;
          const r = baseR + wob;
          ctx.beginPath();
          ctx.arc(0, 0, Math.max(1, r), th0, th1);
          ctx.stroke();
        }
      }
      // Flares (prominences)
      if (st.t % 180 === 0 && st.plasma.flares.length < 4) {
        st.plasma.flares.push({ ang: Math.random() * Math.PI * 2, life: 0, ttl: 300, maxLen: sun.r * rScale * (1.2 + Math.random() * 0.8) });
      }
      for (let i = st.plasma.flares.length - 1; i >= 0; i--) {
        const f = st.plasma.flares[i]; f.life += 1; const k = f.life / f.ttl; const len = f.maxLen * Math.sin(Math.min(1, k) * Math.PI);
        const a = 0.35 * (1 - k);
        ctx.strokeStyle = `rgba(255, 180, 64, ${Math.max(0, a)})`;
        ctx.lineWidth = 2;
        const th = f.ang + Math.sin(st.t * 0.01 + f.ang) * 0.15;
        ctx.beginPath();
        ctx.moveTo(Math.cos(th) * sun.r * rScale, Math.sin(th) * sun.r * rScale);
        ctx.lineTo(Math.cos(th) * (sun.r * rScale + len), Math.sin(th) * (sun.r * rScale + len));
        ctx.stroke();
        if (f.life >= f.ttl) st.plasma.flares.splice(i, 1);
      }
      ctx.restore();

      // Physics params
      const dt = 0.03;

      // Planets dynamics
  for (let i = 1; i < st.bodies.length; i++) {
        const p = st.bodies[i];
        if (!p.active) {
          p.respawn -= 1;
          if (p.respawn <= 0) {
            const R = Math.max(120, Math.min(maxOrbitR, p.orbitR * (0.95 + Math.random() * 0.2)));
            const ang = Math.random() * Math.PI * 2; p.x = cx + Math.cos(ang) * R; p.y = cy + Math.sin(ang) * R;
            const vCirc = Math.sqrt((st.G * sun.m) / R); p.vx = -Math.sin(ang) * vCirc; p.vy = Math.cos(ang) * vCirc; p.active = true; p.trail.length = 0; p.explosion.length = 0;
            if (!p.moons || p.moons.length === 0) {
              p.moons = [];
              const cnt = 1 + Math.floor(Math.random() * 2);
              for (let k = 0; k < cnt; k++) p.moons.push({ ang: Math.random()*Math.PI*2, r: 12 + Math.random()*18 + k*6, speed: 0.003 + Math.random()*0.004, size: 2 + Math.random()*2, alive: true, respawn: 0 });
            }
          }
          // lingering explosion (slower fade)
          for (let k = p.explosion.length - 1; k >= 0; k--) {
            const e = p.explosion[k]; e.life += 1; e.x += e.vx; e.y += e.vy; const a = Math.max(0, 1 - e.life / (e.ttl || 160));
            ctx.fillStyle = `rgba(255,215,0,${a})`; ctx.fillRect(SX(e.x), SY(e.y), 2, 2);
            if (a <= 0) p.explosion.splice(k, 1);
          }
          continue;
        }
        // Gravity (sun + black holes)
        let dx = sun.x - p.x; let dy = sun.y - p.y; let d2 = dx * dx + dy * dy; let d = Math.sqrt(d2) || 1;
        let ax = (dx / d) * ((st.G * sun.m) / d2);
        let ay = (dy / d) * ((st.G * sun.m) / d2);
        if (stateRef.current.blackHoles && stateRef.current.blackHoles.length) {
          for (const bh of stateRef.current.blackHoles) {
            const bdx = bh.x - p.x; const bdy = bh.y - p.y; const bd2 = bdx * bdx + bdy * bdy; const bd = Math.sqrt(bd2) || 1;
            const aB = (st.G * bh.m) / (bd2 + 2000); // softened
            ax += (bdx / bd) * aB; ay += (bdy / bd) * aB;
            // consumption
            if (bd <= bh.r + p.r) {
              p.active = false; p.respawn = 680;
              // BH grows slowly and emits dust
              bh.r = Math.min(bh.r + Math.max(1, p.r * 0.2), 40);
              bh.m += p.m * 60;
              for (let n = 0; n < 40; n++) bh.dust.push({ ang: Math.random()*Math.PI*2, rad: bh.r + 8 + Math.random()*20, speed: 0.01 + Math.random()*0.02, fade: 1 });
            }
          }
        }
        p.vx += ax * dt; p.vy += ay * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        p.trail.push({ x: p.x, y: p.y }); if (p.trail.length > 120) p.trail.shift();
        if (d <= sun.r + p.r) {
          p.active = false; p.respawn = 420; // slower explosions
          for (let n = 0; n < 40; n++) { const ang = Math.random() * Math.PI * 2; const speed = (2 + Math.random() * 3) * 0.5; p.explosion.push({ x: p.x, y: p.y, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, life: 0, ttl: 160 }); }
        }
        if (!p.moons) p.moons = [];
        for (let mi = 0; mi < p.moons.length; mi++) {
          const m = p.moons[mi];
          if (m.alive) {
            m.ang += m.speed;
            const mx = p.x + Math.cos(m.ang) * m.r; const my = p.y + Math.sin(m.ang) * m.r;
            const mdx = sun.x - mx; const mdy = sun.y - my; const md = Math.sqrt(mdx*mdx + mdy*mdy) || 1;
            if (md <= sun.r + m.size) {
              for (let n = 0; n < 16; n++) { const ang = Math.random() * Math.PI * 2; const speed = (1 + Math.random() * 2) * 0.5; p.explosion.push({ x: mx, y: my, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, life: 0, ttl: 160 }); }
              m.alive = false; m.respawn = 520;
            }
          } else {
            m.respawn -= 1; if (m.respawn <= 0) { m.alive = true; m.ang = Math.random()*Math.PI*2; m.r = 12 + Math.random()*18; m.speed = 0.003 + Math.random()*0.004; m.size = 2 + Math.random()*2; }
          }
        }
        // small chance to spawn an extra moon (up to 3)
        if (p.moons.length < 3 && Math.random() < 0.0005) {
          p.moons.push({ ang: Math.random()*Math.PI*2, r: 12 + Math.random()*18 + p.moons.length*6, speed: 0.003 + Math.random()*0.004, size: 2 + Math.random()*2, alive: true, respawn: 0 });
        }
      }

      // Planet-planet collisions (slower explosions)
      for (let i = 1; i < st.bodies.length; i++) {
        const a = st.bodies[i]; if (!a.active) continue;
        for (let j = i + 1; j < st.bodies.length; j++) {
          const b = st.bodies[j]; if (!b.active) continue;
          const dx = a.x - b.x, dy = a.y - b.y; const d = Math.sqrt(dx*dx + dy*dy) || 1;
          if (d <= a.r + b.r) {
            for (let n = 0; n < 28; n++) { const ang = Math.random()*Math.PI*2; const sp = (1 + Math.random()*2.5) * 0.5; a.explosion.push({ x: a.x, y: a.y, vx: Math.cos(ang)*sp, vy: Math.sin(ang)*sp, life: 0, ttl: 160 }); b.explosion.push({ x: b.x, y: b.y, vx: Math.cos(ang)*sp, vy: Math.sin(ang)*sp, life: 0, ttl: 160 }); }
            a.active = false; b.active = false; a.respawn = 480; b.respawn = 480;
          }
        }
      }

      // Orbits and trails (scaled)
      for (let i = 1; i < st.bodies.length; i++) {
        const p = st.bodies[i];
        // orbit
        ctx.beginPath(); ctx.strokeStyle = 'rgba(255,215,0,0.06)'; ctx.lineWidth = 1; ctx.arc(cx, cy, p.orbitR * zoom, 0, Math.PI * 2); ctx.stroke();
        // trail
        ctx.beginPath(); ctx.strokeStyle = p.color + '66'; ctx.lineWidth = 2;
        for (let k = 0; k < p.trail.length; k++) { const t = p.trail[k]; const sx = SX(t.x), sy = SY(t.y); if (k === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy); }
        ctx.stroke();
      }

      // Bodies + moons + labels (scaled)
      ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.font = '12px monospace';
      for (let i = 1; i < st.bodies.length; i++) {
        const p = st.bodies[i];
        const px = SX(p.x), py = SY(p.y);
        if (p.active) {
          ctx.beginPath(); ctx.fillStyle = p.color; ctx.arc(px, py, p.r * rScale, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#333'; ctx.lineWidth = 1; ctx.stroke();
          // Glow ring: subtle for all real visitors, stronger for current visitor
          if (p.isReal) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            const pulse = 2 * Math.sin((stateRef.current?.t || 0) * 0.08);
            if (p.isSelf) {
              ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
              ctx.lineWidth = 4;
              ctx.beginPath(); ctx.arc(px, py, (p.r * rScale) + 8 + pulse, 0, Math.PI * 2); ctx.stroke();
            } else {
              ctx.strokeStyle = 'rgba(100, 200, 255, 0.45)';
              ctx.lineWidth = 2;
              ctx.beginPath(); ctx.arc(px, py, (p.r * rScale) + 5 + pulse*0.5, 0, Math.PI * 2); ctx.stroke();
            }
            ctx.beginPath();
            ctx.restore();
          }
          ctx.fillStyle = '#ffd700'; ctx.fillText(p.name, px, py + p.r * rScale + 6);
          // OS letter on the planet for contrast
          if (p.os && p.os !== '?') {
            ctx.save();
            ctx.font = 'bold 10px monospace';
            ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
            ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.strokeText(p.os, px, py);
            ctx.fillStyle = '#fff'; ctx.fillText(p.os, px, py);
            ctx.restore();
            ctx.font = '12px monospace'; ctx.textBaseline = 'top';
          }
          if (p.moons && p.moons.length) {
            for (const m of p.moons) {
              if (!m.alive) continue;
              const mx = p.x + Math.cos(m.ang) * m.r; const my = p.y + Math.sin(m.ang) * m.r; const sx2 = SX(mx), sy2 = SY(my);
              ctx.beginPath(); ctx.strokeStyle = 'rgba(255,215,0,0.06)'; ctx.arc(px, py, m.r * zoom, 0, Math.PI * 2); ctx.stroke();
              ctx.beginPath(); ctx.fillStyle = '#ccc'; ctx.arc(sx2, sy2, m.size * rScale * 0.8, 0, Math.PI * 2); ctx.fill();
            }
          }
        }
        for (let k = p.explosion.length - 1; k >= 0; k--) { const e = p.explosion[k]; e.life += 1; e.x += e.vx; e.y += e.vy; const a = Math.max(0, 1 - e.life / (e.ttl || 160)); ctx.fillStyle = `rgba(255,215,0,${a})`; ctx.fillRect(SX(e.x), SY(e.y), 2, 2); if (a <= 0) p.explosion.splice(k, 1); }
      }

      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [width, height, name, planetNames, planetsCount, ok]);
  // Live-update visitor-derived properties when the list changes (without full reinit)
  React.useEffect(() => {
    const st = stateRef.current; if (!st || !Array.isArray(visitors)) return;
    const n = Math.min(visitors.length, st.bodies.length - 1);
    for (let i = 0; i < n; i++) {
      const vis = visitors[i];
      const p = st.bodies[i + 1];
      if (!p) continue;
      p.os = vis?.os && typeof vis.os === 'string' ? vis.os[0]?.toUpperCase?.() : p.os;
      p.isSelf = !!vis?.self;
      p.isReal = !!vis && !vis?.sim;
      p.name = `u-${i + 1}`;
    }
  }, [visitors]);
  React.useEffect(() => { if (stateRef.current) stateRef.current.t += 0.001; }, [ok]);
  return <canvas ref={ref} />;
}

function LiveInfraMap() {
  const [topo, setTopo] = useState(null);
  const [checks, setChecks] = useState({});
  const [authError, setAuthError] = useState(null);
  const [demo, setDemo] = useState(false);
  const [visitors, setVisitors] = useState([]);
  const containerRef = React.useRef(null);
  const [dims, setDims] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('infraDims');
        if (saved) {
          const d = JSON.parse(saved);
          if (d && Number(d.w) > 0 && Number(d.h) > 0) return d;
        }
      } catch {}
    }
    return { w: 960, h: 540 };
  });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState({ active: false, sx: 0, sy: 0, ox: 0, oy: 0 });

  // Robustly measure container with ResizeObserver + rAF to avoid tiny size on initial refresh
  useEffect(() => {
    const compute = () => {
      const el = containerRef.current; 
      let baseW = el ? Math.floor(el.getBoundingClientRect().width) : 0;
      // Fallbacks if layout not settled yet
      if (!baseW || baseW < 300) {
        let savedW = 0;
        try { const saved = JSON.parse(localStorage.getItem('infraDims') || 'null'); savedW = saved?.w || 0; } catch {}
        baseW = Math.floor(Math.max(
          window.innerWidth * 0.92,
          window.innerWidth - 320,
          savedW / 1.5
        ));
      }
      baseW = Math.max(320, Math.min(baseW, Math.floor(window.innerWidth * 0.98)));
      const w = Math.min(Math.floor(baseW * 1.5), Math.floor(window.innerWidth * 0.98));
      const maxH = Math.max(360, Math.floor(window.innerHeight * 0.9));
      const h = Math.min(maxH, Math.floor(w * 9 / 16));
      setDims((prev) => (prev.w !== w || prev.h !== h ? { w, h } : prev));
    };

    // First compute after layout using rAF (two ticks)
    let raf1 = requestAnimationFrame(() => {
      compute();
      raf1 = requestAnimationFrame(compute);
    });

    // Observe container size changes
    let ro;
    if ('ResizeObserver' in window) {
      ro = new ResizeObserver(() => compute());
      if (containerRef.current) ro.observe(containerRef.current);
    } else {
      // Fallback: listen to window resize
      window.addEventListener('resize', compute);
    }

    // Safety: delayed compute after fonts/sidebars settle
    const t = setTimeout(compute, 500);

    return () => {
      cancelAnimationFrame(raf1);
      clearTimeout(t);
      if (ro) ro.disconnect(); else window.removeEventListener('resize', compute);
    };
  }, []);

  // Persist dimensions so refresh restores last large size
  useEffect(() => {
    try { localStorage.setItem('infraDims', JSON.stringify(dims)); } catch {}
  }, [dims.w, dims.h]);

  useEffect(() => {
    const el = containerRef.current; if (!el) return;
    const onDown = (e) => {
      const ev = e.touches ? e.touches[0] : e;
      setDrag({ active: true, sx: ev.clientX, sy: ev.clientY, ox: pan.x, oy: pan.y });
    };
    const onMove = (e) => {
      if (!drag.active) return;
      const ev = e.touches ? e.touches[0] : e;
      const dx = ev.clientX - drag.sx; const dy = ev.clientY - drag.sy;
      setPan({ x: drag.ox + dx, y: drag.oy + dy });
    };
    const onUp = () => setDrag((d) => ({ ...d, active: false }));

    el.addEventListener('mousedown', onDown);
    el.addEventListener('touchstart', onDown, { passive: true });
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);
    return () => {
      el.removeEventListener('mousedown', onDown);
      el.removeEventListener('touchstart', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchend', onUp);
    };
  }, [pan.x, pan.y, drag.active, drag.sx, drag.sy, drag.ox, drag.oy]);

  // On mount, only fetch topology if a token exists to avoid 401s; otherwise enter demo silently
  useEffect(() => {
    let on = true;
    async function load() {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        if (!on) return; setDemo(true); setAuthError(null);
        setTopo({ nodes: [{ id: 'self', name: 'demo-node', host: '192.168.0.90', http_url: 'http://192.168.0.90/health', ssh_port: 22 }], edges: [] });
        return;
      }
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const r = await fetch('/api/mesh/topology', { headers });
        if (!on) return;
        if (r.ok) { setTopo(await r.json()); setDemo(false); }
        else { setDemo(true); setTopo({ nodes: [{ id: 'self', name: 'demo-node', host: '192.168.0.90', http_url: 'http://192.168.0.90/health', ssh_port: 22 }], edges: [] }); }
      } catch {
        if (!on) return; setDemo(true);
        setTopo({ nodes: [{ id: 'self', name: 'demo-node', host: '192.168.0.90', http_url: 'http://192.168.0.90/health', ssh_port: 22 }], edges: [] });
      }
    }
    load();
    return () => { on = false; };
  }, []);

  useEffect(() => {
    async function run() {
      if (!topo?.nodes?.length) return;
      const n = topo.nodes[0];
      if (demo) { setChecks({ [n.id]: { ssh: { open: true }, http: { ok: true, status_code: 200 } } }); return; }
      const headers = useAuthHeaders();
      const [ssh, http] = await Promise.all([
        fetch(`/api/checks/port?host=${encodeURIComponent(n.host)}&port=${n.ssh_port}`, { headers }).then(r=>r.json()).catch(()=>({open:false})),
        fetch(`/api/checks/http?url=${encodeURIComponent(n.http_url)}`, { headers }).then(r=>r.json()).catch(()=>({ok:false})),
      ]);
      setChecks({ [n.id]: { ssh, http } });
    }
    run();
    const t = setInterval(run, 5000);
    return () => clearInterval(t);
  }, [topo?.nodes?.length, demo]);

  // Visitors: ping every 3s and read active list; simulate to reach at least 10 if fewer
  useEffect(() => {
    let on = true;
    let tPing, tFetch;
    async function ping() {
      try { await fetch('/api/visitors/ping', { method: 'POST' }); } catch {}
    }
    async function read() {
      try {
        const r = await fetch('/api/visitors/active');
        const data = await r.json().catch(()=>({visitors: []}));
        if (!on) return;
        const real = Array.isArray(data.visitors) ? data.visitors : [];
        let all = real;
        const need = Math.max(0, 10 - real.length);
        if (need > 0) {
          const osPool = ['L','W','M','C','A','I'];
          const sim = Array.from({ length: need }, (_, i) => ({ ip: 'sim*', os: osPool[i % osPool.length], dur_sec: 30 + i * 5, self: false, sim: true }));
          all = real.concat(sim);
        }
        setVisitors(all);
      } catch {
        if (!on) return;
        // Full simulation when backend not reachable
        const osPool = ['L','W','M','C','A','I'];
        const sim = Array.from({ length: 10 }, (_, i) => ({ ip: 'sim*', os: osPool[i % osPool.length], dur_sec: 30 + i * 5, self: i===0, sim: true }));
        setVisitors(sim);
      }
    }
    ping(); read();
    tPing = setInterval(ping, 3000);
    tFetch = setInterval(read, 3000);
    return () => { on = false; clearInterval(tPing); clearInterval(tFetch); };
  }, []);

  if (!topo) return <div className="text-gold">Loading topology…</div>;
  const n = topo.nodes[0];
  const stOK = (checks[n?.id]?.ssh?.open && checks[n?.id]?.http?.ok);
  const planetNames = (topo.nodes || []).map(x => x.name).filter(Boolean);
  // Use visitor count primarily; fallback to topology size
  const planetsCount = Math.max(6, visitors.length || planetNames.length || 0);

  return (
    <div ref={containerRef} className="w-full flex items-center justify-center" style={{minHeight: '70vh', position: 'relative', overflow: 'hidden', cursor: drag.active ? 'grabbing' : 'grab', width: '100vw', marginLeft: 'calc(50% - 50vw)'}}>
      <div style={{ transform: `translateX(10%) translate(${pan.x}px, ${pan.y}px)`, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ boxShadow: '0 0 24px #000', width: dims.w, height: dims.h, overflow: 'hidden', margin: '0 auto' }}>
          <AnimatedInfraCanvas name="infra-main" ok={!!stOK} width={dims.w} height={dims.h} planetNames={planetNames} planetsCount={planetsCount} visitors={visitors} />
        </div>
        {/* Removed overlay texts (no demo, SSH, HTTP labels) */}
      </div>
    </div>
  );
}

// contentMap moved inside App() to access state like orderPlan

function FutureBg() {
  return <div className="bg-future" />;
}

function getUserFromToken(token) {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return { username: payload.sub };
  } catch {
    return null;
  }
}

function DesktopApp() {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    // Restore last active page from localStorage, default to 'home'
    const [active, setActive] = useState(() => localStorage.getItem("activePage") || "home");
  const [animating, setAnimating] = useState(false);
  // Only one modalImg state should exist. If you see another, remove it.
  const [modalImg, setModalImg] = useState(null);
  const [orderPlan, setOrderPlan] = useState(null);
  // Expose setModalImg globally for DynamicPage
  window.setModalImgGlobal = setModalImg;

  useEffect(() => {
    function onOpenOrder(e){ setOrderPlan(e.detail || null); setActive('contact'); setShowAuth(false); }
    window.addEventListener('open-order', onOpenOrder);
    return () => window.removeEventListener('open-order', onOpenOrder);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const u = getUserFromToken(token);
    if (u) setUser(u);
  }, []);

  function handleAuth(data) {
    if (data.access_token) {
      localStorage.setItem("token", data.access_token);
      const u = getUserFromToken(data.access_token);
      setUser(u);
      setShowAuth(false);
    } else if (data.msg) {
      setAuthMode("login");
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    setUser(null);
      setActive("home");
      localStorage.setItem("activePage", "home");
  }

  const filteredMenuItems = user && user.username === "gallo"
    ? menuItems
    : menuItems.filter(item => item.key !== "admin");

  function handleMenu(key) {
    if (key !== active) {
      setAnimating(true);
      setTimeout(() => {
        setActive(key);
          localStorage.setItem("activePage", key);
        setAnimating(false);
      }, 400);
    }
    setMobileMenuOpen(false); // Close mobile menu when navigating
  }

  // Define contentMap here so it can use orderPlan and other state
  const contentMap = {
    home: <DynamicPage pageKey="home" />,
  prices: <Prices onOrder={(plan)=>window.dispatchEvent(new CustomEvent('open-order',{ detail: plan }))} />,
    creations: <DynamicPage pageKey="creations" />,
    education: <DynamicPage pageKey="education" />,
    work: <DynamicPage pageKey="work" />,
    gallery: <DynamicPage pageKey="gallery" />,
    contact: (
      <ContactForm
        initialSubject={orderPlan ? (orderPlan.subject || `Website order: ${orderPlan.title || 'Inquiry'}`) : ""}
        initialMessage={orderPlan ? (
          orderPlan.message || (
            orderPlan.title ? `Plan: ${orderPlan.title}${orderPlan.price ? `\nPrice: €${orderPlan.price}` : ''}${orderPlan.timeline ? `\nTimeline: ${orderPlan.timeline}` : ''}\n\nTell me more about your project:` : ""
          )
        ) : ""}
        plan={orderPlan}
      />
    ),
    arcade: <ArcadePage />,
    sandbox: <DynamicPage pageKey="sandbox" emptyLabel="Sandbox" />,
    placeholder1: <SysadminDashboard />,
    placeholder2: <LiveInfraMap />, // replaced with live map
    "admin-users": (
      <div className="w-full flex flex-col items-center justify-center" style={{minHeight: '80vh', marginLeft: '5%'}}>
        <AdminPanel />
      </div>
    ),
    "admin-pages": (
      <div className="w-full flex flex-col items-center justify-center" style={{minHeight: '80vh', marginLeft: '5%'}}>
        <PageBuilder />
      </div>
    ),
  };

  return (
    <div className="min-h-screen flex bg-black text-gold font-sans relative overflow-x-hidden" style={{minHeight: '100vh', height: '100vh', overflow: 'auto'}}>
      <FutureBg />
      {/* Mobile Menu Toggle */}
      <button 
        className="fixed top-4 left-4 z-30 md:hidden bg-black border border-gold text-gold p-2 rounded-sm"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        ☰
      </button>

      {/* Left Menu */}
      <aside className={`w-48 md:w-56 bg-black border-r border-gold-dim flex flex-col items-center py-8 transition-all duration-300 min-h-screen z-20 
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 md:static fixed left-0 top-0`} 
        style={{height: '100vh'}}>
        <div className="mb-8" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <img src={logo} alt="ItSusi logo" style={{ maxWidth: '140px', width: '80%', height: 'auto', objectFit: 'contain' }} />
        </div>
        <nav className="flex flex-col gap-4 w-full">
          {user ? (
            <>
              <div className="text-gold text-center mb-4">Welcome, {user.username}</div>
              <button className="menu-btn" onClick={handleLogout}>Logout</button>
              {user.username === "gallo" && adminLeftMenuItems.map(item => (
                <button
                  key={item.key}
                  className={`menu-btn${active === item.key ? " active" : ""}`}
                  onClick={() => handleMenu(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </>
          ) : (
            <>
              <button className="menu-btn" onClick={() => { setShowAuth(true); setAuthMode("login"); }}>Login</button>
              <button className="menu-btn" onClick={() => { setShowAuth(true); setAuthMode("register"); }}>Register</button>
            </>
          )}
          {leftMenuItems.map(item => (
            item.href ? (
              <React.Fragment key={item.key}>
                {/* Only show arcade button if user is logged in */}
                {(item.key !== "arcade" || user) && (
                  <button
                    className={
                      "menu-btn" + 
                      (item.key === "arcade" ? " " : "") +
                      (item.key === "arcade" ? "arcade-btn" : "")
                    }
                    style={item.key === "arcade" ? {
                      border: '2px solid #00ff00',
                      color: '#00ff00',
                      fontWeight: 600
                    } : {}}
                    onClick={() => {
                      if (item.key === "arcade") {
                        // Navigate in same tab for arcade
                        window.location.href = item.href;
                      } else {
                        window.open(item.href, '_blank', 'noopener,noreferrer');
                      }
                    }}
                  >
                    {item.label}
                  </button>
                )}
                {item.key === "arcade" && user && (
                  <button
                    className="menu-btn"
                    style={{
                      border: '2px solid #7f5fff',
                      color: '#7f5fff',
                      fontWeight: 600
                    }}
                    onClick={() => window.open('https://jellyfin.itsusi.eu', '_blank')}
                  >
                    Jellyfin
                  </button>
                )}
              </React.Fragment>
            ) : (
              <button
                key={item.key}
                className={
                  "menu-btn" +
                  (active === item.key ? " active" : "")
                }
                onClick={() => handleMenu(item.key)}
              >
                {item.label}
              </button>
            )
          ))}
        </nav>
      </aside>
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen relative z-10 md:ml-0" style={{background: '#000'}}>
        {/* Header */}
        <header className="flex justify-between items-center px-2 md:px-8 py-4 bg-transparent transition-all duration-700 sticky top-0 z-10 ml-0 md:ml-0 pt-16 md:pt-4">
          <nav className="flex gap-1 md:gap-8 flex-wrap justify-center w-full">
            {filteredMenuItems.map(item => (
              <button
                key={item.key}
                className={`header-btn text-sm md:text-base px-2 md:px-4 py-2${active === item.key ? " active" : ""}`}
                onClick={() => handleMenu(item.key)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </header>
          {/* Animated Content Area (canvas) */}
          <section className={`page-bg flex-1 flex items-start justify-start text-left text-sm md:text-lg lg:text-3xl text-gold px-2 md:px-4 lg:px-0 transition-all duration-700 ${animating ? "opacity-0 translate-y-8" : "opacity-100 translate-y-0"}`}
            style={{
              border: '0px solid transparent',
              borderRadius: 0,
              width: active === 'placeholder2' ? '100vw' : window.innerWidth < 768 ? '95vw' : '78vw',
              minHeight: '65vh',
              boxSizing: 'border-box',
              alignSelf: 'flex-start',
              background: '#000',
              transition: 'opacity 0.7s, transform 0.7s',
              overflow: active === 'placeholder2' ? 'hidden' : 'auto',
              marginLeft: active === 'placeholder2' ? 'calc(50% - 50vw)' : window.innerWidth < 768 ? '2.5vw' : 0,
              marginRight: 0,
              position: 'relative',
              left: 0,
              top: window.innerWidth < 768 ? '20px' : '40px',
            }}
          >
            {/* Background animation removed: keep solid black */}
            <ErrorBoundary>
            <Suspense fallback={<div className="text-gold p-4">Loading…</div>}>
            <div
              className="w-full max-w-6xl text-left text-base md:text-lg"
              style={{ position: 'relative', zIndex: 1, ...(active === 'bio' ? { width: '100%', maxWidth: '100%', padding: 0, margin: 0 } : {}) }}
            >
              {contentMap[active] ?? (
                <div className="text-gold p-6">
                  <h2 className="text-2xl mb-2">Page not found</h2>
                  <p>The page you’re looking for doesn’t exist.</p>
                </div>
              )}
            </div>
            </Suspense>
            </ErrorBoundary>
          </section>
          {modalImg && <ImageModal url={modalImg} onClose={() => setModalImg(null)} />}
      {/* Floating WhatsApp Widget */}
      <Suspense fallback={null}>
        <WhatsAppWidget phone="358408511881" name="ItSusi" />
      </Suspense>
          {/* Footer */}
          <footer className="w-full text-center text-xs text-gold bg-black border-t border-gold py-2 mt-auto opacity-80" style={{fontSize: '0.85rem', letterSpacing: '0.03em'}}>
            &copy; Gallogeta, 2025 &mdash; All rights reserved. | <a href="mailto:info@itsusi.eu" className="underline hover:text-white">Contact</a> | <a href="/privacy" className="underline hover:text-white">Privacy Policy</a>
          </footer>
        </main>

      {/* Centered Login/Register Modal */}
      {showAuth && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50" style={{backdropFilter: 'blur(5px)'}}>
          <div className="bg-black border-2 border-gold rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gold mb-2">
                {authMode === 'login' ? 'Login' : 'Register'}
              </h2>
              <p className="text-gold-dim text-sm">
                {authMode === 'login' ? 'Sign in to your account' : 'Create a new account'}
              </p>
            </div>
            <Suspense fallback={<div className="text-gold p-4 text-center">Loading…</div>}>
              <AuthForm mode={authMode} onAuth={handleAuth} />
            </Suspense>
            <button 
              className="header-btn mt-4 w-full" 
              onClick={() => setShowAuth(false)}
              style={{background: 'rgba(191, 164, 58, 0.1)', border: '1px solid #bfa43a'}}
            >
              Close
            </button>
          </div>
        </div>
      )}
      </div>
  );
}

// Main App component with mobile/desktop detection
export default function App() {
  const { isMobile } = useMobileDetection();

  if (isMobile) {
    return (
      <ErrorBoundary>
        <Suspense fallback={
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            minHeight: '100vh', 
            background: '#000', 
            color: '#ffd700',
            fontSize: '18px'
          }}>
            Loading Mobile Version...
          </div>
        }>
          <MobileApp />
        </Suspense>
      </ErrorBoundary>
    );
  }

  return <DesktopApp />;
}
