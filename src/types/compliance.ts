export type ComplianceDocument = {
  id: string;
  documentType: string;
  filePath: string;
  link: string;
  originalName: string;
  mimeType: string;
  size: number;
  status: boolean;
};

export type BusinessInfo = {
  dob: string | null;
  nationality: string | null;
  role: string | null;
  percentOfBusiness: number | null;
  identificationType: string | null;
  tradingName: string | null;
  businessDescription: string | null;
  identityNumber: string | null;
  projectedSalesVolume: string | null;
  merchantAddress: string | null;
  rcNumber: string | null;
  legalBusinessName: string | null;
  countryCode: string | null;
  incorporationDate: string | null;
  businessCommencementDate: string | null;
  ownershipType: string | null;
  staffStrength: number | null;
  numberOfLocations: number | null;
  bankrupcy: boolean | null;
  bankrupcyReason: string | null;
  industry: string | null;
  industryCategory: string | null;
  relationshipWithAcquirer: string | null;
  reasonForTerminationRelationsip: string | null;
  politics: boolean | null;
  productPriceRange: string | null;
  cardAcceptanceType: string | null;
  website: string | null;
  disputeEmail: string | null;
  supportEmail: string | null;
  contactEmail: string | null;
  // dynamic status flags like fieldNameStatus: boolean
  // Using index signature with unknown; consumer should narrow.
  [key: string]: unknown;
};

export type FinancialInfo = {
  accountName: string | null;
  accountNumber: string | null;
  accountType: string | null;
  bvn: string | null;
  bankName: string | null;
  swiftCode: string | null;
  nin: string | null;
  tin: string | null;
  residentialAddress: string | null;
  // dynamic status flags
  [key: string]: unknown;
};

export type OwnerInfo = {
  id: string;
  firstName: string;
  lastName: string;
  address: string | null;
  occupation: string | null;
  mobile: string | null;
  dob: string | null;
  nationality: string | null;
  percentOfBusiness: number | null;
  role: string | null;
  verificationType: string | null;
  verificationNumber: string | null;
  bvn: string | null;
};

export type ComplianceResponseData = {
  id: number;
  merchantCode: string;
  merchantName: string;
  documents: ComplianceDocument[];
  businessInfo: BusinessInfo;
  financialInfo: FinancialInfo;
  owners: OwnerInfo[];
  pciDssCompliant: boolean;
  progress: number; // 6 == complete
  uses3dSecure: boolean;
  dataProtectionPolicy: boolean;
  prohibitedActivitiesDeclaration: string | null;
  status: string; // under_review, approved, etc
  reviewedAt: string | null;
  reviewedBy: string | null;
  validationReference: string | null;
  verificationComment: string | null;
};

export type ComplianceApiResponse = {
  requestSuccessful: boolean;
  responseData: ComplianceResponseData;
  message: string;
  responseCode: string;
};
