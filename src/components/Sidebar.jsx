import { useState } from 'react';
import { useChat } from '../store/chatStore.js';
import { useAuth } from '../store/authStore.js';
import { Plus, Wrench, ShieldHalf, Zap, LogOut, Pencil, Trash2, Check, X } from 'lucide-react';
import { Logo } from '../ui/index.jsx';

function SessionItem({ session, active, onSelect, onRename, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(session.title);

  const commit = () => {
    setEditing(false);
    const t = title.trim();
    if (t && t !== session.title) onRename(session.id, t);
    else setTitle(session.title);
  };

  return (
    <div
      onClick={() => onSelect(session.id)}
      className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm
        ${active ? 'bg-bg-tertiary text-txt-primary' : 'text-txt-secondary hover:bg-bg-tertiary/60'}`}
    >
      <span className="text-accent-cyan">▸</span>
      {editing ? (
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 bg-transparent border-b border-line outline-none text-txt-primary"
        />
      ) : (
        <span className="flex-1 truncate" title={session.title}>
          {session.title}
        </span>
      )}
      <span className="hidden group-hover:flex items-center gap-1">
        <button
          title="Rename"
          onClick={(e) => {
            e.stopPropagation();
            setEditing(true);
          }}
          className="text-txt-muted hover:text-txt-primary"
        >
          ✎
        </button>
        <button
          title="Delete"
          onClick={(e) => {
            e.stopPropagation();
            if (confirm('Delete this chat?')) onDelete(session.id);
          }}
          className="text-txt-muted hover:text-accent-red"
        >
          🗑
        </button>
      </span>
    </div>
  );
}

export default function Sidebar() {
  const { sessions, currentId, llmInfo, newChat, selectSession, renameSession, deleteSession } =
    useChat();
  const { user, openAuth, logout, openPricing, openDashboard, openAdmin, openTools } = useAuth();

  return (
    <aside className="w-72 shrink-0 h-full flex flex-col bg-bg-secondary border-r border-line">
      <div className="p-3 border-b border-line">
        <div className="flex items-center gap-2.5 px-1 pb-3">
          <Logo size={34} />
          <div>
            <div className="font-semibold text-txt-primary leading-tight tracking-wide">CypherMind AI</div>
            <div className="text-[10px] text-txt-muted">Autonomous security copilot</div>
          </div>
        </div>
        <button
          onClick={newChat}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg
            bg-primary/12 text-primary border border-primary/30
            hover:bg-primary/20 hover:shadow-glow transition text-sm font-medium"
        >
          <Plus size={16} /> New chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {sessions.length === 0 && (
          <div className="text-xs text-txt-muted px-3 py-4">No chats yet. Start one above.</div>
        )}
        {sessions.map((s) => (
          <SessionItem
            key={s.id}
            session={s}
            active={s.id === currentId}
            onSelect={selectSession}
            onRename={renameSession}
            onDelete={deleteSession}
          />
        ))}
      </div>

      <div className="p-3 border-t border-line space-y-2">
        <button
          onClick={openTools}
          className="w-full flex items-center justify-center gap-2 py-1.5 rounded-lg bg-bg-tertiary border border-line text-txt-primary text-xs font-semibold hover:border-primary/50 hover:text-primary transition"
        >
          <Wrench size={14} /> Tool Intelligence
        </button>
        {user?.is_admin && (
          <button
            onClick={openAdmin}
            className="w-full flex items-center justify-center gap-2 py-1.5 rounded-lg bg-bg-tertiary border border-line text-txt-primary text-xs font-semibold hover:border-primary/50 hover:text-primary transition"
          >
            <ShieldHalf size={14} /> Admin Panel
          </button>
        )}
        <button
          onClick={openPricing}
          className="w-full flex items-center justify-center gap-2 py-1.5 rounded-lg bg-primary text-bg-primary text-xs font-bold shadow-glow hover:bg-primary-hover transition"
        >
          <Zap size={14} /> Upgrade plan
        </button>
        {user ? (
          <button onClick={openDashboard} className="w-full flex items-center justify-between gap-2 group">
            <div className="min-w-0 text-left">
              <div className="text-xs text-txt-primary truncate group-hover:text-primary" title={user.email}>{user.email}</div>
              <div className="text-[10px] text-primary uppercase font-medium">{user.role} plan · My Account</div>
            </div>
            <span
              onClick={(e) => { e.stopPropagation(); logout(); }}
              className="text-[10px] text-txt-muted hover:text-accent-red shrink-0"
            >logout</span>
          </button>
        ) : (
          <button
            onClick={openAuth}
            className="w-full py-1.5 rounded-lg bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30 text-xs font-medium"
          >
            Sign in / Sign up
          </button>
        )}
        <div className="text-[10px] text-txt-muted truncate" title={llmInfo}>
          {llmInfo || 'connecting…'}
        </div>
      </div>
    </aside>
  );
}
