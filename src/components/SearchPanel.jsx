import { useState } from 'react';
import { api } from '../services/api.js';
import { useChat } from '../store/chatStore.js';

// Built-in search engine UI: search the web, preview/fetch pages, run recon, or push a
// result into the chat so the AI works on it.
export default function SearchPanel() {
  const { toggleSearch, sendMessage } = useChat();
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null);
  const [err, setErr] = useState('');

  const search = async () => {
    const query = q.trim();
    if (!query) return;
    setBusy(true);
    setErr('');
    setPreview(null);
    try {
      const { results: r } = await api.search(query);
      setResults(r);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const open = async (url, mode) => {
    setBusy(true);
    setErr('');
    try {
      if (mode === 'recon') {
        const r = await api.recon(url);
        setPreview({ url, type: 'recon', data: r });
      } else {
        const { page } = await api.fetch(url);
        setPreview({ url, type: 'page', data: page });
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="h-80 shrink-0 flex flex-col border-t border-line bg-bg-secondary">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-line">
        <span className="text-accent-cyan">🔎</span>
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          placeholder="Search the web… (supports site:github.com, inurl:admin, CVE …)"
          className="flex-1 bg-transparent outline-none text-sm text-txt-primary placeholder:text-txt-muted"
        />
        <button onClick={search} className="text-xs px-2 py-1 rounded bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30">
          Search
        </button>
        <button onClick={toggleSearch} className="text-xs text-txt-muted hover:text-accent-red">
          ✕
        </button>
      </div>

      {err && <div className="px-3 py-1 text-xs text-accent-red">{err}</div>}

      <div className="flex-1 overflow-hidden flex">
        {/* results list */}
        <div className="w-1/2 overflow-y-auto border-r border-line p-2 space-y-2">
          {busy && !results.length && <div className="text-xs text-txt-muted p-2">working…</div>}
          {results.map((r, i) => (
            <div key={i} className="text-sm bg-bg-tertiary border border-line rounded-lg p-2">
              <a href={r.url} target="_blank" rel="noreferrer" className="text-accent-cyan hover:underline font-medium">
                {r.title}
              </a>
              <div className="text-[10px] text-txt-muted truncate">{r.url}</div>
              <div className="text-xs text-txt-secondary mt-1 line-clamp-2">{r.snippet}</div>
              <div className="flex gap-2 mt-1.5">
                <button onClick={() => open(r.url, 'fetch')} className="text-[11px] text-accent-blue hover:underline">read</button>
                <button onClick={() => open(r.url, 'recon')} className="text-[11px] text-accent-orange hover:underline">recon</button>
                <button
                  onClick={() => { sendMessage(`Analyze this URL for me: ${r.url}`); toggleSearch(); }}
                  className="text-[11px] text-accent-green hover:underline"
                >
                  send to AI
                </button>
              </div>
            </div>
          ))}
          {!busy && !results.length && <div className="text-xs text-txt-muted p-2">No results yet.</div>}
        </div>

        {/* preview */}
        <div className="w-1/2 overflow-y-auto p-3 font-mono text-[11.5px] leading-relaxed text-txt-secondary whitespace-pre-wrap break-words">
          {!preview && <span className="text-txt-muted">Select “read” or “recon” on a result to preview.</span>}
          {preview?.type === 'page' && (
            <>
              <div className="text-accent-cyan">{preview.data.title || preview.url}</div>
              <div className="text-txt-muted">{preview.url} · HTTP {preview.data.status}</div>
              {preview.data.technologies?.length > 0 && <div>Tech: {preview.data.technologies.join(', ')}</div>}
              <div className="mt-2">{(preview.data.text || '').slice(0, 4000)}</div>
            </>
          )}
          {preview?.type === 'recon' && (
            <>
              <div className="text-accent-cyan">Recon: {preview.url}</div>
              <ReconBlock label="Subdomains" arr={preview.data.recon.subdomains} />
              <ReconBlock label="Routes/Endpoints" arr={preview.data.recon.routes} />
              <ReconBlock label="JS endpoints" arr={preview.data.recon.jsEndpoints} />
              <ReconBlock label="Emails" arr={preview.data.recon.emails} />
              <ReconBlock label="IPs" arr={preview.data.recon.ips} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ReconBlock({ label, arr }) {
  if (!arr?.length) return null;
  return (
    <div className="mt-2">
      <span className="text-accent-orange">{label} ({arr.length}):</span>
      <div className="text-txt-secondary">{arr.slice(0, 40).join('\n')}</div>
    </div>
  );
}
