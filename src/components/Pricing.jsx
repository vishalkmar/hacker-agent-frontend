import { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { useAuth } from '../store/authStore.js';
import { Button, Card, Badge, Spinner } from '../ui/index.jsx';
import { X } from 'lucide-react';

// Lazy-load the Cashfree v3 SDK.
function loadCashfree() {
  return new Promise((resolve, reject) => {
    if (window.Cashfree) return resolve(window.Cashfree);
    const s = document.createElement('script');
    s.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    s.onload = () => resolve(window.Cashfree);
    s.onerror = () => reject(new Error('Failed to load Cashfree SDK'));
    document.head.appendChild(s);
  });
}

export default function Pricing() {
  const { showPricing, closePricing, user, openAuth } = useAuth();
  const [plans, setPlans] = useState([]);
  const [current, setCurrent] = useState('free');
  const [cashfreeOn, setCashfreeOn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!showPricing) return;
    setLoading(true); setMsg('');
    (async () => {
      try {
        const { plans, cashfree } = await api.plans();
        setPlans(plans); setCashfreeOn(cashfree);
        if (user) {
          const me = await api.billingMe().catch(() => null);
          if (me) setCurrent(me.plan.code);
        }
      } finally { setLoading(false); }
    })();
  }, [showPricing, user]);

  if (!showPricing) return null;

  const upgrade = async (plan) => {
    if (!user) { openAuth(); return; }
    if (!cashfreeOn) { setMsg('Payments not configured yet (admin needs to add Cashfree keys).'); return; }
    setBusy(plan.code); setMsg('');
    try {
      const { orderId, paymentSessionId, mode } = await api.billingCheckout(plan.code);
      const Cashfree = await loadCashfree();
      const cf = Cashfree({ mode });
      await cf.checkout({ paymentSessionId, redirectTarget: '_modal' });
      // Back from checkout — verify the order (webhook may also have fired).
      const r = await api.billingVerify(orderId);
      if (r.status === 'paid') {
        setMsg('✅ Payment successful — your plan is now active!');
        setCurrent(plan.code);
        setTimeout(() => window.location.reload(), 1200);
      } else {
        setMsg('Payment not completed (' + r.status + '). If you paid, it will activate shortly.');
      }
    } catch (e) {
      setMsg(e.message);
    } finally { setBusy(''); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={closePricing}>
      <div className="w-full max-w-4xl bg-bg-primary border border-line rounded-2xl p-6 shadow-lift max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-bold text-txt-primary">Upgrade your plan</h2>
          <button onClick={closePricing} className="text-txt-muted hover:text-accent-red"><X size={18} /></button>
        </div>
        <p className="text-sm text-txt-muted mb-5">Choose a plan that fits. Billed monthly · cancel anytime.</p>

        {loading ? (
          <div className="py-16 flex justify-center"><Spinner /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((p) => {
              const isCurrent = p.code === current;
              const featured = p.code === 'pro';
              return (
                <Card key={p.code} className={`p-5 flex flex-col ${featured ? 'ring-2 ring-primary' : ''}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-txt-primary">{p.name}</h3>
                    {featured && <Badge color="blue">Popular</Badge>}
                  </div>
                  <div className="mt-3">
                    <span className="text-3xl font-extrabold text-txt-primary">₹{p.price_inr}</span>
                    {p.price_inr > 0 && <span className="text-txt-muted text-sm">/mo</span>}
                  </div>
                  <ul className="mt-4 space-y-2 flex-1">
                    {p.features.map((f) => (
                      <li key={f} className="text-sm text-txt-secondary flex gap-2">
                        <span className="text-accent-green">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5">
                    {isCurrent ? (
                      <Button variant="outline" className="w-full" disabled>Current plan</Button>
                    ) : p.price_inr === 0 ? (
                      <Button variant="ghost" className="w-full" disabled>Free</Button>
                    ) : (
                      <Button className="w-full" disabled={busy === p.code} onClick={() => upgrade(p)}>
                        {busy === p.code ? 'Processing…' : `Upgrade to ${p.name}`}
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
        {msg && <div className="mt-4 text-sm text-center text-txt-secondary">{msg}</div>}
        {!cashfreeOn && !loading && (
          <div className="mt-3 text-xs text-center text-accent-orange">
            Demo mode — add Cashfree keys in the backend to enable real payments.
          </div>
        )}
      </div>
    </div>
  );
}
