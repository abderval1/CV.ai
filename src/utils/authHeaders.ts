const AUTH_TOKEN_KEY = 'curriculopro_auth_token';

export function getClientAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY) || sessionStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getAuthHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(extra || {})
  };
  const token = getClientAuthToken();
  if (token && !headers.Authorization && !headers.authorization) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export async function authorizedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const extraHeaders = (init.headers as Record<string, string>) || {};
  const headers = getAuthHeaders(extraHeaders);
  return fetch(input, {
    ...init,
    credentials: 'include',
    headers
  });
}
