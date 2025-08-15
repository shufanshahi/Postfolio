export const AUTH_BASE_URL = process.env.NEXT_PUBLIC_AUTH_BASE_URL || 'http://localhost:8081';
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export async function apiFetch(path, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });
  return res;
}

export async function authFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const res = await fetch(`${AUTH_BASE_URL}${path}`, {
    ...options,
    headers,
  });
  return res;
}

