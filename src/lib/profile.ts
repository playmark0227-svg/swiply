import { UserProfile, defaultProfile } from "@/types/profile";

const STORAGE_KEY = "swiply-profile";

export function getProfile(): UserProfile {
  if (typeof window === "undefined") return defaultProfile;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? { ...defaultProfile, ...JSON.parse(stored) } : defaultProfile;
}

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}
