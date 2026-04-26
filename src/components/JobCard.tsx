"use client";

import { useEffect, useRef, useState } from "react";
import { Job } from "@/types/job";
import { getJobVideo } from "@/lib/services/jobMedia";

interface JobCardProps {
  job: Job;
  /** When false, video is paused. Used for off-screen / preview cards. */
  active?: boolean;
}

export default function JobCard({ job, active = true }: JobCardProps) {
  const videoUrl = getJobVideo(job);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [muted, setMuted] = useState(true);

  // Pause/play depending on active state.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (active && !videoFailed) {
      v.play().catch(() => {
        // Some browsers block autoplay even with muted; mark as failed and
        // surface the play button.
        setVideoFailed(true);
      });
    } else {
      v.pause();
    }
  }, [active, videoFailed]);

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl bg-gray-900 select-none">
      {/* Background — video only */}
      <div className="absolute inset-0 bg-black">
        {!videoFailed ? (
          <video
            ref={videoRef}
            src={videoUrl}
            muted={muted}
            loop
            playsInline
            preload="auto"
            onLoadedData={() => setVideoReady(true)}
            onError={() => setVideoFailed(true)}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          // Final fallback: solid gradient (rare — only if the video CDN is
          // unreachable AND the browser blocked autoplay).
          <div className="absolute inset-0 bg-gradient-to-br from-violet-700 via-fuchsia-700 to-rose-600" />
        )}

        {/* Skeleton shimmer until first frame is ready */}
        {!videoReady && !videoFailed && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 animate-pulse" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-black/5 pointer-events-none" />
      </div>

      {/* Top-left badge */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1 items-start">
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/90 text-gray-900 backdrop-blur-sm shadow-sm">
          {job.employmentType}
        </span>
        {videoReady && !videoFailed && (
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/90 text-white backdrop-blur-sm shadow flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
            LIVE
          </span>
        )}
      </div>

      {/* Mute / unmute toggle */}
      {videoReady && !videoFailed && active && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMuted((m) => !m);
          }}
          aria-label={muted ? "ミュート解除" : "ミュート"}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center active:scale-90 transition"
        >
          {muted ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          )}
        </button>
      )}

      {/* Content - positioned from bottom */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 text-white">
        <p className="text-[10px] font-bold tracking-wider text-amber-300 mb-0.5 uppercase leading-tight">
          {job.catchphrase}
        </p>

        <h2 className="text-lg font-extrabold leading-tight">{job.title}</h2>
        <p className="text-[11px] text-white/50 font-medium">{job.company}</p>

        <p className="text-sm font-bold text-emerald-400 mt-1.5">{job.salary}</p>

        <div className="flex items-center gap-3 mt-1 text-[10px] text-white/50">
          <span className="flex items-center gap-1">
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            {job.location}
          </span>
          <span>{job.minDays}</span>
          <span>{job.workHours}</span>
        </div>

        <div className="mt-1.5 flex items-center gap-1">
          <svg className="w-2.5 h-2.5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-[10px] font-medium text-sky-300">{job.experience}</span>
        </div>

        <div className="flex flex-wrap gap-1 mt-1.5">
          {job.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-medium text-white/70"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
