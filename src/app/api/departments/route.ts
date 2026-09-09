import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const departments = await db.departments.list();
    return NextResponse.json({ departments });
  } catch (error) {
    console.error('Failed to get departments:', error);
    return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 });
  }
}
