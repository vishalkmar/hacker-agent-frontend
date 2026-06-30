import { useChat } from '../store/chatStore.js';
import { Globe, X } from 'lucide-react';

// VIEW-ONLY live mirror of the AI's headless browser. The user cannot drive it — it's the AI's
// power tool; this panel just lets the user WATCH what the agent is doing (auto-shows when the
// agent navigates). No address bar, no controls — only a dismiss.
export default function BrowserPanel() {
  const { browserView, toggleBrowser } = useChat();
  const { url, screenshot } = browserView || {};

  return (
    <div className="h-[420px] shrink-0 flex flex-col border-t border-line bg-bg-secondary">
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-line">
        <Globe size={14} className="text-primary shrink-0" />
        <span className="text-[11px] text-txt-secondary font-mono truncate flex-1" title={url || ''}>
          {url || 'AI browser'}
        </span>
        <span className="text-[10px] text-primary/80 shrink-0 inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> AI&nbsp;live
        </span>
        <button onClick={toggleBrowser} title="Hide" className="text-txt-muted hover:text-accent-red shrink-0">
          <X size={15} />
        </button>
      </div>
      <div className="flex-1 overflow-auto bg-[#060a11] flex items-start justify-center">
        {screenshot ? (
          <img src={screenshot} alt="AI browser view" className="w-full h-auto block" />
        ) : (
          <div className="text-txt-muted text-sm m-auto text-center px-6">
            <Globe size={28} className="mx-auto mb-2 opacity-40" />
            The AI will open pages here when it needs to test a web app.
          </div>
        )}
      </div>
    </div>
  );
}
