import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Mail,
  Phone,
  Building,
  ShieldCheck,
  HeartPulse,
  CheckCircle,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function EmployeeProfilePage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const user = await db.users.findById(session.id);
  if (!user) {
    redirect('/login');
  }

  const department = user.departmentId ? await db.departments.findById(user.departmentId) : null;
  const myShifts = await db.shifts.list({ userId: user.id });
  const myTrades = await db.trades.list({ userId: user.id });

  const isNurse = department?.code === 'NURSE' || user.title.toLowerCase().includes('nurse');

  return (
    <AppShell currentUser={session}>
      <div style={{ padding: '24px 32px' }}>
        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              padding: '3px 9px',
              borderRadius: '12px',
              backgroundColor: isNurse ? '#e0f2fe' : '#ede9fe',
              color: isNurse ? '#0369a1' : '#4338ca',
            }}>
              Staff Profile & Credentials
            </span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Clinical Staff Record
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            Inpatient Care Unit 3B • Hospital Employee ID: #{user.id.slice(-6).toUpperCase()}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
          {/* Left: Staff ID Card */}
          <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', height: 'fit-content', borderRadius: '6px' }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '4px',
              backgroundColor: isNurse ? '#f0f9ff' : '#f8fafc',
              color: isNurse ? '#0369a1' : '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
              fontSize: '26px',
              fontWeight: 800,
              border: `2px solid ${isNurse ? '#0284c7' : '#cbd5e1'}`,
            }}>
              {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>

            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '2px' }}>
              {user.name}
            </h2>
            <div style={{ fontSize: '13px', color: '#0284c7', fontWeight: 600, marginBottom: '10px' }}>
              {user.title}
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 8px', borderRadius: '4px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', fontSize: '11px', fontWeight: 600, color: '#334155', marginBottom: '20px' }}>
              <HeartPulse size={13} color="#0284c7" />
              Dept: {department?.name || 'Inpatient Care'}
            </div>

            <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '16px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#334155' }}>
                <Mail size={15} color="#64748b" />
                <span>{user.email}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#334155' }}>
                <Phone size={15} color="#64748b" />
                <span>{user.phone || '+1 (555) 019-2831'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#334155' }}>
                <Building size={15} color="#64748b" />
                <span>Workforce Operations</span>
              </div>
            </div>
          </div>

          {/* Right: Roster & Staffing Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Quick Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div className="glass-panel" style={{ padding: '18px' }}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Active Scheduled Shifts</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                  {myShifts.length}
                </div>
                <div style={{ fontSize: '11px', color: '#059669', marginTop: '4px' }}>Allotted this week</div>
              </div>

              <div className="glass-panel" style={{ padding: '18px' }}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Total Trade History</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                  {myTrades.length}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Proposed / completed</div>
              </div>

              <div className="glass-panel" style={{ padding: '18px' }}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Shift Coverage Status</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
                  100%
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Inpatient ward active</div>
              </div>
            </div>

            {/* Upcoming Shifts Roster */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                  Your Current Roster ({myShifts.length} Shifts)
                </h3>
                <Link href="/employee/calendar" style={{ fontSize: '13px', color: '#0284c7', fontWeight: 600 }}>
                  View Team Schedule &rarr;
                </Link>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {myShifts.map(s => {
                  const d = new Date(s.startTime);
                  const isNight = s.title.includes('Night');
                  return (
                    <div
                      key={s.id}
                      style={{
                        padding: '12px 16px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor: isNight ? '#ede9fe' : '#e0f2fe',
                          color: isNight ? '#4f46e5' : '#0284c7',
                        }}>
                          {s.title}
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                          {d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                          ({isNight ? '19:00 - 07:00' : '07:00 - 19:00'})
                        </span>
                      </div>

                      <span style={{ fontSize: '12px', color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle size={14} /> Confirmed
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
