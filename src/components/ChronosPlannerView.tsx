'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Users,
  Repeat,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
  Share2,
  Download,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Filter,
  Sun,
  Moon,
  ShieldCheck,
  UserCheck,
  Activity,
  ArrowRight,
  Check,
} from 'lucide-react';
import ShiftModal from './ShiftModal';
import { useRouter } from 'next/navigation';
import { ShiftWithDetails } from '@/lib/types';

interface ChronosPlannerViewProps {
  initialShifts: ShiftWithDetails[];
  allEmployees: any[];
  departments: any[];
  pendingTradeCount?: number;
  isAdmin?: boolean;
}

export default function ChronosPlannerView({
  initialShifts,
  allEmployees,
  departments,
  pendingTradeCount = 0,
  isAdmin = true,
}: ChronosPlannerViewProps) {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<'ALL' | 'NURSE' | 'DOCTOR'>('ALL');
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(1); // Tuesday (Sep 8) by default
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('week');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Shift Modal State
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [shiftToEdit, setShiftToEdit] = useState<ShiftWithDetails | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Week days definition (Mon Sep 7 – Sun Sep 13, 2026)
  const weekDays = [
    { dayStr: 'MON', dateStr: 'Sep 07', dayNum: 7, coverage: '100%', hours: '36.0h' },
    { dayStr: 'TUE', dateStr: 'Sep 08', dayNum: 8, coverage: 'Today', hours: '36.0h', isToday: true },
    { dayStr: 'WED', dateStr: 'Sep 09', dayNum: 9, coverage: '100%', hours: '36.0h' },
    { dayStr: 'THU', dateStr: 'Sep 10', dayNum: 10, coverage: '98%', hours: '36.0h' },
    { dayStr: 'FRI', dateStr: 'Sep 11', dayNum: 11, coverage: '100%', hours: '36.0h' },
    { dayStr: 'SAT', dateStr: 'Sep 12', dayNum: 12, coverage: '100%', hours: '36.0h' },
    { dayStr: 'SUN', dateStr: 'Sep 13', dayNum: 13, coverage: '100%', hours: '36.0h' },
  ];

  const activeDay = weekDays[selectedDayIndex];

  // Filter shifts for the active day
  const dayShifts = initialShifts.filter((s) => {
    const d = new Date(s.startTime);
    return d.getUTCDate() === activeDay.dayNum && d.getUTCMonth() === 8 && d.getUTCFullYear() === 2026;
  });

  // Filter shifts by role
  const filteredDayShifts = dayShifts.filter((s) => {
    if (selectedRole === 'ALL') return true;
    if (selectedRole === 'NURSE') return s.departmentId === 'dept-nurse';
    if (selectedRole === 'DOCTOR') return s.departmentId === 'dept-doctor';
    return true;
  });

  const dayShiftList = filteredDayShifts.filter((s) => s.title.includes('Day'));
  const nightShiftList = filteredDayShifts.filter((s) => s.title.includes('Night'));

  const totalWeeklyHours = initialShifts.length * 12;

  const handleExportCSV = () => {
    const headers = 'ID,Staff,Role,Shift,Start,End,Ward\n';
    const rows = initialShifts
      .map(
        (s) =>
          `"${s.id}","${s.user?.name || ''}","${s.user?.title || ''}","${s.title}","${s.startTime}","${s.endTime}","${s.location}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ShiftTracker_Roster_${activeDay.dateStr}.csv`;
    a.click();
    showToast('Shift Roster exported successfully as CSV');
  };

  const handleCommitSchedule = () => {
    showToast('Live schedule committed & locked across operational unit 3B');
  };



  return (
    <div className="planner-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="planner-toast">
          <CheckCircle2 size={16} color="#10b981" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER SECTION */}
      <div className="planner-header">
        <div>

          <h1 className="planner-title">Schedule & Shifts Planner</h1>
          <p className="planner-subtitle">
            Orchestrate labor coverage, assign shift tiers, and mitigate overtime risks in real time across dynamic operational units.
          </p>
        </div>

        {isAdmin && (
          <div className="planner-header-actions">
            <button
              onClick={() => {
                setShiftToEdit(null);
                setIsShiftModalOpen(true);
              }}
              className="btn-planner-primary"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>+ Create Shift</span>
            </button>
          </div>
        )}
      </div>

      {/* CONTROLS & FILTER BAR */}
      <div className="planner-controls-bar">
        <div className="controls-left">
          {/* Segmented View Mode */}
          <div className="segmented-view-pill">
            <button
              onClick={() => setViewMode('month')}
              className={`view-pill-btn ${viewMode === 'month' ? 'active' : ''}`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`view-pill-btn ${viewMode === 'week' ? 'active' : ''}`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`view-pill-btn ${viewMode === 'day' ? 'active' : ''}`}
            >
              Day
            </button>
          </div>

          {/* Date Range Navigator */}
          <div className="date-range-pill">
            <button
              onClick={() => setSelectedDayIndex((prev) => Math.max(0, prev - 1))}
              className="date-nav-arrow"
              title="Previous Day"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="date-range-text">
              <Calendar size={14} color="#0f172a" />
              <span>Sep 07 – Sep 13, 2026</span>
            </div>
            <button
              onClick={() => setSelectedDayIndex((prev) => Math.min(weekDays.length - 1, prev + 1))}
              className="date-nav-arrow"
              title="Next Day"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Role Filters */}
        <div className="controls-right">
          <span className="role-label">ROLE:</span>
          <div className="role-filter-group">
            <button
              onClick={() => setSelectedRole('ALL')}
              className={`role-pill ${selectedRole === 'ALL' ? 'active' : ''}`}
            >
              All Roles
            </button>
            <button
              onClick={() => setSelectedRole('NURSE')}
              className={`role-pill ${selectedRole === 'NURSE' ? 'active' : ''}`}
            >
              Nurses (3)
            </button>
            <button
              onClick={() => setSelectedRole('DOCTOR')}
              className={`role-pill ${selectedRole === 'DOCTOR' ? 'active' : ''}`}
            >
              Physicians (2)
            </button>
          </div>
        </div>
      </div>

      {/* TIMELINE MATRIX STRIP (WEEK DAYS) */}
      <div className="timeline-matrix-section">
        <div className="timeline-matrix-header">
          <span className="matrix-title">TIMELINE MATRIX</span>
          <span className="matrix-badge">2 Active Shift Tiers</span>
        </div>

        <div className="days-strip-container">
          {weekDays.map((d, idx) => {
            const isSelected = idx === selectedDayIndex;
            return (
              <div
                key={d.dayStr}
                onClick={() => setSelectedDayIndex(idx)}
                className={`day-card-item ${isSelected ? 'selected' : ''} ${d.isToday ? 'is-today' : ''}`}
              >
                <div className="day-card-top">
                  <span className="day-name">{d.dayStr}</span>
                  <span className={`coverage-pill ${d.isToday ? 'today-pill' : d.coverage === '100%' ? 'full-pill' : 'alert-pill'}`}>
                    {d.coverage}
                  </span>
                </div>
                <div className="day-date">{d.dateStr}</div>
                <div className="day-hours">{d.hours} Scheduled</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SWIMLANES: MORNING/DAY SHIFT & NIGHT SHIFT */}
      <div className="swimlanes-wrapper">
        {/* SWIMLANE 1: MORNING / DAY SHIFT */}
        <div className="swimlane-card">
          <div className="swimlane-header">
            <div className="swimlane-title-left">
              <span className="shift-dot day-dot"></span>
              <div>
                <span className="shift-title-text">MORNING / DAY SHIFT</span>
                <span className="shift-time-tag">07:00 – 19:00 (12 hrs)</span>
              </div>
            </div>

          </div>

          <div className="swimlane-body">
            {/* Left Headcount Card */}
            <div className="headcount-box">
              <div className="headcount-label">Headcount</div>
              <div className="headcount-number">{dayShiftList.length} Assigned</div>
              {isAdmin && (
                <button
                  onClick={() => {
                    setShiftToEdit(null);
                    setIsShiftModalOpen(true);
                  }}
                  className="btn-quick-staff"
                >
                  <Plus size={13} /> Quick Staff
                </button>
              )}
            </div>

            {/* Shift Cards Row */}
            <div className="staff-cards-row">
              {dayShiftList.map((shift) => {
                const isDoc = shift.departmentId === 'dept-doctor';
                return (
                  <div
                    key={shift.id}
                    onClick={() => {
                      if (isAdmin) {
                        setShiftToEdit(shift);
                        setIsShiftModalOpen(true);
                      }
                    }}
                    className="staff-shift-card"
                  >
                    <div className="card-top-tags">
                      <span className="status-tag active-tag">ACTIVE</span>
                      <span className="status-tag confirmed-tag">Confirmed</span>
                    </div>

                    <div className="staff-card-content">
                      <div className={`staff-avatar ${isDoc ? 'doc-avatar' : 'nurse-avatar'}`}>
                        {shift.user?.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)}
                      </div>
                      <div className="staff-meta">
                        <div className="staff-name">{shift.user?.name}</div>
                        <div className="staff-role">{shift.user?.title}</div>
                      </div>
                    </div>

                    <div className="staff-card-footer">
                      <span className="hours-badge">12.0h</span>
                      <span className="time-range">07:00 – 19:00</span>
                    </div>
                  </div>
                );
              })}

              {isAdmin && (
                <div
                  onClick={() => {
                    setShiftToEdit(null);
                    setIsShiftModalOpen(true);
                  }}
                  className="staff-shift-card add-slot-card"
                >
                  <div className="add-slot-inner">
                    <Plus size={20} color="#0284c7" />
                    <span className="add-slot-text">+ Assign Staff</span>
                    <span className="add-slot-sub">Day Shift Slot</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SWIMLANE 2: NIGHT SHIFT */}
        <div className="swimlane-card" style={{ marginTop: '20px' }}>
          <div className="swimlane-header">
            <div className="swimlane-title-left">
              <span className="shift-dot night-dot"></span>
              <div>
                <span className="shift-title-text">NIGHT SHIFT</span>
                <span className="shift-time-tag">19:00 – 07:00 (12 hrs)</span>
              </div>
            </div>

          </div>

          <div className="swimlane-body">
            {/* Left Headcount Card */}
            <div className="headcount-box">
              <div className="headcount-label">Headcount</div>
              <div className="headcount-number">{nightShiftList.length} Assigned • Full</div>
              <button
                onClick={() => showToast('Night Shift Policy: Full 12h rotation with enforced 12h rest buffer.')}
                className="btn-quick-staff"
              >
                <ShieldCheck size={13} /> Shift Policy
              </button>
            </div>

            {/* Shift Cards Row */}
            <div className="staff-cards-row">
              {nightShiftList.map((shift) => {
                const isDoc = shift.departmentId === 'dept-doctor';
                return (
                  <div
                    key={shift.id}
                    onClick={() => {
                      if (isAdmin) {
                        setShiftToEdit(shift);
                        setIsShiftModalOpen(true);
                      }
                    }}
                    className="staff-shift-card"
                  >
                    <div className="card-top-tags">
                      <span className="status-tag role-supervisor-tag">
                        {isDoc ? 'PHYSICIAN' : 'REGISTERED NURSE'}
                      </span>
                      <span className="status-tag confirmed-tag">Confirmed</span>
                    </div>

                    <div className="staff-card-content">
                      <div className={`staff-avatar ${isDoc ? 'doc-avatar' : 'nurse-avatar'}`}>
                        {shift.user?.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)}
                      </div>
                      <div className="staff-meta">
                        <div className="staff-name">{shift.user?.name}</div>
                        <div className="staff-role">{shift.user?.title}</div>
                      </div>
                    </div>

                    <div className="staff-card-footer">
                      <span className="hours-badge">12.0h</span>
                      <span className="time-range">19:00 – 07:00</span>
                    </div>
                  </div>
                );
              })}

              {/* Sample Pending Swap Card if any */}
              {pendingTradeCount > 0 && (
                <div
                  onClick={() => router.push(isAdmin ? '/admin/trades' : '/employee/trades')}
                  className="staff-shift-card swap-req-card"
                >
                  <div className="card-top-tags">
                    <span className="status-tag swap-tag">SWAP REQ</span>
                    <span className="status-tag pending-tag">Pending Trade</span>
                  </div>

                  <div className="staff-card-content">
                    <div className="staff-avatar swap-avatar">
                      <Repeat size={16} color="#d97706" />
                    </div>
                    <div className="staff-meta">
                      <div className="staff-name">Peer Trade Offer</div>
                      <div className="staff-role">Awaiting Sign-off</div>
                    </div>
                  </div>

                  <div className="staff-card-footer">
                    <span className="hours-badge" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>12.0h</span>
                    <span className="time-range" style={{ color: '#d97706', fontWeight: 700 }}>Review Swap &rarr;</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Shift Modal for adding or editing */}
      {isShiftModalOpen && (
        <ShiftModal
          isOpen={isShiftModalOpen}
          onClose={() => {
            setIsShiftModalOpen(false);
            setShiftToEdit(null);
          }}
          onSaved={() => {
            setIsShiftModalOpen(false);
            setShiftToEdit(null);
            router.refresh();
          }}
          shiftToEdit={shiftToEdit}
          employees={allEmployees}
          departments={departments}
        />
      )}
    </div>
  );
}
