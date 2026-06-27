import { useState, useEffect } from 'react';
import { useAuth } from '../store/authStore.js';
import { Button, Logo } from '../ui/index.jsx';
import OtpInput from './OtpInput.jsx';

export default function AuthModal() {
  const { showAuth, closeAuth, otpStart, otpVerify, otpResend } = useAuth();
  const [step, setStep] = useState('email'); // email | otp
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [mode, setMode] = useState('login');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  if (!showAuth) return null;

  const sendCode = async (e) => {
    e?.preventDefault();
    setBusy(true); setErr('');
    try {
      const { mode: m } = await otpStart(email, name);
      setMode(m);
      setStep('otp');
      setCooldown(60);
    } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };

  const verify = async (e) => {
    e?.preventDefault();
    setBusy(true); setErr('');
    try {
      await otpVerify(email, code);
      window.location.reload();
    } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };

  const resend = async () => {
    if (cooldown > 0) return;
    setErr('');
    try { await otpResend(email); setCooldown(60); } catch (e2) { setErr(e2.message); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm" onClick={closeAuth}>
      <div className="w-[400px] bg-bg-secondary border border-line rounded-2xl p-7 shadow-lift" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col items-center text-center mb-5">
          <Logo size={52} />
          <h2 className="text-lg font-bold text-txt-primary mt-3">
            {step === 'email' ? 'Sign in to CypherMind' : 'Enter your code'}
          </h2>
          <p className="text-xs text-txt-muted mt-1">
            {step === 'email'
              ? 'We’ll email you a 6-digit code — no password needed.'
              : `Sent to ${email}`}
          </p>
        </div>

        {step === 'email' ? (
          <form onSubmit={sendCode} className="space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name (for new accounts)"
              className="w-full bg-bg-tertiary border border-line rounded-xl px-3 py-2.5 text-sm text-txt-primary outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary-ring/40"
            />
            <input
              type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-bg-tertiary border border-line rounded-xl px-3 py-2.5 text-sm text-txt-primary outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary-ring/40"
            />
            {err && <div className="text-xs text-accent-red">{err}</div>}
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? 'Sending…' : 'Send code'}
            </Button>
          </form>
        ) : (
          <form onSubmit={verify} className="space-y-4">
            <OtpInput value={code} onChange={setCode} />
            {err && <div className="text-xs text-accent-red text-center">{err}</div>}
            <Button type="submit" disabled={busy || code.length < 6} className="w-full">
              {busy ? 'Verifying…' : mode === 'register' ? 'Create account' : 'Sign in'}
            </Button>
            <div className="flex items-center justify-between text-xs text-txt-muted">
              <button type="button" onClick={() => { setStep('email'); setCode(''); setErr(''); }} className="hover:text-txt-primary">
                ← Change email
              </button>
              <button type="button" onClick={resend} disabled={cooldown > 0} className="text-primary disabled:text-txt-muted">
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
