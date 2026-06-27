import { create } from 'zustand';
import { api } from '../services/api.js';

export const useChat = create((set, get) => ({
  sessions: [],
  currentId: null,
  messages: [],
  loadingSessions: false,
  loadingMessages: false,
  streaming: false,
  error: null,
  llmInfo: '',
  execInfo: null,
  showTerminal: false,
  showSearch: false,
  showFindings: false,
  findings: [],
  findingStats: null,
  abortStream: null,

  toggleTerminal: () => set((s) => ({ showTerminal: !s.showTerminal })),
  toggleSearch: () => set((s) => ({ showSearch: !s.showSearch })),
  async toggleFindings() {
    const next = !get().showFindings;
    set({ showFindings: next });
    if (next) get().loadFindings();
  },
  async loadFindings() {
    const id = get().currentId;
    if (!id) return;
    try {
      const { findings, stats } = await api.findings(id);
      set({ findings, findingStats: stats });
    } catch {
      /* ignore */
    }
  },

  async init() {
    try {
      const health = await api.health();
      set({ llmInfo: health.llm, execInfo: health.exec });
    } catch {
      set({ error: 'Backend not reachable. Start it with: cd backend && npm run dev' });
    }
    await get().loadSessions();
  },

  async loadSessions() {
    set({ loadingSessions: true });
    try {
      const sessions = await api.listSessions();
      set({ sessions, loadingSessions: false });
      // Auto-select the most recent session if none active.
      if (!get().currentId && sessions.length) get().selectSession(sessions[0].id);
    } catch (e) {
      set({ loadingSessions: false, error: e.message });
    }
  },

  async newChat() {
    try {
      const session = await api.createSession('New chat');
      set((s) => ({ sessions: [session, ...s.sessions], currentId: session.id, messages: [] }));
    } catch (e) {
      set({ error: e.message });
    }
  },

  async selectSession(id) {
    if (get().currentId === id) return;
    set({ currentId: id, loadingMessages: true, messages: [] });
    try {
      const { messages } = await api.getSession(id);
      set({ messages, loadingMessages: false });
    } catch (e) {
      set({ loadingMessages: false, error: e.message });
    }
  },

  async renameSession(id, title) {
    try {
      const updated = await api.renameSession(id, title);
      set((s) => ({ sessions: s.sessions.map((x) => (x.id === id ? updated : x)) }));
    } catch (e) {
      set({ error: e.message });
    }
  },

  async deleteSession(id) {
    try {
      await api.deleteSession(id);
      set((s) => {
        const sessions = s.sessions.filter((x) => x.id !== id);
        const wasCurrent = s.currentId === id;
        return {
          sessions,
          currentId: wasCurrent ? sessions[0]?.id ?? null : s.currentId,
          messages: wasCurrent ? [] : s.messages,
        };
      });
      const cur = get().currentId;
      if (cur) get().selectSession(cur);
    } catch (e) {
      set({ error: e.message });
    }
  },

  async sendMessage(content, attachments = [], autopilot = false) {
    const text = content.trim();
    if ((!text && attachments.length === 0) || get().streaming) return;

    // Ensure there is a session to post to.
    let sessionId = get().currentId;
    if (!sessionId) {
      await get().newChat();
      sessionId = get().currentId;
    }

    const attachNote = attachments.length
      ? `\n\n${attachments.map((a) => `📎 ${a.name}`).join('  ')}`
      : '';
    const userMsg = { id: 'tmp-u-' + Date.now(), role: 'user', content: text + attachNote };
    const assistantMsg = { id: 'tmp-a-' + Date.now(), role: 'assistant', content: '' };
    set((s) => ({ messages: [...s.messages, userMsg, assistantMsg], streaming: true, error: null }));

    const updateAssistant = (updater) =>
      set((s) => ({
        messages: s.messages.map((m) => (m.id === assistantMsg.id ? { ...m, ...updater(m) } : m)),
      }));

    const abort = api.streamChat(sessionId, text || '(see attached file)', {
      onDelta: (t) => updateAssistant((m) => ({ content: m.content + t })),
      // New structured findings were captured this turn.
      onFindings: () => get().loadFindings(),
      // Cross-session memory was recalled for this turn — show a small note on top.
      onMemory: (data) =>
        updateAssistant((m) => ({
          content:
            (m.content ? m.content : '') +
            (m.content ? '' : `> 🧠 _recalled ${data.count} relevant memory item(s) from past sessions_\n\n`),
        })),
      // AI is about to run a command: show it and open a live output block.
      onCommand: (command) =>
        updateAssistant((m) => ({
          content: m.content + `\n\n\`\`\`bash\n$ ${command}\n\`\`\`\n\`\`\`text\n`,
        })),
      // Live stdout/stderr chunks stream into the open output block.
      onOutput: (data) => updateAssistant((m) => ({ content: m.content + (data.text || '') })),
      // Command finished: close the output block and show the exit code.
      onCommandResult: (data) =>
        updateAssistant((m) => ({
          content:
            m.content +
            `\n\`\`\`\n_exit ${data.exitCode}${data.blocked ? ' · blocked by host guard' : ''}_\n`,
        })),
      onDone: (saved) => {
        updateAssistant(() => ({ id: saved.id, content: saved.content, model: saved.model }));
        set({ streaming: false, abortStream: null });
        get().loadSessions(); // refresh titles / ordering
      },
      onError: (err) => {
        updateAssistant((m) => ({ content: m.content || `⚠️ ${err.message}` }));
        set({ streaming: false, abortStream: null, error: err.message });
      },
    }, attachments.map((a) => a.id), autopilot);

    set({ abortStream: abort });
  },

  stop() {
    const a = get().abortStream;
    if (a) a();
    set({ streaming: false, abortStream: null });
  },

  clearError: () => set({ error: null }),
}));
