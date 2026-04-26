export type KycStatus = "unverified" | "pending" | "verified" | "rejected";

export interface KycRecord {
  status: KycStatus;
  submittedAt?: string;
  verifiedAt?: string;
  /** Demo confidence score from the simulated face match. */
  matchConfidence?: number;
  /** Last 4 of the document number for display only. */
  documentLast4?: string;
}

export interface UserProfile {
  name: string;
  age: string;
  gender: string;
  photo: string;
  selfIntro: string;
  hobbies: string[];
  skills: string[];
  location: string;
  desiredJobType: "baito" | "career" | "gig" | "both";
  desiredLocations: string[];
  desiredCategories: string[];
  desiredMinSalary: string;
  desiredDays: string;
  experience: string;
  education: string;
  /** Whether the user has completed onboarding. */
  onboarded: boolean;
  /** Email/notification opt-ins. */
  notifyNewMatches: boolean;
  /** Identity verification (eKYC) state. */
  kyc: KycRecord;
}

export const defaultProfile: UserProfile = {
  name: "",
  age: "",
  gender: "",
  photo: "",
  selfIntro: "",
  hobbies: [],
  skills: [],
  location: "",
  desiredJobType: "both",
  desiredLocations: [],
  desiredCategories: [],
  desiredMinSalary: "",
  desiredDays: "",
  experience: "",
  education: "",
  onboarded: false,
  notifyNewMatches: true,
  kyc: { status: "unverified" },
};
