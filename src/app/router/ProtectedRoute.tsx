import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import { saveIntendedRoute } from "../../lib/redirect";
import FullPageLoader from "../../components/ui/full-page-loader";
import { useEffect, useRef } from 'react';
import { useCompliance } from '../../features/compliance/api';
import type { Merchant } from '../../types/auth';

export default function ProtectedRoute({ roles }: { roles?: string[] }) {
  const { accessToken, user, hydrating, isTokenExpired } = useAuthStore();
  const loc = useLocation();

  // Hooks first
  const validSession = accessToken && !isTokenExpired();
  const userWithMerchants = user as unknown as { merchants?: Merchant[] } | null;
  const merchantCode = userWithMerchants?.merchants?.[0]?.merchantCode;
  const isComplianceRoute = loc.pathname.startsWith('/compliance');
  const { data: complianceData, isLoading: loadingCompliance } = useCompliance(!isComplianceRoute ? merchantCode : undefined);
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    if (complianceData) {
      localStorage.setItem('compliance:progress', String(complianceData.progress));
    }
  }, [complianceData]);

  // Now do conditional UI
  if (hydrating) return <FullPageLoader />;

  if (!validSession) {
    saveIntendedRoute(loc.pathname + loc.search);
    return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />;
  }

  if (roles && user?.role && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (merchantCode && loadingCompliance) return <FullPageLoader />;

  if (merchantCode && complianceData && complianceData.progress !== 8 && loc.pathname !== '/compliance') {
    if (!hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
      return <Navigate to="/compliance" replace />;
    }
  }

  if (loc.pathname === '/compliance' && complianceData?.progress === 8) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export function UnauthOnly() {
  const { accessToken, hydrating, isTokenExpired } = useAuthStore();
  const next = new URLSearchParams(window.location.search).get("next");

  if (hydrating) return <FullPageLoader />;

  const validSession = accessToken && !isTokenExpired();

  if (validSession) {
    return <Navigate to={next || "/dashboard"} replace />;
  }
  return <Outlet />;
}
