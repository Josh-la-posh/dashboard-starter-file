import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import type { ComplianceApiResponse, ComplianceResponseData } from '../../types/compliance';

export async function fetchCompliance(merchantCode: string): Promise<ComplianceResponseData> {
  const res = await api.get<ComplianceApiResponse>(`/compliance`, { params: { merchantCode } });
  return res.data.responseData;
}

export function useCompliance(merchantCode?: string) {
  return useQuery({
    queryKey: ['compliance', merchantCode],
    queryFn: () => fetchCompliance(merchantCode!),
    enabled: !!merchantCode,
    staleTime: 60_000,
  });
}
