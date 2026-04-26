/**
 * Stock video helpers for the swipe deck.
 *
 * Resolves a category-appropriate stock video for a job. Uses Mixkit's free
 * stock library — direct .mp4 URLs that have been stable for years. If a job
 * already has a `video` set, that takes precedence; otherwise we fall back to
 * a category-based default. Consumers should still gracefully degrade to
 * `job.image` if the video fails to load.
 *
 * (Mixkit videos are royalty-free for personal/commercial use under their
 * license — for production you should self-host or upload to your own CDN.)
 */

import type { Job } from "@/types/job";

const CATEGORY_VIDEOS: Record<string, string> = {
  food: "https://assets.mixkit.co/videos/preview/mixkit-coffee-being-poured-in-a-cup-44930-large.mp4",
  service:
    "https://assets.mixkit.co/videos/preview/mixkit-clothing-store-with-a-customer-3791-large.mp4",
  office:
    "https://assets.mixkit.co/videos/preview/mixkit-business-team-discussing-an-investment-strategy-31077-large.mp4",
  engineering:
    "https://assets.mixkit.co/videos/preview/mixkit-programmer-typing-on-laptop-keyboard-1731-large.mp4",
  creative:
    "https://assets.mixkit.co/videos/preview/mixkit-young-graphic-designer-working-at-her-office-29957-large.mp4",
  sales:
    "https://assets.mixkit.co/videos/preview/mixkit-business-team-strategy-meeting-31082-large.mp4",
  logistics:
    "https://assets.mixkit.co/videos/preview/mixkit-employee-loading-boxes-in-a-warehouse-7900-large.mp4",
  event:
    "https://assets.mixkit.co/videos/preview/mixkit-people-having-fun-at-a-bar-37918-large.mp4",
};

const FALLBACK_VIDEO =
  "https://assets.mixkit.co/videos/preview/mixkit-young-woman-vlogger-recording-a-video-46075-large.mp4";

export function getJobVideo(job: Job): string {
  if (job.video) return job.video;
  return CATEGORY_VIDEOS[job.category] ?? FALLBACK_VIDEO;
}
