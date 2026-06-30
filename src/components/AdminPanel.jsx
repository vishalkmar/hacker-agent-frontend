import { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { useAuth } from '../store/authStore.js';
import { Card, Badge, Button, Input, Spinner } from '../ui/index.jsx';
import { ShieldHalf, X } from 'lucide-react';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—');
const TXN_COLOR = { paid: 'green', created: 'orange', failed: 'red' };

function Kpi({ label, value, sub }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-txt-muted uppercase">{label}</div>
      <div className="text-2xl font-bold text-txt-primary mt-1">{value}</div>
      {sub && <div className="text-xs text-txt-muted mt-0.5">{sub}</div>}
    </Card>
  );
}

function SignupBars({ data }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <Card className="p-4">
      <div className="text-xs text-txt-muted uppercase mb-3">Signups (14 days)</div>
      <div className="flex items-end gap-1 h-28">
        {data.map((d) => (
          <div key={d.date} className="flex-1 flex flex-col items-center justify-end group" title={`${d.date}: ${d.count}`}>
            <div className="w-full bg-primary/80 rounded-t group-hover:bg-primary transition" style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count ? 4 : 0 }} />
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function AdminPanel() {
  const { showAdmin, closeAdmin } = useAuth();
  const [tab, setTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState('');
  const [txns, setTxns] = useState([]);
  const [plans, setPlans] = useState([]);

  const loadTab = async (t) => {
    setLoading(true);
    try {
      if (t === 'dashboard') setMetrics(await api.adminMetrics());
      else if (t === 'users') setUsers((await api.adminUsers(q)).users);
      else if (t === 'transactions') setTxns((await api.adminTransactions()).transactions);
      else if (t === 'plans') setPlans((await api.adminPlans()).plans);
    } finally { setLoading(false); }
  };

  useEffect(() => { if (showAdmin) loadTab(tab); /* eslint-disable-next-line */ }, [showAdmin, tab]);
  if (!showAdmin) return null;

  const changePlan = async (id, planCode) => { await api.adminSetUserPlan(id, planCode); loadTab('users'); };
  const savePlan = async (p, patch) => { await api.adminSavePlan(p.code, { ...p, ...patch }); loadTab('plans'); };

  const Tab = ({ id, label }) => (
    <button onClick={() => setTab(id)}
      className={`px-3 py-1.5 rounded-lg text-sm transition ${tab === id ? 'bg-primary text-white' : 'text-txt-secondary hover:bg-bg-tertiary'}`}>{label}</button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={closeAdmin}>
      <div className="w-full max-w-5xl bg-bg-primary border border-line rounded-2xl shadow-lift max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-line sticky top-0 bg-bg-primary z-10">
          <h2 className="text-lg font-bold text-txt-primary flex items-center gap-2"><ShieldHalf size={18} className="text-primary" /> Admin Panel</h2>
          <div className="flex gap-2">
            <Tab id="dashboard" label="Dashboard" />
            <Tab id="users" label="Users" />
            <Tab id="transactions" label="Transactions" />
            <Tab id="plans" label="Plans" />
            <button onClick={closeAdmin} className="ml-2 text-txt-muted hover:text-accent-red"><X size={18} /></button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="py-16 flex justify-center"><Spinner /></div>
          ) : tab === 'dashboard' && metrics ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Kpi label="Total users" value={metrics.users.users} sub={`${metrics.users.new_7d} new this week`} />
                <Kpi label="Verified" value={metrics.users.verified} />
                <Kpi label="Active subs" value={metrics.subscriptions.active} sub={`${metrics.subscriptions.expiring_7d} expiring ≤7d`} />
                <Kpi label="Revenue" value={`₹${metrics.revenue.total}`} sub={`₹${metrics.revenue.month} this month`} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <SignupBars data={metrics.signups} />
                <Card className="p-4">
                  <div className="text-xs text-txt-muted uppercase mb-3">Plan distribution</div>
                  <div className="space-y-2">
                    {metrics.plans.map((p) => (
                      <div key={p.plan} className="flex items-center justify-between text-sm">
                        <span className="capitalize text-txt-secondary">{p.plan}</span>
                        <Badge color="blue">{p.count}</Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          ) : tab === 'users' ? (
            <div>
              <div className="flex gap-2 mb-3">
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search email / name…"
                  onKeyDown={(e) => e.key === 'Enter' && loadTab('users')} />
                <Button onClick={() => loadTab('users')}>Search</Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-txt-muted text-xs text-left border-b border-line">
                    <th className="py-2">Email</th><th>Joined</th><th>Plan</th><th>Expiry</th><th>Verified</th><th>Change plan</th>
                  </tr></thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-line/60">
                        <td className="py-2 text-txt-primary">{u.email}</td>
                        <td className="text-txt-secondary">{fmtDate(u.created_at)}</td>
                        <td><Badge color="blue">{u.role}</Badge></td>
                        <td className="text-txt-secondary">{fmtDate(u.expires_at)}</td>
                        <td>{u.email_verified ? '✓' : '—'}</td>
                        <td>
                          <select defaultValue="" onChange={(e) => e.target.value && changePlan(u.id, e.target.value)}
                            className="bg-bg-secondary border border-line rounded-lg text-xs px-2 py-1 text-txt-primary">
                            <option value="">set…</option>
                            <option value="free">free</option>
                            <option value="pro">pro</option>
                            <option value="enterprise">enterprise</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : tab === 'transactions' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-txt-muted text-xs text-left border-b border-line">
                  <th className="py-2">Date</th><th>User</th><th>Plan</th><th>Amount</th><th>Status</th><th>Order</th>
                </tr></thead>
                <tbody>
                  {txns.map((t) => (
                    <tr key={t.id} className="border-b border-line/60">
                      <td className="py-2 text-txt-secondary">{fmtDate(t.created_at)}</td>
                      <td className="text-txt-primary">{t.email}</td>
                      <td className="capitalize">{t.plan_code}</td>
                      <td>₹{Number(t.amount)}</td>
                      <td><Badge color={TXN_COLOR[t.status] || 'gray'}>{t.status}</Badge></td>
                      <td className="text-txt-muted text-xs">{t.cf_order_id}</td>
                    </tr>
                  ))}
                  {txns.length === 0 && <tr><td colSpan={6} className="text-center text-txt-muted py-10">No transactions.</td></tr>}
                </tbody>
              </table>
            </div>
          ) : tab === 'plans' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((p) => (
                <Card key={p.code} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold capitalize text-txt-primary">{p.name}</h3>
                    <Badge color={p.is_active ? 'green' : 'gray'}>{p.is_active ? 'active' : 'hidden'}</Badge>
                  </div>
                  <label className="text-xs text-txt-muted">Price (₹/mo)</label>
                  <Input type="number" defaultValue={p.price_inr} onBlur={(e) => Number(e.target.value) !== p.price_inr && savePlan(p, { price_inr: Number(e.target.value) })} />
                  <label className="text-xs text-txt-muted">Daily limit</label>
                  <Input type="number" defaultValue={p.daily_limit} onBlur={(e) => Number(e.target.value) !== p.daily_limit && savePlan(p, { daily_limit: Number(e.target.value) })} />
                  <Button size="sm" variant={p.is_active ? 'outline' : 'primary'} className="w-full" onClick={() => savePlan(p, { is_active: !p.is_active })}>
                    {p.is_active ? 'Hide plan' : 'Activate'}
                  </Button>
                </Card>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
