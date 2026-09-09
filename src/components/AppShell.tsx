'use client';

import React, { useState } from 'react';
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
  ShieldCheck,
  TrendingUp,
  Search,
  Bell,
  Plus,
  Menu,
  X,
  ChevronDown,
  Building2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { UserSession } from '@/lib/types';
import ShiftModal from './ShiftModal';
import TradeRequestModal from './TradeRequestModal';

interface AppShellProps {
  currentUser: UserSession;
  pendingTradeCount?: number;
  children: React.ReactNode;
  allEmployees?: any[];
  departments?: any[];
  myShifts?: any[];
}

export default function AppShell({
  currentUser,
  pendingTradeCount = 0,
  children,
  allEmployees = [],
  departments = [],
  myShifts = [],
}: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddShiftOpen, setIsAddShiftOpen] = useState(false);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);

  const isAdmin = currentUser.role === 'ADMIN';

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const navCoreItems = isAdmin
    ? [
      { label: 'Overview', href: '/admin/dashboard', icon: LayoutDashboard },
      { label: 'Schedule & Shifts', href: '/admin/shifts', icon: Calendar },
      { label: 'Staff Roster', href: '/admin/employees', icon: Users },
      {
        label: 'Trade Hub',
        href: '/admin/trades',
        icon: Repeat,
        badge: pendingTradeCount > 0 ? `${pendingTradeCount} Pending` : undefined,
        badgeColor: '#b45309',
        badgeBg: '#fef3c7',
      },
    ]
    : [
      { label: 'Overview', href: '/employee/dashboard', icon: LayoutDashboard },
      { label: 'Schedule & Shifts', href: '/employee/calendar', icon: Calendar },
      {
        label: 'Trade Hub',
        href: '/employee/trades',
        icon: Repeat,
        badge: pendingTradeCount > 0 ? `${pendingTradeCount} Pending` : undefined,
        badgeColor: '#0369a1',
        badgeBg: '#e0f2fe',
      },
    ];

  const navManagementItems = [
    { label: 'Settings', href: isAdmin ? '/admin/settings' : '/employee/profile', icon: Settings },
  ];

  const initials = currentUser.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2);

  return (
    <div className="chronos-shell">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="mobile-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* LEFT SIDEBAR (Desktop Fixed / Mobile Drawer) */}
      <aside className={`chronos-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-brand">
          <Link href={isAdmin ? '/admin/dashboard' : '/employee/dashboard'} className="brand-link" onClick={() => setMobileMenuOpen(false)}>
            <div className="brand-logo-box">
              <Clock size={20} color="#ffffff" strokeWidth={2.4} />
            </div>
            <div>
              <div className="brand-title">
                Care<span style={{ color: '#0284c7' }}>Shift</span>
              </div>
              <div className="brand-subtitle">
                Hospital Workforce Suite
              </div>
            </div>
          </Link>
          <button
            className="mobile-close-btn"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close Menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="sidebar-nav-container">
          {/* Group 1: CORE */}
          <div className="nav-group-title">CORE</div>
          <nav className="nav-list">
            {navCoreItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && item.href !== '/employee/dashboard' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                >
                  <div className="nav-item-left">
                    <Icon size={18} className="nav-icon" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className="nav-badge"
                      style={{ color: item.badgeColor, backgroundColor: item.badgeBg }}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Group 2: MANAGEMENT */}
          <div className="nav-group-title" style={{ marginTop: '20px' }}>MANAGEMENT</div>
          <nav className="nav-list">
            {navManagementItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                >
                  <div className="nav-item-left">
                    <Icon size={18} className="nav-icon" />
                    <span>{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* MAIN VIEW AREA (Right of Sidebar) */}
      <div className="chronos-main-wrapper">
        {/* TOP NAVBAR */}
        <header className="chronos-topbar">
          <div className="topbar-left">
            {/* Mobile Hamburger Button */}
            <button
              className="hamburger-btn"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Toggle Navigation Menu"
            >
              <Menu size={22} />
            </button>


          </div>

          <div className="topbar-right">
            {/* Quick Action: Add Shift (Admin) or Propose Swap (Staff) */}
            {isAdmin ? (
              <button
                onClick={() => setIsAddShiftOpen(true)}
                className="btn-topbar-action"
              >
                <Plus size={16} strokeWidth={2.5} />
                <span>Add Shift</span>
              </button>
            ) : (
              <button
                onClick={() => setIsTradeModalOpen(true)}
                className="btn-topbar-action"
              >
                <Repeat size={15} strokeWidth={2.5} />
                <span>Propose Swap</span>
              </button>
            )}

            {/* Notification Bell */}
            <div className="notification-btn" title={`${pendingTradeCount} pending swap items`}>
              <Bell size={18} />
              {pendingTradeCount > 0 && <span className="notification-dot" />}
            </div>

            {/* User Profile Info Chip */}
            <div className="user-profile-chip">
              <div className="user-avatar-circle">
                {initials}
              </div>
              <div className="user-info-text">
                <div className="user-name">{currentUser.name}</div>
                <div className="user-role">
                  {isAdmin ? 'Shift Operations Lead' : (currentUser.departmentName || 'Staff Member')}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="logout-icon-btn"
                title="Sign Out of Shift Tracker"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        {/* Content Workspace */}
        <main className="chronos-workspace">
          {children}
        </main>
      </div>



      {/* Global Add Shift Modal (if Admin triggers it from Topbar) */}
      {isAddShiftOpen && (
        <ShiftModal
          isOpen={isAddShiftOpen}
          onClose={() => setIsAddShiftOpen(false)}
          onSaved={() => {
            setIsAddShiftOpen(false);
            router.refresh();
          }}
          employees={allEmployees}
          departments={departments}
        />
      )}

      {/* Trade Request Modal */}
      {isTradeModalOpen && (
        <TradeRequestModal
          isOpen={isTradeModalOpen}
          onClose={() => setIsTradeModalOpen(false)}
          onSubmitted={() => {
            setIsTradeModalOpen(false);
            router.refresh();
          }}
          currentUser={currentUser}
          myShifts={myShifts}
        />
      )}
    </div>
  );
}
