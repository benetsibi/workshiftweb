'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Sun, Moon, MapPin, Check } from 'lucide-react';
import { Department, ShiftWithDetails } from '@/lib/types';

interface ShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  shiftToEdit?: ShiftWithDetails | null;
  employees: Array<{ id: string; name: string; title: string; departmentId: string }>;
  departments: Department[];
}

export default function ShiftModal({
  isOpen,
  onClose,
  onSaved,
  shiftToEdit,
  employees,
  departments,
}: ShiftModalProps) {
  const [userId, setUserId] = useState('');
  const [shiftType, setShiftType] = useState<'Day Shift' | 'Night Shift'>('Day Shift');
  const [shiftDate, setShiftDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pad = (n: number) => n.toString().padStart(2, '0');

  useEffect(() => {
    if (shiftToEdit) {
      setUserId(shiftToEdit.userId);
      setShiftType(shiftToEdit.title.includes('Night') ? 'Night Shift' : 'Day Shift');
      const start = new Date(shiftToEdit.startTime);
      setShiftDate(`${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`);
    } else {
      setUserId(employees[0]?.id || '');
      setShiftType('Day Shift');
      const today = new Date();
      setShiftDate(`${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`);
    }
    setError('');
  }, [shiftToEdit, isOpen, employees]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!userId) throw new Error('Please select a staff member to allot this shift');
      if (!shiftDate) throw new Error('Please select a valid date');

      const emp = employees.find(e => e.id === userId);
      const departmentId = emp?.departmentId || departments[0]?.id || 'dept-nurse';

      // Parse date
      const [year, month, day] = shiftDate.split('-').map(Number);
      const start = new Date(year, month - 1, day);
      const end = new Date(year, month - 1, day);

      if (shiftType === 'Day Shift') {
        start.setHours(7, 0, 0, 0);
        end.setHours(19, 0, 0, 0);
      } else {
        start.setHours(19, 0, 0, 0);
        end.setDate(end.getDate() + 1);
        end.setHours(7, 0, 0, 0);
      }

      const payload = {
        title: shiftType,
        userId,
        departmentId,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        breakMinutes: 60,
        location: 'Inpatient Ward',
        notes: `${shiftType} duty allotted to ${emp?.name || 'staff'}`,
      };

      const url = shiftToEdit ? `/api/shifts/${shiftToEdit.id}` : '/api/shifts';
      const method = shiftToEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to allot shift');
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving shift');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-fade-in" style={{ padding: '24px', maxWidth: '480px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '4px',
              backgroundColor: '#f0f9ff',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Calendar size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                {shiftToEdit ? 'Edit Shift Allotment' : 'Allot Staff Shift'}
              </h2>
              <p style={{ fontSize: '12px', color: '#64748b' }}>
                Assign Day or Night shift to staff member
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            style={{ padding: '5px 8px', borderRadius: '4px' }}
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div style={{
            padding: '10px 12px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '4px',
            color: '#dc2626',
            fontSize: '13px',
            marginBottom: '16px',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* 1. Select Staff Member */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" style={{ fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={14} color="#0284c7" /> Staff Member
            </label>
            <select
              className="form-select"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
              style={{ fontSize: '13px', padding: '8px 12px', borderRadius: '4px' }}
            >
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Select Shift Type (Day or Night only) */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" style={{ fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
              Shift Type
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShiftType('Day Shift')}
                style={{
                  padding: '12px 10px',
                  borderRadius: '4px',
                  border: shiftType === 'Day Shift' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                  backgroundColor: shiftType === 'Day Shift' ? '#f0f9ff' : '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#0369a1', fontSize: '13px' }}>
                  <Sun size={16} /> Day Shift
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>07:00 AM – 07:00 PM</div>
                <span style={{ fontSize: '10px', color: '#0369a1', fontWeight: 700, backgroundColor: '#e0f2fe', padding: '1px 6px', borderRadius: '3px' }}>
                  12 Hours
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShiftType('Night Shift')}
                style={{
                  padding: '12px 10px',
                  borderRadius: '4px',
                  border: shiftType === 'Night Shift' ? '2px solid #334155' : '1px solid #cbd5e1',
                  backgroundColor: shiftType === 'Night Shift' ? '#f8fafc' : '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#1e293b', fontSize: '13px' }}>
                  <Moon size={16} /> Night Shift
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>07:00 PM – 07:00 AM</div>
                <span style={{ fontSize: '10px', color: '#334155', fontWeight: 700, backgroundColor: '#e2e8f0', padding: '1px 6px', borderRadius: '3px' }}>
                  12 Hours
                </span>
              </button>
            </div>
          </div>

          {/* 3. Shift Date */}
          <div className="form-group" style={{ marginBottom: '22px' }}>
            <label className="form-label" style={{ fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={15} color="#0284c7" /> Date
            </label>
            <input
              type="date"
              className="form-input"
              value={shiftDate}
              onChange={(e) => setShiftDate(e.target.value)}
              required
              style={{ fontSize: '14px', padding: '10px 12px' }}
            />
          </div>

          <div style={{
            padding: '10px 14px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            marginBottom: '20px',
            fontSize: '12px',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={14} color="#64748b" /> Location: <strong>Inpatient Ward</strong>
            </span>
            <span>Break: <strong>60 min</strong></span>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}
            >
              <Check size={16} />
              <span>{loading ? 'Saving...' : (shiftToEdit ? 'Update Allotment' : 'Allot Shift')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
