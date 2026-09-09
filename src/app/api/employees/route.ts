import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession, hashPassword } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const users = await db.users.list();
    const departments = await db.departments.list();
    const shifts = await db.shifts.list();

    const employeesWithMeta = users.map(user => {
      const dept = departments.find(d => d.id === user.departmentId);
      const userShifts = shifts.filter(s => s.userId === user.id);
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        title: user.title,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        hourlyRate: user.hourlyRate,
        departmentId: user.departmentId,
        department: dept,
        shiftsCount: userShifts.length,
        createdAt: user.createdAt,
      };
    });

    return NextResponse.json({ employees: employeesWithMeta });
  } catch (error) {
    console.error('Failed to get employees:', error);
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, password, role, title, phone, hourlyRate, departmentId } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    const existing = await db.users.findByEmail(email);
    if (existing) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    const newUser = await db.users.create({
      name,
      email,
      passwordHash,
      role: role || 'EMPLOYEE',
      title: title || 'Staff Member',
      phone: phone || '+1 (555) 000-0000',
      hourlyRate: hourlyRate ? Number(hourlyRate) : 28.0,
      departmentId: departmentId || 'dept-icu',
      avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150`,
    });

    return NextResponse.json({
      success: true,
      employee: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        title: newUser.title,
        phone: newUser.phone,
        hourlyRate: newUser.hourlyRate,
        departmentId: newUser.departmentId,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create employee:', error);
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 });
  }
}
