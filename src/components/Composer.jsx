import { useState, useRef, useEffect } from 'react';
import { useChat } from '../store/chatStore.js';
import { api } from '../services/api.js';
import CameraCapture from './CameraCapture.jsx';

const IMAGE_ACCEPT = 'image/*';
const DOC_ACCEPT =
  '.pdf,.txt,.md,.log,.csv,.js,.jsx,.ts,.tsx,.py,.rb,.php,.go,.rs,.java,.c,.h,.cpp,.cs,.sh,.ps1,.sql,.html,.css,.json,.yaml,.yml,.xml,.ini,.env,.conf';

export default function Composer() {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [autopilot, setAutopilot] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [camera, setCamera] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const { sendMessage, streaming, stop, currentId } = useChat();
  const ref = useRef(null);
  const photoRef = useRef(null);
  const docRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 260) + 'px';
  }, [text]);

  // Close the attach menu on outside click.
  useEffect(() => {
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const uploadFiles = async (files) => {
    if (!files.length) return;
    setUploading(true);
    try {
      for (const f of files) {
        const file = await api.uploadFile(f, currentId || undefined);
        setAttachments((a) => [...a, file]);
      }
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const onPick = async (e) => {
    const files = [...e.target.files];
    e.target.value = '';
    await uploadFiles(files);
  };

  const onCaptured = async (file) => {
    setCamera(false);
    await uploadFiles([file]);
  };

  const onPaste = (e) => {
    const imgs = [...(e.clipboardData?.items || [])]
      .filter((i) => i.type.startsWith('image/'))
      .map((i) => i.getAsFile())
      .filter(Boolean);
    if (imgs.length) { e.preventDefault(); uploadFiles(imgs); }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = [...(e.dataTransfer?.files || [])];
    if (files.length) uploadFiles(files);
  };

  const submit = () => {
    if (streaming || uploading) return;
    if (!text.trim() && attachments.length === 0) return;
    sendMessage(text, attachments, autopilot);
    setText('');
    setAttachments([]);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const MenuItem = ({ icon, label, onClick }) => (
    <button
      onClick={() => { setMenuOpen(false); onClick(); }}
      className="flex items-center gap-3 w-full px-3 py-2 text-sm text-txt-secondary hover:bg-bg-tertiary hover:text-txt-primary rounded-lg transition"
    >
      <span className="text-base">{icon}</span> {label}
    </button>
  );

  return (
    <div className="border-t border-line bg-bg-primary p-4">
      {camera && <CameraCapture onCapture={onCaptured} onClose={() => setCamera(false)} />}
      <div className="max-w-[820px] mx-auto">
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {attachments.map((a, i) => (
              <span
                key={a.id}
                className="flex items-center gap-2 text-xs bg-bg-secondary border border-line rounded-lg px-2 py-1 text-txt-secondary shadow-soft"
              >
                {a.kind === 'image' ? '🖼️' : a.kind === 'pdf' ? '📄' : '📎'} {a.name}
                <span className="text-txt-muted">· {a.kind}</span>
                {a.meta?.secrets?.length > 0 && (
                  <span className="text-accent-orange" title="secrets detected">⚠ {a.meta.secrets.length}</span>
                )}
                <button
                  onClick={() => setAttachments((arr) => arr.filter((_, idx) => idx !== i))}
                  className="text-txt-muted hover:text-accent-red"
                >✕</button>
              </span>
            ))}
          </div>
        )}

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`flex items-end gap-2 bg-bg-secondary border rounded-2xl px-3 py-2 shadow-soft transition ${
            dragOver ? 'border-primary ring-2 ring-primary-ring/40' : 'border-line focus-within:border-primary/50'
          }`}
        >
          {/* + attach menu */}
          <div className="relative shrink-0" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              title="Add attachment"
              disabled={uploading}
              className="px-2 py-1.5 rounded-lg text-txt-secondary hover:text-primary hover:bg-bg-tertiary disabled:opacity-40 transition text-lg leading-none"
            >＋</button>
            {menuOpen && (
              <div className="absolute bottom-11 left-0 w-44 bg-bg-secondary border border-line rounded-xl shadow-lift p-1 z-20">
                <MenuItem icon="📷" label="Camera" onClick={() => setCamera(true)} />
                <MenuItem icon="🖼️" label="Photo" onClick={() => photoRef.current?.click()} />
                <MenuItem icon="📄" label="Document" onClick={() => docRef.current?.click()} />
              </div>
            )}
          </div>
          <input ref={photoRef} type="file" multiple accept={IMAGE_ACCEPT} onChange={onPick} className="hidden" />
          <input ref={docRef} type="file" multiple accept={DOC_ACCEPT} onChange={onPick} className="hidden" />

          <textarea
            ref={ref}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            placeholder={uploading ? 'Uploading…' : 'Ask CypherMind…  (Enter to send, Shift+Enter for newline)'}
            className="flex-1 bg-transparent outline-none resize-none text-txt-primary placeholder:text-txt-muted py-1.5 max-h-[260px] overflow-y-auto"
          />
          {streaming ? (
            <button
              onClick={stop}
              className="shrink-0 px-3 py-1.5 rounded-lg bg-accent-red/15 text-accent-red border border-accent-red/30 text-sm"
            >■ Stop</button>
          ) : (
            <button
              onClick={submit}
              disabled={(!text.trim() && attachments.length === 0) || uploading}
              className="shrink-0 px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary-hover disabled:opacity-40 text-sm font-medium shadow-soft transition"
            >Send ↵</button>
          )}
        </div>

        <div className="flex items-center justify-center gap-3 mt-2">
          <button
            onClick={() => setAutopilot((a) => !a)}
            title="Autonomous engagement: AI runs the full kill-chain itself"
            className={`text-[11px] px-2 py-0.5 rounded-full border transition ${
              autopilot
                ? 'bg-accent-purple/15 text-accent-purple border-accent-purple/40'
                : 'text-txt-muted border-line hover:text-txt-secondary'
            }`}
          >🤖 Autopilot {autopilot ? 'ON' : 'OFF'}</button>
          <span className="text-[10px] text-txt-muted">
            Camera, photos &amp; documents — drag, paste, or use ＋. AI reads &amp; remembers them.
          </span>
        </div>
      </div>
    </div>
  );
}
