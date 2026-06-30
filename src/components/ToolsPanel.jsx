import { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { useAuth } from '../store/authStore.js';
import { Button, Card, Badge, Input, Spinner } from '../ui/index.jsx';
import { Wrench, X } from 'lucide-react';

const STATUS_COLOR = { works: 'green', partial: 'orange', broken: 'red', untested: 'gray' };

export default function ToolsPanel() {
  const { showTools, closeTools, user } = useAuth();
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [stats, setStats] = useState(null);
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');
  const [audit, setAudit] = useState(null);

  useEffect(() => {
    if (!showTools) return;
    api.toolsStats().then(setStats).catch(() => {});
  }, [showTools, busy]);

  if (!showTools) return null;

  const search = async () => {
    if (!q.trim()) return;
    setSearching(true);
    try { setResults((await api.toolsSearch(q)).tools); } finally { setSearching(false); }
  };

  const run = async (label, fn) => {
    setBusy(label); setMsg('');
    try { const r = await fn(); setMsg(`${label}: ${JSON.stringify(r)}`.slice(0, 200)); }
    catch (e) { setMsg(`${label} failed: ${e.message}`); }
    finally { setBusy(''); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={closeTools}>
      <div className="w-full max-w-3xl bg-bg-primary border border-line rounded-2xl shadow-lift max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <h2 className="text-lg font-bold text-txt-primary flex items-center gap-2"><Wrench size={18} className="text-primary" /> Kali Tool Intelligence</h2>
          <button onClick={closeTools} className="text-txt-muted hover:text-accent-red"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex gap-3 text-sm text-txt-secondary">
            <Badge color="blue">{stats?.tools ?? 0} tools indexed</Badge>
            <Badge color="green">{stats?.with_example ?? 0} with examples</Badge>
          </div>

          <div className="flex gap-2">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="What do you need? e.g. brute-force SSH, make a wordlist…"
              onKeyDown={(e) => e.key === 'Enter' && search()} />
            <Button onClick={search} disabled={searching}>{searching ? '…' : 'Find tools'}</Button>
          </div>

          <div className="space-y-2">
            {results.map((t) => (
              <Card key={t.name} className="p-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-txt-primary">{t.name}</span>
                  <div className="flex items-center gap-2">
                    {t.category && <Badge color="blue">{t.category}</Badge>}
                    {t.score ? <span className="text-[10px] text-txt-muted">{Number(t.score).toFixed(2)}</span> : null}
                  </div>
                </div>
                {t.summary && <div className="text-sm text-txt-secondary mt-1">{t.summary}</div>}
                {t.example && <code className="block mt-1 text-xs bg-bg-tertiary rounded px-2 py-1 text-txt-primary">{t.example}</code>}
              </Card>
            ))}
            {results.length === 0 && <div className="text-center text-txt-muted text-sm py-8">Search the indexed Kali arsenal — the AI uses this same index to pick tools &amp; flags.</div>}
          </div>

          {user?.is_admin && (
            <div className="border-t border-line pt-4">
              <div className="text-xs text-txt-muted uppercase mb-2">Admin — build the index &amp; test tools</div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" disabled={busy} onClick={async () => { setBusy('audit'); setMsg(''); try { setAudit(await api.toolsAudit()); } catch (e) { setMsg('audit failed: ' + e.message); } finally { setBusy(''); } }}>Audit installed tools</Button>
                <Button size="sm" variant="outline" disabled={busy} onClick={() => run('seed', api.toolsSeed)}>Seed sample tools</Button>
                <Button size="sm" variant="outline" disabled={busy} onClick={() => run('reindex', () => api.toolsReindex(100000))}>Rebuild from container</Button>
                <Button size="sm" variant="outline" disabled={busy} onClick={() => run('selftest', () => api.toolsSelftest('all', 25))}>Run self-test</Button>
              </div>
              {busy && <div className="text-xs text-primary mt-2 flex items-center gap-2"><Spinner /> {busy}…</div>}

              {audit && (
                <Card className="p-3 mt-3 text-xs">
                  <div className="flex flex-wrap gap-2 mb-2">
                    <Badge color={audit.isEverythingImage ? 'green' : 'orange'}>image: {audit.configuredImage}</Badge>
                    <Badge color={audit.ready ? 'green' : 'red'}>{audit.ready ? 'container ready' : 'not ready'}</Badge>
                    {audit.report && <Badge color={audit.report.kali_everything === 'yes' ? 'green' : 'orange'}>everything: {audit.report.kali_everything}</Badge>}
                  </div>
                  {!audit.ready ? (
                    <div className="text-accent-red">{audit.error}</div>
                  ) : (
                    <div className="space-y-1 text-txt-secondary">
                      <div>Binaries: <b className="text-txt-primary">{audit.report.binaries}</b> · Packages: <b className="text-txt-primary">{audit.report.packages}</b> · Checked: {audit.report.checked}</div>
                      <div className="text-accent-green">Present ({audit.report.present?.length}): {(audit.report.present || []).join(', ')}</div>
                      {audit.report.missing?.length > 0 && (
                        <div className="text-accent-orange">Missing ({audit.report.missing.length}): {audit.report.missing.join(', ')}</div>
                      )}
                    </div>
                  )}
                </Card>
              )}
              {msg && <div className="text-xs text-txt-secondary mt-2 break-all">{msg}</div>}
              <p className="text-[11px] text-txt-muted mt-2">“Rebuild from container” extracts real docs from the Kali-Everything image (heavy). Self-test runs safe smoke tests (lab target only).</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
