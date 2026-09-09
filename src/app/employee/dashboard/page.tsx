import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  Repeat,
  MapPin,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ArrowRightLeft,
  UserCheck,
  Building,
  Sun,
  Moon,
  HeartPulse,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  searchParams?: Promise<{ employeeId?: string }>;
}

export default async function EmployeeDashboardPage({ searchParams }: PageProps) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const resolvedParams = searchParams ? await searchParams : {};
  const allEmployees = session.role === 'ADMIN' ? await db.users.list() : [];

  // If Admin is inspecting, allow switching employee preview
  let targetUserId = session.id;
  if (session.role === 'ADMIN') {
    if (resolvedParams.employeeId) {
      targetUserId = resolvedParams.employeeId;
    } else {
      targetUserId = 'usr-nurse-1'; // Default to Sarah Jenkins (Nurse)
    }
  }

  const targetUser = targetUserId === session.id
    ? session
    : (await db.users.findById(targetUserId)) || session;

  const targetUserObj = await db.users.findById(targetUserId);
  const userDept = targetUserObj?.departmentId ? await db.departments.findById(targetUserObj.departmentId) : null;

  // Fetch target employee's shifts
  const myShifts = await db.shifts.list({ userId: targetUserId, status: 'SCHEDULED' });
  // Fetch trades related to target employee
  const myTrades = await db.trades.list({ userId: targetUserId });

  // Inbound trades where this employee is the target colleague
  const inboundPendingTrades = myTrades.filter(
    t => t.targetUserId === targetUserId && t.status === 'PENDING_PEER'
  );

  // Outbound trades initiated by this employee
  const outboundTrades = myTrades.filter(t => t.requesterId === targetUserId);

  // Next upcoming shift
  const nextShift = myShifts.length > 0 ? myShifts[0] : null;

  // Calculate total hours this week
  let totalScheduledHours = 0;
  myShifts.forEach(s => {
    const start = new Date(s.startTime).getTime();
    const end = new Date(s.endTime).getTime();
    const diff = (end - start) / (1000 * 60 * 60);
    totalScheduledHours += Math.max(0, diff - (s.breakMinutes || 0) / 60);
  });

  const isNurse = userDept?.code === 'NURSE' || targetUser.title?.toLowerCase().includes('nurse');

  return (
    <AppShell
      currentUser={session}
      pendingTradeCount={inboundPendingTrades.length}
      allEmployees={allEmployees}
      departments={userDept ? [userDept] : []}
    >
      <div style={{ maxWidth: '1360px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        {/* Admin Preview Switcher Bar (only visible to Admin) */}
        {session.role === 'ADMIN' && (
          <div style={{
            marginBottom: '24px',
            padding: '12px 18px',
            backgroundColor: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#0284c7' }}>
                Admin Roster Preview:
              </span>
              <span style={{ fontSize: '13px', color: '#334155' }}>
                Viewing shifts for <strong>{targetUser.name}</strong> ({targetUser.title})
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', color: '#64748b', marginRight: '4px' }}>Switch Staff:</span>
              {allEmployees.map(emp => {
                const isActive = emp.id === targetUserId;
                return (
                  <Link
                    key={emp.id}
                    href={`/employee/dashboard?employeeId=${emp.id}`}
                    className="btn btn-sm"
                    style={{
                      fontSize: '11px',
                      padding: '4px 8px',
                      backgroundColor: isActive ? '#0284c7' : '#ffffff',
                      color: isActive ? '#ffffff' : '#334155',
                      border: isActive ? '1px solid #0284c7' : '1px solid #cbd5e1',
                      fontWeight: isActive ? 700 : 500,
                    }}
                  >
                    {emp.name.split(' ')[0]} {emp.role === 'ADMIN' ? '(Admin)' : ''}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Welcome Header */}
        <div className="resp-page-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.03em',
                textTransform: 'uppercase',
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: isNurse ? '#f0f9ff' : '#f8fafc',
                color: isNurse ? '#0369a1' : '#334155',
                border: '1px solid #cbd5e1',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}>
                <HeartPulse size={13} /> {userDept?.name || 'Staff Member'} Roster
              </span>
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>
              Welcome back, {targetUser.name}
            </h1>

          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <Link href="/employee/calendar" className="btn btn-secondary">
              <Calendar size={15} />
              <span>Team Schedule</span>
            </Link>
            <Link href="/employee/trades" className="btn btn-primary">
              <Repeat size={15} />
              <span>Shift Swap Requests</span>
            </Link>
          </div>
        </div>

        {/* Inbound Trade Requests Alert Banner */}
        {inboundPendingTrades.length > 0 && (
          <div style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '4px',
            padding: '14px 18px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '4px',
                backgroundColor: '#dcfce7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#16a34a',
              }}>
                <ArrowRightLeft size={16} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#14532d' }}>
                  {inboundPendingTrades.length} Colleague Shift Swap Request{inboundPendingTrades.length > 1 ? 's' : ''} Awaiting Your Response
                </div>
                <div style={{ fontSize: '12px', color: '#15803d' }}>
                  A fellow staff member has proposed trading shifts with you. Click below to review.
                </div>
              </div>
            </div>
            <Link href="/employee/trades" className="btn btn-sm btn-success">
              Review Swap Offers &rarr;
            </Link>
          </div>
        )}

        {/* Top 3 KPI Metrics */}
        <div className="resp-kpi-grid">
          <div className="glass-panel" style={{ padding: '18px 20px', borderRadius: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                My Shifts This Week
              </span>
              <div style={{ width: '30px', height: '30px', borderRadius: '4px', backgroundColor: '#f0f9ff', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={16} />
              </div>
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
              {myShifts.length}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              Assigned Day / Night shifts (Mon–Sun)
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '18px 20px', borderRadius: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Scheduled Duty Hours
              </span>
              <div style={{ width: '30px', height: '30px', borderRadius: '4px', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={16} />
              </div>
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#059669', lineHeight: 1 }}>
              {Math.round(totalScheduledHours)} hrs
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              Net duty hours (1h meal break deducted)
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '18px 20px', borderRadius: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Swap Requests
              </span>
              <div style={{ width: '30px', height: '30px', borderRadius: '4px', backgroundColor: '#f8fafc', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Repeat size={16} />
              </div>
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
              {myTrades.length}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              {inboundPendingTrades.length} pending your peer decision
            </div>
          </div>
        </div>

        {/* Next Shift Spotlight Card */}
        {nextShift && (
          <div style={{
            padding: '20px 24px',
            marginBottom: '24px',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderLeft: nextShift.title.includes('Night') ? '4px solid #475569' : '4px solid #0284c7',
            borderRadius: '6px',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.03em',
                textTransform: 'uppercase',
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: nextShift.title.includes('Night') ? '#f1f5f9' : '#f0f9ff',
                color: nextShift.title.includes('Night') ? '#334155' : '#0369a1',
                border: '1px solid #cbd5e1',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}>
                {nextShift.title.includes('Night') ? <Moon size={12} /> : <Sun size={12} />}
                Next Scheduled Shift
              </span>
              <span style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>
                {nextShift.location}
              </span>
            </div>

            <div className="resp-spotlight-grid">
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
                  {nextShift.title}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', color: '#475569', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={15} color="#0284c7" />
                    <span>{new Date(nextShift.startTime).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={15} color="#059669" />
                    <span>
                      {nextShift.title.includes('Night') ? '07:00 PM – 07:00 AM (12h)' : '07:00 AM – 07:00 PM (12h)'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={15} color="#0284c7" />
                    <span>{nextShift.location}</span>
                  </div>
                </div>
              </div>

              <div className="resp-spotlight-action" style={{ textAlign: 'right' }}>
                <Link
                  href={`/employee/trades?shiftId=${nextShift.id}`}
                  className="btn btn-secondary"
                >
                  <Repeat size={14} color="#0284c7" />
                  <span>Request Swap for Shift</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Schedule List & Active Trades Grid */}
        <div className="resp-dashboard-grid">
          {/* My Shifts for this week */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} color="#0284c7" />
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>My Shifts (This Week)</h3>
              </div>
              <Link href="/employee/calendar" style={{ fontSize: '13px', color: '#0284c7', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                Full Schedule <ArrowRight size={14} />
              </Link>
            </div>

            {myShifts.length === 0 ? (
              <div style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                <Calendar size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                  No shifts scheduled for this week
                </div>
                <div style={{ fontSize: '13px' }}>
                  Contact clinical admin Elena Vance or review the roster schedule.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {myShifts.map(shift => {
                  const start = new Date(shift.startTime);
                  const isNight = shift.title.includes('Night');
                  const dateStr = start.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
                  const timeStr = isNight ? '19:00 - 07:00 (12 hrs)' : '07:00 - 19:00 (12 hrs)';

                  return (
                    <div
                      key={shift.id}
                      className="resp-shift-row"
                      style={{
                        borderLeft: `4px solid ${isNight ? '#475569' : '#0284c7'}`,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '220px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '4px',
                          backgroundColor: isNight ? '#f1f5f9' : '#f0f9ff',
                          color: isNight ? '#334155' : '#0284c7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          {isNight ? <Moon size={16} /> : <Sun size={16} />}
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            {shift.title}
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              padding: '1px 6px',
                              borderRadius: '3px',
                              backgroundColor: isNight ? '#f1f5f9' : '#f0f9ff',
                              color: isNight ? '#334155' : '#0369a1',
                              border: '1px solid #cbd5e1',
                            }}>
                              {timeStr}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 600, color: '#334155' }}>{dateStr}</span>
                            <span>•</span>
                            <span>{shift.location}</span>
                            <span>•</span>
                            <span>Break: 60 min</span>
                          </div>
                        </div>
                      </div>

                      <div className="resp-shift-row-btn">
                        <Link
                          href={`/employee/trades?shiftId=${shift.id}`}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '12px', padding: '6px 12px' }}
                        >
                          <Repeat size={13} /> Request Swap
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Trade Activity Tracker */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Repeat size={18} color="#0284c7" />
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>My Swap Requests</h3>
              </div>
              <Link href="/employee/trades" style={{ fontSize: '13px', color: '#0284c7', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                View All <ArrowRight size={14} />
              </Link>
            </div>

            {myTrades.length === 0 ? (
              <div style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                <Repeat size={30} style={{ margin: '0 auto 10px', opacity: 0.35 }} />
                <div style={{ fontSize: '13px', color: '#64748b' }}>
                  No active shift swap requests right now.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {myTrades.slice(0, 4).map(trade => {
                  const isRequester = trade.requesterId === session.id;
                  const otherParty = isRequester ? trade.targetUser.name : trade.requester.name;

                  return (
                    <div
                      key={trade.id}
                      style={{
                        padding: '12px 14px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                          {isRequester ? `You ➔ ${otherParty}` : `${otherParty} ➔ You`}
                        </span>
                        <span className={`badge ${trade.status === 'ADMIN_APPROVED'
                            ? 'badge-approved'
                            : trade.status === 'PENDING_PEER' || trade.status === 'PEER_ACCEPTED'
                              ? 'badge-pending'
                              : 'badge-denied'
                          }`} style={{ fontSize: '10px' }}>
                          {trade.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {trade.requesterShift.title} ⇄ {trade.targetShift.title}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
