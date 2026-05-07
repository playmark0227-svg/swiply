"use client";

/**
 * Interview room route.
 *
 * URL: /interview/?id=<interviewId>&mode=user|company
 *
 * - Reads the appointment from localStorage (via the interviews service).
 * - Asks for recording consent unless the URL says "noConsent=1" (used
 *   when re-entering after the consent is already known).
 * - Renders <InterviewRoom> client-side only (uses MediaRecorder + iframe,
 *   neither of which work in static export pre-rendering).
 *
 * Search-param routing keeps this compatible with `output: "export"` — no
 * `generateStaticParams` needed for the runtime-created interview IDs.
 */

import { Suspense, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  type InterviewAppointment,
  getInterviewById,
  subscribeInterviews,
} from "@/lib/services/interviews";
import { useAuth } from "@/components/AuthProvider";
import InterviewConsentDialog from "@/components/InterviewConsentDialog";

const InterviewRoom = dynamic(() => import("@/components/InterviewRoom"), {
  ssr: false,
  loading: () => (
    <div className="min-h-dvh flex items-center justify-center text-gray-400 text-sm">
      面接ルームを準備中…
    </div>
  ),
});

export default function InterviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center text-gray-400 text-sm">
          読み込み中…
        </div>
      }
    >
      <InterviewPageInner />
    </Suspense>
  );
}

function InterviewPageInner() {
  const params = useSearchParams();
  const id = params.get("id") ?? "";
  const mode: "user" | "company" =
    params.get("mode") === "company" ? "company" : "user";

  const auth = useAuth();
  const [appointment, setAppointment] = useState<
    InterviewAppointment | null | undefined
  >(undefined);
  const [consent, setConsent] = useState<boolean | null>(null);

  // Resolve from localStorage, and re-resolve on cross-tab updates.
  useEffect(() => {
    if (!id) return;
    const refresh = () => setAppointment(getInterviewById(id) ?? null);
    refresh();
    return subscribeInterviews(refresh);
  }, [id]);

  // Bail out before the effect even runs when the URL is malformed.
  if (!id) return <NotFoundView id="" />;

  if (appointment === undefined) {
    return (
      <div className="min-h-dvh flex items-center justify-center text-gray-400 text-sm">
        読み込み中…
      </div>
    );
  }

  if (!appointment) {
    return <NotFoundView id={id} />;
  }

  if (appointment.status === "cancelled") {
    return (
      <div className="min-h-dvh bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-base font-extrabold text-gray-900 mb-2">
            この面接はキャンセルされました
          </p>
          <Link
            href="/messages"
            className="inline-block px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-[12px] font-bold hover:bg-gray-200"
          >
            メッセージに戻る
          </Link>
        </div>
      </div>
    );
  }

  // If the interview already has analysis for this perspective, jump
  // straight to the analysis page — re-running it would overwrite.
  const alreadyAnalyzed =
    mode === "user"
      ? !!appointment.analysisForUser
      : !!appointment.analysisForCompany;

  // Consent state machine: ask once per visit unless already chosen.
  if (consent === null && !alreadyAnalyzed) {
    return (
      <InterviewConsentDialog
        open
        jobCompany={appointment.jobCompany}
        jobTitle={appointment.jobTitle}
        onConsent={() => setConsent(true)}
        onDecline={() => setConsent(false)}
        onCancel={() => {
          if (typeof window !== "undefined") window.history.back();
        }}
      />
    );
  }

  return (
    <InterviewRoom
      appointment={appointment}
      displayName={auth.session?.displayName ?? "ゲスト"}
      recordingEnabled={consent === true && !alreadyAnalyzed}
      mode={mode}
    />
  );
}

function NotFoundView({ id }: { id: string }) {
  return (
    <div className="min-h-dvh bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-base font-extrabold text-gray-900 mb-2">
          面接が見つかりません
        </p>
        <p className="text-[12px] text-gray-500 mb-5 break-all">
          {id ? `ID: ${id}` : "URL に id パラメータがありません"}
        </p>
        <Link
          href="/messages"
          className="inline-block px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-[12px] font-bold hover:bg-gray-200"
        >
          メッセージに戻る
        </Link>
      </div>
    </div>
  );
}
