import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || undefined;
    const departmentId = searchParams.get('departmentId') || undefined;
    const status = searchParams.get('status') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const shifts = await db.shifts.list({
      userId,
      departmentId,
      status,
      startDate,
      endDate,
    });

    return NextResponse.json({ shifts });
  } catch (error) {
    console.error('Failed to fetch shifts:', error);
    return NextResponse.json({ error: 'Failed to fetch shifts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only Admin can directly schedule arbitrary shifts
    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required to create shifts' }, { status: 403 });
    }

    const body = await request.json();
    const { title, userId, departmentId, startTime, endTime, breakMinutes, location, notes } = body;

    if (!title || !userId || !departmentId || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields (title, userId, departmentId, startTime, endTime)' },
        { status: 400 }
      );
    }

    const newShift = await db.shifts.create({
      title: title.trim(),
      userId,
      departmentId,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      breakMinutes: breakMinutes ? Number(breakMinutes) : 30,
      location: location || 'Main Facility',
      notes: notes || '',
      status: 'SCHEDULED',
    });

    // Invalidate caches across all views
    revalidatePath('/employee/dashboard');
    revalidatePath('/employee/calendar');
    revalidatePath('/employee/trades');
    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/shifts');

    return NextResponse.json({ success: true, shift: newShift }, { status: 201 });
  } catch (error) {
    console.error('Failed to create shift:', error);
    return NextResponse.json({ error: 'Failed to create shift' }, { status: 500 });
  }
}
