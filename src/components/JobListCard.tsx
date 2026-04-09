"use client";

import Link from "next/link";
import Image from "next/image";
import { Job } from "@/types/job";

interface JobListCardProps {
  job: Job;
}

export default function JobListCard({ job }: JobListCardProps) {
  return (
    <Link href={`/job/${job.id}`} className="block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow active:scale-[0.99]">
        {/* Image */}
        <div className="relative h-36">
          <Image
            src={job.image}
            alt={job.company}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 350px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          {/* Badge */}
          <div className="absolute top-2.5 left-2.5">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 text-gray-900">
              {job.employmentType}
            </span>
          </div>
          {/* Salary overlay */}
          <div className="absolute bottom-2.5 left-2.5">
            <span className="text-sm font-bold text-emerald-300">{job.salary}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-3">
          <h3 className="text-sm font-extrabold text-gray-900 leading-tight">{job.title}</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">{job.company}</p>

          {/* Info row */}
          <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-400">
            <span className="flex items-center gap-0.5">
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              {job.location}
            </span>
            <span>{job.minDays}</span>
          </div>

          {/* Experience */}
          <div className="mt-1.5 flex items-center gap-1">
            <svg className="w-2.5 h-2.5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-[10px] font-medium text-sky-600">{job.experience}</span>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mt-2">
            {job.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full bg-gray-50 text-[10px] font-medium text-gray-500"
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
