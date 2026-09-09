import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

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

    // Prevent admin from deleting themselves
    if (session.id === id) {
      return NextResponse.json({ error: 'You cannot delete your own admin account' }, { status: 400 });
    }

    const deleted = await db.users.delete(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Employee removed successfully' });
  } catch (error) {
    console.error('Failed to delete employee:', error);
    return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 });
  }
}
