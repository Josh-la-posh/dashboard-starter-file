import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import { getLastRoute } from "../../lib/lastRoute";

export default function RootRedirect() {
  const token = useAuthStore((s) => s.accessToken);
  const next = new URLSearchParams(window.location.search).get("next");
  if (token) {
    const complianceProgress = localStorage.getItem('compliance:progress');
    if (complianceProgress && complianceProgress !== '6') {
      return <Navigate to="/compliance" replace />;
    }
    const last = getLastRoute();
    return <Navigate to={next || last || "/dashboard"} replace />;
  }
  return <Navigate to={next || "/login"} replace />;
}
