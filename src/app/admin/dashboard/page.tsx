import React from 'react';
import { redirect } from 'next/navigation';
import AppShell from '@/components/AppShell';
import ChronosPlannerView from '@/components/ChronosPlannerView';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminDashboardPage() {
  const session = await getSession();

  // Protect Admin route
  if (!session) {
    redirect('/login');
  }
  if (session.role !== 'ADMIN') {
    redirect('/employee/dashboard');
  }

  // Fetch hospital data from PostgreSQL
  const allShifts = await db.shifts.list();
  const allUsers = await db.users.list();
  const departments = await db.departments.list();
  const pendingTrades = await db.trades.list({ pendingAdmin: true });

  return (
    <AppShell
      currentUser={session}
      pendingTradeCount={pendingTrades.length}
      allEmployees={allUsers}
      departments={departments}
    >
      <ChronosPlannerView
        initialShifts={allShifts}
        allEmployees={allUsers}
        departments={departments}
        pendingTradeCount={pendingTrades.length}
        isAdmin={true}
      />
    </AppShell>
  );
}
