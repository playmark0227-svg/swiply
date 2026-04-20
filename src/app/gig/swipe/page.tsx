"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import SwipeDeck from "@/components/SwipeDeck";
import { getJobsByType } from "@/lib/services/jobs";
import type { Job } from "@/types/job";

export default function GigSwipePage() {
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    getJobsByType("gig").then(setJobs);
  }, []);

  return (
    <div className="swipe-page flex flex-col h-dvh bg-gray-50">
      <Header />
      <main className="flex-1 relative overflow-hidden">
        <div className="max-w-lg mx-auto h-full p-2 pb-0">
          <SwipeDeck jobs={jobs} />
        </div>
      </main>
    </div>
  );
}
