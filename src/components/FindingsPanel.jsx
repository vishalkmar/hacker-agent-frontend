import { useState } from 'react';
import { useChat } from '../store/chatStore.js';
import { api } from '../services/api.js';

const SEV = {
  critical: 'text-accent-red border-accent-red/40',
  high: 'text-accent-orange border-accent-orange/40',
  medium: 'text-accent-yellow border-accent-yellow/40',
  low: 'text-accent-blue border-accent-blue/40',
  info: 'text-txt-secondary border-line',
};
const STATUSES = ['open', 'confirmed', 'fixed', 'false_positive', 'accepted_risk'];

function FindingRow({ f, onChange }) {
  const [open, setOpen] = useState(false);
  const sevClass = SEV[f.severity] || SEV.info;

  const patch = async (p) => {
    try {
      await api.updateFinding(f.id, p);
      onChange();
    } catch (e) {
      alert(e.message);
    }
  };
  const del = async () => {
    if (!confirm('Delete this finding?')) return;
    await api.deleteFinding(f.id);
    onChange();
  };

  return (
    <div className={`text-sm bg-bg-tertiary border rounded-lg ${sevClass}`}>
      <div className="flex items-center justify-between gap-2 px-3 py-2 cursor-pointer" onClick={() => setOpen((o) => !o)}>
        <span className="font-medium text-txt-primary truncate">
          {f.status === 'fixed' || f.status === 'false_positive' ? <s className="opacity-60">{f.title}</s> : f.title}
        </span>
        <span className="flex items-center gap-2 shrink-0 text-[10px] uppercase">
          {f.cvss_score != null && Number(f.cvss_score) > 0 && <span className="opacity-80">{f.cvss_score}</span>}
          <span>{f.severity}</span>
        </span>
      </div>
      {open && (
        <div className="px-3 pb-2 text-[11px] text-txt-secondary space-y-1 border-t border-line/50 pt-2">
          <div className="text-txt-muted">
            {f.host ? `host ${f.host} ` : ''}{f.service ? `· ${f.service} ` : ''}{f.version ? `· ${f.version} ` : ''}· {f.finding_type} · {f.source}
          </div>
          {f.cve && (
            <div>
              CVE:{' '}
              {f.cve.split(',').map((c) => (
                <a key={c} href={`https://nvd.nist.gov/vuln/detail/${c.trim()}`} target="_blank" rel="noreferrer" className="text-accent-cyan underline mr-1">
                  {c.trim()}
                </a>
              ))}
            </div>
          )}
          {f.evidence && <pre className="whitespace-pre-wrap break-words bg-bg-primary/60 rounded p-2 max-h-32 overflow-y-auto">{f.evidence}</pre>}
          {f.remediation && <div><span className="text-accent-green">Fix:</span> {f.remediation}</div>}
          <div className="flex items-center gap-2 pt-1">
            <select
              value={f.status || 'open'}
              onChange={(e) => patch({ status: e.target.value })}
              className="bg-bg-primary border border-line rounded px-1 py-0.5 text-[11px]"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              value={f.severity}
              onChange={(e) => patch({ severity: e.target.value })}
              className="bg-bg-primary border border-line rounded px-1 py-0.5 text-[11px]"
            >
              {['critical', 'high', 'medium', 'low', 'info'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button onClick={del} className="text-accent-red hover:underline ml-auto">delete</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FindingsPanel() {
  const { findings, findingStats, toggleFindings, loadFindings, currentId } = useChat();
  const s = findingStats || { critical: 0, high: 0, medium: 0, low: 0, info: 0, total: 0 };
  const [reporting, setReporting] = useState(false);

  const genReport = async () => {
    if (!currentId) return;
    setReporting(true);
    try {
      const { report } = await api.generateReport(currentId);
      window.open(api.reportUrl(report.id, 'html'), '_blank');
    } catch (e) {
      alert('Report failed: ' + e.message);
    } finally {
      setReporting(false);
    }
  };

  return (
    <div className="h-80 shrink-0 flex flex-col border-t border-line bg-bg-secondary">
      <div className="flex items-center justify-between px-3 py-2 border-b border-line">
        <div className="flex items-center gap-3 text-xs">
          <span className="text-accent-cyan font-mono">🎯 Findings ({s.total})</span>
          {s.critical > 0 && <span className="text-accent-red">crit {s.critical}</span>}
          {s.high > 0 && <span className="text-accent-orange">high {s.high}</span>}
          {s.medium > 0 && <span className="text-accent-yellow">med {s.medium}</span>}
          {s.low > 0 && <span className="text-accent-blue">low {s.low}</span>}
          {s.info > 0 && <span className="text-txt-muted">info {s.info}</span>}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={genReport}
            disabled={reporting}
            className="text-xs px-2 py-0.5 rounded bg-accent-purple/20 text-accent-purple border border-accent-purple/30 disabled:opacity-50"
          >
            {reporting ? 'generating…' : '📄 Report'}
          </button>
          <button onClick={loadFindings} className="text-xs text-txt-muted hover:text-txt-primary">refresh</button>
          <button onClick={toggleFindings} className="text-xs text-txt-muted hover:text-accent-red">✕</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {findings.length === 0 && (
          <div className="text-xs text-txt-muted p-2">
            No findings yet. Ask the AI to scan a target (e.g. “scan scanme.nmap.org” or
            “vulnscan https://target”). Open ports, vulns, CVEs and CVSS show up here. Click a
            finding to expand, change status/severity, or delete.
          </div>
        )}
        {findings.map((f) => (
          <FindingRow key={f.id} f={f} onChange={loadFindings} />
        ))}
      </div>
    </div>
  );
}
