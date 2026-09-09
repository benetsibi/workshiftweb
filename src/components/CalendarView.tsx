'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, MapPin, User, Calendar as CalendarIcon, Filter, Repeat } from 'lucide-react';
import { Department, ShiftWithDetails } from '@/lib/types';

interface CalendarViewProps {
  shifts: ShiftWithDetails[];
  departments: Department[];
  onShiftClick?: (shift: ShiftWithDetails) => void;
  onRequestTrade?: (shift: ShiftWithDetails) => void;
  currentUserId?: string;
  isAdmin?: boolean;
}

export default function CalendarView({
  shifts,
  departments,
  onShiftClick,
  onRequestTrade,
  currentUserId,
  isAdmin = false,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [selectedDept, setSelectedDept] = useState<string>('all');

  // Filter shifts by department if selected
  const filteredShifts = shifts.filter(s => {
    if (selectedDept !== 'all' && s.departmentId !== selectedDept) return false;
    return true;
  });

  // Date Navigation Helpers
  const nextPeriod = () => {
    const next = new Date(currentDate);
    if (viewMode === 'week') {
      next.setDate(next.getDate() + 7);
    } else {
      next.setMonth(next.getMonth() + 1);
    }
    setCurrentDate(next);
  };

  const prevPeriod = () => {
    const prev = new Date(currentDate);
    if (viewMode === 'week') {
      prev.setDate(prev.getDate() - 7);
    } else {
      prev.setMonth(prev.getMonth() - 1);
    }
    setCurrentDate(prev);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Generate days for Week View
  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay(); // 0 is Sunday
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
    startOfWeek.setDate(diff);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d);
    }
    return days;
  };

  // Generate days for Month View
  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days = [];
    // Leading days
    const startOffset = (firstDay.getDay() + 6) % 7; // Monday = 0
    for (let i = startOffset; i > 0; i--) {
      const d = new Date(year, month, 1 - i);
      days.push({ date: d, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      days.push({ date: d, isCurrentMonth: true });
    }

    // Trailing days to fill 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ date: d, isCurrentMonth: false });
    }

    return days;
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const getShiftsForDay = (date: Date) => {
    return filteredShifts.filter(s => isSameDay(new Date(s.startTime), date));
  };

  const weekDays = getWeekDays();
  const monthDays = getMonthDays();
  const today = new Date();

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      {/* Calendar Controls Topbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px',
      }}>
        {/* Period Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#f1f5f9', borderRadius: 'var(--radius-md)', padding: '3px' }}>
            <button
              onClick={prevPeriod}
              className="btn btn-secondary btn-sm"
              style={{ padding: '6px 8px', border: 'none', background: '#ffffff' }}
              title="Previous"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={goToToday}
              className="btn btn-secondary btn-sm"
              style={{ padding: '6px 12px', border: 'none', fontSize: '13px', background: '#ffffff', fontWeight: 600 }}
            >
              Today
            </button>
            <button
              onClick={nextPeriod}
              className="btn btn-secondary btn-sm"
              style={{ padding: '6px 8px', border: 'none', background: '#ffffff' }}
              title="Next"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', minWidth: '220px' }}>
            {viewMode === 'week' ? (
              `${weekDays[0].toLocaleDateString([], { month: 'short', day: 'numeric' })} – ${weekDays[6].toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`
            ) : (
              currentDate.toLocaleDateString([], { month: 'long', year: 'numeric' })
            )}
          </h3>
        </div>

        {/* Filters and View Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Department Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={15} color="#64748b" />
            <select
              className="form-select"
              style={{ padding: '6px 12px', fontSize: '13px', width: 'auto', borderRadius: '8px' }}
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
            >
              <option value="all">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
              ))}
            </select>
          </div>

          {/* Week / Month Toggle */}
          <div style={{
            display: 'flex',
            backgroundColor: '#f1f5f9',
            borderRadius: 'var(--radius-md)',
            padding: '3px',
            border: '1px solid #e2e8f0',
          }}>
            <button
              onClick={() => setViewMode('week')}
              style={{
                padding: '6px 14px',
                fontSize: '13px',
                fontWeight: 700,
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: viewMode === 'week' ? '#4f46e5' : 'transparent',
                color: viewMode === 'week' ? '#ffffff' : '#475569',
                transition: 'all 0.2s',
              }}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('month')}
              style={{
                padding: '6px 14px',
                fontSize: '13px',
                fontWeight: 700,
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: viewMode === 'month' ? '#4f46e5' : 'transparent',
                color: viewMode === 'month' ? '#ffffff' : '#475569',
                transition: 'all 0.2s',
              }}
            >
              Month
            </button>
          </div>
        </div>
      </div>

      {/* WEEK VIEW */}
      {viewMode === 'week' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '12px' }}>
          {weekDays.map((day, idx) => {
            const dayShifts = getShiftsForDay(day);
            const isToday = isSameDay(day, today);

            return (
              <div
                key={idx}
                style={{
                  backgroundColor: isToday ? '#f0f9ff' : '#ffffff',
                  border: isToday ? '1px solid #0284c7' : '1px solid #cbd5e1',
                  borderRadius: '4px',
                  minHeight: '280px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Day Header */}
                <div style={{
                  padding: '10px 12px',
                  borderBottom: '1px solid #cbd5e1',
                  backgroundColor: isToday ? '#e0f2fe' : '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: isToday ? '#0369a1' : '#475569', textTransform: 'uppercase' }}>
                    {day.toLocaleDateString([], { weekday: 'short' })}
                  </span>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    width: '24px',
                    height: '24px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isToday ? '#0284c7' : 'transparent',
                    color: isToday ? '#ffffff' : '#0f172a',
                  }}>
                    {day.getDate()}
                  </span>
                </div>

                {/* Shifts List in this day */}
                <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
                  {dayShifts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 8px', fontSize: '12px', color: '#94a3b8' }}>
                      No rotations
                    </div>
                  ) : (
                    dayShifts.map(shift => {
                      const startTimeStr = new Date(shift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      const endTimeStr = new Date(shift.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      const isMyShift = shift.userId === currentUserId;
                      const deptColor = shift.department?.color || '#4f46e5';

                      return (
                        <div
                          key={shift.id}
                          onClick={() => onShiftClick && onShiftClick(shift)}
                          style={{
                            backgroundColor: '#ffffff',
                            border: `1px solid ${isMyShift ? '#86efac' : '#e2e8f0'}`,
                            borderLeft: `4px solid ${deptColor}`,
                            borderRadius: '8px',
                            padding: '10px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              color: deptColor,
                              letterSpacing: '0.04em',
                            }}>
                              {shift.department?.code || 'ON-CALL'}
                            </span>
                            {isMyShift && (
                              <span style={{ fontSize: '9px', backgroundColor: '#ecfdf5', color: '#059669', padding: '1px 6px', borderRadius: '4px', fontWeight: 700, border: '1px solid #a7f3d0' }}>
                                My Duty
                              </span>
                            )}
                          </div>

                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', lineHeight: 1.25, marginBottom: '6px' }}>
                            {shift.title}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
                            <Clock size={12} />
                            <span>{startTimeStr} - {endTimeStr}</span>
                          </div>

                          {shift.user && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#334155', fontWeight: 600 }}>
                              <User size={12} color="#4f46e5" />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {shift.user.name}
                              </span>
                            </div>
                          )}

                          {/* Quick Trade Button for Employee viewing their own shift */}
                          {!isAdmin && isMyShift && onRequestTrade && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onRequestTrade(shift);
                              }}
                              className="btn btn-sm"
                              style={{
                                marginTop: '6px',
                                width: '100%',
                                fontSize: '11px',
                                padding: '3px 6px',
                                backgroundColor: '#f0f9ff',
                                color: '#0369a1',
                                border: '1px solid #bae6fd',
                                fontWeight: 700,
                                borderRadius: '3px',
                              }}
                            >
                              <Repeat size={11} /> Propose Swap
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MONTH VIEW */}
      {viewMode === 'month' && (
        <div>
          {/* Day of week headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '6px', marginBottom: '6px', textAlign: 'center' }}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} style={{ fontSize: '12px', fontWeight: 700, color: '#475569', padding: '6px' }}>
                {day}
              </div>
            ))}
          </div>

          {/* Month grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '6px' }}>
            {monthDays.map((item, idx) => {
              const dayShifts = getShiftsForDay(item.date);
              const isToday = isSameDay(item.date, today);

              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: item.isCurrentMonth
                      ? (isToday ? '#f0f9ff' : '#ffffff')
                      : '#f8fafc',
                    border: isToday ? '1px solid #0284c7' : '1px solid #cbd5e1',
                    borderRadius: '4px',
                    minHeight: '100px',
                    padding: '6px',
                    opacity: item.isCurrentMonth ? 1 : 0.45,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: isToday ? 800 : 600,
                      color: isToday ? '#0369a1' : '#1e293b',
                    }}>
                      {item.date.getDate()}
                    </span>
                    {dayShifts.length > 0 && (
                      <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>
                        {dayShifts.length}
                      </span>
                    )}
                  </div>

                  {/* Shift dots or mini pills */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, overflowY: 'auto' }}>
                    {dayShifts.slice(0, 3).map(shift => (
                      <div
                        key={shift.id}
                        onClick={() => onShiftClick && onShiftClick(shift)}
                        style={{
                          fontSize: '10px',
                          padding: '2px 5px',
                          borderRadius: '4px',
                          backgroundColor: shift.userId === currentUserId ? '#ecfdf5' : '#f1f5f9',
                          color: '#0f172a',
                          fontWeight: 600,
                          borderLeft: `3px solid ${shift.department?.color || '#4f46e5'}`,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          cursor: 'pointer',
                        }}
                        title={`${shift.title} - ${shift.user?.name || 'Engineer'}`}
                      >
                        {new Date(shift.startTime).getHours()}:00 {shift.title}
                      </div>
                    ))}
                    {dayShifts.length > 3 && (
                      <span style={{ fontSize: '9px', color: '#4f46e5', textAlign: 'center', fontWeight: 700 }}>
                        +{dayShifts.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
