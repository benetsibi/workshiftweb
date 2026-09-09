'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Repeat,
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Calendar,
  AlertCircle,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  MessageSquare,
  Check,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import TradeRequestModal from '@/components/TradeRequestModal';
import { ShiftWithDetails, TradeWithDetails, UserSession } from '@/lib/types';

function TradesHubContent() {
  const searchParams = useSearchParams();
  const preselectedShiftId = searchParams.get('shiftId') || undefined;

  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [trades, setTrades] = useState<TradeWithDetails[]>([]);
  const [myShifts, setMyShifts] = useState<ShiftWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inbound' | 'outbound'>('inbound');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<{ [tradeId: string]: boolean }>({});
  const [statusNotice, setStatusNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Restore saved tab from localStorage if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('shifttracker_trades_tab');
      if (saved && (saved === 'inbound' || saved === 'outbound')) {
        setActiveTab(saved);
      }
    }
  }, []);

  const handleTabChange = (tab: 'inbound' | 'outbound') => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      localStorage.setItem('shifttracker_trades_tab', tab);
    }
  };

  // Auto-open modal if shiftId was provided in query string
  useEffect(() => {
    if (preselectedShiftId) {
      setIsModalOpen(true);
    }
  }, [preselectedShiftId]);

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

  const loadData = async (preferredTab?: 'inbound' | 'outbound') => {
    setLoading(true);
    try {
      const [tradesRes, shiftsRes] = await Promise.all([
        fetch('/api/trades'),
        fetch('/api/shifts'),
      ]);

      const [tradesData, shiftsData] = await Promise.all([
        tradesRes.json(),
        shiftsRes.json(),
      ]);

      let combinedTrades: TradeWithDetails[] = tradesData.trades || [];

      // Merge with localStorage cached trades for serverless cloud persistence
      if (typeof window !== 'undefined') {
        try {
          const cachedRaw = localStorage.getItem('shifttracker_cached_trades');
          if (cachedRaw) {
            const cached: TradeWithDetails[] = JSON.parse(cachedRaw);
            const map = new Map<string, TradeWithDetails>();
            combinedTrades.forEach(t => map.set(t.id, t));
            cached.forEach(t => {
              const existing = map.get(t.id);
              if (!existing || new Date(t.updatedAt || 0) >= new Date(existing.updatedAt || 0)) {
                map.set(t.id, t);
              }
            });
            combinedTrades = Array.from(map.values());
            combinedTrades.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          }
        } catch {}
      }

      // Strictly filter to trades involving the logged-in employee (privacy protection)
      const userOnlyTrades = currentUser
        ? combinedTrades.filter((t: any) => t.targetUserId === currentUser.id || t.requesterId === currentUser.id)
        : combinedTrades;

      setTrades(userOnlyTrades);
      
      // Smart tab selection if not explicitly set
      if (currentUser) {
        const inb = userOnlyTrades.filter((t: any) => t.targetUserId === currentUser.id);
        const outb = userOnlyTrades.filter((t: any) => t.requesterId === currentUser.id);
        
        if (preferredTab) {
          handleTabChange(preferredTab);
        } else if (typeof window !== 'undefined' && !localStorage.getItem('shifttracker_trades_tab')) {
          if (inb.length > 0) {
            handleTabChange('inbound');
          } else if (outb.length > 0) {
            handleTabChange('outbound');
          }
        }
      }

      if (shiftsData.shifts && currentUser) {
        setMyShifts(shiftsData.shifts.filter((s: any) => s.userId === currentUser.id));
      }
    } catch (e) {
      console.error('Failed to load trade data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  const handleTradeAction = async (tradeId: string, action: 'PEER_ACCEPT' | 'PEER_DECLINE' | 'CANCEL') => {
    setActionLoading(prev => ({ ...prev, [tradeId]: true }));
    setStatusNotice(null);

    try {
      const res = await fetch(`/api/trades/${tradeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update trade request');
      }

      if (action === 'PEER_ACCEPT') {
        setStatusNotice({
          type: 'success',
          message: 'Trade accepted! It has been forwarded to the Administrator for final schedule authorization.',
        });
      } else if (action === 'PEER_DECLINE') {
        setStatusNotice({
          type: 'success',
          message: 'Trade offer declined.',
        });
      } else {
        setStatusNotice({
          type: 'success',
          message: 'Trade request cancelled.',
        });
      }
      // Update in localStorage cache as well
      if (typeof window !== 'undefined') {
        try {
          const list: any[] = JSON.parse(localStorage.getItem('shifttracker_cached_trades') || '[]');
          const idx = list.findIndex(t => t.id === tradeId);
          if (idx !== -1) {
            list[idx].status = action === 'PEER_ACCEPT' ? 'PEER_ACCEPTED' : action === 'PEER_DECLINE' ? 'PEER_DECLINED' : 'CANCELLED';
            list[idx].updatedAt = new Date().toISOString();
            localStorage.setItem('shifttracker_cached_trades', JSON.stringify(list));
          }
        } catch {}
      }

      loadData();
    } catch (e: any) {
      setStatusNotice({
        type: 'error',
        message: e.message || 'An error occurred',
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [tradeId]: false }));
    }
  };

  const inboundTrades = trades.filter(t => t.targetUserId === currentUser?.id);
  const outboundTrades = trades.filter(t => t.requesterId === currentUser?.id);
  const pendingInboundCount = inboundTrades.filter(t => t.status === 'PENDING_PEER').length;

  const displayedTrades = activeTab === 'inbound' ? inboundTrades : outboundTrades;

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
    <AppShell currentUser={currentUser} pendingTradeCount={pendingInboundCount}>
      <div style={{ padding: '24px 32px' }}>
        {/* Top Header */}
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
              My Shift Swap Requests
            </h1>
            <p style={{ fontSize: '14px', color: '#64748b' }}>
              Review incoming swap proposals from colleagues, track your sent requests, and view administrative status.
            </p>
          </div>

          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary" style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}>
            <Plus size={16} />
            <span>Request Shift Swap</span>
          </button>
        </div>

        {statusNotice && (
          <div style={{
            padding: '14px 18px',
            backgroundColor: statusNotice.type === 'success' ? '#ecfdf5' : 'var(--danger-bg)',
            border: `1px solid ${statusNotice.type === 'success' ? '#a7f3d0' : 'var(--danger-border)'}`,
            borderRadius: 'var(--radius-md)',
            color: statusNotice.type === 'success' ? '#065f46' : '#991b1b',
            fontSize: '14px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            {statusNotice.type === 'success' ? <CheckCircle2 size={18} color="#059669" /> : <AlertCircle size={18} color="#dc2626" />}
            <span>{statusNotice.message}</span>
          </div>
        )}

        {/* Tab Selection */}
        <div style={{
          display: 'flex',
          backgroundColor: '#f1f5f9',
          borderRadius: 'var(--radius-md)',
          padding: '4px',
          border: '1px solid var(--border-subtle)',
          width: 'fit-content',
          marginBottom: '24px',
        }}>
          <button
            onClick={() => handleTabChange('inbound')}
            style={{
              padding: '8px 18px',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'inbound' ? '#10b981' : 'transparent',
              color: activeTab === 'inbound' ? '#ffffff' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ArrowDownLeft size={15} />
            <span>Incoming Offers ({inboundTrades.length})</span>
            {pendingInboundCount > 0 && (
              <span style={{ backgroundColor: '#ffffff', color: '#064e3b', fontSize: '10px', fontWeight: 800, borderRadius: '8px', padding: '1px 5px' }}>
                {pendingInboundCount} NEW
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabChange('outbound')}
            style={{
              padding: '8px 18px',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'outbound' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'outbound' ? '#ffffff' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ArrowUpRight size={15} />
            <span>My Requests ({outboundTrades.length})</span>
          </button>

          </div>

        {/* Trades List */}
        {loading ? (
          <div className="glass-panel" style={{ padding: '60px 24px', textAlign: 'center', color: '#64748b' }}>
            <div style={{
              width: '32px',
              height: '32px',
              border: '3px solid #e2e8f0',
              borderTopColor: '#0284c7',
              borderRadius: '50%',
              margin: '0 auto 16px',
              animation: 'spin 0.8s linear infinite',
            }} />
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>Loading trade requests...</p>
          </div>
        ) : displayedTrades.length === 0 ? (
          <div className="glass-panel" style={{ padding: '60px 24px', textAlign: 'center' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              color: '#059669',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}>
              <Repeat size={28} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              {activeTab === 'inbound' ? 'No incoming shift trade proposals' : 'You have not submitted any shift trade requests'}
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 20px' }}>
              {activeTab === 'inbound'
                ? 'When a colleague asks to swap their shift with one of your scheduled rotations, their offer will appear here.'
                : 'Need to adjust your hours? Propose a mutual swap with a colleague in 3 quick steps.'}
            </p>
            <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
              <Plus size={16} /> Propose Shift Swap
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {displayedTrades.map(trade => {
              const isTargetUser = trade.targetUserId === currentUser?.id;
              const isRequester = trade.requesterId === currentUser?.id;
              const isPendingMyResponse = isTargetUser && trade.status === 'PENDING_PEER';
              const isLoading = actionLoading[trade.id] || false;

              let statusBadgeClass = 'badge-pending';
              let statusLabel = trade.status.replace('_', ' ');

              if (trade.status === 'ADMIN_APPROVED') {
                statusBadgeClass = 'badge-approved';
                statusLabel = 'Approved & Swapped';
              } else if (trade.status === 'PEER_ACCEPTED') {
                statusBadgeClass = 'badge-pending';
                statusLabel = 'Colleague Accepted — Waiting on Admin';
              } else if (trade.status === 'PEER_DECLINED') {
                statusBadgeClass = 'badge-denied';
                statusLabel = 'Colleague Declined';
              } else if (trade.status === 'ADMIN_DENIED') {
                statusBadgeClass = 'badge-denied';
                statusLabel = 'Admin Denied';
              } else if (trade.status === 'CANCELLED') {
                statusBadgeClass = 'badge-cancelled';
                statusLabel = 'Cancelled';
              }

              return (
                <div
                  key={trade.id}
                  className="glass-panel"
                  style={{
                    padding: '24px',
                    borderLeft: isPendingMyResponse ? '4px solid #10b981' : '1px solid var(--border-subtle)',
                  }}
                >
                  {/* Status header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className={`badge ${statusBadgeClass}`} style={{ fontSize: '11px' }}>
                        {statusLabel}
                      </span>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        Requested {new Date(trade.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {isPendingMyResponse && (
                      <span style={{ fontSize: '12px', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} /> Action Required by You
                      </span>
                    )}
                  </div>

                  {/* Side-by-Side Trade Proposal */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto 1fr',
                    alignItems: 'center',
                    gap: '20px',
                    backgroundColor: '#f8fafc',
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    marginBottom: '16px',
                  }}>
                    {/* Requester Shift */}
                    <div>
                      <div style={{ fontSize: '11px', color: isRequester ? 'var(--primary)' : '#059669', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.04em' }}>
                        {isRequester ? 'YOUR OFFERED SHIFT' : `${trade.requester.name.toUpperCase()}'S OFFERED SHIFT`}
                      </div>

                      <div style={{ backgroundColor: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)', borderLeft: `4px solid ${trade.requesterShift.department?.color || '#4f46e5'}` }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {trade.requesterShift.title}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {formatShiftDateTime(trade.requesterShift.startTime)}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          {trade.requesterShift.department?.name ? `${trade.requesterShift.department.name} • ` : ''}{trade.requesterShift.location}
                        </div>
                      </div>
                    </div>

                    {/* Middle Swap Glyph */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'var(--primary)' }}>
                      <ArrowRightLeft size={22} />
                      <span style={{ fontSize: '10px', fontWeight: 700 }}>SWAP</span>
                    </div>

                    {/* Target Shift */}
                    <div>
                      <div style={{ fontSize: '11px', color: isTargetUser ? '#0284c7' : 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.04em' }}>
                        {isTargetUser
                          ? `YOUR SHIFT (REQUESTED BY ${trade.requester.name.toUpperCase()})`
                          : `${trade.targetUser.name.toUpperCase()}'S SHIFT (DESIRED)`}
                      </div>

                      <div style={{ backgroundColor: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)', borderLeft: `4px solid ${trade.targetShift.department?.color || '#10b981'}` }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {trade.targetShift.title}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {formatShiftDateTime(trade.targetShift.startTime)}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          {trade.targetShift.department?.name ? `${trade.targetShift.department.name} • ` : ''}{trade.targetShift.location}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stated Reason */}
                  {trade.reason && (
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <MessageSquare size={15} color="var(--primary)" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <div>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Reason: </span>
                        <span>{trade.reason}</span>
                      </div>
                    </div>
                  )}

                  {/* Admin notes if present */}
                  {trade.adminNotes && (
                    <div style={{ fontSize: '13px', color: '#b45309', marginBottom: '16px' }}>
                      <strong>Operations Note:</strong> {trade.adminNotes}
                    </div>
                  )}

                  {/* Actions for Inbound Receiver */}
                  {isPendingMyResponse && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: '12px',
                      paddingTop: '16px',
                      borderTop: '1px solid var(--border-subtle)',
                    }}>
                      <button
                        onClick={() => handleTradeAction(trade.id, 'PEER_DECLINE')}
                        className="btn btn-secondary btn-sm"
                        disabled={isLoading}
                        style={{ color: '#dc2626' }}
                      >
                        <XCircle size={15} /> Decline Offer
                      </button>
                      <button
                        onClick={() => handleTradeAction(trade.id, 'PEER_ACCEPT')}
                        className="btn btn-success btn-sm"
                        disabled={isLoading}
                      >
                        <Check size={15} /> {isLoading ? 'Submitting...' : 'Accept Swap Offer'}
                      </button>
                    </div>
                  )}

                  {/* Actions for Outbound Requester to Cancel */}
                  {isRequester && trade.status === 'PENDING_PEER' && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      paddingTop: '14px',
                      borderTop: '1px solid var(--border-subtle)',
                    }}>
                      <button
                        onClick={() => handleTradeAction(trade.id, 'CANCEL')}
                        className="btn btn-secondary btn-sm"
                        disabled={isLoading}
                        style={{ fontSize: '12px' }}
                      >
                        Cancel Trade Request
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Trade Request Modal */}
        {currentUser && (
          <TradeRequestModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSubmitted={() => {
              loadData('outbound');
              setStatusNotice({
                type: 'success',
                message: 'Your shift trade request was successfully submitted to your colleague!',
              });
            }}
            currentUser={currentUser}
            myShifts={myShifts}
            preselectedShiftId={preselectedShiftId}
          />
        )}
      </div>
    </AppShell>
  );
}

export default function EmployeeTradesPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading shift trades...</div>}>
      <TradesHubContent />
    </Suspense>
  );
}
