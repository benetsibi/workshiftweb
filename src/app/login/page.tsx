'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  HeartPulse,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Clock,
  User,
} from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isTimeout = searchParams?.get('timeout') === '1';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please check your credentials.');
      }

      router.push(data.redirectUrl);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#f1f5f9',
    }}>
      <div className="app-container" style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '36px 20px',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '460px',
          padding: '32px',
          borderRadius: '6px',
          backgroundColor: '#ffffff',
          border: '1px solid #cbd5e1',
          boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.08)',
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: '#0b132b',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px',
              boxShadow: '0 4px 12px rgba(11, 19, 43, 0.2)',
            }}>
              <Clock size={24} color="#60a5fa" strokeWidth={2.5} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
                Shift<span style={{ color: '#0284c7' }}>Tracker</span>
              </h1>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', fontWeight: 500, margin: 0 }}>
              Workforce Shift Management & Scheduling
            </p>
          </div>

          {/* Session Timeout Banner */}
          {isTimeout && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              backgroundColor: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '4px',
              color: '#92400e',
              fontSize: '13px',
              marginBottom: '18px',
            }}>
              <Clock size={16} style={{ flexShrink: 0 }} color="#d97706" />
              <span>Session timed out after 5 minutes of inactivity. Please sign in again.</span>
            </div>
          )}

          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '4px',
              color: '#991b1b',
              fontSize: '13px',
              marginBottom: '18px',
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Staff Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: '38px', fontSize: '14px', borderRadius: '4px' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@hospital.com"
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Password
                </label>
                <span style={{ fontSize: '12px', color: '#0284c7', cursor: 'pointer', fontWeight: 600 }}>Forgot password?</span>
              </div>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  className="form-input"
                  style={{ paddingLeft: '38px', fontSize: '14px', borderRadius: '4px' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-lg"
              disabled={loading}
              style={{
                width: '100%',
                marginBottom: '20px',
                borderRadius: '9999px',
                backgroundColor: '#0b132b',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 20px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(11, 19, 43, 0.25)',
              }}
            >
              {loading ? 'Authenticating...' : 'Sign In to Shift Tracker'}
              <ArrowRight size={16} />
            </button>
          </form>

          <div style={{
            fontSize: '11px',
            color: '#64748b',
            lineHeight: 1.5,
            borderTop: '1px solid #cbd5e1',
            paddingTop: '12px',
            textAlign: 'center',
          }}>
            <p style={{ margin: 0 }}>
              Shift Tracker • Secure Workforce Scheduling Platform
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading login...</div>}>
      <LoginForm />
    </Suspense>
  );
}
