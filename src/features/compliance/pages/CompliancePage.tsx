import { useAuthStore } from '../../../store/auth';
import { useCompliance, useSaveCompliance, putCompliance, startVerification } from '../api';
import { ArrowRight, ArrowLeft, Send, Loader2 } from 'lucide-react';
import type { Merchant } from '../../../types/auth';
import {
  useMerchantSelectionStore,
  ensureMerchantSelected,
} from '../../../store/merchantSelection';
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '../../../utils/cn';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { DropdownSelect } from '../../../components/ui/dropdown-select';
import {
  useComplianceDraftStore,
  syncProgressToLegacyStorage,
} from '../../../store/complianceDraft';

export default function CompliancePage() {
  const user = useAuthStore(
    (s) => s.user as unknown as { merchants?: Merchant[] } | null
  );
  const selectedMerchantCode = useMerchantSelectionStore(
    (s) => s.selectedMerchantCode
  );
  const merchants = useMerchantSelectionStore((s) => s.merchants);

  useEffect(() => {
    ensureMerchantSelected();
  }, []);
  const merchantCode =
    selectedMerchantCode ||
    user?.merchants?.[0]?.merchantCode ||
    safelyFirstMerchantCode();

  const { data } = useCompliance(merchantCode);
  const saveMutation = useSaveCompliance(merchantCode || '', data);

  const draft = useComplianceDraftStore((s) => s.draft);
  const updateDraft = useComplianceDraftStore((s) => s.update);
  const setStepIndex = useComplianceDraftStore((s) => s.setStepIndex);
  const markStepComplete = useComplianceDraftStore((s) => s.markStepComplete);
  const markSubmitted = useComplianceDraftStore((s) => s.markSubmitted);

  const [step, setStep] = useState(draft.stepIndex || 0);
  const [nextLoading, setNextLoading] = useState(false);

  // ---------------- Step 1 form schema ----------------
  const step1Schema = z.object({
    legalBusinessName: z.string().trim().min(1, 'Required'),
    tradingName: z.string().trim().min(1, 'Required'),
    businessDescription: z.string().trim().min(100, 'Minimum 100 characters'),
    businessCategory: z.string().min(1, 'Required'),
    projectedSalesVolume: z.string().min(1, 'Required'),
    website: z
      .string()
      .url('Enter a valid URL')
      .optional()
      .or(z.literal('')),
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
    },
  });

  const values = form.watch();
  const userEditedStep1Ref = useRef(false);
  useEffect(() => {
    const subscription = form.watch((_v, { name, type }) => {
      if (type === 'change' && name) userEditedStep1Ref.current = true;
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // ---------------- Local state for later steps ----------------
  // Step 2
  const [rcNumber, setRcNumber] = useState(draft.rcNumber || '');
  const [tin, setTin] = useState(draft.tin || '');

  // Step 3
  const [memoDoc, setMemoDoc] = useState(
    draft.memorandum_and_articles || ''
  );
  const [certDoc, setCertDoc] = useState(
    draft.certificate_of_incorporation || ''
  );
  const [statusReportDoc, setStatusReportDoc] = useState(
    draft.status_report || ''
  );

  // Step 4
  const [repFirstName, setRepFirstName] = useState(draft.firstName || '');
  const [repLastName, setRepLastName] = useState(draft.lastName || '');
  const [repDob, setRepDob] = useState(draft.dob || '');
  const [repNationality, setRepNationality] = useState(
    draft.nationality || ''
  );
  const [repRole, setRepRole] = useState(draft.role || '');
  const [repOccupation, setRepOccupation] = useState(draft.occupation || '');
  const [repMobile, setRepMobile] = useState(draft.mobile || '');
  const [repAddress, setRepAddress] = useState(draft.residentialAddress || '');
  const [repPercentOwnership, setRepPercentOwnership] = useState(
    draft.percentOfBusiness?.toString() || ''
  );
  const [repBvn, setRepBvn] = useState(draft.bvn || '');
  const [repIdentificationType, setRepIdentificationType] = useState(
    draft.identificationType || ''
  );
  const [repIdentityNumber, setRepIdentityNumber] = useState(
    draft.identityNumber || ''
  );
  const [editingOwnerIndex, setEditingOwnerIndex] = useState<number | null>(
    null
  );

  // Step 6
  const [contactEmail, setContactEmail] = useState(draft.contactEmail || '');
  const [supportEmail, setSupportEmail] = useState(draft.supportEmail || '');
  const [disputeEmail, setDisputeEmail] = useState(draft.disputeEmail || '');

  // Keep step index in store
  useEffect(() => {
    setStepIndex(step);
  }, [step, setStepIndex]);

  // ------------ Step 1 server snapshot + form reset ------------
  const step1OriginalRef = useRef<Step1Values | null>(null);

  useEffect(() => {
    if (data?.businessInfo) {
      const serverVals: Step1Values = {
        legalBusinessName: data.businessInfo.legalBusinessName || '',
        tradingName: data.businessInfo.tradingName || '',
        businessDescription: data.businessInfo.businessDescription || '',
        businessCategory: data.businessInfo.ownershipType || '',
        projectedSalesVolume: data.businessInfo.projectedSalesVolume || '',
        website: data.businessInfo.website || '',
      };
      step1OriginalRef.current = serverVals;
      form.reset(serverVals, { keepDirty: false, keepTouched: false });
      userEditedStep1Ref.current = false;
    }
  }, [data?.id, data?.businessInfo, form]);


  // ---------------- Draft autosaves (local only) ----------------
  // step 1
  useEffect(() => {
    if (step !== 0) return;
    const handle = setTimeout(() => {
      updateDraft({
        legalBusinessName: values.legalBusinessName,
        tradingName: values.tradingName,
        businessDescription: values.businessDescription,
        businessCategory: values.businessCategory,
        projectedSalesVolume: values.projectedSalesVolume,
        website: values.website,
      });
    }, 500);
    return () => clearTimeout(handle);
  }, [values, updateDraft, step]);

  // step 2
  useEffect(() => {
    if (step !== 1) return;
    const handle = setTimeout(() => {
      updateDraft({ rcNumber, tin });
    }, 400);
    return () => clearTimeout(handle);
  }, [rcNumber, tin, updateDraft, step]);

  // step 3
  useEffect(() => {
    if (step !== 2) return;
    const handle = setTimeout(() => {
      updateDraft({
        memorandum_and_articles: memoDoc || undefined,
        certificate_of_incorporation: certDoc || undefined,
        status_report: statusReportDoc || undefined,
      });
    }, 400);
    return () => clearTimeout(handle);
  }, [step, memoDoc, certDoc, statusReportDoc, updateDraft]);

  // step 4
  useEffect(() => {
    if (step !== 3) return;
    const handle = setTimeout(() => {
      updateDraft({
        firstName: repFirstName || '',
        lastName: repLastName || '',
        dob: repDob || '',
        nationality: repNationality || '',
        role: repRole || '',
        occupation: repOccupation || '',
        mobile: repMobile || '',
        residentialAddress: repAddress || '',
        percentOfBusiness: repPercentOwnership
          ? Number(repPercentOwnership)
          : null,
        bvn: repBvn || '',
        identificationType: repIdentificationType || '',
        identityNumber: repIdentityNumber || '',
      });
    }, 400);
    return () => clearTimeout(handle);
  }, [
    step,
    repFirstName,
    repLastName,
    repDob,
    repNationality,
    repRole,
    repOccupation,
    repMobile,
    repAddress,
    repPercentOwnership,
    repBvn,
    repIdentificationType,
    repIdentityNumber,
    updateDraft,
  ]);

  // step 6
  useEffect(() => {
    if (step !== 5) return;
    const handle = setTimeout(() => {
      updateDraft({
        contactEmail: contactEmail.trim(),
        supportEmail: supportEmail.trim(),
        disputeEmail: disputeEmail.trim(),
      });
    }, 400);
    return () => clearTimeout(handle);
  }, [step, contactEmail, supportEmail, disputeEmail, updateDraft]);

  // reflect progress (legacy)
  useEffect(() => {
    syncProgressToLegacyStorage(draft.progress);
  }, [draft.progress]);

  // When server progress arrives, move user to the next form to fill:
  // progress N => show step index N (so targetProgress = step+1)
  useEffect(() => {
    if (data?.progress != null && data.progress < 7) {
      if (step !== data.progress) setStep(data.progress);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.progress]);

  // Avoid early return so hooks below aren't considered conditional; show loader in render instead.

  const complete = data?.progress === 8;

  // --------------- Helpers ---------------

  // File to base64 helper (must be before any conditional returns to avoid hook ordering issues)
  const handleFile = useCallback((file: File, setter: (v: string) => void) => {
    const allowed = ['image/jpeg','image/png','image/jpg','application/pdf'];
    if (!file || !allowed.includes(file.type)) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = typeof reader.result === 'string' ? reader.result : '';
      setter(base64);
    };
    reader.readAsDataURL(file);
  }, []);

  // Convert a data URL base64 string back into a File for binary FormData upload
  const dataUrlToFile = useCallback((dataUrl: string, name: string): File | null => {
    if (!dataUrl || !dataUrl.startsWith('data:')) return null;
    const [meta, b64] = dataUrl.split(',');
    if (!b64) return null;
    const match = /data:(.*?);base64/.exec(meta);
    const mime = match ? match[1] : 'application/octet-stream';
    try {
      const binary = atob(b64);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: mime });
      // Attempt to infer extension from mime
      const ext = mime === 'application/pdf' ? 'pdf' : mime.startsWith('image/') ? mime.split('/')[1] : 'bin';
      return new File([blob], name.endsWith('.'+ext) ? name : `${name}.${ext}`, { type: mime });
    } catch {
      return null;
    }
  }, []);

  // File to base64 helper

  // ------------------- Options & UI helpers -------------------
  const ownershipTypes = [
    { value: 'sole_proprietorship', label: 'Sole Proprietorship' },
    { value: 'limited_liability_company', label: 'Limited Liability Company' },
    { value: 'public_liability_compacy', label: 'Public Liability Company' },
    { value: 'ngo', label: 'NGO' },
    { value: 'government', label: 'Government' },
    { value: 'partnership', label: 'Partnership' },
    { value: 'religious_organization', label: 'Religious Organization' },
    { value: 'others', label: 'Others' },
  ];
  const projectedVolumes = [
    { value: '0-100k', label: '0 — 100k' },
    { value: '100k-500k', label: '100k — 500k' },
    { value: '500k-1m', label: '500k — 1M' },
    { value: '1m+', label: '1M+' },
  ];
  const descriptionLength = values.businessDescription?.trim().length || 0;
  const descriptionTooShort =
    descriptionLength > 0 && descriptionLength < 100;
  const step1Valid = form.formState.isValid;

  const totalSteps = 8;
  const merchantName =
    merchants.find((m) => m.merchantCode === selectedMerchantCode)
      ?.merchantName ||
    merchants[0]?.merchantName ||
    'there';

  // ---------------------- Step 4 validation helpers ----------------------
  const isAdult = useMemo(() => {
    if (!repDob) return false;
    const dobDate = new Date(repDob);
    if (isNaN(dobDate.getTime())) return false;
    const today = new Date();
    let age = today.getFullYear() - dobDate.getFullYear();
    const m = today.getMonth() - dobDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) age--;
    // Assumption: requirement "greater than 18" interpreted as >= 18 years old.
    return age >= 18;
  }, [repDob]);
  const repStepValid = useMemo(() => {
    const allFilled = [
      repFirstName,
      repLastName,
      repDob,
      repNationality,
      repRole,
      repOccupation,
      repMobile,
      repAddress,
      repPercentOwnership,
      repBvn,
      repIdentificationType,
      repIdentityNumber,
    ].every((v) => typeof v === 'string' && v.trim() !== '');
    // Ownership percentage must be a number >= 0 (assuming) and not empty
    const percentOk = repPercentOwnership.trim() !== '' && !isNaN(Number(repPercentOwnership));
    return allFilled && percentOk && isAdult;
  }, [
    repFirstName,
    repLastName,
    repDob,
    repNationality,
    repRole,
    repOccupation,
    repMobile,
    repAddress,
    repPercentOwnership,
    repBvn,
    repIdentificationType,
    repIdentityNumber,
    isAdult,
  ]);

  // ---------------------- NEXT (per step) ----------------------
  const onNext = async () => {
    const targetProgress = step + 1; // step index => progress number
    const sp = data?.progress;
    const networkSteps = [0, 1, 2, 4, 5, 6];
    const willNetwork = networkSteps.includes(step);
    if (willNetwork) setNextLoading(true);
    try {

    // STEP 1 (POST first time; else PUT only if changed)
    if (step === 0) {
      await form.trigger();
      if (!form.formState.isValid) return;
      const fd = new FormData();
      fd.append('legalBusinessName', values.legalBusinessName);
      fd.append('tradingName', values.tradingName);
      fd.append('businessDescription', values.businessDescription);
      fd.append('projectedSalesVolume', values.projectedSalesVolume);
      fd.append('ownershipType', values.businessCategory);
      fd.append('progress', String(targetProgress));
      if (values.website) fd.append('website', values.website);
      await saveMutation.mutateAsync(fd);

      // Reset reference snapshot for future equality checks (even though we always PUT now)
      step1OriginalRef.current = {
        legalBusinessName: values.legalBusinessName,
        tradingName: values.tradingName,
        businessDescription: values.businessDescription,
        businessCategory: values.businessCategory,
        projectedSalesVolume: values.projectedSalesVolume,
        website: values.website || '',
      };
      form.reset(step1OriginalRef.current, { keepDirty: false, keepTouched: true });
      userEditedStep1Ref.current = false;

      markStepComplete(step, totalSteps);
      setStep((s) => Math.min(steps.length - 1, s + 1));
      return;
    }

    // STEP 2: registration info (PUT always, include progress rule)
    if (step === 1) {
      const fd = new FormData();
      fd.append('rcNumber', rcNumber);
      // Per requirement: send identityNumber instead of tin in Form 2 request body, via explicit PUT
      fd.append('identityNumber', tin);
      if ((sp ?? 0) < targetProgress) fd.append('progress', String(targetProgress));
      await putCompliance(merchantCode || '', fd); // force PUT regardless of existing.id state
      markStepComplete(step, totalSteps);
      setStep((s) => Math.min(steps.length - 1, s + 1));
      return;
    }

    // STEP 3: documents
    if (step === 2) {
      const fd = new FormData();
      // Convert stored base64 strings to File objects for binary upload
      const memoFile = memoDoc ? dataUrlToFile(memoDoc, 'memorandum_of_association') : null;
      const certFile = certDoc ? dataUrlToFile(certDoc, 'certificate_of_incorporation') : null;
      const statusFile = statusReportDoc ? dataUrlToFile(statusReportDoc, 'status_report') : null;
      if (memoFile) fd.append('memorandum_of_association', memoFile);
      if (certFile) fd.append('certificate_of_incorporation', certFile);
      if (statusFile) fd.append('status_report', statusFile);
      if ((sp ?? 0) < targetProgress) fd.append('progress', String(targetProgress));
      // Force PUT per requirement
      await putCompliance(merchantCode || '', fd);
      markStepComplete(step, totalSteps);
      setStep((s) => Math.min(steps.length - 1, s + 1));
      return;
    }

    // STEP 4: representative capture (single entry form)
    if (step === 3) {
      const minFilled = repFirstName && repLastName;
      // Update owners array locally (add or edit) before sending full array
      let updatedOwners = draft.owners;
      if (minFilled) {
        if (editingOwnerIndex !== null) {
          const copy = [...draft.owners];
            copy[editingOwnerIndex] = {
              ...copy[editingOwnerIndex],
              firstName: repFirstName,
              lastName: repLastName,
              mobile: repMobile || '',
              verificationNumber: repIdentityNumber || '',
              occupation: repOccupation || '',
              percent_of_business: repPercentOwnership ? Number(repPercentOwnership) : 0,
              address: repAddress || '',
              verificationType: repIdentificationType || '',
              dob: repDob || '',
              nationality: repNationality || '',
              role: repRole || '',
              bvn: repBvn || '',
            };
          updatedOwners = copy;
          updateDraft({ owners: updatedOwners });
          setEditingOwnerIndex(null);
        } else {
          updatedOwners = [
            ...draft.owners,
            {
              firstName: repFirstName,
              lastName: repLastName,
              mobile: repMobile || '',
              verificationNumber: repIdentityNumber || '',
              occupation: repOccupation || '',
              percent_of_business: repPercentOwnership ? Number(repPercentOwnership) : 0,
              address: repAddress || '',
              verificationType: repIdentificationType || '',
              dob: repDob || '',
              nationality: repNationality || '',
              role: repRole || '',
              bvn: repBvn || '',
            },
          ];
          updateDraft({ owners: updatedOwners });
        }
      }
      // No network request on Form 4; just proceed to summary
      markStepComplete(step, totalSteps);
      setStep((s) => Math.min(steps.length - 1, s + 1));
      return;
    }

    // STEP 5: summary — send all owners (including role & bvn) in single request
    if (step === 4) {
      const fd = new FormData();
      draft.owners.forEach((o, idx) => {
        fd.append(`owners[${idx}].firstName`, o.firstName);
        fd.append(`owners[${idx}].lastName`, o.lastName);
        fd.append(`owners[${idx}].mobile`, o.mobile);
        fd.append(`owners[${idx}].verificationNumber`, o.verificationNumber);
        fd.append(`owners[${idx}].occupation`, o.occupation);
        fd.append(`owners[${idx}].percent_of_business`, String(o.percent_of_business));
        fd.append(`owners[${idx}].address`, o.address);
        fd.append(`owners[${idx}].verificationType`, o.verificationType);
        fd.append(`owners[${idx}].dob`, o.dob);
        fd.append(`owners[${idx}].nationality`, o.nationality);
        if (o.role) fd.append(`owners[${idx}].role`, o.role);
        if (o.bvn) fd.append(`owners[${idx}].bvn`, o.bvn);
      });
      if ((sp ?? 0) < targetProgress) fd.append('progress', String(targetProgress));
      // Always send on Form 5 to persist owners
      await saveMutation.mutateAsync(fd);
      markStepComplete(step, totalSteps);
      setStep((s) => Math.min(steps.length - 1, s + 1));
      return;
    }

    // STEP 6: emails
    if (step === 5) {
      const emails = [contactEmail, supportEmail, disputeEmail];
      const valid = emails.every((e) => /.+@.+\..+/.test(e));
      if (!valid) return;
      const fd = new FormData();
      // Per requirement: Form 6 PUT body contactEmail, disputeEmail, supportEmail, progress
      fd.append('contactEmail', contactEmail);
      fd.append('disputeEmail', disputeEmail);
      fd.append('supportEmail', supportEmail);
      fd.append('progress', String(targetProgress)); // always include progress for explicit contract
      await putCompliance(merchantCode || '', fd); // force PUT
      markStepComplete(step, totalSteps);
      setStep((s) => Math.min(steps.length - 1, s + 1));
      return;
    }

    // STEP 7: Review (we still move forward; the actual submission happens in onSubmit)
    if (step === 6) {
      // Sync progress only; review screen shows aggregated data
      const fd = new FormData();
      if ((sp ?? 0) < targetProgress) fd.append('progress', String(targetProgress));
      await saveMutation.mutateAsync(fd);
      markStepComplete(step, totalSteps);
      setStep((s) => Math.min(steps.length - 1, s + 1));
      return;
    }
    } finally {
      if (willNetwork) setNextLoading(false);
    }
  };

  const setComplianceStatus = useAuthStore(s=>s.setComplianceStatus);
  const onSubmit = async () => {
    try {
      if (!merchantCode) return;
      // Step 1: start verification
      const data = await startVerification(merchantCode);
      if (data?.status === 'under_review') {
        setComplianceStatus('under_review');
      }
      // Step 2: set progress to 7 explicitly via PUT /compliance
      const fd = new FormData();
      fd.append('progress', '7');
      await putCompliance(merchantCode, fd);
      markSubmitted();
      syncProgressToLegacyStorage(7);
      setStep(steps.findIndex((s) => s.title === 'Submission Successful'));
    } catch (e) {
      console.error('final submission flow failed', e);
      // Fallback: attempt to set progress=7 directly so user isn't blocked
      try {
        const fd = new FormData();
        fd.append('progress', '7');
        await saveMutation.mutateAsync(fd);
        markSubmitted();
        syncProgressToLegacyStorage(7);
        setStep(steps.findIndex((s) => s.title === 'Submission Successful'));
      } catch { /* fallback also failed; leave user on review step */ }
    }
  };

  // -------------------- Steps UI content --------------------
  const steps = [
    {
      title: 'Business Info',
      content: (
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <Input
            label="What is your legal business name?"
            value={values.legalBusinessName}
            onChange={(e) =>
              form.setValue('legalBusinessName', e.target.value, {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
            state={
              form.formState.errors.legalBusinessName ? 'error' : 'default'
            }
            helper={form.formState.errors.legalBusinessName?.message}
          />
          <Input
            label="Trading name"
            value={values.tradingName}
            onChange={(e) =>
              form.setValue('tradingName', e.target.value, {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
            state={form.formState.errors.tradingName ? 'error' : 'default'}
            helper={form.formState.errors.tradingName?.message}
          />
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center justify-between">
              <span>
                Business description{' '}
                <span className="text-muted-foreground">
                  (min 100 chars)
                </span>
              </span>
              <span
                className={cn(
                  'text-xs',
                  descriptionTooShort
                    ? 'text-red-600'
                    : 'text-muted-foreground'
                )}
              >
                {descriptionLength}/100
              </span>
            </label>
            <textarea
              className={cn(
                'w-full rounded-lg border bg-card p-3 text-sm resize-vertical focus:outline-none focus:ring-4 focus:ring-ring',
                form.formState.errors.businessDescription
                  ? 'border-red-500'
                  : 'border-input'
              )}
              rows={5}
              value={values.businessDescription}
              onChange={(e) =>
                form.setValue('businessDescription', e.target.value, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              placeholder="Describe your business model, products/services, target customers..."
            />
            {form.formState.errors.businessDescription && (
              <p className="text-xs text-red-600">
                {form.formState.errors.businessDescription.message}
              </p>
            )}
          </div>
          <div className="space-y-6">
            <div>
              <DropdownSelect
                label="Ownership Type"
                options={ownershipTypes}
                value={values.businessCategory}
                onChange={(val) =>
                  form.setValue('businessCategory', String(val), {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
                state={
                  form.formState.errors.businessCategory ? 'error' : 'default'
                }
                placeholder="Select"
              />
              {form.formState.errors.businessCategory && (
                <p className="text-xs text-red-600 mt-1">
                  {form.formState.errors.businessCategory.message}
                </p>
              )}
            </div>
            <div>
              <DropdownSelect
                label="Projected sales volume"
                options={projectedVolumes}
                value={values.projectedSalesVolume}
                onChange={(val) =>
                  form.setValue('projectedSalesVolume', String(val), {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
                state={
                  form.formState.errors.projectedSalesVolume
                    ? 'error'
                    : 'default'
                }
                placeholder="Select"
              />
              {form.formState.errors.projectedSalesVolume && (
                <p className="text-xs text-red-600 mt-1">
                  {form.formState.errors.projectedSalesVolume.message}
                </p>
              )}
            </div>
            <Input
              label="Website"
              value={values.website}
              onChange={(e) =>
                form.setValue('website', e.target.value, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              state={form.formState.errors.website ? 'error' : 'default'}
              helper={form.formState.errors.website?.message}
              placeholder="https://example.com"
            />
          </div>
        </form>
      ),
    },
    {
      title: 'Enter your business registration information',
      content: (
        <div className="space-y-6">
          <SectionHeader
            title="Enter your business registration information"
            description="Provide your registered business details, so we can verify your business information."
            className="mb-10"
          />
          <Input
            label="Registration Number"
            value={rcNumber}
            onChange={(e) => setRcNumber(e.target.value)}
            placeholder="e.g. RC1234567"
          />
          <Input
            label="Tax Identification Number"
            value={tin}
            onChange={(e) => setTin(e.target.value)}
            placeholder="e.g. 01234567-0001"
          />
        </div>
      ),
    },
    {
      title: 'Business registration document',
      content: (
        <div className="space-y-6">
          <SectionHeader
            title="Business registration document"
            description="Please upload documents that are government issued, unedited and are JPG, JPEG, PNG or PDF file formats."
            className="mb-10"
          />
          <div className="space-y-4">
            <UploadField
              label="Memorandum and Articles of Association"
              value={memoDoc}
              onChangeFile={(f) => f && handleFile(f, setMemoDoc)}
            />
            <UploadField
              label="Certificate of Incorporation"
              value={certDoc}
              onChangeFile={(f) => f && handleFile(f, setCertDoc)}
            />
            <UploadField
              label="CAC Status Report"
              value={statusReportDoc}
              onChangeFile={(f) => f && handleFile(f, setStatusReportDoc)}
            />
          </div>
        </div>
      ),
    },
    {
      title: 'Representative (Form 4)',
      content: (
        <div className="space-y-6">
          <SectionHeader
            title="Tell us about the business representative"
            description="A business representative is either an owner, director or shareholder of your business."
            className="mb-4"
          />
          {editingOwnerIndex !== null && (
            <div className="rounded border border-blue-500/40 bg-blue-50 dark:bg-blue-900/20 p-3 text-[11px] flex items-center justify-between">
              <span>
                Editing representative #{editingOwnerIndex + 1}. Update details
                and click Next to save changes.
              </span>
              <button
                type="button"
                className="text-blue-600 hover:underline ml-4"
                onClick={() => {
                  setEditingOwnerIndex(null);
                }}
              >
                Cancel
              </button>
            </div>
          )}
          <div className="space-y-4">
            <Input
              label="Legal First Name"
              value={repFirstName}
              onChange={(e) => setRepFirstName(e.target.value)}
            />
            <Input
              label="Legal Last Name"
              value={repLastName}
              onChange={(e) => setRepLastName(e.target.value)}
            />
            <Input
              label="Date of Birth"
              type="date"
              value={repDob}
              onChange={(e) => setRepDob(e.target.value)}
            />
            {!isAdult && repDob && (
              <p className="text-[10px] text-red-600">Representative must be at least 18 years old.</p>
            )}
            <Input
              label="Nationality"
              value={repNationality}
              onChange={(e) => setRepNationality(e.target.value)}
            />
            <DropdownSelect
              label="Role at the Business"
              value={repRole}
              onChange={(v) => setRepRole(String(v))}
              options={[
                { value: 'owner', label: 'Owner' },
                { value: 'director', label: 'Director' },
                { value: 'shareholder', label: 'Shareholder' },
              ]}
              placeholder="Select"
            />
            <Input
              label="Occupation"
              value={repOccupation}
              onChange={(e) => setRepOccupation(e.target.value)}
            />
            <Input
              label="Mobile"
              value={repMobile}
              onChange={(e) => setRepMobile(e.target.value)}
            />
            <Input
              label="Address"
              value={repAddress}
              onChange={(e) => setRepAddress(e.target.value)}
            />
            <Input
              label="Ownership Percentage"
              type="number"
              value={repPercentOwnership}
              onChange={(e) => setRepPercentOwnership(e.target.value)}
              placeholder="e.g. 25"
            />
            <Input
              label="Bank Verification Number (BVN)"
              value={repBvn}
              onChange={(e) => setRepBvn(e.target.value)}
            />
            <DropdownSelect
              label="Identification Document"
              value={repIdentificationType}
              onChange={(v) => setRepIdentificationType(String(v))}
              options={[
                { value: 'nin', label: 'National Identification Number' },
                { value: 'bvn', label: 'Bank Verification Number' },
                { value: 'voters_card', label: "Voter's Card" },
                { value: 'drivers_license', label: "Driver's License" },
                { value: 'passport', label: 'International Passport' },
              ]}
              placeholder="Select"
            />
            <Input
              label="Identification Number"
              value={repIdentityNumber}
              onChange={(e) => setRepIdentityNumber(e.target.value)}
            />
            {step === 3 && !repStepValid && (
              <p className="text-[10px] text-red-600">
                Please complete all fields (including BVN & valid DOB) before proceeding.
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Representative Summary (Form 5)',
      content: (
        <div className="space-y-6">
          <SectionHeader
            title="Tell us about the business representative"
            description="A business representative is either an owner, director or shareholder of your business."
            className="mb-2"
          />
          {!!draft.owners.length && (
            <div className="space-y-4">
              <ul className="space-y-3">
                {draft.owners.map((o, i) => (
                  <li
                    key={i}
                    className="text-xs md:text-sm bg-muted/40 rounded border p-4 space-y-2"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                      <SummaryField
                        label="Name"
                        value={`${o.firstName} ${o.lastName}`.trim()}
                      />
                      <SummaryField label="Date of Birth" value={o.dob || '—'} />
                      <SummaryField
                        label="Nationality"
                        value={o.nationality || '—'}
                      />
                      <SummaryField label="Role" value={o.verificationType || '—'} />
                      {/* Use role field instead of verificationType for Role */}
                      <SummaryField label="Role" value={o.role || '—'} />
                      <SummaryField
                        label="Occupation"
                        value={o.occupation || '—'}
                      />
                      <SummaryField label="Mobile" value={o.mobile || '—'} />
                      <SummaryField
                        label="Address"
                        value={o.address || '—'}
                      />
                      <SummaryField
                        label="Ownership %"
                        value={String(o.percent_of_business ?? '—')}
                      />
                      <SummaryField
                        label="ID Type"
                        value={o.verificationType || '—'}
                      />
                      <SummaryField
                        label="ID Number"
                        value={o.verificationNumber || '—'}
                      />
                      <SummaryField
                        label="BVN"
                        value={o.bvn || '—'}
                      />
                    </div>
                    <div className="flex gap-3 pt-1">
                      <button
                        type="button"
                        className="text-[10px] text-blue-600 hover:underline"
                        onClick={() => {
                          setRepFirstName(o.firstName || '');
                          setRepLastName(o.lastName || '');
                          setRepDob(o.dob || '');
                          setRepNationality(o.nationality || '');
                          setRepRole(o.role || '');
                          setRepOccupation(o.occupation || '');
                          setRepMobile(o.mobile || '');
                          setRepAddress(o.address || '');
                          setRepPercentOwnership(
                            o.percent_of_business != null
                              ? String(o.percent_of_business)
                              : ''
                          );
                          setRepBvn(o.bvn || '');
                          setRepIdentificationType(o.verificationType || '');
                          setRepIdentityNumber(o.verificationNumber || '');
                          setEditingOwnerIndex(i);
                          setStep(
                            steps.findIndex(
                              (s) => s.title === 'Representative (Form 4)'
                            )
                          );
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="text-[10px] text-red-600 hover:underline"
                        onClick={() => {
                          const copy = [...draft.owners];
                          copy.splice(i, 1);
                          updateDraft({ owners: copy });
                          // If we were editing this owner, reset editing state
                          if (editingOwnerIndex === i) setEditingOwnerIndex(null);
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex flex-col gap-3 pt-2">
            <button
              type="button"
              className="text-xs text-blue-600 hover:underline w-fit"
              onClick={() => {
                setRepFirstName('');
                setRepLastName('');
                setRepDob('');
                setRepNationality('');
                setRepRole('');
                setRepOccupation('');
                setRepMobile('');
                setRepAddress('');
                setRepPercentOwnership('');
                setRepBvn('');
                setRepIdentificationType('');
                setRepIdentityNumber('');
                setEditingOwnerIndex(null);
                setStep(
                  steps.findIndex(
                    (s) => s.title === 'Representative (Form 4)'
                  )
                );
              }}
            >
              Add additional owners, directors or shareholders
            </button>
            <p className="text-[11px] text-red-600">
              Once you click on save, you can’t go back and make changes.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Email Contacts',
      content: (
        <div className="space-y-6 text-sm">
          <SectionHeader
            title="Provide your primary contact emails"
            description="We will use these emails to contact your business for general inquiries, support requests and disputes."
            className="mb-2"
          />
          <div className="space-y-4">
            <Input
              label="Primary Contact Email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="contact@business.com"
            />
            <Input
              label="Support Email"
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              placeholder="support@business.com"
            />
            <Input
              label="Dispute Email"
              type="email"
              value={disputeEmail}
              onChange={(e) => setDisputeEmail(e.target.value)}
              placeholder="disputes@business.com"
            />
            <p className="text-[10px] text-muted-foreground">
              Ensure these mailboxes are actively monitored.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Review & Submit',
      content: (
        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            Review entered information. Submitting will mark compliance as
            complete.
          </p>
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-xs uppercase tracking-wide mb-2">
                Business
              </h4>
              <ul className="text-xs list-disc pl-5 space-y-1">
                <li>Legal Name: {values.legalBusinessName || '—'}</li>
                <li>Trading Name: {values.tradingName || '—'}</li>
                <li>Category: {values.businessCategory || '—'}</li>
                <li>
                  Projected Volume: {values.projectedSalesVolume || '—'}
                </li>
                <li>Website: {values.website || '—'}</li>
                <li>RC Number: {rcNumber || '—'}</li>
                <li>Tax Identification Number: {tin || '—'}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-xs uppercase tracking-wide mb-2">
                Documents
              </h4>
              <ul className="text-xs list-disc pl-5 space-y-1">
                <li>
                  Memorandum & Articles: {memoDoc ? 'Uploaded' : '—'}
                </li>
                <li>
                  Certificate of Incorporation: {certDoc ? 'Uploaded' : '—'}
                </li>
                <li>CAC Status Report: {statusReportDoc ? 'Uploaded' : '—'}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-xs uppercase tracking-wide mb-2">
                Representatives ({draft.owners.length})
              </h4>
              {draft.owners.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No representatives captured.
                </p>
              )}
              {!!draft.owners.length && (
                <ul className="space-y-2">
                  {draft.owners.map((o, i) => (
                    <li
                      key={i}
                      className="text-[11px] bg-muted/40 rounded border p-3"
                    >
                      <span className="font-medium">
                        {o.firstName} {o.lastName}
                      </span>{' '}
                      · <span>{o.verificationType || '—'}</span> ·{' '}
                      <span>{o.percent_of_business ?? '—'}%</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h4 className="font-medium text-xs uppercase tracking-wide mb-2">
                Emails
              </h4>
              <ul className="text-xs list-disc pl-5 space-y-1">
                <li>Primary Contact: {contactEmail || '—'}</li>
                <li>Support: {supportEmail || '—'}</li>
                <li>Dispute: {disputeEmail || '—'}</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Submission Successful',
      content: (
        <div className="space-y-6 text-center max-w-lg mx-auto">
          <div className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">
              Submission successful
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground">
              Your compliance documents have been received and are currently
              under review. We will notify you once the review is complete.
            </p>
          </div>
          <div className="rounded-md border bg-muted/40 p-4 text-left space-y-2 text-xs">
            <p>
              <span className="font-medium">Status:</span> Under Review
            </p>
            <p>
              <span className="font-medium">Next Steps:</span> Our team is
              verifying your submitted information. This typically takes 1–2
              business days.
            </p>
            <p>
              <span className="font-medium">Need to update something?</span>{' '}
              Reach out to support and we can reopen your application if
              required.
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => {
              window.location.href = '/dashboard';
            }}
          >
            Go to Dashboard
          </Button>
        </div>
      ),
    },
  ];

  // --------------------------- Render ---------------------------
  return (
    <div className="space-y-10">
      <div className="pt-2">
        <h2 className="text-xl font-semibold">Activate your account</h2>
        <div className="h-px bg-border mt-3" />
      </div>

      {complete && (
        <div className="rounded border border-green-600/40 bg-green-50 dark:bg-green-900/10 p-4 text-sm text-green-700 dark:text-green-300">
          You are fully onboarded.
        </div>
      )}

      {!complete && (
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 md:col-span-2">
            <div className="md:sticky md:top-20">
              <span className="inline-block bg-amber-400 text-black text-xs font-medium px-3 py-1 rounded">
                Step {step + 1} of {steps.length}
              </span>
            </div>
          </div>

          <div className="col-span-12 md:col-span-8 md:col-start-3 flex flex-col items-center text-center">
            {step === 0 && (
              <div className="space-y-3 max-w-lg mb-10">
                <h3 className="text-lg md:text-2xl font-semibold text-start">
                  Hi {merchantName}, let's setup your account real quick
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground text-start">
                  As a regulated financial services company, we would need to
                  verify your identification and business registration
                  information.
                </p>
              </div>
            )}

            <div className="w-full max-w-lg space-y-8 text-left">
              {steps[step].content}

              <div className="flex justify-between pt-2">
                <Button
                  variant="outline"
                  disabled={step === 0}
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>

                {step < steps.length - 1 ? (
                  steps[step].title === 'Review & Submit' ? (
                    <Button variant="primary" onClick={onSubmit}>
                      <Send className="h-4 w-4 mr-1" />
                      Submit
                    </Button>
                  ) : (
                    <Button
                      disabled={
                        nextLoading ||
                        (step === 0 && (!step1Valid || saveMutation.isPending)) ||
                        (step === 3 && !repStepValid) ||
                        (step === 5 &&
                          ![contactEmail, supportEmail, disputeEmail].every((e) => /.+@.+\..+/.test(e)))
                      }
                      onClick={onNext}
                    >
                      {nextLoading ? (
                        <span className="flex items-center"><Loader2 className="h-4 w-4 mr-2 animate-spin" />{step === 0 ? 'Saving...' : 'Processing...'}</span>
                      ) : (
                        <span className="flex items-center">Next<ArrowRight className="h-4 w-4 ml-1" /></span>
                      )}
                    </Button>
                  )
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ----------------------- Small components ----------------------- */
type UploadFieldProps = {
  label: string;
  value?: string;
  onChangeFile: (file: File | null) => void;
};
function UploadField({ label, value, onChangeFile }: UploadFieldProps) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const validate = (file: File) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    const maxBytes = 10 * 1024 * 1024;
    if (!allowed.includes(file.type)) return 'Unsupported file type';
    if (file.size > maxBytes) return 'File too large (max 10MB)';
    return null;
  };

  const handleSelect = (file: File | null) => {
    if (!file) {
      onChangeFile(null);
      setFileName(null);
      setError(null);
      return;
    }
    const v = validate(file);
    if (v) {
      setError(v);
      return;
    }
    setError(null);
    setFileName(file.name);
    onChangeFile(file);
  };

  const prevent = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const onDrop = (e: React.DragEvent) => {
    prevent(e);
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleSelect(file);
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium">{label}</label>
        {value && (
          <button
            type="button"
            onClick={() => {
              onChangeFile(null);
              setFileName(null);
              setError(null);
            }}
            className="text-[10px] text-red-600 hover:underline"
          >
            Remove
          </button>
        )}
      </div>
      <div
        className={cn(
          'border border-dashed rounded-md h-24 flex flex-col items-center justify-center text-xs cursor-pointer transition-colors',
          dragOver ? 'bg-accent/30 border-accent' : 'bg-muted/30 border-muted-foreground/40',
          error ? 'border-red-500' : ''
        )}
        onDragEnter={(e) => {
          prevent(e);
          setDragOver(true);
        }}
        onDragOver={(e) => {
          prevent(e);
          setDragOver(true);
        }}
        onDragLeave={(e) => {
          prevent(e);
          setDragOver(false);
        }}
        onDrop={onDrop}
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.jpg,.jpeg,.png,.pdf';
          input.onchange = (ev: Event) => {
            const target = ev.target as HTMLInputElement | null;
            const f = target?.files?.[0];
            if (f) handleSelect(f);
            else handleSelect(null);
          };
          input.click();
        }}
      >
        {!value && (
          <span className="text-muted-foreground text-center px-4">
            Drag files here or click to upload
          </span>
        )}
        {value && (
          <div className="flex flex-col items-center gap-1 px-3 text-center">
            <span
              className="text-[11px] font-medium truncate max-w-[180px]"
              title={fileName || 'Uploaded file'}
            >
              {fileName || 'Uploaded file'}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/30">
              Uploaded
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-4">
        {!value && !error && (
          <p className="text-[10px] text-muted-foreground">Upload a document</p>
        )}
        {error && <p className="text-[10px] text-red-600">{error}</p>}
      </div>
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

type SectionHeaderProps = {
  title: string;
  description?: string;
  className?: string;
};
function SectionHeader({ title, description, className }: SectionHeaderProps) {
  return (
    <div className={cn('space-y-3 max-w-lg', className)}>
      <h3 className="text-lg md:text-2xl font-semibold text-start">{title}</h3>
      {description && (
        <p className="text-xs md:text-sm text-muted-foreground text-start">
          {description}
        </p>
      )}
    </div>
  );
}

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
        {label}
      </p>
      <p className="text-sm break-words">{value || '—'}</p>
    </div>
  );
}
