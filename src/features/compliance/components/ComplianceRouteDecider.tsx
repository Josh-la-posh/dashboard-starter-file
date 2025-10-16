import CompliancePage from '../pages/CompliancePage';
import ComplianceStatusPage from '../pages/ComplianceStatusPage';
import UnderReviewPage from '../pages/UnderReviewPage';
import { useAuthStore } from '../../../store/auth';
import { useComplianceDraftStore } from '../../../store/complianceDraft';
import { useEffect } from 'react';

export default function ComplianceRouteDecider() {
  const status = useAuthStore(s=>s.complianceStatus);
  const resetDraft = useComplianceDraftStore(s=>s.reset);

  // Handle restart when rejected
  useEffect(()=>{
    if (status === 'rejected') {
      const url = new URL(window.location.href);
      if (url.searchParams.get('restart') === '1') {
        resetDraft();
      }
    }
  }, [status, resetDraft]);

  if (status === 'under_review') {
    return <UnderReviewPage />;
  }
  if (status === 'approved' || status === 'rejected' || status === 'pending') {
    return <ComplianceStatusPage />;
  }
  return <CompliancePage />;
}
