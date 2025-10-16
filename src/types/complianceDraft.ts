export type ComplianceOwner = {
  firstName: string;
  lastName: string;
  mobile: string;
  verificationNumber: string; // generic identity number
  occupation: string;
  percent_of_business: number;
  address: string;
  verificationType: string; // nin, passport, etc.
  dob: string; // ISO date
  nationality: string;
  role?: string; // added per Form 4 requirements
  bvn?: string; // added per Form 4 requirements
};

export type ComplianceDraft = {
  // Progress & control
  progress: number; // 0-6
  stepIndex: number; // current wizard step index

  // Core business info
  legalBusinessName: string;
  tradingName: string;
  businessDescription: string;
  businessCategory: string;
  projectedSalesVolume: string;
  merchantAddress: string;
  rcNumber: string;
  countryCode: string;
  incorporationDate: string;
  businessCommencementDate: string;
  ownershipType: string;
  staffStrength: number | null;
  numberOfLocations: number | null;
  bankrupcy: boolean | null;
  bankrupcyReason: string;
  relationshipWithAcquirer: boolean | null;
  reasonForTerminationRelationsip: string;
  politics: boolean | null;
  productPriceRange: string;
  cardAcceptanceType: string;
  website: string;

  // Banking & financial
  accountName: string;
  accountNumber: string;
  accountType: string;
  bvn: string;
  bankName: string;
  swiftCode: string;
  tin: string;
  pciDssCompliant: boolean | null;
  uses3dSecure: boolean | null;
  dataProtectionPolicy: boolean | null;

  // Contacts
  contactEmail: string;
  disputeEmail: string;
  supportEmail: string;

  // Identity (maybe principal)
  dob: string; // principal DOB
  nationality: string;
  role: string; // principal role
  percentOfBusiness: number | null; // principal share (if any)
  identificationType: string;
  identityNumber: string;
  residentialAddress: string;
  nin: string;

  // Representative (Form 4) fields
  firstName?: string;
  lastName?: string;
  mobile?: string;
  occupation?: string;
  percent_of_business?: number; // alt naming if needed by API

  // Uploaded document placeholders (store file names or base64 for now)
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
  memorandum_and_articles?: string; // Memorandum and Articles of Association

  // Arrays
  owners: ComplianceOwner[];
};

export const emptyComplianceDraft = (): ComplianceDraft => ({
  progress: 0,
  stepIndex: 0,
  legalBusinessName: '',
  tradingName: '',
  businessDescription: '',
  businessCategory: '',
  projectedSalesVolume: '',
  merchantAddress: '',
  rcNumber: '',
  countryCode: '',
  incorporationDate: '',
  businessCommencementDate: '',
  ownershipType: '',
  staffStrength: null,
  numberOfLocations: null,
  bankrupcy: null,
  bankrupcyReason: '',
  relationshipWithAcquirer: null,
  reasonForTerminationRelationsip: '',
  politics: null,
  productPriceRange: '',
  cardAcceptanceType: '',
  website: '',
  accountName: '',
  accountNumber: '',
  accountType: '',
  bvn: '',
  bankName: '',
  swiftCode: '',
  tin: '',
  pciDssCompliant: null,
  uses3dSecure: null,
  dataProtectionPolicy: null,
  contactEmail: '',
  disputeEmail: '',
  supportEmail: '',
  dob: '',
  nationality: '',
  role: '',
  percentOfBusiness: null,
  identificationType: '',
  identityNumber: '',
  residentialAddress: '',
  nin: '',
  firstName: '',
  lastName: '',
  mobile: '',
  occupation: '',
  percent_of_business: undefined,
  owners: [],
  memorandum_and_articles: undefined,
});
