"use client";

import Link from "next/link";
import Image from "next/image";
import { memo } from "react";
import { Job } from "@/types/job";
import { isNew } from "@/lib/services/search";

interface JobListCardProps {
  job: Job;
  /** Match badge to show next to title (e.g., "92% match"). */
  matchBadge?: string;
}

function JobListCardImpl({ job, matchBadge }: JobListCardProps) {
  const fresh = isNew(job, 3);
  return (
    <Link href={`/job/${job.id}`} className="block group">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100/80 group-hover:shadow-xl group-hover:shadow-gray-200/60 group-hover:border-violet-100 group-hover:-translate-y-1 transition-all duration-200 group-active:scale-[0.98]">
        {/* Image */}
        <div className="relative aspect-[4/3]">
          <Image
            src={job.image}
            alt={job.company}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 200px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          {/* Top-left status badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white/90 backdrop-blur-sm text-gray-800 shadow-sm">
              {job.employmentType}
            </span>
            {job.urgent && (
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-rose-500/95 text-white shadow-sm">
                急募
              </span>
            )}
            {fresh && !job.urgent && (
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/95 text-white shadow-sm">
                新着
              </span>
            )}
          </div>

          {/* Top-right flags */}
          <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
            {job.featured && (
              <span className="px-1.5 py-0.5 rounded-lg text-[9px] font-bold bg-amber-400/95 text-amber-900 shadow-sm">
                ★ PICK
              </span>
            )}
            {job.remoteOk && (
              <span className="px-1.5 py-0.5 rounded-lg text-[9px] font-bold bg-violet-500/90 text-white shadow-sm">
                リモートOK
              </span>
            )}
          </div>

          {/* Salary overlay */}
          <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-2">
            <span className="text-[13px] font-extrabold text-white drop-shadow">
              {job.salary}
            </span>
            {matchBadge && (
              <span className="px-1.5 py-0.5 rounded-md bg-white/90 text-violet-600 text-[10px] font-extrabold">
                {matchBadge}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-2.5 py-2.5">
          <h3 className="text-[13px] font-extrabold text-gray-900 leading-snug line-clamp-1">
            {job.title}
          </h3>
          <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{job.company}</p>

          {/* Info */}
          <div className="flex items-center gap-1 mt-1.5 text-[10px] text-gray-400">
            <svg className="w-3 h-3 shrink-0 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            <span className="truncate">{job.location}</span>
            <span className="text-gray-200">|</span>
            <span className="shrink-0">{job.minDays}</span>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mt-2">
            {job.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 rounded-md bg-violet-50 text-[9px] font-semibold text-violet-500"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}

/**
 * Memoized — `job` is a stable reference from the data layer, so this
 * skips re-renders when only sibling state (like list filters) changes.
 */
const JobListCard = memo(JobListCardImpl);
export default JobListCard;
