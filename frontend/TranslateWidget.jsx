import React from 'react';

export default function TranslateWidget() {
  const [lang, setLang] = React.useState('en');
  const [busy, setBusy] = React.useState(false);
  const apiBase = (import.meta?.env?.VITE_API_BASE)
    || (typeof window !== 'undefined' && window.API_BASE)
    || (typeof location !== 'undefined' && location.origin.includes(':8000') ? location.origin : '');

  // Collect items to translate: text nodes and common attributes
  function collectTranslatableItems(root) {
    // Text nodes
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const t = (node.nodeValue || '').trim();
        if (!t) return NodeFilter.FILTER_REJECT;
        const p = node.parentElement;
        if (!p) return NodeFilter.FILTER_REJECT;
        const tag = p.tagName.toLowerCase();
        if (['script','style','noscript','iframe','canvas'].includes(tag)) return NodeFilter.FILTER_REJECT;
        if (p.closest('.translate-widget')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const items = [];
    let n;
    while ((n = walker.nextNode())) {
      const node = n;
      items.push({ get: () => node.nodeValue, set: (v) => { node.nodeValue = v; } });
    }
    // Attributes (placeholder, title, alt)
    const seen = new Set();
    const pushAttr = (el, attr) => {
      if (!el || !el.getAttribute) return;
      if (el.closest && el.closest('.translate-widget')) return;
      const val = el.getAttribute(attr);
      if (!val || !val.trim()) return;
      const key = `${attr}|${val}`;
      if (seen.has(key)) return;
      seen.add(key);
      items.push({ get: () => el.getAttribute(attr), set: (v) => { el.setAttribute(attr, v); } });
    };
    root.querySelectorAll('[placeholder], [title], [alt]').forEach(el => {
      if (el.hasAttribute('placeholder')) pushAttr(el, 'placeholder');
      if (el.hasAttribute('title')) pushAttr(el, 'title');
      if (el.hasAttribute('alt')) pushAttr(el, 'alt');
    });
    return items;
  }

  async function applyTranslation(targetLang) {
    if (targetLang === 'en') return restoreOriginal();
    if (busy) return;
    setBusy(true);
    try {
  const container = document.body; // translate globally
  const items = collectTranslatableItems(container);
  if (!items.length) { setBusy(false); return; }
  const originals = items.map(it => it.get());
      // cache originals on first run
      const cacheKey = '__orig_text_cache__';
  if (!window[cacheKey] || !window[cacheKey].items || window[cacheKey].items.length === 0) window[cacheKey] = { items, originals };
      // De-duplicate texts for speed
      const uniq = new Map();
  originals.forEach((t, i) => { const key = t || ''; if (!uniq.has(key)) uniq.set(key, []); uniq.get(key).push(i); });
      const uniqueTexts = Array.from(uniq.keys()).map(t => (t && t.length > 2000 ? (t.slice(0, 1990) + '…') : t));
  const res = await fetch(`${apiBase}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts: uniqueTexts, source: 'en', target: targetLang, format: 'text' })
      });
  let data = null;
  try { data = await res.json(); } catch (e) { console.error('Bad JSON from /api/translate', e); }
      if (!res.ok || !data.translations || !Array.isArray(data.translations)) throw new Error('translate failed');
      // Map unique translations back to all nodes
      const uniqueTranslations = data.translations;
      let idx = 0;
      const translatedMap = new Map();
      for (const key of uniq.keys()) {
        translatedMap.set(key, uniqueTranslations[idx++] ?? key);
      }
      let changedCount = 0;
      items.forEach((it, i) => {
        const src = originals[i] ?? '';
        const tr = translatedMap.get(src ?? '');
        const finalTxt = (tr != null ? tr : src);
        if (finalTxt !== src) changedCount++;
        it.set(finalTxt);
      });
      if (!changedCount && data && data.changed === false) {
        console.warn('No changes applied by translator. Check LT_URL and network.');
      }
      setLang(targetLang);
      localStorage.setItem('site_lang', targetLang);
    } catch (e) {
      console.error('Translation error', e);
    } finally {
      setBusy(false);
    }
  }

  function restoreOriginal() {
    try {
      const cache = window['__orig_text_cache__'];
      if (!cache || !cache.items || !cache.originals) {
        const container = document.body;
        const items = collectTranslatableItems(container);
        const originals = items.map(it => it.get());
        window['__orig_text_cache__'] = { items, originals };
      }
      const c = window['__orig_text_cache__'];
      if (c && c.items && c.originals) {
        c.items.forEach((it, i) => { if (it && c.originals[i] != null) it.set(c.originals[i]); });
      } else {
        // Fallback: reload to ensure pristine text
        location.reload();
        return;
      }
      setLang('en');
      localStorage.setItem('site_lang', 'en');
    } catch {}
  }

  // Reapply language on mount if user had previously selected one
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('site_lang');
      if (saved && saved !== 'en') {
        applyTranslation(saved);
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Listen for app-level page changes to re-apply current language once
  React.useEffect(() => {
    function onPageChanged() {
      const saved = localStorage.getItem('site_lang');
      if (saved && saved !== 'en' && !busy) {
        applyTranslation(saved);
      }
    }
    window.addEventListener('page-changed', onPageChanged);
    return () => window.removeEventListener('page-changed', onPageChanged);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy]);

  function restoreOriginal() {
    try {
      // Persist original language by setting googtrans to /en/en and clearing variants
      const val = '/en/en';
      const exp = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
      const hosts = [location.hostname];
      const parts = location.hostname.split('.');
      if (parts.length > 2) hosts.push('.' + parts.slice(-2).join('.'));
      if (parts.length >= 2) hosts.push('.' + parts.slice(-2).join('.'));
      hosts.forEach((dom) => {
        try { document.cookie = `googtrans=${val}; expires=${exp}; path=/; domain=${dom}`; } catch {}
      });
      // Also try immediate switch to English without reload
      changeLang('en');
      setTimeout(() => { try { document.body.style.top = '0px'; } catch {} }, 50);
    } catch {}
  }

  return (
    <>
      <style>{`
        .translate-widget { position: fixed; top: 50px; right: 50px; z-index: 999999; }
  .translate-box { display: flex; gap: 8px; background: rgba(0,0,0,0.6); border: 1px solid #bfa43a; padding: 8px; }
  .translate-btn { cursor: pointer; width: 36px; height: 24px; line-height: 24px; text-align: center; font-size: 18px; border: 1px solid #bfa43a33; color: #ffd700; background: #000; }
        .translate-btn:hover { border-color: #bfa43a; box-shadow: 0 0 10px rgba(191,164,58,0.25); }
        .translate-btn[disabled] { opacity: 0.6; cursor: wait; }
        @media (max-width: 768px) { .translate-widget { top: 12px; right: 12px; } }
      `}</style>

      <div className="translate-widget">
        <div className="translate-box" role="group" aria-label="Translate page">
          <button className="translate-btn" title="Original (English)" onClick={restoreOriginal} aria-label="Restore original" disabled={busy}>⟲</button>
          <button className="translate-btn" title="Suomi" onClick={() => applyTranslation('fi')} aria-label="Käännä suomeksi" disabled={busy}>🇫🇮</button>
          <button className="translate-btn" title="Eesti" onClick={() => applyTranslation('et')} aria-label="Tõlgi eesti keelde" disabled={busy}>🇪🇪</button>
        </div>
      </div>
      {/* Minimal overlay to show progress */}
      {busy && (
        <div className="translate-overlay" style={{position:'fixed', inset:0, pointerEvents:'none', zIndex:999998}}>
          <div style={{position:'absolute', top:6, right:6, color:'#ffd700', fontSize:12, background:'rgba(0,0,0,0.5)', padding:'4px 6px', border:'1px solid #bfa43a'}}>Translating…</div>
        </div>
      )}
    </>
  );
}
