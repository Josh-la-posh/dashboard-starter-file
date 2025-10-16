// Utility to build the flat compliance payload expected by backend
// We intentionally flatten nested business & financial info and map naming differences.
import type { ComplianceDraft } from '../../types/complianceDraft';

// Owners array in draft uses percent_of_business; backend expects same snake_case according to spec provided.
export interface FlatOwnerPayload {
  firstName?: string;
  lastName?: string;
  mobile?: string;
  verificationNumber?: string;
  occupation?: string;
  percent_of_business?: number; // snake_case per backend
  address?: string;
  verificationType?: string;
  role?: string;
  dob?: string;
  bvn?: string;
  nationality?: string;
}

// Full flat payload for POST/PUT (all forms). We keep everything optional so we can send a subset if desired.
export interface FlatCompliancePayload {
  // Progress only (merchantCode now query param, not in body)
  progress?: number;
  // Business identity & meta
  dob?: string; // principal dob
  nationality?: string;
  role?: string;
  percentOfBusiness?: number | null; // principal share (note: backend field? keep camelCase if backend accepts; else map separately if required)
  identificationType?: string;
  tradingName?: string;
  businessDescription?: string;
  identityNumber?: string;
  projectedSalesVolume?: string;
  merchantAddress?: string;
  rcNumber?: string;
  legalBusinessName?: string;
  countryCode?: string;
  incorporationDate?: string;
  businessCommencementDate?: string;
  ownershipType?: string;
  staffStrength?: number | null;
  numberOfLocations?: number | null;
  bankrupcy?: boolean | null;
  bankrupcyReason?: string;
  relationshipWithAcquirer?: boolean | null;
  reasonForTerminationRelationsip?: string;
  politics?: boolean | null;
  productPriceRange?: string;
  cardAcceptanceType?: string;
  website?: string;
  contactEmail?: string;
  supportEmail?: string;
  disputeEmail?: string;
  // Financial
  accountName?: string;
  accountNumber?: string;
  accountType?: string;
  bvn?: string;
  bankName?: string;
  swiftCode?: string;
  tin?: string;
  residentialAddress?: string;
  nin?: string;
  // Flags
  pciDssCompliant?: boolean | null;
  uses3dSecure?: boolean | null;
  dataProtectionPolicy?: boolean | null;
  // Owners
  owners?: FlatOwnerPayload[];
  // Documents (base64 strings) - only include if present
  memorandum_of_association?: string; // mapping from memorandum_and_articles draft field
  certificate_of_incorporation?: string;
  status_report?: string;
  director_id?: string;
  utility_bill?: string;
  tax_clearance?: string;
  declaration_statement?: string;
  financial_history?: string;
  delivery_policy?: string;
  return_credit_policy?: string;
  prohibited_activities_declaration?: string;
  bricks_and_mortar_agreement?: string;
  web_merchants_agreement?: string;
}

// Helper to treat empty strings uniformly
function emptyToUndefined<T extends string | null | undefined>(v: T): T | undefined {
  if (v == null) return undefined;
  return (typeof v === 'string' && v.trim() === '') ? undefined : v;
}

export function buildFlatCompliancePayload(params: {
  draft: ComplianceDraft;
  ownersOverride?: FlatOwnerPayload[]; // for incremental owner save
  progress?: number;
  includeAll?: boolean; // if true send full snapshot; else only include logically filled values + overrides
  allowedKeys?: string[]; // whitelist of keys to include (always keeps merchantCode & progress)
}): FlatCompliancePayload {
  const { draft, ownersOverride, progress, includeAll = true, allowedKeys } = params;

  const owners: FlatOwnerPayload[] | undefined = ownersOverride
    ? ownersOverride
    : (draft.owners && draft.owners.length
        ? draft.owners.map(o => ({ ...o, percent_of_business: o.percent_of_business }))
        : undefined);

  const payload: FlatCompliancePayload = {
    progress,
    // Business core (principal)
    dob: emptyToUndefined(draft.dob),
    nationality: emptyToUndefined(draft.nationality),
    role: emptyToUndefined(draft.role),
    percentOfBusiness: draft.percentOfBusiness ?? undefined,
    identificationType: emptyToUndefined(draft.identificationType),
    tradingName: emptyToUndefined(draft.tradingName),
    businessDescription: emptyToUndefined(draft.businessDescription),
    identityNumber: emptyToUndefined(draft.identityNumber),
    projectedSalesVolume: emptyToUndefined(draft.projectedSalesVolume),
    merchantAddress: emptyToUndefined(draft.merchantAddress),
    rcNumber: emptyToUndefined(draft.rcNumber),
    legalBusinessName: emptyToUndefined(draft.legalBusinessName),
    countryCode: emptyToUndefined(draft.countryCode),
    incorporationDate: emptyToUndefined(draft.incorporationDate),
    businessCommencementDate: emptyToUndefined(draft.businessCommencementDate),
    ownershipType: emptyToUndefined(draft.ownershipType),
    staffStrength: draft.staffStrength ?? undefined,
    numberOfLocations: draft.numberOfLocations ?? undefined,
    bankrupcy: draft.bankrupcy ?? undefined,
    bankrupcyReason: emptyToUndefined(draft.bankrupcyReason),
    relationshipWithAcquirer: draft.relationshipWithAcquirer ?? undefined,
    reasonForTerminationRelationsip: emptyToUndefined(draft.reasonForTerminationRelationsip),
    politics: draft.politics ?? undefined,
    productPriceRange: emptyToUndefined(draft.productPriceRange),
    cardAcceptanceType: emptyToUndefined(draft.cardAcceptanceType),
    website: emptyToUndefined(draft.website),
    contactEmail: emptyToUndefined(draft.contactEmail),
    supportEmail: emptyToUndefined(draft.supportEmail),
    disputeEmail: emptyToUndefined(draft.disputeEmail),
    // Financial
    accountName: emptyToUndefined(draft.accountName),
    accountNumber: emptyToUndefined(draft.accountNumber),
    accountType: emptyToUndefined(draft.accountType),
    bvn: emptyToUndefined(draft.bvn),
    bankName: emptyToUndefined(draft.bankName),
    swiftCode: emptyToUndefined(draft.swiftCode),
    tin: emptyToUndefined(draft.tin),
    residentialAddress: emptyToUndefined(draft.residentialAddress),
    nin: emptyToUndefined(draft.nin),
    // Flags
    pciDssCompliant: draft.pciDssCompliant ?? undefined,
    uses3dSecure: draft.uses3dSecure ?? undefined,
    dataProtectionPolicy: draft.dataProtectionPolicy ?? undefined,
    // Owners
    owners,
    // Documents mapping (only include if present)
    memorandum_of_association: emptyToUndefined(draft.memorandum_and_articles),
    certificate_of_incorporation: emptyToUndefined(draft.certificate_of_incorporation),
    status_report: emptyToUndefined(draft.status_report),
    director_id: emptyToUndefined(draft.director_id),
    utility_bill: emptyToUndefined(draft.utility_bill),
    tax_clearance: emptyToUndefined(draft.tax_clearance),
    declaration_statement: emptyToUndefined(draft.declaration_statement),
    financial_history: emptyToUndefined(draft.financial_history),
    delivery_policy: emptyToUndefined(draft.delivery_policy),
    return_credit_policy: emptyToUndefined(draft.return_credit_policy),
    prohibited_activities_declaration: emptyToUndefined(draft.prohibited_activities_declaration),
    bricks_and_mortar_agreement: emptyToUndefined(draft.bricks_and_mortar_agreement),
    web_merchants_agreement: emptyToUndefined(draft.web_merchants_agreement),
  };

  if (!includeAll) {
    // Remove undefined keys for minimal patching
    const mutable: { [k: string]: unknown } = { ...payload };
    Object.entries(mutable).forEach(([k, v]) => {
      if (v === undefined) delete mutable[k];
    });
    if (allowedKeys && allowedKeys.length) {
      Object.keys(mutable).forEach((k) => {
        if (k !== 'progress' && !allowedKeys.includes(k)) {
          delete mutable[k];
        }
      });
    }
    return mutable as unknown as FlatCompliancePayload; // narrowed version without undefined keys
  }

  if (allowedKeys && allowedKeys.length) {
    const filtered: { [k: string]: unknown } = {};
    if (progress != null) filtered.progress = progress;
    const indexed = payload as unknown as { [k: string]: unknown };
    allowedKeys.forEach((k) => {
      const val = indexed[k];
      if (val !== undefined) filtered[k] = val;
    });
    return filtered as unknown as FlatCompliancePayload;
  }
  return payload;
}
