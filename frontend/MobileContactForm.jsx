import React, { useState } from "react";

function getRandomCaptcha() {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  return {
    question: `${a} + ${b} = ?`,
    answer: (a + b).toString()
  };
}

export default function MobileContactForm({ initialSubject = "", initialMessage = "" }) {
  const [form, setForm] = useState({ 
    name: "", 
    email: "", 
    subject: initialSubject, 
    message: initialMessage 
  });
  const [captcha, setCaptcha] = useState(getRandomCaptcha());
  const [captchaInput, setCaptchaInput] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setStatus("");

    // Validate captcha
    if (captchaInput !== captcha.answer) {
      setError("Incorrect captcha answer");
      setCaptcha(getRandomCaptcha());
      setCaptchaInput("");
      return;
    }

    // Validate form
    if (!form.name || !form.email || !form.message) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        setStatus("Message sent successfully!");
        setForm({ name: "", email: "", subject: "", message: "" });
        setCaptchaInput("");
        setCaptcha(getRandomCaptcha());
      } else {
        throw new Error("Failed to send message");
      }
    } catch (err) {
      setError("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-page-content">
      <div className="mobile-page-title">Contact Me</div>
      
      <div className="mobile-text-content">
        <strong>M.Norenberg Sysadmin</strong><br />
        Finland, Helsinki<br />
        📞 +358408511881<br />
        ✉️ gallogeta@gmail.com
      </div>

      <form onSubmit={handleSubmit} className="mobile-form">
        <input
          type="text"
          placeholder="Your Name *"
          className="mobile-input"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />

        <input
          type="email"
          placeholder="Your Email *"
          className="mobile-input"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />

        <input
          type="text"
          placeholder="Subject"
          className="mobile-input"
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
        />

        <textarea
          placeholder="Your Message *"
          className="mobile-input mobile-textarea"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          required
        />

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#ffd700' }}>
            Security Question: {captcha.question}
          </label>
          <input
            type="text"
            placeholder="Your answer"
            className="mobile-input"
            value={captchaInput}
            onChange={(e) => setCaptchaInput(e.target.value)}
            required
          />
        </div>

        {error && (
          <div style={{ 
            color: '#ff4444', 
            marginBottom: '16px', 
            padding: '12px', 
            background: 'rgba(255, 68, 68, 0.1)',
            borderRadius: '8px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {status && (
          <div style={{ 
            color: '#44ff44', 
            marginBottom: '16px', 
            padding: '12px', 
            background: 'rgba(68, 255, 68, 0.1)',
            borderRadius: '8px',
            fontSize: '14px'
          }}>
            {status}
          </div>
        )}

        <button
          type="submit"
          className="mobile-btn"
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Message"}
        </button>
      </form>
    </div>
  );
}