export interface UpdateProfileRequest {
  firstName?: string | null;
  lastName?: string | null;
  usesHHMM?: boolean | null;
  isInstructor?: boolean | null;
  preferredTimeZoneId?: string | null;
  currencyJurisdiction?: string | null;
}

export interface UserProfile {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
  usesHHMM: boolean;
  isInstructor: boolean;
  preferredTimeZoneId: string | null;
  currencyJurisdiction: string;
  createdAt: string;
}
