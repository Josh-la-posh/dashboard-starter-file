import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import { getLastRoute } from "../../lib/lastRoute";

export default function RootRedirect() {
  const token = useAuthStore((s) => s.accessToken);
  const complianceStatus = useAuthStore(s=>s.complianceStatus);
  const next = new URLSearchParams(window.location.search).get("next");
  if (token) {
    // Decide landing route based on compliance status rules
    if (!complianceStatus) {
      // Has not started compliance at all
      return <Navigate to="/compliance" replace />;
    }
    if (complianceStatus === 'pending' || complianceStatus === 'rejected') {
      return <Navigate to="/compliance" replace />;
    }
    if (complianceStatus === 'under_review') {
      return <Navigate to="/compliance" replace />; // will show status page
    }
    const last = getLastRoute();
    return <Navigate to={next || last || "/dashboard"} replace />;
  }
  return <Navigate to={next || "/login"} replace />;
}
