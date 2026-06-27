import { useState, useRef, useEffect } from 'react';
import { api } from '../services/api.js';
import { useChat } from '../store/chatStore.js';

// A simple manual terminal: type a command, it runs on the backend shell and shows output.
// (The AI also runs commands on its own inside chat; this is for you to drive it directly.)
export default function Terminal() {
  const { execInfo, currentId, toggleTerminal } = useChat();
  const [lines, setLines] = useState([
    {
      type: 'info',
      text: `CypherMind terminal — backend: ${execInfo?.backend || '?'}${
        execInfo?.backend === 'docker' || execInfo?.backend === 'auto' ? ` (${execInfo?.image})` : ''
      } · shell: ${execInfo?.shell || '?'} · host-guard: ${execInfo?.guardHost ? 'on' : 'off'}`,
    },
  ]);
  const [cmd, setCmd] = useState('');
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState([]);
  const [histIdx, setHistIdx] = useState(-1);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView();
  }, [lines]);

  const run = async () => {
    const command = cmd.trim();
    if (!command || busy) return;
    setLines((l) => [...l, { type: 'cmd', text: `$ ${command}` }]);
    setHistory((h) => [...h, command]);
    setHistIdx(-1);
    setCmd('');
    setBusy(true);
    try {
      const r = await api.runCommand(command, currentId || undefined);
      const body = [r.stdout, r.stderr].filter((s) => s && s.trim()).join('\n').trimEnd();
      setLines((l) => [
        ...l,
        ...(body ? [{ type: 'out', text: body }] : []),
        {
          type: r.exitCode === 0 ? 'exit-ok' : 'exit-bad',
          text: `[exit ${r.exitCode}${r.blocked ? ' · blocked by host guard' : ''}]`,
        },
      ]);
    } catch (e) {
      setLines((l) => [...l, { type: 'err', text: e.message }]);
    } finally {
      setBusy(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      run();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!history.length) return;
      const i = histIdx < 0 ? history.length - 1 : Math.max(0, histIdx - 1);
      setHistIdx(i);
      setCmd(history[i]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIdx < 0) return;
      const i = histIdx + 1;
      if (i >= history.length) {
        setHistIdx(-1);
        setCmd('');
      } else {
        setHistIdx(i);
        setCmd(history[i]);
      }
    }
  };

  const color = {
    info: 'text-txt-muted',
    cmd: 'text-accent-cyan',
    out: 'text-txt-primary',
    err: 'text-accent-red',
    'exit-ok': 'text-accent-green',
    'exit-bad': 'text-accent-orange',
  };

  return (
    <div className="h-72 shrink-0 flex flex-col border-t border-line bg-bg-tertiary">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-line bg-bg-secondary">
        <span className="text-xs text-txt-secondary font-mono">
          ▣ Terminal — {execInfo?.backend === 'host' ? 'host' : execInfo?.backend} · {execInfo?.shell}
        </span>
        <div className="flex items-center gap-3">
          <button onClick={() => setLines([])} className="text-xs text-txt-muted hover:text-txt-primary">
            clear
          </button>
          <button onClick={toggleTerminal} className="text-xs text-txt-muted hover:text-accent-red">
            ✕ close
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 font-mono text-[12.5px] leading-relaxed">
        {lines.map((l, i) => (
          <pre key={i} className={`whitespace-pre-wrap break-words ${color[l.type] || ''}`}>
            {l.text}
          </pre>
        ))}
        {busy && <pre className="text-txt-muted">running…</pre>}
        <div ref={endRef} />
      </div>

      <div className="flex items-center gap-2 px-3 py-2 border-t border-line">
        <span className="text-accent-cyan font-mono text-sm">$</span>
        <input
          autoFocus
          value={cmd}
          onChange={(e) => setCmd(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={busy}
          placeholder={`run a ${execInfo?.shell || ''} command…`}
          className="flex-1 bg-transparent outline-none font-mono text-[13px] text-txt-primary placeholder:text-txt-muted disabled:opacity-50"
        />
      </div>
    </div>
  );
}
