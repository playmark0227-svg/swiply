"use client";

import { Job } from "@/types/job";
import Image from "next/image";

interface JobCardProps {
  job: Job;
}

export default function JobCard({ job }: JobCardProps) {
  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl bg-white select-none">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={job.image}
          alt={job.company}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 400px"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-black/5" />
      </div>

      {/* Employment type badge */}
      <div className="absolute top-3 left-3 z-10">
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/90 text-gray-900 backdrop-blur-sm shadow-sm">
          {job.employmentType}
        </span>
      </div>

      {/* Content - positioned from bottom */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 text-white">
        {/* Catchphrase */}
        <p className="text-[10px] font-bold tracking-wider text-amber-300 mb-0.5 uppercase leading-tight">
          {job.catchphrase}
        </p>

        {/* Title & Company */}
        <h2 className="text-lg font-extrabold leading-tight">{job.title}</h2>
        <p className="text-[11px] text-white/50 font-medium">{job.company}</p>

        {/* Salary highlight */}
        <p className="text-sm font-bold text-emerald-400 mt-1.5">{job.salary}</p>

        {/* Key info row */}
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

        {/* Experience */}
        <div className="mt-1.5 flex items-center gap-1">
          <svg className="w-2.5 h-2.5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-[10px] font-medium text-sky-300">{job.experience}</span>
        </div>

        {/* Tags */}
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
