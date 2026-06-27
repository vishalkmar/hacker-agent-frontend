// Thin REST + SSE client for the CypherMind backend.
// In dev, Vite proxies /api -> http://localhost:8787 (see vite.config.js).

const BASE = '/api';

let _token = localStorage.getItem('cm_token') || '';
export function setToken(t) {
  _token = t || '';
  if (t) localStorage.setItem('cm_token', t);
  else localStorage.removeItem('cm_token');
}
export function getToken() {
  return _token;
}
function authHeaders(extra = {}) {
  return _token ? { ...extra, Authorization: `Bearer ${_token}` } : extra;
}

async function http(path, options = {}) {
  const res = await fetch(BASE + path, {
    ...options,
    headers: authHeaders({ 'Content-Type': 'application/json', ...(options.headers || {}) }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export const api = {
  health: () => http('/health'),

  register: (email, password, name) =>
    http('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name }) }),
  login: (email, password) =>
    http('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => http('/auth/me'),
  updateProfile: (display_name) =>
    http('/auth/me', { method: 'PATCH', body: JSON.stringify({ display_name }) }),
  // Email-OTP (Phase 12)
  otpStart: (email, name) =>
    http('/auth/start', { method: 'POST', body: JSON.stringify({ email, name }) }),
  otpVerify: (email, code) =>
    http('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, code }) }),
  otpResend: (email) =>
    http('/auth/resend-otp', { method: 'POST', body: JSON.stringify({ email }) }),

  // Billing (Phase 13)
  plans: () => http('/plans'),
  billingMe: () => http('/billing/me'),
  billingCheckout: (planCode) =>
    http('/billing/checkout', { method: 'POST', body: JSON.stringify({ planCode }) }),
  billingVerify: (orderId) => http(`/billing/verify/${orderId}`),
  billingTransactions: () => http('/billing/transactions'),

  // Admin (Phase 15)
  adminMetrics: () => http('/admin/metrics'),
  adminUsers: (q = '') => http(`/admin/users?q=${encodeURIComponent(q)}`),
  adminUser: (id) => http(`/admin/users/${id}`),
  adminSetUserPlan: (id, planCode) =>
    http(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify({ planCode }) }),
  adminTransactions: (status = '') => http(`/admin/transactions?status=${status}`),
  adminPlans: () => http('/admin/plans'),
  adminSavePlan: (code, data) =>
    http(`/admin/plans/${code}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Kali Tool Intelligence (Phases 19-22)
  toolsSearch: (q) => http(`/tools/search?q=${encodeURIComponent(q)}&k=10`),
  toolsStats: () => http('/tools/stats'),
  toolsCapabilities: () => http('/tools/capabilities'),
  toolsSeed: () => http('/tools/seed', { method: 'POST' }),
  toolsReindex: (maxTools) => http('/tools/reindex', { method: 'POST', body: JSON.stringify({ maxTools }) }),
  toolsSelftest: (scope, limit) =>
    http('/tools/selftest', { method: 'POST', body: JSON.stringify({ scope, limit }) }),
  toolsAudit: () => http('/tools/audit'),

  findings: (sessionId) => http(`/sessions/${sessionId}/findings`),
  updateFinding: (id, patch) => http(`/findings/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteFinding: (id) => http(`/findings/${id}`, { method: 'DELETE' }),

  generateReport: (sessionId) => http(`/sessions/${sessionId}/reports`, { method: 'POST', body: '{}' }),
  reportUrl: (id, format) => `/api/reports/${id}/download?format=${format}`,

  generatePayload: (spec) => http('/payloads/generate', { method: 'POST', body: JSON.stringify(spec) }),

  search: (query) => http('/web/search', { method: 'POST', body: JSON.stringify({ query }) }),
  fetch: (url) => http('/web/fetch', { method: 'POST', body: JSON.stringify({ url }) }),
  recon: (url) => http('/web/recon', { method: 'POST', body: JSON.stringify({ url }) }),

  listSessions: () => http('/sessions').then((d) => d.sessions),
  createSession: (title) =>
    http('/sessions', { method: 'POST', body: JSON.stringify({ title }) }).then((d) => d.session),
  getSession: (id) => http(`/sessions/${id}`),
  renameSession: (id, title) =>
    http(`/sessions/${id}`, { method: 'PATCH', body: JSON.stringify({ title }) }).then((d) => d.session),
  deleteSession: (id) => http(`/sessions/${id}`, { method: 'DELETE' }),

  async uploadFile(file, sessionId) {
    const fd = new FormData();
    fd.append('file', file);
    if (sessionId) fd.append('sessionId', sessionId);
    const res = await fetch(BASE + '/files/upload', { method: 'POST', body: fd, headers: authHeaders() });
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      throw new Error(b.error || `Upload failed (${res.status})`);
    }
    return (await res.json()).file;
  },

  terminalInfo: () => http('/terminal/info'),
  runCommand: (command, sessionId) =>
    http('/terminal/run', { method: 'POST', body: JSON.stringify({ command, sessionId }) }).then(
      (d) => d.result
    ),

  // Stream a chat reply via SSE-over-fetch.
  // Calls handlers.onDelta(text), handlers.onDone(message), handlers.onError(err).
  // Returns an abort function.
  streamChat(sessionId, content, handlers = {}, attachments = [], autopilot = false) {
    const ctrl = new AbortController();

    (async () => {
      try {
        const res = await fetch(`${BASE}/chat/${sessionId}`, {
          method: 'POST',
          headers: authHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ content, attachments, autopilot }),
          signal: ctrl.signal,
        });
        if (!res.ok || !res.body) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Chat failed (${res.status})`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // Parse complete SSE frames (separated by a blank line).
          let idx;
          while ((idx = buffer.indexOf('\n\n')) !== -1) {
            const frame = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 2);
            const event = /event:\s*(.*)/.exec(frame)?.[1]?.trim();
            const dataLine = /data:\s*([\s\S]*)/.exec(frame)?.[1]?.trim();
            if (!event || !dataLine) continue;
            let data;
            try {
              data = JSON.parse(dataLine);
            } catch {
              continue;
            }
            if (event === 'delta') handlers.onDelta?.(data.text);
            else if (event === 'memory') handlers.onMemory?.(data);
            else if (event === 'findings') handlers.onFindings?.(data);
            else if (event === 'command') handlers.onCommand?.(data.command);
            else if (event === 'output') handlers.onOutput?.(data);
            else if (event === 'command_result') handlers.onCommandResult?.(data);
            else if (event === 'done') handlers.onDone?.(data.message);
            else if (event === 'error') handlers.onError?.(new Error(data.error));
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError') handlers.onError?.(err);
      }
    })();

    return () => ctrl.abort();
  },
};
