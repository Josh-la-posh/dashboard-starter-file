import { useAuthStore } from '../../../store/auth';

export default function UnderReviewPage() {
  const status = useAuthStore(s=>s.complianceStatus);
  if (status !== 'under_review') return null;
  return (
    <div className='p-8 max-w-2xl mx-auto'>
      <div className='border rounded-md p-6 text-sm bg-blue-50 border-blue-300 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'>
        <h2 className='text-lg font-semibold mb-2'>Compliance Under Review</h2>
        <p className='text-xs md:text-sm opacity-90'>Your compliance submission has been received and is currently being reviewed. You will be notified once a decision is made. This typically takes 1–2 business days.</p>
        <div className='mt-4 text-[11px] space-y-1'>
          <p><span className='font-medium'>Next Steps:</span> We are verifying your documents and business details.</p>
          <p><span className='font-medium'>Need to update something?</span> Contact support; we can reopen your application if required.</p>
        </div>
      </div>
    </div>
  );
}
