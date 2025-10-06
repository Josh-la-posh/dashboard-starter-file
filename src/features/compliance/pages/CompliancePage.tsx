import { useAuthStore } from '../../../store/auth';
import { useCompliance } from '../api';
import FullPageLoader from '../../../components/ui/full-page-loader';
import { ArrowRight, ArrowLeft, Send } from 'lucide-react';
import type { Merchant } from '../../../types/auth';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '../../../utils/cn';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { DropdownSelect } from '../../../components/ui/dropdown-select';
import { useComplianceDraftStore, syncProgressToLegacyStorage } from '../../../store/complianceDraft';

export default function CompliancePage() {
  // Assuming first merchant for now (login selects one later maybe)
  // For now attempt to read persisted merchants list from auth store's user (if extended) or localStorage fallback
  const user = useAuthStore(s => s.user as unknown as { merchants?: Merchant[] } | null);
  const merchantCode = user?.merchants?.[0]?.merchantCode || safelyFirstMerchantCode();
  const { data, isLoading, isError } = useCompliance(merchantCode);
  const draft = useComplianceDraftStore(s=>s.draft);
  const updateDraft = useComplianceDraftStore(s=>s.update);
  const setStepIndex = useComplianceDraftStore(s=>s.setStepIndex);
  const markStepComplete = useComplianceDraftStore(s=>s.markStepComplete);
  const markSubmitted = useComplianceDraftStore(s=>s.markSubmitted);
  const [step, setStep] = useState(draft.stepIndex || 0);
  const step1Schema = z.object({
    legalBusinessName: z.string().trim().min(1,'Required'),
    tradingName: z.string().trim().min(1,'Required'),
    businessDescription: z.string().trim().min(100,'Minimum 100 characters'),
    businessCategory: z.string().min(1,'Required'),
    projectedSalesVolume: z.string().min(1,'Required'),
    website: z.string().url('Enter a valid URL').optional().or(z.literal('')), // optional
  });
  type Step1Values = z.infer<typeof step1Schema>;

  const form = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    mode: 'onChange',
    defaultValues: {
      legalBusinessName: draft.legalBusinessName || '',
      tradingName: draft.tradingName || '',
      businessDescription: draft.businessDescription || '',
      businessCategory: draft.businessCategory || '',
      projectedSalesVolume: draft.projectedSalesVolume || '',
      website: draft.website || '',
    }
  });

  const values = form.watch();

  const [accountNumber, setAccountNumber] = useState(draft.accountNumber || '');
  const [supportEmail, setSupportEmail] = useState(draft.supportEmail || '');
  const [rcNumber, setRcNumber] = useState(draft.rcNumber || '');

  // Sync step state changes to store
  useEffect(()=>{ setStepIndex(step); }, [step, setStepIndex]);

  // Autosave Step1 values (debounced)
  useEffect(()=>{
    const handle = setTimeout(()=>{
      updateDraft({
        legalBusinessName: values.legalBusinessName,
        tradingName: values.tradingName,
        businessDescription: values.businessDescription,
        businessCategory: values.businessCategory,
        projectedSalesVolume: values.projectedSalesVolume,
        website: values.website,
      });
    }, 400);
    return ()=>clearTimeout(handle);
  }, [values, updateDraft]);

  // Autosave financial step fields
  useEffect(()=>{
    if (step !== 1) return; // only when on financial step
    const handle = setTimeout(()=>{
      updateDraft({ accountNumber, supportEmail, rcNumber });
    }, 400);
    return ()=>clearTimeout(handle);
  }, [accountNumber, supportEmail, rcNumber, updateDraft, step]);

  // Reflect draft progress (legacy compatibility)
  useEffect(()=>{ syncProgressToLegacyStorage(draft.progress); }, [draft.progress]);

  if (isLoading) return <FullPageLoader />;
  if (isError) return <div className='p-6 text-sm text-destructive'>Failed to load compliance data.</div>;

  const complete = data?.progress === 6;

  const businessCategories = [
    { value: 'retail', label: 'Retail' },
    { value: 'technology', label: 'Technology' },
    { value: 'hospitality', label: 'Hospitality' },
    { value: 'services', label: 'Professional Services' },
  ];
  const projectedVolumes = [
    { value: '0-100k', label: '0 — 100k' },
    { value: '100k-500k', label: '100k — 500k' },
    { value: '500k-1m', label: '500k — 1M' },
    { value: '1m+', label: '1M+' },
  ];

  const descriptionLength = values.businessDescription?.trim().length || 0;
  const descriptionTooShort = descriptionLength > 0 && descriptionLength < 100;
  const step1Valid = form.formState.isValid;

  const totalSteps = 4; // keep in sync with steps array length
  const steps = [
    {
      title: 'Business Info',
      content: (
        <form className='space-y-6' onSubmit={e=>e.preventDefault()}>
          <Input
            label='What is your legal business name?'
            value={values.legalBusinessName}
            onChange={e=>form.setValue('legalBusinessName', e.target.value, { shouldValidate:true, shouldDirty:true })}
            state={form.formState.errors.legalBusinessName ? 'error':'default'}
            helper={form.formState.errors.legalBusinessName?.message}
          />
          <Input
            label='Trading name'
            value={values.tradingName}
            onChange={e=>form.setValue('tradingName', e.target.value, { shouldValidate:true, shouldDirty:true })}
            state={form.formState.errors.tradingName ? 'error':'default'}
            helper={form.formState.errors.tradingName?.message}
          />
          <div className='space-y-2'>
            <label className='text-sm font-medium flex items-center justify-between'>
              <span>Business description <span className='text-muted-foreground'>(min 100 chars)</span></span>
              <span className={cn('text-xs', descriptionTooShort ? 'text-red-600':'text-muted-foreground')}>{descriptionLength}/100</span>
            </label>
            <textarea
              className={cn('w-full rounded-lg border bg-card p-3 text-sm resize-vertical focus:outline-none focus:ring-4 focus:ring-ring', form.formState.errors.businessDescription ? 'border-red-500' : 'border-input')}
              rows={5}
              value={values.businessDescription}
              onChange={e=>form.setValue('businessDescription', e.target.value, { shouldValidate:true, shouldDirty:true })}
              placeholder='Describe your business model, products/services, target customers...'
            />
            {form.formState.errors.businessDescription && (
              <p className='text-xs text-red-600'>{form.formState.errors.businessDescription.message}</p>
            )}
          </div>
          <div className='space-y-6'>
            <div>
              <DropdownSelect
                label='Business category'
                options={businessCategories}
                value={values.businessCategory}
                onChange={(val)=>form.setValue('businessCategory', String(val), { shouldValidate:true, shouldDirty:true })}
                state={form.formState.errors.businessCategory ? 'error':'default'}
                placeholder='Select'
              />
              {form.formState.errors.businessCategory && <p className='text-xs text-red-600 mt-1'>{form.formState.errors.businessCategory.message}</p>}
            </div>
            <div>
              <DropdownSelect
                label='Projected sales volume'
                options={projectedVolumes}
                value={values.projectedSalesVolume}
                onChange={(val)=>form.setValue('projectedSalesVolume', String(val), { shouldValidate:true, shouldDirty:true })}
                state={form.formState.errors.projectedSalesVolume ? 'error':'default'}
                placeholder='Select'
              />
              {form.formState.errors.projectedSalesVolume && <p className='text-xs text-red-600 mt-1'>{form.formState.errors.projectedSalesVolume.message}</p>}
            </div>
            <Input
              label='Website'
              value={values.website}
              onChange={e=>form.setValue('website', e.target.value, { shouldValidate:true, shouldDirty:true })}
              state={form.formState.errors.website ? 'error':'default'}
              helper={form.formState.errors.website?.message}
              placeholder='https://example.com'
            />
          </div>
        </form>
      )
    },
    {
      title: 'Financial Info',
      content: (
        <div className='grid gap-4 md:grid-cols-2'>
          <Input label='RC Number' value={rcNumber} onChange={e=>setRcNumber(e.target.value)} />
          <Input label='Account Number' value={accountNumber} onChange={e=>setAccountNumber(e.target.value)} />
          <Input label='Support Email' type='email' value={supportEmail} onChange={e=>setSupportEmail(e.target.value)} className='md:col-span-2' />
        </div>
      )
    },
    {
      title: 'Documents',
      content: (
        <div className='text-sm text-muted-foreground space-y-3'>
          <p>Document uploads placeholder. (e.g., certificate of incorporation, director IDs).</p>
          <div className='rounded border border-dashed p-4 text-xs'>Upload widgets go here.</div>
        </div>
      )
    },
    {
      title: 'Review & Submit',
      content: (
        <div className='space-y-4 text-sm'>
          <p className='text-muted-foreground'>Review entered information. Submitting will mark compliance as complete (mock).</p>
          <ul className='text-xs list-disc pl-5 space-y-1'>
            <li>Legal Name: {values.legalBusinessName || '—'}</li>
            <li>Trading Name: {values.tradingName || '—'}</li>
            <li>Category: {values.businessCategory || '—'}</li>
            <li>Projected Volume: {values.projectedSalesVolume || '—'}</li>
            <li>Website: {values.website || '—'}</li>
            <li>RC Number: {rcNumber || '—'}</li>
            <li>Account Number: {accountNumber || '—'}</li>
            <li>Support Email: {supportEmail || '—'}</li>
          </ul>
        </div>
      )
    }
  ];

  const onSubmit = () => {
    // In real implementation: send mutation then refetch compliance & persist to backend
    markSubmitted();
    syncProgressToLegacyStorage(6);
  };

  const merchantName = user?.merchants?.[0]?.merchantName || 'there';

  return (
    <div className='space-y-10'>
      {/* Top title bar as per screenshot */}
      <div className='pt-2'>
        <h2 className='text-xl font-semibold'>Activate your account</h2>
        <div className='h-px bg-border mt-3' />
      </div>

      {complete && (
        <div className='rounded border border-green-600/40 bg-green-50 dark:bg-green-900/10 p-4 text-sm text-green-700 dark:text-green-300'>You are fully onboarded.</div>
      )}

      {!complete && (
        <div className='grid grid-cols-12 gap-8'>
          {/* Left sticky step badge */}
            <div className='col-span-12 md:col-span-2'>
              <div className='md:sticky md:top-20'>
                <span className='inline-block bg-amber-400 text-black text-xs font-medium px-3 py-1 rounded'>Step {step+1} of {steps.length}</span>
              </div>
            </div>
            {/* Main content */}
            <div className='col-span-12 md:col-span-8 md:col-start-3 flex flex-col items-center text-center'>
              <div className='space-y-3 max-w-lg mb-10'>
                <h3 className='text-lg md:text-2xl font-semibold'>Hi {merchantName}, let's setup your account real quick</h3>
                <p className='text-xs md:text-sm text-muted-foreground'>As a regulated financial services company, we would need to verify your identification and business registration information.</p>
              </div>
              <div className='w-full max-w-lg space-y-8 text-left'>
                {steps[step].content}
                <div className='flex justify-between pt-2'>
                  <Button variant='outline' disabled={step===0} onClick={()=>setStep(s=>Math.max(0,s-1))}><ArrowLeft className='h-4 w-4 mr-1'/>Back</Button>
                  {step < steps.length-1 ? (
                    <Button disabled={step===0 && !step1Valid} onClick={()=>{
                      if (step===0) {
                        form.trigger();
                        if (!form.formState.isValid) return;
                      }
                      // Mark current step complete & increment progress if new
                      markStepComplete(step, totalSteps);
                      setStep(s=>Math.min(steps.length-1,s+1));
                    }}>Next<ArrowRight className='h-4 w-4 ml-1'/></Button>
                  ) : (
                    <Button variant='primary' onClick={onSubmit}><Send className='h-4 w-4 mr-1'/>Submit</Button>
                  )}
                </div>
              </div>
            </div>
        </div>
      )}
    </div>
  );
}

function safelyFirstMerchantCode(): string | undefined {
  try {
    const raw = localStorage.getItem('auth');
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    const merchants = parsed?.state?.user?.merchants || [];
    return merchants[0]?.merchantCode;
  } catch {
    return undefined;
  }
}
