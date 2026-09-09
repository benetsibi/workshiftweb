import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { User, UserSession } from './types';
import { db } from './db';

const SESSION_COOKIE_NAME = 'shifttracker_session';
export const SESSION_TIMEOUT_SECONDS = 5 * 60; // 5 minutes

export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, 10);
}

export async function comparePassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

export async function toSessionUser(user: User): Promise<UserSession> {
  let departmentName: string | undefined;
  let departmentCode: string | undefined;
  if (user.departmentId) {
    const dept = await db.departments.findById(user.departmentId);
    departmentName = dept?.name;
    departmentCode = dept?.code;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    title: user.title,
    departmentId: user.departmentId,
    departmentName,
    departmentCode,
  };
}

export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie?.value) {
    return null;
  }

  try {
    const decoded = Buffer.from(sessionCookie.value, 'base64').toString('utf-8');
    const session = JSON.parse(decoded) as UserSession & { expiresAt?: number };

    // Enforce 5-minute session timeout
    if (session.expiresAt && Date.now() > session.expiresAt) {
      return null;
    }

    // Verify user still exists in DB
    const user = await db.users.findById(session.id);
    if (!user) {
      return null;
    }

    return await toSessionUser(user);
  } catch (e) {
    console.error('Failed to parse session cookie', e);
    return null;
  }
}

export async function setSession(user: User): Promise<void> {
  const cookieStore = await cookies();
  const sessionUser = await toSessionUser(user);
  
  // 5-minute timeout window (300,000 ms)
  const sessionData = {
    ...sessionUser,
    expiresAt: Date.now() + SESSION_TIMEOUT_SECONDS * 1000,
  };

  const encoded = Buffer.from(JSON.stringify(sessionData)).toString('base64');

  cookieStore.set(SESSION_COOKIE_NAME, encoded, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TIMEOUT_SECONDS, // 5 minutes
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
