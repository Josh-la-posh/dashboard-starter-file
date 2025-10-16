import { useAuthStore } from '../../../store/auth';

export default function ComplianceStatusPage() {
  const status = useAuthStore(s=>s.complianceStatus);
  if (!status) return null;
  const copy: Record<string,{title:string;description:string;color:string}> = {
    pending: { title: 'Compliance In Progress', description: 'You have started your compliance application. Please continue filling out the required information.', color: 'bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300'},
    under_review: { title: 'Compliance Under Review', description: 'Your compliance submission has been received and is currently being reviewed. You will be notified once a decision is made.', color: 'bg-blue-50 border-blue-300 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'},
    approved: { title: 'Compliance Approved', description: 'Your compliance has been approved. You now have full access to all features.', color: 'bg-green-50 border-green-300 text-green-800 dark:bg-green-900/20 dark:text-green-300'},
    rejected: { title: 'Compliance Rejected', description: 'Your compliance submission was rejected. Please restart the process and ensure all details & documents are correct.', color: 'bg-red-50 border-red-300 text-red-800 dark:bg-red-900/20 dark:text-red-300'},
  };
  const c = copy[status];
  return (
    <div className='p-8 max-w-2xl mx-auto'>
      <div className={`border rounded-md p-6 text-sm ${c.color}`}> 
        <h2 className='text-lg font-semibold mb-2'>{c.title}</h2>
        <p className='text-xs md:text-sm opacity-90'>{c.description}</p>
        {status === 'rejected' && (
          <div className='mt-4'>
            <a href='/compliance?restart=1' className='text-xs font-medium text-primary underline'>Restart compliance process</a>
          </div>
        )}
      </div>
    </div>
  );
}
