'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building,
  Clock,
  ShieldCheck,
  Bell,
  Save,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  Sun,
  Moon,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { HospitalSettings, UserSession } from '@/lib/types';

export default function AdminSettingsPage() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [hospitalName, setHospitalName] = useState('Workforce Operations');
  const [unitName, setUnitName] = useState('Operations Unit');
  const [dayShiftStart, setDayShiftStart] = useState('07:00');
  const [dayShiftEnd, setDayShiftEnd] = useState('19:00');
  const [nightShiftStart, setNightShiftStart] = useState('19:00');
  const [nightShiftEnd, setNightShiftEnd] = useState('07:00');
  const [autoApproval, setAutoApproval] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.user.role === 'ADMIN') {
          setCurrentUser(data.user);
        } else {
          window.location.href = '/login';
        }
      });

    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.settings) {
          setHospitalName(data.settings.hospitalName || 'Workforce Operations');
          setUnitName(data.settings.unitName || 'Operations Unit');
          setDayShiftStart(data.settings.dayShiftStart || '07:00');
          setDayShiftEnd(data.settings.dayShiftEnd || '19:00');
          setNightShiftStart(data.settings.nightShiftStart || '19:00');
          setNightShiftEnd(data.settings.nightShiftEnd || '07:00');
          setAutoApproval(Boolean(data.settings.autoApproval));
          setEmailAlerts(Boolean(data.settings.emailAlerts));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotice(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospitalName,
          unitName,
          dayShiftStart,
          dayShiftEnd,
          nightShiftStart,
          nightShiftEnd,
          autoApproval,
          emailAlerts,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update settings');

      setNotice({ message: 'Settings saved successfully.', type: 'success' });
    } catch (err: any) {
      setNotice({ message: err.message || 'Error saving settings', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (!currentUser) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', color: '#64748b' }}>
        Loading settings...
      </div>
    );
  }

  return (
    <AppShell currentUser={currentUser}>
      <div style={{ padding: '24px 32px', maxWidth: '960px' }}>
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
              backgroundColor: '#e0f2fe',
              color: '#0369a1',
            }}>
              Facility Administration
            </span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Organization & Shift Settings
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            Configure organization parameters, Day & Night shift operational hours, and staff trade policies.
          </p>
        </div>

        {notice && (
          <div style={{
            padding: '14px 18px',
            backgroundColor: notice.type === 'success' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${notice.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            borderRadius: '8px',
            color: notice.type === 'success' ? '#166534' : '#991b1b',
            fontSize: '14px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            {notice.type === 'success' ? <CheckCircle size={18} color="#16a34a" /> : <AlertCircle size={18} color="#dc2626" />}
            <span>{notice.message}</span>
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Section 1: Facility Information */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building size={18} />
              </div>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Facility & Ward Information</h2>
                <p style={{ fontSize: '12px', color: '#64748b' }}>Identification displayed across staff schedules and reports</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Organization / Company Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Unit / Department Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 2: Shift Hours Configuration */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={18} />
              </div>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Standard Shift Hours (12-Hour Rotations)</h2>
                <p style={{ fontSize: '12px', color: '#64748b' }}>Designated hours for standard Day Shift and Night Shift</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {/* Day Shift */}
              <div style={{ padding: '16px', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#0369a1', marginBottom: '12px' }}>
                  <Sun size={18} /> Day Shift Hours
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#475569', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Start</label>
                    <input
                      type="time"
                      className="form-input"
                      value={dayShiftStart}
                      onChange={(e) => setDayShiftStart(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#475569', fontWeight: 600, display: 'block', marginBottom: '4px' }}>End</label>
                    <input
                      type="time"
                      className="form-input"
                      value={dayShiftEnd}
                      onChange={(e) => setDayShiftEnd(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Night Shift */}
              <div style={{ padding: '16px', backgroundColor: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#4338ca', marginBottom: '12px' }}>
                  <Moon size={18} /> Night Shift Hours
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#475569', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Start</label>
                    <input
                      type="time"
                      className="form-input"
                      value={nightShiftStart}
                      onChange={(e) => setNightShiftStart(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#475569', fontWeight: 600, display: 'block', marginBottom: '4px' }}>End</label>
                    <input
                      type="time"
                      className="form-input"
                      value={nightShiftEnd}
                      onChange={(e) => setNightShiftEnd(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Shift Trading & Clinical Rules */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={18} />
              </div>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Shift Trading & Policy Rules</h2>
                <p style={{ fontSize: '12px', color: '#64748b' }}>Staff compliance rules for peer shift swaps</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                    Role Parity Policy (Nurses trade with Nurses only)
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Ensures clinical skill continuity by restricting trades to matching departments.
                  </div>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#16a34a', backgroundColor: '#dcfce7', padding: '3px 10px', borderRadius: '12px' }}>
                  Enforced
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                    Administrative Approval Required
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Require Head Nurse / Clinical Director sign-off before schedule updates take effect.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={!autoApproval}
                  onChange={(e) => setAutoApproval(!e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                    Email & System Notifications
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Send automated roster alerts whenever a trade request is submitted or finalized.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
              style={{ backgroundColor: '#0284c7', borderColor: '#0284c7', padding: '10px 24px' }}
            >
              <Save size={16} />
              <span>{saving ? 'Saving Settings...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
