export type JobType = "baito" | "career" | "gig";

/**
 * SWIPLY verification record.
 *
 * Companies submit documents + accept a SWIPLY interview, and on pass,
 * receive a "確認済み" badge that shows up on every surface (swipe card,
 * job detail, message thread). Designed to counter the「無名LPだと信頼
 * されない」problem岡崎さん raised.
 */
export interface VerificationDetails {
  /** When the company passed verification (ISO date). */
  verifiedAt: string;
  /** Items that were checked — shown in the verification details modal. */
  items: string[];
  /** Last re-verification pass (ISO). Re-verification is required yearly. */
  reviewedAt?: string;
}

/**
 * Brand-page module — used by the company-side branding feature
 * (#6, 親対策). Optional per company; rendered on /company/[id]/brand/.
 */
export interface BrandStaffVoice {
  name: string;
  role: string;
  joinedYear?: string;
  quote: string;
  photo?: string;
}

export interface BrandPress {
  outlet: string;
  title: string;
  url?: string;
  publishedAt?: string;
}

export interface BrandPage {
  /** Big tagline shown at the top of the brand page. */
  tagline: string;
  /** Multi-paragraph CEO message (visible to candidates + parents). */
  ceoMessage: string;
  ceoName: string;
  ceoPhoto?: string;
  /** Multiple workplace / culture videos. */
  videos: { title: string; url: string }[];
  /** Real staff voices — closer to "social proof" than ads. */
  staffVoices: BrandStaffVoice[];
  /** Headline benefits (休日, 福利厚生, 教育制度…). */
  benefitsHighlights: string[];
  /** Press / media coverage — credibility signal for parents. */
  press?: BrandPress[];
  /** Free-form HTML for ad-hoc messaging. */
  customHtml?: string;
}

export interface Job {
  id: string;
  type: JobType;
  company: string;
  title: string;
  salary: string;
  /** Numeric salary for filtering. baito/gig: hourly yen. career: monthly yen. gig: daily/3h normalised to hourly. */
  salaryValue: number;
  location: string;
  /** Region key for filter ("tokyo" | "kanagawa" | "saitama" | "chiba" | "osaka" | "remote" | "other") */
  region: string;
  catchphrase: string;
  image: string;
  video?: string;
  description: string;
  requirements: string[];
  benefits: string[];
  workHours: string;
  access: string;
  tags: string[];
  employmentType: string;
  ageRequirement?: string;
  minDays: string;
  experience: string;
  /** ISO date string for "新着" badge / sort by recent. */
  postedAt: string;
  /** Mock applicants-this-week. */
  applicants?: number;
  /** Mock view count for trending sort. */
  views?: number;
  /** Show 急募 badge. */
  urgent?: boolean;
  /** Featured / pinned job. */
  featured?: boolean;
  /** Remote OK badge. */
  remoteOk?: boolean;
  /** Coarse category for matching ("food" | "office" | "creative" | "engineering" | "sales" | "logistics" | "service" | "event") */
  category: string;
  companyDescription?: string;
  qa?: { q: string; a: string }[];
  // ─── New trust + speed signals (2026-05) ─────────────────────────
  /** SWIPLY 確認済み — set when verification has passed. */
  verification?: VerificationDetails;
  /** Whether SWIPLY-verified. Cached read of `!!verification`. */
  verified?: boolean;
  /**
   * Founding-member badge — companies who paid the永続20%OFF
   * fee in the first 100. Drives ⭐FOUNDING badge + priority swipe slot.
   */
  founding?: boolean;
  /**
   * 即日面接対応 — company commits to scheduling an interview
   * within 48h of the candidate's "面接希望" tap. Surfaced as
   * "🔥 今日・明日面接OK" badge + dedicated filter.
   */
  instantInterview?: boolean;
  /** Optional brand page payload. Lazy-loaded from the company brand route. */
  brand?: BrandPage;
}
