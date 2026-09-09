import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filterUserId = searchParams.get('userId');
    const filterStatus = searchParams.get('status') || undefined;
    const pendingAdmin = searchParams.get('pendingAdmin') === 'true';

    // If Admin, they can see all trades or filter by user/status
    // If Employee, they can only see trades where they are requester or target
    const userIdToFilter = session.role === 'ADMIN' ? (filterUserId || undefined) : session.id;

    const trades = await db.trades.list({
      userId: userIdToFilter,
      status: filterStatus,
      pendingAdmin: session.role === 'ADMIN' ? pendingAdmin : undefined,
    });

    return NextResponse.json({ trades });
  } catch (error) {
    console.error('Failed to get trades:', error);
    return NextResponse.json({ error: 'Failed to fetch trade requests' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { requesterShiftId, targetUserId, targetShiftId, reason } = body;

    if (!requesterShiftId || !targetUserId || !targetShiftId) {
      return NextResponse.json(
        { error: 'requesterShiftId, targetUserId, and targetShiftId are required' },
        { status: 400 }
      );
    }

    // Verify requester owns the shift (unless admin creating on their behalf)
    const reqShift = await db.shifts.findById(requesterShiftId);
    if (!reqShift) {
      return NextResponse.json({ error: 'Your selected shift was not found' }, { status: 404 });
    }

    if (session.role !== 'ADMIN' && reqShift.userId !== session.id) {
      return NextResponse.json({ error: 'You can only trade shifts assigned to you' }, { status: 403 });
    }

    // Verify target shift belongs to target user
    const targetShift = await db.shifts.findById(targetShiftId);
    if (!targetShift) {
      return NextResponse.json({ error: 'Target shift not found' }, { status: 404 });
    }

    if (targetShift.userId !== targetUserId) {
      return NextResponse.json({ error: 'Target shift is not assigned to the selected colleague' }, { status: 400 });
    }

    if (session.id === targetUserId && session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'You cannot trade a shift with yourself' }, { status: 400 });
    }

    // Clinical policy enforcement: Nurses can only request trades from other nurses, doctors from doctors
    const requesterUser = await db.users.findById(session.id);
    const targetUser = await db.users.findById(targetUserId);
    if (requesterUser && targetUser && session.role !== 'ADMIN' && requesterUser.departmentId !== targetUser.departmentId) {
      return NextResponse.json(
        { error: 'Staff policy violation: Nurses may only request shift trades from other nursing staff.' },
        { status: 400 }
      );
    }

    const newTrade = await db.trades.create({
      requesterId: session.id,
      requesterShiftId,
      targetUserId,
      targetShiftId,
      reason: reason || '',
    });

    return NextResponse.json({ success: true, trade: newTrade }, { status: 201 });
  } catch (error) {
    console.error('Failed to create trade request:', error);
    return NextResponse.json({ error: 'Failed to create trade request' }, { status: 500 });
  }
}
