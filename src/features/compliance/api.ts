import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import type { ComplianceApiResponse, ComplianceResponseData, BusinessInfo, FinancialInfo } from '../../types/compliance';
// FormData is now used for all compliance saves; flat JSON still accepted but deprecated.

function emptyBusinessInfo(): BusinessInfo {
  return {
    dob: null, nationality: null, role: null, percentOfBusiness: null, identificationType: null, tradingName: null,
    businessDescription: null, identityNumber: null, projectedSalesVolume: null, merchantAddress: null, rcNumber: null,
    legalBusinessName: null, countryCode: null, incorporationDate: null, businessCommencementDate: null, ownershipType: null,
    staffStrength: null, numberOfLocations: null, bankrupcy: null, bankrupcyReason: null, industry: null, industryCategory: null,
    relationshipWithAcquirer: null, reasonForTerminationRelationsip: null, politics: null, productPriceRange: null,
    cardAcceptanceType: null, website: null, disputeEmail: null, supportEmail: null, contactEmail: null
  };
}
function emptyFinancialInfo(): FinancialInfo {
  return {
    accountName: null, accountNumber: null, accountType: null, bvn: null, bankName: null, swiftCode: null, nin: null,
    tin: null, residentialAddress: null
  };
}

let inflightCompliance: Promise<ComplianceResponseData> | null = null;
export async function fetchCompliance(merchantCode: string): Promise<ComplianceResponseData> {
  if (!merchantCode) throw new Error('merchantCode required');
  if (!inflightCompliance) {
    // Instrumentation log (remove after debugging)
  console.log('[compliance] fetch start', merchantCode, new Date().toISOString());
    inflightCompliance = (async () => {
      try {
        const res = await api.get<ComplianceApiResponse>(`/compliance`, { params: { merchantCode } });
        const body = res.data;
        if (!body.requestSuccessful && (body.responseCode === '99' || body.responseData == null)) {
          // Treat as not-started compliance; synthesize minimal object with progress 0
          return {
            id: 0,
            merchantCode,
            merchantName: merchantCode,
            documents: [],
            businessInfo: emptyBusinessInfo(),
            financialInfo: emptyFinancialInfo(),
            owners: [],
            pciDssCompliant: false,
            progress: 0,
            uses3dSecure: false,
            dataProtectionPolicy: false,
            prohibitedActivitiesDeclaration: null,
            status: 'not_started',
            reviewedAt: null,
            reviewedBy: null,
            validationReference: null,
            verificationComment: null
          };
        }
        return body.responseData;
      } catch (e: unknown) {
        // If API throws (network or 403 with shape), attempt to parse response
        interface MaybeAxiosError { response?: { data?: unknown }; }
        const respData = (e as MaybeAxiosError).response?.data;
        const resp = (respData && typeof respData === 'object' ? respData as ComplianceApiResponse : undefined);
        if (resp && (resp.responseCode === '99' || resp.responseData == null)) {
          return {
            id: 0,
            merchantCode,
            merchantName: merchantCode,
            documents: [],
            businessInfo: emptyBusinessInfo(),
            financialInfo: emptyFinancialInfo(),
            owners: [],
            pciDssCompliant: false,
            progress: 0,
            uses3dSecure: false,
            dataProtectionPolicy: false,
            prohibitedActivitiesDeclaration: null,
            status: 'not_started',
            reviewedAt: null,
            reviewedBy: null,
            validationReference: null,
            verificationComment: null
          };
        }
        throw e;
      }
    })().finally(() => {
      console.log('[compliance] fetch end');
      inflightCompliance = null;
    });
  } else {
    console.log('[compliance] reuse inflight promise');
  }
  return inflightCompliance;
}

export function useCompliance(merchantCode?: string) {
  return useQuery({
    queryKey: ['compliance', merchantCode],
    queryFn: () => fetchCompliance(merchantCode!),
    enabled: !!merchantCode,
    // large staleTime + disable refetch triggers ensures single fetch per session unless manually invalidated
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: false, // avoid retry storm on CORS failure
  });
}

// Now we support flat payload (preferred) but retain backward compatibility for nested partials.
export type ComplianceSavePayload = FormData | Record<string, unknown>;

async function postCompliance(merchantCode: string, payload: ComplianceSavePayload): Promise<ComplianceResponseData> {
  const res = await api.post<ComplianceApiResponse>(`/compliance?merchantCode=${merchantCode}`, payload);
  return res.data.responseData;
}

export async function putCompliance(merchantCode: string, payload: ComplianceSavePayload): Promise<ComplianceResponseData> {
  const res = await api.put<ComplianceApiResponse>(`/compliance?merchantCode=${merchantCode}`, payload);
  return res.data.responseData;
}

// Final verification submission endpoint: PUT /compliance/startVerification
// Sends minimal FormData (currently only progress=8 per spec) and returns updated compliance object.
export async function startVerification(merchantCode: string): Promise<ComplianceResponseData> {
  if (!merchantCode) throw new Error('merchantCode required');
  const fd = new FormData();
  fd.append('progress', '8'); // ensure server records final progress
  const res = await api.put<ComplianceApiResponse>(`/compliance/startVerification?merchantCode=${merchantCode}`, fd);
  return res.data.responseData;
}

export function useSaveCompliance(merchantCode: string, existing?: ComplianceResponseData | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['complianceSave', merchantCode],
    mutationFn: async (payload: ComplianceSavePayload) => {
      if (existing && existing.id && existing.id !== 0) {
        return putCompliance(merchantCode, payload);
      }
      return postCompliance(merchantCode, payload);
    },
    onSuccess: (data) => {
      qc.setQueryData(['compliance', merchantCode], data);
    }
  });
}

// Removed multipart initial upload hook; FormData is directly supported via useSaveCompliance.
