const STORAGE_KEY = "swiply-likes";

export function getLikedJobIds(): string[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function addLike(jobId: string): void {
  const likes = getLikedJobIds();
  if (!likes.includes(jobId)) {
    likes.push(jobId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(likes));
  }
}

export function removeLike(jobId: string): void {
  const likes = getLikedJobIds().filter((id) => id !== jobId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(likes));
}

export function isLiked(jobId: string): boolean {
  return getLikedJobIds().includes(jobId);
}
