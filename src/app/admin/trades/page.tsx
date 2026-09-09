'use client';

import React, { useState, useEffect } from 'react';
import {
  Repeat,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRightLeft,
  Calendar,
  User,
  ShieldCheck,
  AlertCircle,
  MessageSquare,
  FileCheck,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { TradeWithDetails, UserSession } from '@/lib/types';

export default function AdminTradesPage() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [trades, setTrades] = useState<TradeWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [adminNoteInput, setAdminNoteInput] = useState<{ [tradeId: string]: string }>({});
  const [actionLoading, setActionLoading] = useState<{ [tradeId: string]: boolean }>({});
  const [successMessage, setSuccessMessage] = useState('');

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

  const loadTrades = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/trades');
      const data = await res.json();
      if (data.trades) {
        setTrades(data.trades);
      }
    } catch (e) {
      console.error('Failed to load trade requests', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrades();
  }, []);

  const handleAdminAction = async (tradeId: string, action: 'ADMIN_APPROVE' | 'ADMIN_DENY') => {
    setActionLoading(prev => ({ ...prev, [tradeId]: true }));
    setSuccessMessage('');

    try {
      const res = await fetch(`/api/trades/${tradeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          adminNotes: adminNoteInput[tradeId] || (action === 'ADMIN_APPROVE' ? 'Approved by Admin' : 'Denied by Admin'),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update trade request');
      }

      setSuccessMessage(
        action === 'ADMIN_APPROVE'
          ? 'Shift trade approved! Assigned employees have been automatically swapped on both shifts.'
          : 'Shift trade was denied.'
      );

      loadTrades();
    } catch (e: any) {
      alert(e.message || 'Error occurred while updating trade');
    } finally {
      setActionLoading(prev => ({ ...prev, [tradeId]: false }));
    }
  };

  const pendingAdminTrades = trades.filter(t => t.status === 'PEER_ACCEPTED');
  const displayedTrades = activeTab === 'pending' ? pendingAdminTrades : trades;

  const formatShiftDateTime = (iso: string) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  if (!currentUser) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', color: '#64748b' }}>
        Loading trades...
      </div>
    );
  }

  return (
    <AppShell currentUser={currentUser} pendingTradeCount={pendingAdminTrades.length}>
      <div style={{ padding: '24px 32px' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge badge-admin">
                <ShieldCheck size={12} /> Shift Governance & Compliance
              </span>
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Shift Trade Approvals Queue
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Review peer-agreed shift trades, inspect coverage impacts, and ratify roster changes.
            </p>
          </div>

          {/* Tab buttons */}
          <div style={{
            display: 'flex',
            backgroundColor: '#f1f5f9',
            borderRadius: 'var(--radius-md)',
            padding: '4px',
            border: '1px solid var(--border-subtle)',
          }}>
            <button
              onClick={() => setActiveTab('pending')}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeTab === 'pending' ? '#f59e0b' : 'transparent',
                color: activeTab === 'pending' ? '#ffffff' : '#64748b',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>Awaiting Approval ({pendingAdminTrades.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('all')}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeTab === 'all' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'all' ? '#ffffff' : '#64748b',
                transition: 'all 0.2s',
              }}
            >
              All Trades History ({trades.length})
            </button>
          </div>
        </div>

        {successMessage && (
          <div style={{
            padding: '14px 18px',
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: 'var(--radius-md)',
            color: '#065f46',
            fontSize: '14px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <CheckCircle2 size={18} color="#059669" />
            <span>{successMessage}</span>
          </div>
        )}

        {displayedTrades.length === 0 ? (
          <div className="glass-panel" style={{ padding: '60px 24px', textAlign: 'center' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'rgba(79, 70, 229, 0.1)',
              color: 'var(--primary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}>
              <FileCheck size={28} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              {activeTab === 'pending' ? 'No pending trades requiring authorization' : 'No shift trade history found'}
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto' }}>
              {activeTab === 'pending'
                ? 'When two team members agree to swap their shifts, their request will appear here for your final approval.'
                : 'Trade requests will appear here once team members initiate shift swaps.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {displayedTrades.map(trade => {
              const isPendingAdmin = trade.status === 'PEER_ACCEPTED';
              const isLoading = actionLoading[trade.id] || false;

              let statusBadgeClass = 'badge-pending';
              if (trade.status === 'ADMIN_APPROVED') statusBadgeClass = 'badge-approved';
              if (trade.status === 'ADMIN_DENIED' || trade.status === 'PEER_DECLINED' || trade.status === 'CANCELLED') statusBadgeClass = 'badge-denied';

              return (
                <div
                  key={trade.id}
                  className="glass-panel"
                  style={{
                    padding: '24px',
                    borderLeft: isPendingAdmin ? '4px solid #f59e0b' : '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className={`badge ${statusBadgeClass}`} style={{ fontSize: '11px' }}>
                        {trade.status.replace('_', ' ')}
                      </span>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        Submitted {new Date(trade.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {isPendingAdmin && (
                      <span style={{ fontSize: '12px', color: '#d97706', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} /> Ready for Admin Ratification
                      </span>
                    )}
                  </div>

                  {/* Side-by-Side Swap Comparison */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto 1fr',
                    alignItems: 'center',
                    gap: '20px',
                    backgroundColor: '#f8fafc',
                    padding: '18px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    marginBottom: '16px',
                  }}>
                    {/* Left: Requester & Their Shift */}
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.05em' }}>
                        Requester (Offers Shift)
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: 'rgba(79, 70, 229, 0.12)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px' }}>
                          {trade.requester.name[0]}
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{trade.requester.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{trade.requester.title}</div>
                        </div>
                      </div>

                      <div style={{ backgroundColor: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)', borderLeft: `4px solid ${trade.requesterShift.department?.color || '#4f46e5'}` }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{trade.requesterShift.title}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {formatShiftDateTime(trade.requesterShift.startTime)}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          {trade.requesterShift.department?.name} • {trade.requesterShift.location}
                        </div>
                      </div>
                    </div>

                    {/* Middle: Swap Indicator */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#f59e0b' }}>
                      <ArrowRightLeft size={24} />
                      <span style={{ fontSize: '10px', fontWeight: 700 }}>SWAP</span>
                    </div>

                    {/* Right: Target & Their Shift */}
                    <div>
                      <div style={{ fontSize: '11px', color: '#059669', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.05em' }}>
                        Colleague (Takes Shift)
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px' }}>
                          {trade.targetUser.name[0]}
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{trade.targetUser.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{trade.targetUser.title}</div>
                        </div>
                      </div>

                      <div style={{ backgroundColor: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)', borderLeft: `4px solid ${trade.targetShift.department?.color || '#10b981'}` }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{trade.targetShift.title}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {formatShiftDateTime(trade.targetShift.startTime)}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          {trade.targetShift.department?.name} • {trade.targetShift.location}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stated Reason */}
                  {trade.reason && (
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <MessageSquare size={15} color="var(--primary)" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <div>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Employee Reason: </span>
                        <span>{trade.reason}</span>
                      </div>
                    </div>
                  )}

                  {/* If Admin note exists */}
                  {trade.adminNotes && (
                    <div style={{ fontSize: '13px', color: '#b45309', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ShieldCheck size={15} />
                      <span><strong>Admin Note:</strong> {trade.adminNotes}</span>
                    </div>
                  )}

                  {/* Actions for Pending Trades */}
                  {isPendingAdmin && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                      paddingTop: '16px',
                      borderTop: '1px solid var(--border-subtle)',
                    }}>
                      <div style={{ flex: 1, minWidth: '220px' }}>
                        <input
                          type="text"
                          placeholder="Admin approval / denial note (optional)..."
                          className="form-input"
                          style={{ fontSize: '13px', padding: '8px 12px' }}
                          value={adminNoteInput[trade.id] || ''}
                          onChange={(e) => setAdminNoteInput({ ...adminNoteInput, [trade.id]: e.target.value })}
                        />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                          onClick={() => handleAdminAction(trade.id, 'ADMIN_DENY')}
                          className="btn btn-danger btn-sm"
                          disabled={isLoading}
                        >
                          <XCircle size={15} />
                          <span>Deny Trade</span>
                        </button>
                        <button
                          onClick={() => handleAdminAction(trade.id, 'ADMIN_APPROVE')}
                          className="btn btn-success btn-sm"
                          disabled={isLoading}
                        >
                          <CheckCircle2 size={15} />
                          <span>{isLoading ? 'Processing...' : 'Approve & Swap Shifts'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
