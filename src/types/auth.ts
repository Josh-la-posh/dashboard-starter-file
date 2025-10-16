export type LoginPayload = { email: string; password: string };

export type ApiEnvelope<T> = {
  requestSuccessful: boolean;
  responseData: T;
  message: string;
  responseCode: string;
};

export type Aggregator = {
  aggregatorCode: string;
  aggregatorName: string;
};

export type Merchant = {
  id: number;
  contactEmail: string;
  supportEmail: string;
  disputeEmail: string;
  businessEmail: string;
  phoneNumber: string;
  website: string;
  merchantCode: string;
  merchantName: string;
  postalCode: string;
  countryCode: string;
  status: string;
  returnUrl: string;
  isWhitelisted: boolean;
  notificationURL: string;
  businessDescription: string;
  industryCategoryId: number;
  businessType: string;
  registrationType: string;
};

export type LoginUser = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  isEmailConfirmed: boolean;
  emailConfirmationDate: string;
  isAdmin: boolean;
  id: string;
  isActive: boolean;
  createdDate: string;
  modifiedDate: string;
  modifiedBy: string;
};

export type LoginResponseData = {
  accessToken: string;
  expiredIn: number;
  aggregator: Aggregator;
  merchants: Merchant[];
  user: LoginUser;
  complianceStatus?: 'pending' | 'under_review' | 'approved' | 'rejected';
};

export type LoginApiResponse = ApiEnvelope<LoginResponseData>;

export type Country = { id: string; countryName: string; code?: string };
export type Industry = { id: number; industryName: string };
export type IndustryCategory = { id: number; categoryName: string };

export type RegisterPayload = {
  country: string;
  businessName: string;
  contactEmail: string;
  contactPhoneNumber: string;
  contactFirstName: string;
  contactLastName: string;
};

export type RegisterResponseData = {
  id: number;
  contactEmail: string;
  countryCode: string;
  status: string;
  isWhitelisted: boolean;
  industryCategoryId: number;
  businessType: string;
  registrationType: string;
};

export type SetPasswordWithTokenPayload = {
  token: string;
  password: string;
  confirmPassword: string;
};