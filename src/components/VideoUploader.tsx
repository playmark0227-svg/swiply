"use client";

import { useEffect, useRef, useState } from "react";
import {
  deleteVideo,
  getVideoUrl,
  isVideoRef,
  putVideo,
  refToDisplayId,
} from "@/lib/services/videoStore";

interface Props {
  /**
   * Current video reference. Either:
   *   - "idb://video-{id}" — stored locally, will be resolved & previewed
   *   - "https://..." — external URL, shown as text + previewed inline
   *   - "" / undefined — empty
   */
  value: string;
  onChange: (next: string) => void;
}

function fmtBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Drop / pick / paste a video file. Stored in IndexedDB; the form's
 * value becomes a synthetic `idb://video-{id}` ref. Also supports
 * pasting/typing an external URL directly.
 */
export default function VideoUploader({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [meta, setMeta] = useState<{
    filename?: string;
    size?: number;
    type?: string;
  }>({});

  // Build a preview URL for the current value.
  useEffect(() => {
    setError("");
    if (!value) {
      setPreviewUrl(null);
      setMeta({});
      return;
    }
    if (!isVideoRef(value)) {
      setPreviewUrl(value);
      setMeta({});
      return;
    }
    let cancelled = false;
    let createdUrl: string | null = null;
    setPreviewLoading(true);
    getVideoUrl(value).then((url) => {
      setPreviewLoading(false);
      if (cancelled) {
        if (url) URL.revokeObjectURL(url);
        return;
      }
      createdUrl = url;
      setPreviewUrl(url);
      if (!url) setError("保存された動画が見つかりません");
    });
    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [value]);

  async function handleFile(file: File) {
    setError("");
    if (!file.type.startsWith("video/")) {
      setError("動画ファイル（mp4 / mov / webm 等）を指定してください");
      return;
    }
    setMeta({
      filename: file.name,
      size: file.size,
      type: file.type,
    });
    setUploading(true);
    try {
      // If the previous value was an idb:// ref, drop the old blob.
      if (isVideoRef(value)) {
        await deleteVideo(value).catch(() => undefined);
      }
      const ref = await putVideo(file);
      onChange(ref);
    } catch (e) {
      setError(e instanceof Error ? e.message : "アップロードに失敗しました");
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function onPaste(e: React.ClipboardEvent) {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === "file" && item.type.startsWith("video/")) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          handleFile(file);
          return;
        }
      }
    }
  }

  async function clearVideo() {
    if (isVideoRef(value)) {
      await deleteVideo(value).catch(() => undefined);
    }
    setMeta({});
    onChange("");
  }

  const isLocal = isVideoRef(value);

  return (
    <div className="space-y-3" onPaste={onPaste}>
      {/* Drop zone */}
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`relative block cursor-pointer rounded-2xl border-2 border-dashed transition ${
          dragOver
            ? "border-blue-500 bg-blue-50"
            : "border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/40"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            // reset so selecting the same file again still triggers change
            e.currentTarget.value = "";
          }}
        />
        <div className="px-5 py-8 text-center">
          {uploading ? (
            <p className="text-[13px] font-bold text-blue-600">
              アップロード中…
            </p>
          ) : (
            <>
              <svg
                className="w-9 h-9 mx-auto text-gray-300 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-[13px] font-bold text-gray-700">
                ここに動画をドラッグ＆ドロップ
              </p>
              <p className="text-[11px] text-gray-500 mt-1">
                またはクリックしてファイルを選択 ／ 動画ファイルをペースト
              </p>
              <p className="text-[10px] text-gray-400 mt-2">
                対応形式: mp4, mov, webm 等
              </p>
            </>
          )}
        </div>
      </label>

      {/* Or external URL */}
      <div>
        <label className="block text-[10px] font-bold text-gray-400 mb-1.5 tracking-wider uppercase">
          または 動画URL を直接入力
        </label>
        <input
          type="url"
          value={isLocal ? "" : value}
          onChange={(e) => onChange(e.target.value)}
          disabled={isLocal}
          placeholder="https://example.com/video.mp4 （未指定ならカテゴリ別の自動マップを使用）"
          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 disabled:bg-gray-50 disabled:text-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* Preview */}
      {(previewUrl || previewLoading) && (
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
          <div className="flex items-start gap-3">
            {previewLoading ? (
              <div className="w-32 h-20 bg-gray-200 rounded-lg animate-pulse" />
            ) : previewUrl ? (
              <video
                src={previewUrl}
                muted
                playsInline
                controls
                className="w-40 max-w-[40%] rounded-lg bg-black"
              />
            ) : null}
            <div className="min-w-0 flex-1 text-[12px] space-y-0.5">
              <p className="font-bold text-gray-900">
                {isLocal ? "ローカル保存（IndexedDB）" : "外部URL"}
              </p>
              {isLocal && (
                <p className="text-gray-500 font-mono text-[11px]">
                  {refToDisplayId(value)}
                </p>
              )}
              {meta.filename && (
                <p className="text-gray-600 truncate">{meta.filename}</p>
              )}
              {meta.size != null && (
                <p className="text-gray-400">
                  {fmtBytes(meta.size)}
                  {meta.type && ` ／ ${meta.type}`}
                </p>
              )}
              <button
                type="button"
                onClick={clearVideo}
                className="text-rose-500 hover:underline text-[11px] font-bold mt-1"
              >
                {isLocal ? "削除する" : "クリア"}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="text-[12px] text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}
