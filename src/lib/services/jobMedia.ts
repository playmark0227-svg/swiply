/**
 * Stock video helpers for the swipe deck.
 *
 * Resolves a sample video URL for each job. We use a pool of verified
 * publicly-accessible MP4s (test/demo CDNs that allow hotlinking and have
 * been stable for years) and assign one to each job deterministically
 * via an ID hash, so every job gets the same video on every render.
 *
 * If a job already has `video` set in `data/jobs.ts`, that takes precedence.
 *
 * Note: these are placeholder demo videos (sample reels, nature footage,
 * Blender open-movie trailers, etc.). For production, swap in real footage
 * uploaded to your own CDN.
 */

import type { Job } from "@/types/job";

/** Pool of verified-working public sample MP4s. */
const VIDEO_POOL: string[] = [
  // Pexels public preview reels (work-themed lifestyle clips)
  "https://videos.pexels.com/video-files/3209828/3209828-hd_1280_720_25fps.mp4",
  "https://videos.pexels.com/video-files/854088/854088-hd_1280_720_25fps.mp4",
  "https://videos.pexels.com/video-files/853874/853874-hd_1280_720_25fps.mp4",
  // test-videos.co.uk (Big Buck Bunny / Sintel / Jellyfish — small 720p, ~2MB)
  "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_2MB.mp4",
  "https://test-videos.co.uk/vids/sintel/mp4/h264/720/Sintel_720_10s_2MB.mp4",
  "https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_2MB.mp4",
  // samplelib.com — variety of durations
  "https://download.samplelib.com/mp4/sample-5s.mp4",
  "https://download.samplelib.com/mp4/sample-10s.mp4",
  "https://download.samplelib.com/mp4/sample-15s.mp4",
  "https://download.samplelib.com/mp4/sample-20s.mp4",
  "https://download.samplelib.com/mp4/sample-30s.mp4",
  // W3C / Blender open-movie trailers (long-running, very stable)
  "https://media.w3.org/2010/05/sintel/trailer.mp4",
  "https://media.w3.org/2010/05/bunny/trailer.mp4",
  "https://media.w3.org/2010/05/video/movie_300.mp4",
  "https://download.blender.org/durian/trailer/sintel_trailer-720p.mp4",
  // videojs CDN
  "https://vjs.zencdn.net/v/oceans.mp4",
  // learningcontainer.com sample
  "https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4",
];

/**
 * Final fallback video. Used if a job has no explicit video and the hashed
 * pick somehow lands out of bounds (it shouldn't — defensive).
 */
const FALLBACK_VIDEO = "https://vjs.zencdn.net/v/oceans.mp4";

/** djb2 — small, fast, reasonably uniform string hash. */
function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function getJobVideo(job: Job): string {
  if (job.video) return job.video;
  if (VIDEO_POOL.length === 0) return FALLBACK_VIDEO;
  const idx = hash(job.id) % VIDEO_POOL.length;
  return VIDEO_POOL[idx] ?? FALLBACK_VIDEO;
}
