import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const shift = await db.shifts.findById(id);
    if (!shift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
    }
    return NextResponse.json({ shift });
  } catch (error) {
    console.error('Failed to get shift:', error);
    return NextResponse.json({ error: 'Failed to get shift' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const updates = await request.json();

    const updated = await db.shifts.update(id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
    }

    // Invalidate caches across all employee and admin views
    revalidatePath('/employee/dashboard');
    revalidatePath('/employee/calendar');
    revalidatePath('/employee/trades');
    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/shifts');

    return NextResponse.json({ success: true, shift: updated });
  } catch (error) {
    console.error('Failed to update shift:', error);
    return NextResponse.json({ error: 'Failed to update shift' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const success = await db.shifts.delete(id);
    if (!success) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
    }

    // Invalidate caches across all employee and admin views
    revalidatePath('/employee/dashboard');
    revalidatePath('/employee/calendar');
    revalidatePath('/employee/trades');
    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/shifts');

    return NextResponse.json({ success: true, message: 'Shift deleted successfully' });
  } catch (error) {
    console.error('Failed to delete shift:', error);
    return NextResponse.json({ error: 'Failed to delete shift' }, { status: 500 });
  }
}
