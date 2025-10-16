import { useAuthStore } from '../../store/auth';

const copy: Record<string,{title:string;description:string;classes:string}> = {
  pending: { title: 'Compliance In Progress', description: 'Continue your compliance application to unlock full features.', classes: 'bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300' },
  under_review: { title: 'Compliance Under Review', description: 'Your submission is being reviewed. Some features may be limited.', classes: 'bg-blue-50 border-blue-300 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' },
  rejected: { title: 'Compliance Rejected', description: 'Your submission was rejected. Please restart the process.', classes: 'bg-red-50 border-red-300 text-red-800 dark:bg-red-900/20 dark:text-red-300' },
  approved: { title: 'Compliance Approved', description: 'Your account is fully verified. Enjoy all features.', classes: 'bg-green-50 border-green-300 text-green-800 dark:bg-green-900/20 dark:text-green-300' },
};

export default function ComplianceBanner() {
  const status = useAuthStore(s=>s.complianceStatus);
  if (!status) return null;
  const c = copy[status];
  return (
    <div className={`mb-6 border rounded p-4 text-xs md:text-sm ${c.classes}`}> 
      <p className='font-medium'>{c.title}</p>
      <p className='opacity-90'>{c.description} {status==='rejected' && (<a className='underline ml-1' href='/compliance?restart=1'>Restart now</a>)}</p>
      {status==='pending' && <a className='underline text-primary mt-2 inline-block' href='/compliance'>Continue compliance</a>}
    </div>
  );
}
