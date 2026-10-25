import axios from 'axios';

// In development Vite proxies /api to the backend. For a separate frontend deployment set VITE_API_URL.
const BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({ baseURL: `${BASE}/api` });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const imgUrl = (p) => (!p ? null : p.startsWith('http') ? p : `${BASE}${p}`);
export const errMsg = (e) => e.response?.data?.message || e.message || 'Something went wrong';

// download a file (CSV report) from an authenticated endpoint
export async function downloadFile(url, filename) {
  const res = await api.get(url, { responseType: 'blob' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(res.data);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
}

export default api;
