import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME, AUTH_SESSION_TTL_SECONDS } from '@/lib/config';
import {
  createSessionToken as createSignedSessionToken,
  safeTokenEqual,
  verifySessionToken as verifySignedSessionToken,
} from '@/lib/auth-token';
import { getEnv } from '@/lib/env';

function safeEqual(left: string, right: string) {
  return safeTokenEqual(getEnv().AUTH_SECRET, left, right);
}

export function verifyAdminCredentials(username: string, password: string) {
  const env = getEnv();
  return safeEqual(username, env.ADMIN_USERNAME) && safeEqual(password, env.ADMIN_PASSWORD);
}

export function createSessionToken(username: string, expiresAt: number) {
  return createSignedSessionToken(getEnv().AUTH_SECRET, username, expiresAt);
}

export function verifySessionToken(token: string) {
  return verifySignedSessionToken(getEnv().AUTH_SECRET, token);
}

export async function isAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  return token ? verifySessionToken(token) : false;
}

export async function setAuthSession(username: string) {
  const cookieStore = await cookies();
  const expiresAt = Date.now() + AUTH_SESSION_TTL_SECONDS * 1000;

  cookieStore.set(AUTH_COOKIE_NAME, createSessionToken(username, expiresAt), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(expiresAt),
  });
}

export async function clearAuthSession() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}
