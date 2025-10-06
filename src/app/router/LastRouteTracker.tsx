import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Tracks last non-auth, non-compliance route for post-login restoration.
export function LastRouteTracker() {
  const loc = useLocation();
  useEffect(() => {
    const pathname = loc.pathname;
    if (/^\/(login|register|forgot-password|reset-password|verify-email|compliance)/.test(pathname)) return;
    localStorage.setItem('last:route', pathname + loc.search);
  }, [loc]);
  return null;
}