import React from 'react';
import waIcon from './media/pics/WA.png';

export default function WhatsAppWidget({ phone = '358408511881', name = 'It Susi' }) {
  const [open, setOpen] = React.useState(false);
  const [msg, setMsg] = React.useState('Hi ' + name + '.');

  const openChat = (e) => {
    e?.preventDefault?.();
    const text = encodeURIComponent(msg || '');
    const link = `https://wa.me/${phone}?text=${text}`;
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <div style={{ 
      position: 'fixed', 
      right: window.innerWidth < 768 ? '20px' : '80px', 
      bottom: window.innerWidth < 768 ? '20px' : '80px', 
      zIndex: 9999 
    }}>
      <style>{`
        @keyframes waPulseGold {
          0%   { transform: scale(1); }
          50%  { transform: scale(1.06); }
          100% { transform: scale(1); }
        }
      `}</style>
      {/* Floating Button */}
      <button
        aria-label="WhatsApp Chat"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: window.innerWidth < 768 ? 64 : 84,
          height: window.innerWidth < 768 ? 64 : 84,
          borderRadius: '50%',
          background: '#000',
          border: '2px solid #ffd700',
          boxShadow: 'none',
          color: '#ffd700',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          letterSpacing: '0.02em',
          cursor: 'pointer',
          animation: 'waPulseGold 2.8s ease-in-out infinite',
          willChange: 'transform',
        }}
        title={`Chat with ${name} on WhatsApp`}
      >
        <img src={waIcon} alt="WhatsApp" style={{ 
          width: window.innerWidth < 768 ? 42 : 56, 
          height: window.innerWidth < 768 ? 42 : 56, 
          display: 'block' 
        }} />
      </button>

      {/* Chatbox */}
  {open && (
        <div
          style={{
            position: 'absolute',
            right: window.innerWidth < 768 ? '-280px' : 0,
            bottom: window.innerWidth < 768 ? 76 : 96,
            width: window.innerWidth < 768 ? '280px' : '320px',
            maxWidth: '85vw',
            background: 'linear-gradient(180deg, #0e0e0e, #1a1a1a)',
            border: '1px solid #ffd700',
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: '0 12px 36px rgba(0,0,0,0.8)',
            color: '#fff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#0b0b0b', borderBottom: '1px solid #3d3200' }}>
            <div style={{ fontWeight: 700, color: '#ffd700' }}>{name}</div>
            <button onClick={() => setOpen(false)} style={{ color: '#ccc', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>✕</button>
          </div>
          <div style={{ padding: 12, borderBottom: '1px solid #2a2a2a', color: '#bbb', fontSize: 13 }}>
            Send a WhatsApp message directly.
          </div>
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <textarea
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              rows={3}
              placeholder={`Message to ${name}...`}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) openChat(e); }}
              style={{
                width: '100%',
                resize: 'none',
                background: '#111',
                color: '#eee',
                border: '1px solid #3d3200',
                borderRadius: 8,
                padding: '8px 10px',
                outline: 'none',
                boxShadow: 'inset 0 0 10px rgba(0,0,0,0.4)'
              }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={openChat} style={{ flex: 1, background: '#ffd700', color: '#000', border: 'none', borderRadius: 8, padding: '10px 12px', fontWeight: 700, cursor: 'pointer' }}>Send</button>
              <button onClick={() => setOpen(false)} style={{ background: '#222', color: '#bbb', border: '1px solid #333', borderRadius: 8, padding: '10px 12px', cursor: 'pointer' }}>Close</button>
            </div>
            <div style={{ fontSize: 11, color: '#777', textAlign: 'right' }}></div>
          </div>    
        </div>
      )}
    </div>
  );
}
