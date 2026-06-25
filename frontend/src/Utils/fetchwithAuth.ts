import config from '../config';
import { triggerLogout } from '../context/AuthContext';

export async function fetchwithAuth(url: string, options: RequestInit = {}) {
  let token = localStorage.getItem('token');

  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken) {
      triggerLogout();                       // dispacther
      throw new Error('No refresh token available');
    }

    try {
      const refreshRes = await fetch(`${config.apiUrl}/api/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!refreshRes.ok) throw new Error('Refresh failed');

      const data = await refreshRes.json();

      localStorage.setItem('token', data.token);
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }

      headers.set('Authorization', `Bearer ${data.token}`);
      response = await fetch(url, { ...options, headers });

    } catch (error) {
      triggerLogout();                //dispatch a logout event to the AuthProvider so it can update its state and redirect the user to the login page
      throw error;
    }
  }

  return response;
}