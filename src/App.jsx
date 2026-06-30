import { useEffect } from 'react';
import { useChat } from './store/chatStore.js';
import { useAuth } from './store/authStore.js';
import Sidebar from './components/Sidebar.jsx';
import ChatPane from './components/ChatPane.jsx';
import FindingsPanel from './components/FindingsPanel.jsx';
import AuthModal from './components/AuthModal.jsx';
import Pricing from './components/Pricing.jsx';
import { Target } from 'lucide-react';
import Dashboard from './components/Dashboard.jsx';
import AdminPanel from './components/AdminPanel.jsx';
import ToolsPanel from './components/ToolsPanel.jsx';
import BrowserPanel from './components/BrowserPanel.jsx';

export default function App() {
  const {
    init, error, clearError,
    showFindings, toggleFindings,
    showBrowser,
  } = useChat();
  const loadAuth = useAuth((s) => s.load);

  useEffect(() => {
    loadAuth();
    init();
  }, [init, loadAuth]);

  return (
    <div className="h-full flex">
      <AuthModal />
      <Pricing />
      <Dashboard />
      <AdminPanel />
      <ToolsPanel />
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <ChatPane />
        {/* AI-driven & view-only — the AI does all searching/browsing/commands itself; the user
            only chats and watches. The browser auto-opens when the agent navigates. */}
        {showBrowser && <BrowserPanel />}
        {showFindings && <FindingsPanel />}
      </div>

      {/* Findings is a read-only VIEW of what the AI found — the only optional panel. */}
      <div className="fixed bottom-24 right-6 flex flex-col gap-2 items-end">
        {!showFindings && (
          <button
            onClick={toggleFindings}
            title="View findings"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-bg-secondary border border-line text-accent-orange text-sm shadow-soft hover:shadow-lift hover:border-accent-orange/50 transition"
          >
            <Target size={15} /> Findings
          </button>
        )}
      </div>

      {error && (
        <div
          onClick={clearError}
          className="fixed bottom-4 right-4 max-w-sm bg-accent-red/15 border border-accent-red/40 text-accent-red text-sm px-4 py-3 rounded-xl cursor-pointer"
          title="Click to dismiss"
        >
          {error}
        </div>
      )}
    </div>
  );
}
