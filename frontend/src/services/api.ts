import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: BASE_URL });

// Inject auth token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vi_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('vi_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { name: string; email: string; password: string; role?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  updateMe: (data: { name?: string }) => api.patch('/auth/me', data),
  googleLogin: (credential: string) => api.post('/auth/google', { credential }),
};

// ─── Sessions ─────────────────────────────────────────────────────────────────
export const sessionApi = {
  create: (data: { title?: string; metadata?: object }) =>
    api.post('/sessions', data),
  list: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/sessions', { params }),
  get: (id: string) => api.get(`/sessions/${id}`),
  appendKeystrokes: (id: string, events: object[]) =>
    api.post(`/sessions/${id}/keystrokes`, { events }),
  appendPauses: (id: string, pauses: object[]) =>
    api.post(`/sessions/${id}/pauses`, { pauses }),
  snapshot: (id: string, data: object) =>
    api.post(`/sessions/${id}/snapshot`, data),
  complete: (id: string, data: { content: string; wordCount: number; charCount: number; paragraphCount: number }) =>
    api.post(`/sessions/${id}/complete`, data),
  delete: (id: string) => api.delete(`/sessions/${id}`),
};

// ─── Reports ──────────────────────────────────────────────────────────────────
export const reportApi = {
  generate: (sessionId: string) =>
    api.post(`/reports/generate/${sessionId}`),
  list: () => api.get('/reports'),
  get: (id: string) => api.get(`/reports/${id}`),
  share: (id: string) => api.post(`/reports/${id}/share`),
  getShared: (token: string) => api.get(`/reports/shared/${token}`),
};

// ─── Analysis ─────────────────────────────────────────────────────────────────
export const analysisApi = {
  analyzeWithGroq: (text: string) =>
    api.post('/openai/analyze', { text }),
  analyzeText: (text: string) =>
    api.post('/analysis/text', { text }),
  liveFlags: (data: { recentKeystrokes?: number; pastedText?: string; timeSinceLastKey?: number }) =>
    api.post('/analysis/live-flags', data),
};

export default api;