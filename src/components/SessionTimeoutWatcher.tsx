'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export default function SessionTimeoutWatcher() {
  const router = useRouter();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogoutDueToTimeout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout error on timeout:', e);
    }
    window.location.href = '/login?timeout=1';
  };

  const resetTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(handleLogoutDueToTimeout, TIMEOUT_MS);
  };

  useEffect(() => {
    resetTimer();

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    
    // Throttle event listener
    let throttleTimeout: NodeJS.Timeout | null = null;
    const handleActivity = () => {
      if (!throttleTimeout) {
        throttleTimeout = setTimeout(() => {
          resetTimer();
          throttleTimeout = null;
        }, 1000);
      }
    };

    activityEvents.forEach(evt => {
      window.addEventListener(evt, handleActivity, { passive: true });
    });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (throttleTimeout) clearTimeout(throttleTimeout);
      activityEvents.forEach(evt => {
        window.removeEventListener(evt, handleActivity);
      });
    };
  }, []);

  return null;
}
