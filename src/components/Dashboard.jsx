import { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { useAuth } from '../store/authStore.js';
import { Button, Card, Badge, Spinner, Input } from '../ui/index.jsx';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const TXN_COLOR = { paid: 'green', created: 'orange', failed: 'red' };

export default function Dashboard() {
  const { showDashboard, closeDashboard, user, setUser, openPricing } = useAuth();
  const [tab, setTab] = useState('overview');
  const [billing, setBilling] = useState(null);
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState(user?.display_name || '');
  const [saved, setSaved] = useState('');

  useEffect(() => {
    if (!showDashboard) return;
    setLoading(true);
    (async () => {
      try {
        const [b, t] = await Promise.all([
          api.billingMe().catch(() => null),
          api.billingTransactions().catch(() => ({ transactions: [] })),
        ]);
        setBilling(b); setTxns(t.transactions || []);
        setName(user?.display_name || '');
      } finally { setLoading(false); }
    })();
  }, [showDashboard, user]);

  if (!showDashboard) return null;

  const saveProfile = async () => {
    setSaved('');
    const { user: u } = await api.updateProfile(name);
    setUser(u); setSaved('Saved ✓');
  };

  const daysLeft = billing?.subscription?.expires_at
    ? Math.max(0, Math.ceil((new Date(billing.subscription.expires_at) - Date.now()) / 86400000))
    : null;
  const usagePct = billing?.usage?.limit ? Math.min(100, Math.round((billing.usage.used / billing.usage.limit) * 100)) : 0;

  const Tab = ({ id, label }) => (
    <button
      onClick={() => setTab(id)}
      className={`px-3 py-1.5 rounded-lg text-sm transition ${tab === id ? 'bg-primary-tint text-primary font-medium' : 'text-txt-secondary hover:bg-bg-tertiary'}`}
    >{label}</button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={closeDashboard}>
      <div className="w-full max-w-3xl bg-bg-primary border border-line rounded-2xl shadow-lift max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <h2 className="text-lg font-bold text-txt-primary">My Account</h2>
          <button onClick={closeDashboard} className="text-txt-muted hover:text-accent-red">✕</button>
        </div>
        <div className="flex gap-2 px-6 pt-4">
          <Tab id="overview" label="Overview" />
          <Tab id="profile" label="Profile" />
          <Tab id="transactions" label="Transactions" />
        </div>

        <div className="p-6">
          {loading ? (
            <div className="py-16 flex justify-center"><Spinner /></div>
          ) : tab === 'overview' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="p-5">
                <div className="text-xs text-txt-muted uppercase">Current plan</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-bold text-txt-primary capitalize">{billing?.plan?.name || 'Free'}</span>
                  <Badge color="blue">{billing?.plan?.period || 'free'}</Badge>
                </div>
                {daysLeft !== null && <div className="text-sm text-txt-secondary mt-1">{daysLeft} days left · renews {fmtDate(billing?.subscription?.expires_at)}</div>}
                <Button className="mt-4" size="sm" onClick={() => { closeDashboard(); openPricing(); }}>⚡ Upgrade</Button>
              </Card>
              <Card className="p-5">
                <div className="text-xs text-txt-muted uppercase">Usage today</div>
                <div className="text-2xl font-bold text-txt-primary mt-1">{billing?.usage?.used || 0}<span className="text-base text-txt-muted"> / {billing?.usage?.limit || 0}</span></div>
                <div className="h-2 bg-bg-tertiary rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: usagePct + '%' }} />
                </div>
                <div className="text-xs text-txt-muted mt-2">Messages used today</div>
              </Card>
            </div>
          ) : tab === 'profile' ? (
            <div className="max-w-sm space-y-4">
              <div>
                <label className="text-xs text-txt-muted">Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-xs text-txt-muted">Email</label>
                <div className="flex items-center gap-2 mt-1">
                  <Input value={user?.email || ''} disabled className="opacity-70" />
                  {user?.email_verified && <Badge color="green">verified</Badge>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={saveProfile}>Save changes</Button>
                {saved && <span className="text-sm text-accent-green">{saved}</span>}
              </div>
            </div>
          ) : (
            <div>
              {txns.length === 0 ? (
                <div className="text-center text-txt-muted py-12 text-sm">No transactions yet.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-txt-muted text-xs text-left border-b border-line">
                      <th className="py-2">Date</th><th>Plan</th><th>Amount</th><th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txns.map((t) => (
                      <tr key={t.id} className="border-b border-line/60">
                        <td className="py-2 text-txt-secondary">{fmtDate(t.created_at)}</td>
                        <td className="capitalize text-txt-primary">{t.plan_code}</td>
                        <td className="text-txt-primary">₹{Number(t.amount)}</td>
                        <td><Badge color={TXN_COLOR[t.status] || 'gray'}>{t.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
