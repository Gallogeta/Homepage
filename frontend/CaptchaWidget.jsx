import React, { useEffect, useRef, useState } from "react";

// Detect site keys from env or global. Prefer Turnstile; fall back to hCaptcha.
const TURNSTILE_SITEKEY = (import.meta?.env?.VITE_TURNSTILE_SITEKEY) || (typeof window !== 'undefined' && window.TURNSTILE_SITEKEY);
const HCAPTCHA_SITEKEY = (import.meta?.env?.VITE_HCAPTCHA_SITEKEY) || (typeof window !== 'undefined' && window.HCAPTCHA_SITEKEY);

export default function CaptchaWidget({ onToken, onExpired, className = "" }) {
  const containerRef = useRef(null);
  const [provider, setProvider] = useState(null); // 'turnstile' | 'hcaptcha' | null

  useEffect(() => {
    if (TURNSTILE_SITEKEY) setProvider('turnstile');
    else if (HCAPTCHA_SITEKEY) setProvider('hcaptcha');
    else setProvider(null);
  }, []);

  useEffect(() => {
    let script;
    let widgetId;
    let canceled = false;

    const cleanup = () => {
      try {
        if (provider === 'turnstile' && widgetId && window.turnstile) {
          window.turnstile.remove(widgetId);
        }
        if (provider === 'hcaptcha' && window.hcaptcha && containerRef.current) {
          // hCaptcha auto-cleans with container removal; no explicit remove API needed.
        }
      } catch {}
      if (script && script.parentNode) script.parentNode.removeChild(script);
    };

    const renderTurnstile = () => {
      if (!containerRef.current || !window.turnstile) return;
      widgetId = window.turnstile.render(containerRef.current, {
        sitekey: TURNSTILE_SITEKEY,
        callback: (token) => onToken && onToken(token),
        'expired-callback': () => onExpired && onExpired(),
        'error-callback': () => onExpired && onExpired(),
        theme: 'dark',
      });
    };

    const renderHCaptcha = () => {
      if (!containerRef.current || !window.hcaptcha) return;
      window.hcaptcha.render(containerRef.current, {
        sitekey: HCAPTCHA_SITEKEY,
        callback: (token) => onToken && onToken(token),
        'expired-callback': () => onExpired && onExpired(),
        'error-callback': () => onExpired && onExpired(),
        theme: 'dark',
      });
    };

    const ensureScriptAndRender = () => {
      if (provider === 'turnstile') {
        if (window.turnstile) { renderTurnstile(); return; }
        script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.onload = () => { if (!canceled) renderTurnstile(); };
        document.head.appendChild(script);
      } else if (provider === 'hcaptcha') {
        if (window.hcaptcha) { renderHCaptcha(); return; }
        script = document.createElement('script');
        script.src = 'https://hcaptcha.com/1/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.onload = () => { if (!canceled) renderHCaptcha(); };
        document.head.appendChild(script);
      }
    };

    if (provider) ensureScriptAndRender();

    return () => { canceled = true; cleanup(); };
  }, [provider]);

  if (!provider) return null; // No site key configured
  return <div ref={containerRef} className={className} />;
}
