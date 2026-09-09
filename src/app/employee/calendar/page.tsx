'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Repeat,
  Filter,
  User,
  Users,
  Info,
  ShieldCheck,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import CalendarView from '@/components/CalendarView';
import TradeRequestModal from '@/components/TradeRequestModal';
import { Department, ShiftWithDetails, UserSession } from '@/lib/types';

export default function EmployeeCalendarPage() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [shifts, setShifts] = useState<ShiftWithDetails[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterScope, setFilterScope] = useState<'my' | 'all'>('all');

  // Trade modal state
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [selectedShiftForTrade, setSelectedShiftForTrade] = useState<string | undefined>(undefined);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setCurrentUser(data.user);
        } else {
          window.location.href = '/login';
        }
      });
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [shiftsRes, deptsRes] = await Promise.all([
        fetch('/api/shifts'),
        fetch('/api/departments'),
      ]);

      const [shiftsData, deptsData] = await Promise.all([
        shiftsRes.json(),
        deptsRes.json(),
      ]);

      if (shiftsData.shifts) setShifts(shiftsData.shifts);
      if (deptsData.departments) setDepartments(deptsData.departments);
    } catch (e) {
      console.error('Failed to load schedule', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRequestTrade = (shift: ShiftWithDetails) => {
    // If user clicked their own shift, pass it as preselected
    if (currentUser && shift.userId === currentUser.id) {
      setSelectedShiftForTrade(shift.id);
    } else {
      setSelectedShiftForTrade(myShifts[0]?.id);
    }
    setIsTradeModalOpen(true);
  };

  const myShifts = currentUser ? shifts.filter(s => s.userId === currentUser.id) : [];
  const displayedShifts = filterScope === 'my' ? myShifts : shifts;

  if (!currentUser) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', color: '#64748b' }}>
        Loading schedule...
      </div>
    );
  }

  return (
    <AppShell currentUser={currentUser} departments={departments}>
      <div style={{ padding: '24px 32px' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
        }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Hospital Team Schedule
            </h1>
            <p style={{ fontSize: '14px', color: '#64748b' }}>
              Active Day & Night rotations for all 3 Nurses and 2 Inpatient Doctors.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Filter Scope: My Shifts vs All Shifts */}
            <div style={{
              display: 'flex',
              backgroundColor: '#f1f5f9',
              borderRadius: '8px',
              padding: '3px',
              border: '1px solid #e2e8f0',
            }}>
              <button
                onClick={() => setFilterScope('my')}
                className="btn btn-sm"
                style={{
                  backgroundColor: filterScope === 'my' ? '#0284c7' : 'transparent',
                  color: filterScope === 'my' ? '#ffffff' : '#64748b',
                  padding: '6px 14px',
                  border: 'none',
                  fontWeight: 600,
                }}
              >
                <User size={14} /> My Shifts ({myShifts.length})
              </button>
              <button
                onClick={() => setFilterScope('all')}
                className="btn btn-sm"
                style={{
                  backgroundColor: filterScope === 'all' ? '#0284c7' : 'transparent',
                  color: filterScope === 'all' ? '#ffffff' : '#64748b',
                  padding: '6px 14px',
                  border: 'none',
                  fontWeight: 600,
                }}
              >
                <Users size={14} /> Full Roster ({shifts.length})
              </button>
            </div>

            <button
              onClick={() => {
                setSelectedShiftForTrade(myShifts[0]?.id);
                setIsTradeModalOpen(true);
              }}
              className="btn btn-primary"
              disabled={myShifts.length === 0}
              style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}
            >
              <Repeat size={16} />
              <span>Request Shift Swap</span>
            </button>
          </div>
        </div>

        {/* Clinical Staff Rule Banner */}
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '13px',
          color: '#0369a1',
        }}>
          <ShieldCheck size={18} color="#0284c7" style={{ flexShrink: 0 }} />
          <span>
            <strong>Clinical Swapping Rule:</strong> Registered Nurses may swap with other Nurses. Doctors may swap with other Doctors. Click <strong>"Request Swap"</strong> on any shift to propose a trade.
          </span>
        </div>

        {/* Calendar View */}
        <CalendarView
          shifts={displayedShifts}
          departments={departments}
          currentUserId={currentUser?.id}
          isAdmin={false}
          onRequestTrade={handleRequestTrade}
        />

        {/* Trade Request Modal */}
        {currentUser && (
          <TradeRequestModal
            isOpen={isTradeModalOpen}
            onClose={() => setIsTradeModalOpen(false)}
            onSubmitted={() => {
              loadData();
            }}
            currentUser={currentUser}
            myShifts={myShifts}
            preselectedShiftId={selectedShiftForTrade}
          />
        )}
      </div>
    </AppShell>
  );
}
