import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { comparePassword, setSession, toSessionUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const user = await db.users.findByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials. Please check your email or password.' },
        { status: 401 }
      );
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid credentials. Please check your email or password.' },
        { status: 401 }
      );
    }

    // Set HTTP-only session cookie
    await setSession(user);

    const redirectUrl = user.role === 'ADMIN' ? '/admin/dashboard' : '/employee/dashboard';

    return NextResponse.json({
      success: true,
      user: await toSessionUser(user),
      redirectUrl,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred during login' }, { status: 500 });
  }
}
