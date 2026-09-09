'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Calendar,
  Clock,
  Users,
  Repeat,
  LayoutDashboard,
  LogOut,
  Settings,
  User as UserIcon,
  HeartPulse,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { UserSession } from '@/lib/types';

interface NavbarProps {
  currentUser?: UserSession | null;
  pendingTradeCount?: number;
}

export default function Navbar({ currentUser, pendingTradeCount = 0 }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #cbd5e1',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
    }}>
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px' }}>
        {/* Brand Logo */}
        <Link href={currentUser ? (isAdmin ? '/admin/dashboard' : '/employee/dashboard') : '/login'} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '4px',
            backgroundColor: '#0284c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Clock size={20} color="#ffffff" strokeWidth={2.4} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '3px', color: '#0f172a' }}>
              Shift<span style={{ color: '#0284c7' }}>Tracker</span>
            </div>
            <div style={{ fontSize: '10px', color: '#64748b', letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600, marginTop: '-2px' }}>
              Shift Trade Hub
            </div>
          </div>
        </Link>

        {/* Navigation Links */}
        {currentUser ? (
          <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {isAdmin ? (
              <>
                <Link
                  href="/admin/dashboard"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: pathname === '/admin/dashboard' ? '#0369a1' : '#475569',
                    backgroundColor: pathname === '/admin/dashboard' ? '#f1f5f9' : 'transparent',
                    border: pathname === '/admin/dashboard' ? '1px solid #cbd5e1' : '1px solid transparent',
                  }}
                >
                  <LayoutDashboard size={16} /> Admin Dashboard
                </Link>
                <Link
                  href="/admin/shifts"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: pathname.startsWith('/admin/shifts') ? '#0369a1' : '#475569',
                    backgroundColor: pathname.startsWith('/admin/shifts') ? '#f1f5f9' : 'transparent',
                    border: pathname.startsWith('/admin/shifts') ? '1px solid #cbd5e1' : '1px solid transparent',
                  }}
                >
                  <Calendar size={16} /> Shift Management
                </Link>
                <Link
                  href="/admin/employees"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: pathname.startsWith('/admin/employees') ? '#0369a1' : '#475569',
                    backgroundColor: pathname.startsWith('/admin/employees') ? '#f1f5f9' : 'transparent',
                    border: pathname.startsWith('/admin/employees') ? '1px solid #cbd5e1' : '1px solid transparent',
                  }}
                >
                  <Users size={16} /> User Directory
                </Link>
                <Link
                  href="/admin/trades"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: pathname.startsWith('/admin/trades') ? '#0369a1' : '#475569',
                    backgroundColor: pathname.startsWith('/admin/trades') ? '#f1f5f9' : 'transparent',
                    border: pathname.startsWith('/admin/trades') ? '1px solid #cbd5e1' : '1px solid transparent',
                    position: 'relative',
                  }}
                >
                  <Repeat size={16} /> Swap Approvals
                  {pendingTradeCount > 0 && (
                    <span style={{
                      backgroundColor: '#d97706',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: 700,
                      borderRadius: '3px',
                      padding: '1px 5px',
                      marginLeft: '4px',
                    }}>
                      {pendingTradeCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/admin/settings"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: pathname.startsWith('/admin/settings') ? '#0369a1' : '#475569',
                    backgroundColor: pathname.startsWith('/admin/settings') ? '#f1f5f9' : 'transparent',
                    border: pathname.startsWith('/admin/settings') ? '1px solid #cbd5e1' : '1px solid transparent',
                  }}
                >
                  <Settings size={16} /> Settings
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/employee/dashboard"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: pathname === '/employee/dashboard' ? '#0369a1' : '#475569',
                    backgroundColor: pathname === '/employee/dashboard' ? '#f1f5f9' : 'transparent',
                    border: pathname === '/employee/dashboard' ? '1px solid #cbd5e1' : '1px solid transparent',
                  }}
                >
                  <Clock size={16} /> My Shifts
                </Link>
                <Link
                  href="/employee/calendar"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: pathname.startsWith('/employee/calendar') ? '#0369a1' : '#475569',
                    backgroundColor: pathname.startsWith('/employee/calendar') ? '#f1f5f9' : 'transparent',
                    border: pathname.startsWith('/employee/calendar') ? '1px solid #cbd5e1' : '1px solid transparent',
                  }}
                >
                  <Calendar size={16} /> Schedule
                </Link>
                <Link
                  href="/employee/trades"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: pathname.startsWith('/employee/trades') ? '#0369a1' : '#475569',
                    backgroundColor: pathname.startsWith('/employee/trades') ? '#f1f5f9' : 'transparent',
                    border: pathname.startsWith('/employee/trades') ? '1px solid #cbd5e1' : '1px solid transparent',
                  }}
                >
                  <Repeat size={16} /> My Requests
                  {pendingTradeCount > 0 && (
                    <span style={{
                      backgroundColor: '#0284c7',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: 700,
                      borderRadius: '3px',
                      padding: '1px 5px',
                      marginLeft: '4px',
                    }}>
                      {pendingTradeCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/employee/profile"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: pathname.startsWith('/employee/profile') ? '#0369a1' : '#475569',
                    backgroundColor: pathname.startsWith('/employee/profile') ? '#f1f5f9' : 'transparent',
                    border: pathname.startsWith('/employee/profile') ? '1px solid #cbd5e1' : '1px solid transparent',
                  }}
                >
                  <UserIcon size={16} /> Profile
                </Link>
              </>
            )}
          </nav>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
            <Lock size={14} color="#0284c7" />
            <span>Restricted Internal System</span>
          </div>
        )}

        {/* User Profile / Logout */}
        <div>
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                  {currentUser.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '3px',
                    backgroundColor: isAdmin ? '#f1f5f9' : '#f0f9ff',
                    color: isAdmin ? '#0f172a' : '#0369a1',
                    border: '1px solid #cbd5e1',
                  }}>
                    {isAdmin ? 'CLINICAL ADMIN' : (currentUser.departmentName?.toUpperCase() || 'STAFF')}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-secondary btn-sm"
                title="Sign out of Shift Tracker"
                style={{ padding: '6px 10px' }}
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
              Internal Portal Only
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
