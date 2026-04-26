export type JobType = "baito" | "career" | "gig";

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
}
