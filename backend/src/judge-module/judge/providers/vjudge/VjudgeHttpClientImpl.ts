/**
 * Real axios-based implementation of VjudgeHttpClient.
 *
 * Uses a per-account axios instance with a tough-cookie jar so
 * session cookies (JSESSIONID) are automatically persisted and
 * replayed on every request — exactly what a browser session does.
 *
 * One instance of this class is created per VjudgeAccount inside
 * VjudgeProvider.  That keeps cookie jars isolated between accounts,
 * which matches vjudge's one-session-per-account model.
 */

import axios, { AxiosInstance } from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import type { VjudgeHttpClient } from './VjudgeProvider.js';

export function createVjudgeHttpClient(): VjudgeHttpClient & { cookieJar: CookieJar } {
  const jar = new CookieJar();

  const client: AxiosInstance = wrapper(
    axios.create({
      jar,
      withCredentials: true,
      // vjudge sometimes redirects on login — follow automatically
      maxRedirects: 5,
      // Don't throw on non-2xx; we inspect status ourselves
      validateStatus: () => true,
      headers: {
        // Mimic a real browser so vjudge doesn't immediately block the UA
        'User-Agent':
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    }),
  );

  return {
    cookieJar: jar,

    async post(url, body, headers = {}) {
      // body can be URLSearchParams (form) or a plain object (JSON)
      const res = await client.post(url, body, {
        headers: {
          ...headers,
        },
        // axios serialises URLSearchParams as form-urlencoded automatically
      });
      return {
        status: res.status,
        body: typeof res.data === 'string' ? res.data : JSON.stringify(res.data),
      };
    },

    async get(url, headers = {}) {
      const res = await client.get(url, { headers });
      return {
        status: res.status,
        body: typeof res.data === 'string' ? res.data : JSON.stringify(res.data),
      };
    },
  };
}
