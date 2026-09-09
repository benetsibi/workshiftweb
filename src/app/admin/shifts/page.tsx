'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Filter,
  List,
  Grid,
  Trash2,
  Edit2,
  Clock,
  User,
  MapPin,
  RefreshCw,
  Search,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import CalendarView from '@/components/CalendarView';
import ShiftModal from '@/components/ShiftModal';
import { Department, ShiftWithDetails, UserSession } from '@/lib/types';

export default function AdminShiftsPage() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [shifts, setShifts] = useState<ShiftWithDetails[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewStyle, setViewStyle] = useState<'calendar' | 'table'>('calendar');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shiftToEdit, setShiftToEdit] = useState<ShiftWithDetails | null>(null);

  // Load user session
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setCurrentUser(data.user);
        } else {
          window.location.href = '/login';
        }
      })
      .catch(() => {
        window.location.href = '/login';
      });
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [shiftsRes, deptsRes, empRes] = await Promise.all([
        fetch('/api/shifts'),
        fetch('/api/departments'),
        fetch('/api/employees'),
      ]);

      const [shiftsData, deptsData, empData] = await Promise.all([
        shiftsRes.json(),
        deptsRes.json(),
        empRes.json(),
      ]);

      if (shiftsData.shifts) setShifts(shiftsData.shifts);
      if (deptsData.departments) setDepartments(deptsData.departments);
      if (empData.employees) setEmployees(empData.employees);
    } catch (e) {
      console.error('Failed to load schedule data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteShift = async (id: string) => {
    if (!confirm('Are you sure you want to delete this shift rotation?')) return;

    try {
      const res = await fetch(`/api/shifts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setShifts(shifts.filter(s => s.id !== id));
      }
    } catch (e) {
      console.error('Failed to delete shift', e);
    }
  };

  const handleEditClick = (shift: ShiftWithDetails) => {
    setShiftToEdit(shift);
    setIsModalOpen(true);
  };

  const handleAddClick = () => {
    setShiftToEdit(null);
    setIsModalOpen(true);
  };

  // Filtered shifts for table view
  const filteredShifts = shifts.filter(s => {
    if (selectedDeptFilter !== 'all' && s.departmentId !== selectedDeptFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = s.title.toLowerCase().includes(q);
      const matchUser = s.user?.name.toLowerCase().includes(q);
      const matchLoc = s.location.toLowerCase().includes(q);
      return matchTitle || matchUser || matchLoc;
    }
    return true;
  });

  if (!currentUser) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', color: '#64748b' }}>
        Loading shifts...
      </div>
    );
  }

  return (
    <AppShell currentUser={currentUser} allEmployees={employees} departments={departments}>
      <div style={{ padding: '24px 32px' }}>
        {/* Header Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px',
        }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Hospital Shift Management
            </h1>
            <p style={{ fontSize: '14px', color: '#64748b' }}>
              Allot Day Shift (07:00–19:00) and Night Shift (19:00–07:00) to Nurses and Doctors.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* View Switcher: Calendar vs Table */}
            <div style={{
              display: 'flex',
              backgroundColor: '#f1f5f9',
              borderRadius: '8px',
              padding: '3px',
              border: '1px solid #e2e8f0',
            }}>
              <button
                onClick={() => setViewStyle('calendar')}
                className="btn btn-sm"
                style={{
                  backgroundColor: viewStyle === 'calendar' ? '#0284c7' : 'transparent',
                  color: viewStyle === 'calendar' ? '#ffffff' : '#64748b',
                  padding: '6px 12px',
                  border: 'none',
                  fontWeight: 600,
                }}
              >
                <Grid size={15} /> Calendar
              </button>
              <button
                onClick={() => setViewStyle('table')}
                className="btn btn-sm"
                style={{
                  backgroundColor: viewStyle === 'table' ? '#0284c7' : 'transparent',
                  color: viewStyle === 'table' ? '#ffffff' : '#64748b',
                  padding: '6px 12px',
                  border: 'none',
                  fontWeight: 600,
                }}
              >
                <List size={15} /> Table Roster
              </button>
            </div>

            <button onClick={handleAddClick} className="btn btn-primary" style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}>
              <Plus size={16} />
              <span>Allot Shift</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Bar (visible for Table view or general filtering) */}
        {viewStyle === 'table' && (
          <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '260px' }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="text"
                  placeholder="Search shifts by title, employee, location..."
                  className="form-input"
                  style={{ paddingLeft: '36px', fontSize: '13px', padding: '8px 12px 8px 36px' }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select
                className="form-select"
                style={{ width: 'auto', fontSize: '13px', padding: '8px 12px' }}
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
              >
                <option value="all">All Departments</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>

            <div style={{ fontSize: '13px', color: '#94a3b8' }}>
              Showing {filteredShifts.length} shifts
            </div>
          </div>
        )}

        {/* View Mode: Interactive Calendar */}
        {viewStyle === 'calendar' ? (
          <CalendarView
            shifts={shifts}
            departments={departments}
            isAdmin={true}
            onShiftClick={handleEditClick}
          />
        ) : (
          /* View Mode: Structured Table */
          <div className="glass-panel" style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                    <th style={{ padding: '14px 20px' }}>Shift Details</th>
                    <th style={{ padding: '14px 20px' }}>Assigned Clinician</th>
                    <th style={{ padding: '14px 20px' }}>Role / Dept</th>
                    <th style={{ padding: '14px 20px' }}>Schedule Timing</th>
                    <th style={{ padding: '14px 20px' }}>Break</th>
                    <th style={{ padding: '14px 20px' }}>Status</th>
                    <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredShifts.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                        No shifts match your search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredShifts.map((shift) => {
                      const start = new Date(shift.startTime);
                      const end = new Date(shift.endTime);
                      const dateStr = start.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
                      const timeStr = `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

                      return (
                        <tr
                          key={shift.id}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            transition: 'background-color 0.15s',
                          }}
                        >
                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{shift.title}</div>
                            <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                              <MapPin size={12} /> {shift.location}
                            </div>
                          </td>

                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                backgroundColor: '#eef2ff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#4f46e5',
                                fontSize: '12px',
                                fontWeight: 800,
                              }}>
                                {shift.user?.name ? shift.user.name[0] : '?'}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, color: '#0f172a' }}>{shift.user?.name || 'Unassigned'}</div>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>{shift.user?.title || ''}</div>
                              </div>
                            </div>
                          </td>

                          <td style={{ padding: '14px 20px' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 700,
                              backgroundColor: '#f1f5f9',
                              color: shift.department?.color || '#4f46e5',
                              borderLeft: `3px solid ${shift.department?.color || '#4f46e5'}`,
                            }}>
                              {shift.department?.name || 'General'}
                            </span>
                          </td>

                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{dateStr}</div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>{timeStr}</div>
                          </td>

                          <td style={{ padding: '14px 20px', color: '#475569', fontWeight: 500 }}>
                            {shift.breakMinutes} min
                          </td>

                          <td style={{ padding: '14px 20px' }}>
                            <span className="badge badge-scheduled" style={{ fontSize: '11px' }}>
                              {shift.status}
                            </span>
                          </td>

                          <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                              <button
                                onClick={() => handleEditClick(shift)}
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '6px 10px' }}
                                title="Edit Shift"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteShift(shift.id)}
                                className="btn btn-danger btn-sm"
                                style={{ padding: '6px 10px' }}
                                title="Delete Shift"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Shift Creation / Edit Modal */}
        <ShiftModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSaved={loadData}
          shiftToEdit={shiftToEdit}
          employees={employees}
          departments={departments}
        />
      </div>
    </AppShell>
  );
}
