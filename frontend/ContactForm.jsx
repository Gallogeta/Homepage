import React, { useState } from "react";

const PLACEHOLDER = {
  name: "M.Norenberg Sysadmin",
  address: "Finland, Helsinki",
  phone: "+358408511881",
  email: "gallogeta@gmail.com",
};

function getRandomCaptcha() {
  // Simple math captcha
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  return {
    question: `${a} + ${b} = ?`,
    answer: (a + b).toString()
  };
}

export default function ContactForm({ initialSubject = "", initialMessage = "", plan }) {
  const apiBase = (import.meta?.env?.VITE_API_BASE)
    || (typeof window !== 'undefined' && window.API_BASE)
    || (typeof location !== 'undefined' ? location.origin : '');
  const [form, setForm] = useState({ name: "", email: "", subject: initialSubject, message: initialMessage });
  const [captcha, setCaptcha] = useState(getRandomCaptcha());
  const [captchaInput, setCaptchaInput] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("");
    setError("");
    if (captchaInput !== captcha.answer) {
      setError("Captcha incorrect. Please try again.");
      setCaptcha(getRandomCaptcha());
      setCaptchaInput("");
      return;
    }
    setLoading(true);
    try {
  const res = await fetch(`${apiBase}/contact`, { // Fixed: removed double /api/ path
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, plan })
      });
      if (!res.ok) throw new Error("Failed to send message.");
      setStatus("Message sent! Thank you.");
  setForm({ name: "", email: "", subject: "", message: "" });
      setCaptcha(getRandomCaptcha());
      setCaptchaInput("");
    } catch (err) {
      setError(err.message || "Failed to send message.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="p-8 bg-black bg-opacity-80 rounded-lg shadow-lg border mt-8 flex flex-col items-center text-center"
      style={{
        width: window.innerWidth < 768 ? '95%' : '120%',
        maxWidth: '1400px',
        marginLeft: window.innerWidth < 768 ? '2.5%' : '5%',
        marginRight: 'auto',
        boxSizing: 'border-box',
        border: '1px solid transparent',
      }}
    >
      <h2 className="text-3xl font-bold text-gold mb-2 text-center tracking-wide">Contact</h2>
      <div className="mb-6 text-gold text-center">
        <div className="text-xl font-semibold mb-1">{PLACEHOLDER.name}</div>
        <div className="mb-1">{PLACEHOLDER.address}</div>
        <div className="mb-1">{PLACEHOLDER.phone}</div>
  <div className="mb-1"><a href={`mailto:${PLACEHOLDER.email}`} className="underline text-gold hover:text-white">{PLACEHOLDER.email}</a></div>
      </div>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 p-6 rounded-lg shadow-inner"
        style={{
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 80%, rgba(40,40,60,0.85) 100%)',
          border: '0px solid #FFD700',
          boxShadow: '0 2px 24px 0 rgba(255,215,0,0.08)',
        }}
      >
        <input
          className="bg-[#18181c] border border-gold px-3 py-2 text-gold focus:outline-none rounded focus:bg-black/80 focus:border-2 focus:border-yellow-400 transition-colors"
          name="name"
          placeholder="Your Name"
          value={form.name}
          onChange={handleChange}
          required
        />
        <input
          className="bg-[#18181c] border border-gold px-3 py-2 text-gold focus:outline-none rounded focus:bg-black/80 focus:border-2 focus:border-yellow-400 transition-colors"
          name="email"
          type="email"
          placeholder="Your Email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          className="bg-[#18181c] border border-gold px-3 py-2 text-gold focus:outline-none rounded focus:bg-black/80 focus:border-2 focus:border-yellow-400 transition-colors"
          name="subject"
          placeholder="Subject"
          value={form.subject}
          onChange={handleChange}
          required
        />
        <textarea
          className="bg-[#18181c] border border-gold px-3 py-2 text-gold focus:outline-none rounded min-h-[120px] focus:bg-black/80 focus:border-2 focus:border-yellow-400 transition-colors"
          name="message"
          placeholder="Your Message"
          value={form.message}
          onChange={handleChange}
          required
        />
        <div className="flex items-center gap-2">
          <span className="text-gold">Captcha: {captcha.question}</span>
          <input
            className="bg-[#18181c] border border-gold px-2 py-1 text-gold focus:outline-none rounded w-24 focus:bg-black/80 focus:border-2 focus:border-yellow-400 transition-colors"
            value={captchaInput}
            onChange={e => setCaptchaInput(e.target.value)}
            required
          />
        </div>
        {error && <div className="text-red-500 text-xs">{error}</div>}
        {status && <div className="text-green-400 text-xs">{status}</div>}
        <button
          type="submit"
          className="header-btn mt-2 text-lg font-semibold py-2 rounded border border-gold bg-gradient-to-r from-black to-gold hover:from-gold hover:to-black transition-colors"
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Message"}
        </button>
      </form>
    </div>
  );
}
