import { useEffect } from 'react';
import { useChat } from './store/chatStore.js';
import { useAuth } from './store/authStore.js';
import Sidebar from './components/Sidebar.jsx';
import ChatPane from './components/ChatPane.jsx';
import Terminal from './components/Terminal.jsx';
import SearchPanel from './components/SearchPanel.jsx';
import FindingsPanel from './components/FindingsPanel.jsx';
import AuthModal from './components/AuthModal.jsx';
import Pricing from './components/Pricing.jsx';
import Dashboard from './components/Dashboard.jsx';
import AdminPanel from './components/AdminPanel.jsx';
import ToolsPanel from './components/ToolsPanel.jsx';

export default function App() {
  const {
    init, error, clearError,
    showTerminal, toggleTerminal,
    showSearch, toggleSearch,
    showFindings, toggleFindings,
    execInfo,
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
        {showFindings && <FindingsPanel />}
        {showSearch && <SearchPanel />}
        {showTerminal && <Terminal />}
      </div>

      {/* Floating toggles */}
      <div className="fixed bottom-24 right-6 flex flex-col gap-2 items-end">
        {!showFindings && (
          <button
            onClick={toggleFindings}
            title="Open findings"
            className="px-3 py-2 rounded-xl bg-bg-secondary border border-line text-accent-orange text-sm shadow-soft hover:shadow-lift hover:border-accent-orange/50 transition"
          >
            🎯 Findings
          </button>
        )}
        {!showSearch && (
          <button
            onClick={toggleSearch}
            title="Open search"
            className="px-3 py-2 rounded-xl bg-bg-secondary border border-line text-primary text-sm shadow-soft hover:shadow-lift hover:border-primary/50 transition"
          >
            🔎 Search
          </button>
        )}
        {execInfo?.enabled !== false && !showTerminal && (
          <button
            onClick={toggleTerminal}
            title="Open terminal"
            className="px-3 py-2 rounded-xl bg-bg-secondary border border-line text-terminal text-sm shadow-soft hover:shadow-lift hover:border-terminal/50 transition"
          >
            ▣ Terminal
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
