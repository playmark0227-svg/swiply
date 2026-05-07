"use client";

/**
 * The interview room itself.
 *
 * Three responsibilities:
 *   1. Embed Jitsi Meet via <iframe> (handles all WebRTC).
 *   2. If recording was consented, run a parallel `getUserMedia` audio
 *      stream + MediaRecorder. The Jitsi iframe doesn't expose the local
 *      audio track, so we capture the mic ourselves; the iframe gets its
 *      own permission and runs concurrently. (The OS lets multiple
 *      consumers share the mic.)
 *   3. When the interview ends, upload the recorded audio to the Worker
 *      for transcription + analysis, then update the appointment.
 *
 * The component is fully client-side; the parent route loads it via
 * `next/dynamic({ ssr: false })`.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  type InterviewAppointment,
  analyzeInterview,
  buildJitsiUrl,
  formatJaDateTime,
  transcribeAudio,
  updateInterview,
} from "@/lib/services/interviews";

type Phase =
  | "ready" // pre-call screen — show details + Join button
  | "live" // iframe mounted, optionally recording
  | "processing" // upload + transcribe + analyze
  | "done" // analysis written, show summary
  | "error";

interface Props {
  appointment: InterviewAppointment;
  /** Display name to pass to Jitsi. */
  displayName: string;
  /** Whether we should record + transcribe + analyze. */
  recordingEnabled: boolean;
  /** Whose perspective is this? (drives which analysis slot is filled). */
  mode: "user" | "company";
}

export default function InterviewRoom({
  appointment: initial,
  displayName,
  recordingEnabled,
  mode,
}: Props) {
  const [appointment, setAppointment] = useState(initial);
  const [phase, setPhase] = useState<Phase>("ready");
  const [progress, setProgress] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [recordingMs, setRecordingMs] = useState(0);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingStartRef = useRef<number>(0);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (tickerRef.current) clearInterval(tickerRef.current);
      try {
        if (recorderRef.current?.state === "recording") {
          recorderRef.current.stop();
        }
      } catch {
        // ignore
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // ─── Recording lifecycle ────────────────────────────────────────────
  async function startRecording(): Promise<void> {
    if (!recordingEnabled) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream, {
        mimeType: pickMimeType(),
      });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start(2000); // emit chunks every 2s
      recorderRef.current = recorder;
      recordingStartRef.current = Date.now();
      tickerRef.current = setInterval(() => {
        setRecordingMs(Date.now() - recordingStartRef.current);
      }, 1000);
    } catch (e) {
      // Permission denied or no mic — log but keep the call going.
      console.warn("[interview] recording start failed:", e);
    }
  }

  function stopRecording(): Promise<Blob | null> {
    return new Promise((resolve) => {
      const r = recorderRef.current;
      if (!r) {
        resolve(null);
        return;
      }
      if (r.state === "inactive") {
        const blob = new Blob(chunksRef.current, {
          type: chunksRef.current[0]?.type || "audio/webm",
        });
        resolve(blob.size > 0 ? blob : null);
        return;
      }
      r.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: chunksRef.current[0]?.type || "audio/webm",
        });
        streamRef.current?.getTracks().forEach((t) => t.stop());
        if (tickerRef.current) {
          clearInterval(tickerRef.current);
          tickerRef.current = null;
        }
        resolve(blob.size > 0 ? blob : null);
      };
      try {
        r.stop();
      } catch {
        resolve(null);
      }
    });
  }

  // ─── Phase actions ──────────────────────────────────────────────────
  async function handleJoin() {
    setPhase("live");
    updateInterview(appointment.id, {
      status: "in_progress",
      recordedAt: recordingEnabled ? new Date().toISOString() : undefined,
    });
    await startRecording();
  }

  async function handleEnd() {
    if (!confirm("面接を終了しますか？録画は停止して AI 振り返りを作成します。")) {
      return;
    }
    setPhase("processing");
    setProgress("録画を保存中…");

    let finalAppointment = appointment;
    finalAppointment =
      updateInterview(appointment.id, { status: "completed" }) ??
      finalAppointment;

    if (!recordingEnabled) {
      setAppointment(finalAppointment);
      setPhase("done");
      return;
    }

    try {
      const blob = await stopRecording();
      if (!blob) {
        setAppointment(finalAppointment);
        setPhase("done");
        return;
      }

      setProgress("音声を文字起こし中…");
      const tr = await transcribeAudio(blob);
      if (!tr.ok || !tr.transcript) {
        setError(tr.error || "transcription failed");
        setPhase("error");
        return;
      }
      finalAppointment =
        updateInterview(appointment.id, { transcript: tr.transcript }) ??
        finalAppointment;

      setProgress("AI 振り返りを作成中…");
      const an = await analyzeInterview(tr.transcript, mode, {
        jobTitle: appointment.jobTitle,
        jobCompany: appointment.jobCompany,
      });
      if (!an.ok || !an.analysis) {
        setError(an.error || "analysis failed");
        setPhase("error");
        return;
      }
      finalAppointment =
        updateInterview(appointment.id, {
          [mode === "user" ? "analysisForUser" : "analysisForCompany"]:
            an.analysis,
        }) ?? finalAppointment;

      setAppointment(finalAppointment);
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPhase("error");
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────
  if (phase === "ready") {
    return (
      <ReadyView
        appointment={appointment}
        recordingEnabled={recordingEnabled}
        onJoin={handleJoin}
      />
    );
  }
  if (phase === "live") {
    return (
      <LiveView
        appointment={appointment}
        displayName={displayName}
        recordingEnabled={recordingEnabled}
        recordingMs={recordingMs}
        onEnd={handleEnd}
      />
    );
  }
  if (phase === "processing") {
    return <ProcessingView progress={progress} />;
  }
  if (phase === "error") {
    return <ErrorView message={error} appointmentId={appointment.id} />;
  }
  return <DoneView appointment={appointment} mode={mode} />;
}

// ─── Sub-views ────────────────────────────────────────────────────────

function ReadyView({
  appointment,
  recordingEnabled,
  onJoin,
}: {
  appointment: InterviewAppointment;
  recordingEnabled: boolean;
  onJoin: () => void;
}) {
  return (
    <div className="min-h-dvh bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={appointment.jobImage}
          alt={appointment.jobCompany}
          className="w-16 h-16 rounded-2xl object-cover mx-auto mb-3 ring-2 ring-violet-100"
        />
        <h1 className="text-center text-base font-extrabold text-gray-900">
          {appointment.jobCompany}
        </h1>
        <p className="text-center text-[12px] text-gray-500 mb-4">
          {appointment.jobTitle}
        </p>
        <div className="bg-gray-50 rounded-2xl px-4 py-3.5 text-[12px] text-gray-700 space-y-1 mb-4 border border-gray-100">
          <Row label="日時" value={formatJaDateTime(appointment.scheduledAt)} />
          <Row label="所要時間" value={`${appointment.durationMinutes}分`} />
          {appointment.title && <Row label="議題" value={appointment.title} />}
          {appointment.notes && <Row label="メモ" value={appointment.notes} />}
        </div>
        <div
          className={`rounded-2xl px-3.5 py-2.5 text-[11px] mb-4 ${
            recordingEnabled
              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
              : "bg-gray-50 text-gray-600 border border-gray-100"
          }`}
        >
          {recordingEnabled
            ? "🔴 録画と AI 振り返りが有効です"
            : "○ 録画なしで参加します（AI 振り返りは作成されません）"}
        </div>
        <button
          onClick={onJoin}
          className="w-full py-3 rounded-2xl text-sm font-extrabold text-white bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-md shadow-violet-200/60 active:scale-[0.98] transition"
        >
          面接ルームに入る
        </button>
        <Link
          href="/messages"
          className="block text-center text-[11px] text-gray-400 mt-3 hover:text-gray-600"
        >
          メッセージに戻る
        </Link>
      </div>
    </div>
  );
}

function LiveView({
  appointment,
  displayName,
  recordingEnabled,
  recordingMs,
  onEnd,
}: {
  appointment: InterviewAppointment;
  displayName: string;
  recordingEnabled: boolean;
  recordingMs: number;
  onEnd: () => void;
}) {
  const url = buildJitsiUrl(appointment.roomName, displayName);
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="bg-black/80 text-white px-4 py-2 flex items-center gap-3 border-b border-white/10">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold truncate">
            {appointment.jobCompany}
          </p>
          <p className="text-[10px] text-white/60 truncate">
            {appointment.jobTitle}
          </p>
        </div>
        {recordingEnabled && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-400/40">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
            <span className="text-[10px] font-bold text-rose-200">REC</span>
            <span className="text-[10px] text-rose-200/80 tabular-nums">
              {formatDuration(recordingMs)}
            </span>
          </div>
        )}
        <button
          onClick={onEnd}
          className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-bold"
        >
          終了
        </button>
      </div>
      <iframe
        src={url}
        title="ビデオ面接"
        allow="camera; microphone; fullscreen; speaker; display-capture; autoplay"
        className="flex-1 w-full bg-black"
      />
    </div>
  );
}

function ProcessingView({ progress }: { progress: string }) {
  return (
    <div className="min-h-dvh bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white flex items-center justify-center mb-4 animate-pulse">
          <svg className="w-7 h-7 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.4}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 12a8 8 0 0 1 8-8" />
          </svg>
        </div>
        <p className="text-sm font-extrabold text-gray-900 mb-1">
          {progress || "処理中…"}
        </p>
        <p className="text-[12px] text-gray-500">
          画面はそのままお待ちください
        </p>
      </div>
    </div>
  );
}

function ErrorView({
  message,
  appointmentId,
}: {
  message: string;
  appointmentId: string;
}) {
  return (
    <div className="min-h-dvh bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 4h.01M4.93 19h14.14a2 2 0 0 0 1.74-3l-7.07-12.25a2 2 0 0 0-3.48 0L3.2 16a2 2 0 0 0 1.73 3z" />
          </svg>
        </div>
        <p className="text-sm font-extrabold text-gray-900 mb-2">
          振り返り作成に失敗しました
        </p>
        <p className="text-[11px] text-gray-500 mb-5 break-words">
          {message}
        </p>
        <Link
          href={`/interview/analysis/?id=${appointmentId}`}
          className="inline-block px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-[12px] font-bold hover:bg-gray-200"
        >
          後で開く
        </Link>
      </div>
    </div>
  );
}

function DoneView({
  appointment,
  mode,
}: {
  appointment: InterviewAppointment;
  mode: "user" | "company";
}) {
  const has =
    mode === "user"
      ? !!appointment.analysisForUser
      : !!appointment.analysisForCompany;
  return (
    <div className="min-h-dvh bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-6 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center mb-3">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.4}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-base font-extrabold text-gray-900 mb-1">
          面接が終了しました
        </h1>
        <p className="text-[12px] text-gray-500 mb-5">
          おつかれさまでした✨
        </p>
        {has && (
          <Link
            href={`/interview/analysis/?id=${appointment.id}&mode=${mode}`}
            className="block w-full py-3 rounded-2xl text-sm font-extrabold text-white bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-md shadow-violet-200/60 mb-2"
          >
            AI 振り返りを見る
          </Link>
        )}
        <Link
          href="/messages"
          className="block w-full py-3 rounded-2xl text-sm font-bold text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100"
        >
          メッセージに戻る
        </Link>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="font-bold text-gray-900 text-right break-words">
        {value}
      </span>
    </div>
  );
}

function formatDuration(ms: number): string {
  const sec = Math.floor(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function pickMimeType(): string {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  for (const t of candidates) {
    if (
      typeof MediaRecorder !== "undefined" &&
      typeof MediaRecorder.isTypeSupported === "function" &&
      MediaRecorder.isTypeSupported(t)
    ) {
      return t;
    }
  }
  return "audio/webm";
}
