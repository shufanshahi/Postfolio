export const AUTH_BASE_URL = process.env.NEXT_PUBLIC_AUTH_BASE_URL || 'http://localhost:8081';
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
export const POST_SERVICE_URL = process.env.NEXT_PUBLIC_POST_SERVICE_URL || 'http://localhost:8082';
export const JOB_SERVICE_URL = process.env.NEXT_PUBLIC_JOB_SERVICE_URL || 'http://localhost:8083';

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

export async function postServiceFetch(path, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await fetch(`${POST_SERVICE_URL}${path}`, {
    ...options,
    headers,
  });
  return res;
}

export async function jobServiceFetch(path, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await fetch(`${JOB_SERVICE_URL}${path}`, {
    ...options,
    headers,
  });
  return res;
}

