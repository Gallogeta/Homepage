import React, { useState, useEffect } from "react";

export default function CaptchaWidget({ onToken, onExpired, className = "" }) {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [operator, setOperator] = useState('+');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    generateCaptcha();
  }, []);

  const generateCaptcha = () => {
    const n1 = Math.floor(Math.random() * 10) + 1;
    const n2 = Math.floor(Math.random() * 10) + 1;
    const ops = ['+', '-'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    setNum1(n1);
    setNum2(n2);
    setOperator(op);
    setAnswer('');
    setError('');
  };

  const calculateAnswer = () => {
    if (operator === '+') return num1 + num2;
    if (operator === '-') return num1 - num2;
    return 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const correct = calculateAnswer();
    if (parseInt(answer) === correct) {
      onToken && onToken('verified');
      setError('');
    } else {
      setError('Incorrect answer. Try again.');
      generateCaptcha();
    }
  };

  return (
    <div className={`captcha-widget ${className}`}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="text-gold">
          What is {num1} {operator} {num2}?
        </div>
        <input
          type="number"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="bg-black border border-gold px-2 py-1 text-gold focus:outline-none"
          placeholder="Answer"
          required
        />
        {error && <div className="text-red-500">{error}</div>}
        <button type="submit" className="header-btn">Verify</button>
      </form>
    </div>
  );
}
