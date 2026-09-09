'use client';

import React, { useState, useEffect } from 'react';
import { X, Repeat, ArrowRightLeft, User, Calendar, AlertCircle, Check, ShieldCheck, Sun, Moon } from 'lucide-react';
import { ShiftWithDetails, UserSession } from '@/lib/types';

interface TradeRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: () => void;
  currentUser: UserSession;
  myShifts: ShiftWithDetails[];
  preselectedShiftId?: string;
}

export default function TradeRequestModal({
  isOpen,
  onClose,
  onSubmitted,
  currentUser,
  myShifts,
  preselectedShiftId,
}: TradeRequestModalProps) {
  const [requesterShiftId, setRequesterShiftId] = useState('');
  const [colleagues, setColleagues] = useState<Array<{ id: string; name: string; title: string; departmentId: string; department?: { name: string } }>>([]);
  const [targetUserId, setTargetUserId] = useState('');
  const [colleagueShifts, setColleagueShifts] = useState<ShiftWithDetails[]>([]);
  const [targetShiftId, setTargetShiftId] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingShifts, setLoadingShifts] = useState(false);
  const [error, setError] = useState('');

  // Determine role title
  const isNurse = currentUser.title?.toLowerCase().includes('nurse') || currentUser.departmentName?.toLowerCase().includes('nurs');

  // Fetch colleagues on mount/open
  useEffect(() => {
    if (isOpen) {
      if (preselectedShiftId) {
        setRequesterShiftId(preselectedShiftId);
      } else if (myShifts.length > 0) {
        setRequesterShiftId(myShifts[0].id);
      }

      const fetchColleagues = async () => {
        try {
          const res = await fetch('/api/employees');
          const data = await res.json();
          if (data.employees) {
            // Filter: Must be an EMPLOYEE, not currentUser, AND same department (Nurses only with Nurses, Doctors with Doctors)
            const peers = data.employees.filter((e: any) => {
              if (e.id === currentUser.id || e.role !== 'EMPLOYEE') return false;
              if (currentUser.departmentId && e.departmentId) {
                return e.departmentId === currentUser.departmentId;
              }
              return true;
            });

            setColleagues(peers);
            if (peers.length > 0) {
              setTargetUserId(peers[0].id);
            }
          }
        } catch (e) {
          console.error('Failed to load colleagues', e);
        }
      };

      fetchColleagues();
      setError('');
    }
  }, [isOpen, preselectedShiftId, myShifts, currentUser.id, currentUser.departmentId]);

  // When target colleague changes, fetch their scheduled shifts
  useEffect(() => {
    if (targetUserId) {
      const fetchTargetShifts = async () => {
        setLoadingShifts(true);
        try {
          const res = await fetch(`/api/shifts?userId=${targetUserId}&status=SCHEDULED`);
          const data = await res.json();
          if (data.shifts) {
            setColleagueShifts(data.shifts);
            if (data.shifts.length > 0) {
              setTargetShiftId(data.shifts[0].id);
            } else {
              setTargetShiftId('');
            }
          }
        } catch (e) {
          console.error('Failed to fetch target shifts', e);
        } finally {
          setLoadingShifts(false);
        }
      };

      fetchTargetShifts();
    }
  }, [targetUserId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!requesterShiftId || !targetUserId || !targetShiftId) {
      setError('Please select both your shift and the colleague shift to propose swap');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterShiftId,
          targetUserId,
          targetShiftId,
          reason: reason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit trade request');
      }

      if (typeof window !== 'undefined' && data.trade) {
        try {
          const list = JSON.parse(localStorage.getItem('shifttracker_cached_trades') || '[]');
          list.unshift(data.trade);
          localStorage.setItem('shifttracker_cached_trades', JSON.stringify(list));
        } catch {}
      }

      onSubmitted();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred while submitting trade request');
    } finally {
      setLoading(false);
    }
  };

  const formatShiftLabel = (s: ShiftWithDetails) => {
    const d = new Date(s.startTime);
    const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const isNight = s.title.includes('Night');
    return `${dateStr} — ${s.title} (${isNight ? '19:00 - 07:00' : '07:00 - 19:00'})`;
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-fade-in" style={{ padding: '24px', maxWidth: '520px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
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
              <Repeat size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                Request Shift Swap
              </h2>
              <p style={{ fontSize: '12px', color: '#64748b' }}>
                Trade your Day/Night shift with an eligible colleague
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

        {/* Policy Alert Banner */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          padding: '10px 14px',
          backgroundColor: '#f8fafc',
          border: '1px solid #cbd5e1',
          borderLeft: '4px solid #0284c7',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#0369a1',
          marginBottom: '18px',
        }}>
          <ShieldCheck size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Staffing Policy:</strong> Qualified colleagues eligible for trade are listed below.
          </div>
        </div>

        {error && (
          <div style={{
            padding: '12px 14px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#dc2626',
            fontSize: '13px',
            marginBottom: '16px',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Step 1: Select My Shift */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" style={{ fontWeight: 600, color: '#1e293b' }}>
              1. Select Your Shift to Give Up
            </label>
            {myShifts.length === 0 ? (
              <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', fontSize: '13px', color: '#64748b' }}>
                You have no scheduled shifts available to trade.
              </div>
            ) : (
              <select
                className="form-select"
                value={requesterShiftId}
                onChange={(e) => setRequesterShiftId(e.target.value)}
                required
                style={{ fontSize: '14px', padding: '10px 12px' }}
              >
                {myShifts.map(s => (
                  <option key={s.id} value={s.id}>
                    {formatShiftLabel(s)}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0 16px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
            }}>
              <ArrowRightLeft size={16} />
            </div>
          </div>

          {/* Step 2: Select Colleague */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" style={{ fontWeight: 600, color: '#1e293b' }}>
              2. Select Colleague ({isNurse ? 'Nurses Only' : 'Doctors Only'})
            </label>
            {colleagues.length === 0 ? (
              <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', fontSize: '13px', color: '#64748b' }}>
                No eligible colleagues available in your department.
              </div>
            ) : (
              <select
                className="form-select"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                required
                style={{ fontSize: '14px', padding: '10px 12px' }}
              >
                {colleagues.map(col => (
                  <option key={col.id} value={col.id}>
                    {col.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Step 3: Select Colleague's Shift */}
          <div className="form-group" style={{ marginBottom: '18px' }}>
            <label className="form-label" style={{ fontWeight: 600, color: '#1e293b' }}>
              3. Select Colleague's Shift You Want to Take
            </label>
            {loadingShifts ? (
              <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', fontSize: '13px', color: '#64748b' }}>
                Loading colleague's shifts...
              </div>
            ) : colleagueShifts.length === 0 ? (
              <div style={{ padding: '12px', backgroundColor: '#fef2f2', borderRadius: '8px', fontSize: '13px', color: '#b91c1c' }}>
                This colleague has no scheduled shifts right now. Please select another colleague.
              </div>
            ) : (
              <select
                className="form-select"
                value={targetShiftId}
                onChange={(e) => setTargetShiftId(e.target.value)}
                required
                style={{ fontSize: '14px', padding: '10px 12px' }}
              >
                {colleagueShifts.map(s => (
                  <option key={s.id} value={s.id}>
                    {formatShiftLabel(s)}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Reason */}
          <div className="form-group" style={{ marginBottom: '22px' }}>
            <label className="form-label" style={{ fontWeight: 600, color: '#1e293b' }}>
              Reason for Request (Optional)
            </label>
            <input
              type="text"
              className="form-input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Clinical exam conflict, personal doctor appointment"
              style={{ fontSize: '14px', padding: '10px 12px' }}
            />
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
              disabled={loading || myShifts.length === 0 || colleagueShifts.length === 0}
              style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}
            >
              <Check size={16} />
              <span>{loading ? 'Submitting...' : 'Send Swap Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
