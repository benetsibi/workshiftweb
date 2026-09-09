'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Mail,
  Phone,
  Building,
  ShieldCheck,
  UserCheck,
  X,
  Check,
  Search,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { Department, UserSession } from '@/lib/types';

export default function AdminEmployeesPage() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add Employee Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'EMPLOYEE' | 'ADMIN'>('EMPLOYEE');
  const [title, setTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [hourlyRate, setHourlyRate] = useState('32.00');
  const [departmentId, setDepartmentId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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

  const loadData = async () => {
    setLoading(true);
    try {
      const [empRes, deptRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/departments'),
      ]);
      const [empData, deptData] = await Promise.all([
        empRes.json(),
        deptRes.json(),
      ]);

      if (empData.employees) setEmployees(empData.employees);
      if (deptData.departments) {
        setDepartments(deptData.departments);
        if (deptData.departments.length > 0 && !departmentId) {
          setDepartmentId(deptData.departments[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to load employees', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          title,
          phone,
          hourlyRate: Number(hourlyRate),
          departmentId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add employee');
      }

      setIsModalOpen(false);
      setName('');
      setEmail('');
      setPassword('');
      setTitle('');
      setPhone('');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEmployee = async (id: string, empName: string) => {
    if (!confirm(`Are you sure you want to remove ${empName} from ShiftTracker? This will also remove their scheduled shifts.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setEmployees(employees.filter(e => e.id !== id));
      } else {
        alert(data.error || 'Failed to delete');
      }
    } catch (e) {
      console.error('Failed to delete employee', e);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    if (search) {
      const q = search.toLowerCase();
      return (
        emp.name.toLowerCase().includes(q) ||
        emp.email.toLowerCase().includes(q) ||
        (emp.title && emp.title.toLowerCase().includes(q)) ||
        (emp.department?.name && emp.department.name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  if (!currentUser) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', color: '#64748b' }}>
        Loading roster...
      </div>
    );
  }

  return (
    <AppShell currentUser={currentUser} allEmployees={employees} departments={departments}>
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
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Staff & User Directory
            </h1>
            <p style={{ fontSize: '14px', color: '#64748b' }}>
              Manage employees, credentials, and departmental roles.
            </p>
          </div>

          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary" style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}>
            <Plus size={16} />
            <span>Add New Staff</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search team by name, role, email, or department..."
              className="form-input"
              style={{ paddingLeft: '36px', fontSize: '13px', padding: '8px 12px 8px 36px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
            {filteredEmployees.length} registered team members
          </div>
        </div>

        {/* Employee Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '20px' }}>
          {filteredEmployees.map(emp => {
            const isAdmin = emp.role === 'ADMIN';

            return (
              <div key={emp.id} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', borderRadius: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '4px',
                      backgroundColor: isAdmin ? '#0f172a' : '#0284c7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '14px',
                    }}>
                      {emp.name[0]}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                        {emp.name}
                      </h3>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
                        {emp.title || 'Clinical Staff'}
                      </div>
                    </div>
                  </div>

                  <span className={`badge ${isAdmin ? 'badge-admin' : 'badge-employee'}`} style={{ fontSize: '10px' }}>
                    {isAdmin ? <ShieldCheck size={11} /> : <UserCheck size={11} />}
                    {emp.role}
                  </span>
                </div>

                {/* Details list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155' }}>
                    <Mail size={14} color="#64748b" />
                    <span>{emp.email}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155' }}>
                    <Phone size={14} color="#64748b" />
                    <span>{emp.phone || 'No phone recorded'}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155' }}>
                    <Building size={14} color="#64748b" />
                    <span>{emp.department?.name || 'General Staff'}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#0369a1', fontWeight: 600 }}>
                    <ShieldCheck size={14} />
                    <span>Inpatient Unit 3B Staff</span>
                  </div>
                </div>

                {/* Footer Strip */}
                <div style={{
                  paddingTop: '16px',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <span style={{ fontSize: '12px', color: '#818cf8', fontWeight: 600 }}>
                    {emp.shiftsCount} scheduled shifts
                  </span>

                  {currentUser?.id !== emp.id && (
                    <button
                      onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '4px 8px', color: '#f87171' }}
                      title="Remove employee"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Employee Modal */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content animate-fade-in" style={{ padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(99, 102, 241, 0.2)',
                    color: '#818cf8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Users size={18} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>
                      Add New Team Member
                    </h2>
                    <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                      Register staff member with credentials and department
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '6px', borderRadius: '50%' }}
                >
                  <X size={18} />
                </button>
              </div>

              {error && (
                <div style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--danger-bg)',
                  border: '1px solid var(--danger-border)',
                  borderRadius: 'var(--radius-md)',
                  color: '#fca5a5',
                  fontSize: '13px',
                  marginBottom: '16px',
                }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleAddEmployee}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Dr. Robert Vance"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="robert@shifttracker.com"
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      className="form-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Access Role</label>
                    <select
                      className="form-select"
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                    >
                      <option value="EMPLOYEE">Employee (Shift Portal)</option>
                      <option value="ADMIN">Administrator (Full Access)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Job Title</label>
                    <input
                      type="text"
                      className="form-input"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Staff Nurse, Charge Physician"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <select
                      className="form-select"
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                    >
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="text"
                    className="form-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="btn btn-secondary"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    <Check size={16} />
                    {submitting ? 'Creating...' : 'Create Team Member'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
