import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { TradeStatus } from '@/lib/types';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, adminNotes } = body;

    const trade = await db.trades.findById(id);
    if (!trade) {
      return NextResponse.json({ error: 'Trade request not found' }, { status: 404 });
    }

    let newStatus: TradeStatus;

    if (action === 'PEER_ACCEPT') {
      // Must be target user
      if (trade.targetUserId !== session.id && session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Only the requested colleague can accept this trade' }, { status: 403 });
      }
      if (trade.status !== 'PENDING_PEER') {
        return NextResponse.json({ error: 'This trade request is no longer pending peer response' }, { status: 400 });
      }
      newStatus = 'PEER_ACCEPTED';
    } else if (action === 'PEER_DECLINE') {
      // Must be target user
      if (trade.targetUserId !== session.id && session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Only the requested colleague can decline this trade' }, { status: 403 });
      }
      if (trade.status !== 'PENDING_PEER') {
        return NextResponse.json({ error: 'This trade request is no longer pending peer response' }, { status: 400 });
      }
      newStatus = 'PEER_DECLINED';
    } else if (action === 'ADMIN_APPROVE') {
      // Must be admin
      if (session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Admin privileges required to approve shift trade' }, { status: 403 });
      }
      newStatus = 'ADMIN_APPROVED';
    } else if (action === 'ADMIN_DENY') {
      // Must be admin
      if (session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Admin privileges required to deny shift trade' }, { status: 403 });
      }
      newStatus = 'ADMIN_DENIED';
    } else if (action === 'CANCEL') {
      // Must be requester or admin
      if (trade.requesterId !== session.id && session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Only the requester can cancel this trade' }, { status: 403 });
      }
      newStatus = 'CANCELLED';
    } else {
      return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 });
    }

    const updated = await db.trades.updateStatus(id, newStatus, adminNotes);
    return NextResponse.json({ success: true, trade: updated });
  } catch (error) {
    console.error('Failed to update trade request:', error);
    return NextResponse.json({ error: 'Failed to update trade request' }, { status: 500 });
  }
}
