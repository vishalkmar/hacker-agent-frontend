import { create } from 'zustand';
import { api, setToken, getToken } from '../services/api.js';

export const useAuth = create((set) => ({
  user: null,
  ready: false,
  showAuth: false,

  openAuth: () => set({ showAuth: true }),
  closeAuth: () => set({ showAuth: false }),

  showPricing: false,
  openPricing: () => set({ showPricing: true }),
  closePricing: () => set({ showPricing: false }),

  showDashboard: false,
  openDashboard: () => set({ showDashboard: true }),
  closeDashboard: () => set({ showDashboard: false }),
  setUser: (user) => set({ user }),

  showAdmin: false,
  openAdmin: () => set({ showAdmin: true }),
  closeAdmin: () => set({ showAdmin: false }),

  showTools: false,
  openTools: () => set({ showTools: true }),
  closeTools: () => set({ showTools: false }),

  async load() {
    if (!getToken()) {
      set({ ready: true, user: null });
      return;
    }
    try {
      const { user } = await api.me();
      set({ user, ready: true });
    } catch {
      setToken('');
      set({ user: null, ready: true });
    }
  },

  async login(email, password) {
    const { user, token } = await api.login(email, password);
    setToken(token);
    set({ user, showAuth: false });
    return user;
  },

  async register(email, password, name) {
    const { user, token } = await api.register(email, password, name);
    setToken(token);
    set({ user, showAuth: false });
    return user;
  },

  // Email-OTP (Phase 12)
  async otpStart(email, name) {
    return api.otpStart(email, name); // { mode }
  },
  async otpVerify(email, code) {
    const { user, token } = await api.otpVerify(email, code);
    setToken(token);
    set({ user, showAuth: false });
    return user;
  },
  async otpResend(email) {
    return api.otpResend(email);
  },

  logout() {
    setToken('');
    set({ user: null });
    // reload so all per-user state resets cleanly
    window.location.reload();
  },
}));
