import React, { useState } from "react";
import CaptchaWidget from "./CaptchaWidget";

export default function AuthForm({ onAuth, mode = "login" }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [captchaActive, setCaptchaActive] = useState(false);
  const hasCaptchaSitekey = !!(import.meta?.env?.VITE_TURNSTILE_SITEKEY || import.meta?.env?.VITE_HCAPTCHA_SITEKEY || (typeof window !== 'undefined' && (window.TURNSTILE_SITEKEY || window.HCAPTCHA_SITEKEY)));
  const [resetMode, setResetMode] = useState(null); // 'request' | 'confirm' | null
  const [resetEmail, setResetEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [resetNewPw, setResetNewPw] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const apiBase = (import.meta?.env?.VITE_API_BASE)
    || (typeof window !== 'undefined' && window.API_BASE)
    || (typeof location !== 'undefined' ? location.origin : '');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");
    try {
      if (resetMode === 'request') {
  const r = await fetch(`${apiBase}/password/reset/request`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: resetEmail, captcha: captcha || undefined })
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.detail || 'Reset request failed');
        setInfo('If the email exists, a reset token has been sent.');
        setResetMode('confirm');
        setLoading(false);
        return;
      }
      if (resetMode === 'confirm') {
        const r = await fetch(`${apiBase}/password/reset/confirm`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: resetToken, new_password: resetNewPw })
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.detail || 'Reset failed');
        setInfo('Password has been reset. You can login now.');
        setResetMode(null);
        setLoading(false);
        return;
      }
  const url = mode === "register" ? `${apiBase}/register` : `${apiBase}/token`;
      const body = mode === "register"
        ? { username, password, email, ...(code ? { code } : {}), ...(captcha ? { captcha } : {}) }
        : new URLSearchParams({ username, password });
      const res = await fetch(url, {
        method: "POST",
        headers: mode === "register" ? { "Content-Type": "application/json" } : { "Content-Type": "application/x-www-form-urlencoded" },
        body: mode === "register" ? JSON.stringify(body) : body,
      });
      const data = await res.json();
      if (!res.ok) {
        let msg = data.detail;
        if (Array.isArray(msg)) msg = msg.map(e => e.msg).join(", ");
        if (typeof msg === "object") msg = JSON.stringify(msg);
        throw new Error(msg || "Auth failed");
      }
      onAuth(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (resetMode) {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 p-4 bg-black border border-gold rounded text-gold">
        {resetMode === 'request' ? (
          <>
            <input className="bg-black border-b border-gold px-2 py-1 text-gold" placeholder="Email" type="email" value={resetEmail} onChange={e=>setResetEmail(e.target.value)} required />
            {hasCaptchaSitekey ? (
              <CaptchaWidget
                className="mt-2"
                onToken={(t)=>{ setCaptcha(t); setCaptchaActive(true); }}
                onExpired={()=>{ setCaptcha(""); setCaptchaActive(false); }}
              />
            ) : (
              <input className="bg-black border-b border-gold px-2 py-1 text-gold" placeholder="Captcha (if required)" value={captcha} onChange={e=>setCaptcha(e.target.value)} />
            )}
            {error && <div className="text-red-500 text-xs">{error}</div>}
            {info && <div className="text-green-500 text-xs">{info}</div>}
        <button type="submit" className="header-btn mt-2" disabled={loading || (hasCaptchaSitekey && !captchaActive)}>{loading?"...":"Send reset token"}</button>
            <button type="button" className="menu-btn" onClick={()=>setResetMode(null)}>Back</button>
          </>
        ) : (
          <>
            <input className="bg-black border-b border-gold px-2 py-1 text-gold" placeholder="Reset token" value={resetToken} onChange={e=>setResetToken(e.target.value)} required />
            <input className="bg-black border-b border-gold px-2 py-1 text-gold" placeholder="New password" type="password" value={resetNewPw} onChange={e=>setResetNewPw(e.target.value)} required />
            {error && <div className="text-red-500 text-xs">{error}</div>}
            {info && <div className="text-green-500 text-xs">{info}</div>}
            <button type="submit" className="header-btn mt-2" disabled={loading}>{loading?"...":"Confirm reset"}</button>
            <button type="button" className="menu-btn" onClick={()=>setResetMode(null)}>Back</button>
          </>
        )}
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-gold">
      <input
        className="bg-transparent border border-gold rounded px-3 py-2 text-gold focus:outline-none focus:border-yellow-400 transition-colors"
        placeholder="Username"
        value={username}
        onChange={e => setUsername(e.target.value)}
        required
      />
      {mode === "register" && (
        <input
          className="bg-transparent border border-gold rounded px-3 py-2 text-gold focus:outline-none focus:border-yellow-400 transition-colors"
          placeholder="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
      )}
      <input
        className="bg-transparent border border-gold rounded px-3 py-2 text-gold focus:outline-none focus:border-yellow-400 transition-colors"
        placeholder="Password"
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
      />
      {mode === "register" && (
        <>
          <input
            className="bg-black border-b border-gold px-2 py-1 text-gold focus:outline-none"
            placeholder="Registration code (if provided)"
            value={code}
            onChange={e => setCode(e.target.value)}
          />
          {hasCaptchaSitekey ? (
            <CaptchaWidget
              className="mt-2"
              onToken={(t)=>{ setCaptcha(t); setCaptchaActive(true); }}
              onExpired={()=>{ setCaptcha(""); setCaptchaActive(false); }}
            />
          ) : (
            <input
              className="bg-black border-b border-gold px-2 py-1 text-gold focus:outline-none"
              placeholder="Captcha (if required)"
              value={captcha}
              onChange={e => setCaptcha(e.target.value)}
            />
          )}
        </>
      )}
      {error && <div className="text-red-500 text-sm bg-red-900 bg-opacity-20 border border-red-500 rounded px-3 py-2">{error}</div>}
      {info && <div className="text-green-500 text-sm bg-green-900 bg-opacity-20 border border-green-500 rounded px-3 py-2">{info}</div>}
      <button 
        type="submit" 
        className="bg-gold text-black font-bold py-2 px-4 rounded hover:bg-yellow-400 transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed" 
        disabled={loading || (mode === 'register' && hasCaptchaSitekey && !captchaActive)}
      >
        {loading ? "Processing..." : mode === "register" ? "Create Account" : "Sign In"}
      </button>
      {mode !== 'register' && (
        <button 
          type="button" 
          className="text-gold hover:text-yellow-400 text-sm underline mt-2 transition-colors" 
          onClick={()=>{ setResetMode('request'); setError(''); setInfo(''); }}
        >
          Forgot password?
        </button>
      )}
    </form>
  );
}
