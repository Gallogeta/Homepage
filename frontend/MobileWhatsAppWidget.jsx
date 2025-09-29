import React from 'react';

export default function MobileWhatsAppWidget({ phone = '358408511881', name = 'ItSusi' }) {
  const [open, setOpen] = React.useState(false);
  const [msg, setMsg] = React.useState('Hi ' + name + '.');

  const openChat = (e) => {
    e?.preventDefault?.();
    const text = encodeURIComponent(msg || '');
    const link = `https://wa.me/${phone}?text=${text}`;
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      {/* Mobile WhatsApp Button */}
      <button
        className="mobile-whatsapp"
        onClick={() => setOpen(!open)}
        style={{
          background: '#000',
          border: '2px solid #ffd700',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(255, 215, 0, 0.3)',
        }}
        aria-label="WhatsApp Chat"
      >
        <svg 
          width="28" 
          height="28" 
          viewBox="0 0 24 24" 
          fill="#ffd700"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.51 3.415"/>
        </svg>
      </button>

      {/* Mobile WhatsApp Popup */}
      {open && (
        <>
          {/* Backdrop */}
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 199,
            }}
            onClick={() => setOpen(false)}
          />
          
          {/* Popup */}
          <div className="mobile-whatsapp-popup" style={{
            background: 'linear-gradient(180deg, #0e0e0e, #1a1a1a)',
            border: '1px solid #ffd700',
            zIndex: 200,
          }}>
            <div style={{ 
              padding: '16px', 
              borderBottom: '1px solid #ffd700', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center' 
            }}>
              <div style={{ fontWeight: 'bold', color: '#ffd700' }}>{name}</div>
              <button 
                onClick={() => setOpen(false)}
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  color: '#ccc', 
                  fontSize: '20px',
                  width: '32px',
                  height: '32px',
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ padding: '12px', color: '#bbb', fontSize: '14px', borderBottom: '1px solid #333' }}>
              Send a WhatsApp message directly.
            </div>
            
            <div style={{ padding: '16px' }}>
              <textarea
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                placeholder={`Message to ${name}...`}
                style={{
                  width: '100%',
                  minHeight: '80px',
                  background: '#111',
                  color: '#eee',
                  border: '1px solid #ffd700',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '16px',
                  resize: 'vertical',
                  marginBottom: '16px',
                }}
              />
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={openChat}
                  className="mobile-btn"
                  style={{ flex: 1, margin: 0 }}
                >
                  Send
                </button>
                <button 
                  onClick={() => setOpen(false)}
                  className="mobile-btn-outline"
                  style={{ flex: 1, margin: 0 }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}