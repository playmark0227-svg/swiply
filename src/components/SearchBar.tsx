"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { haptic } from "@/lib/haptic";

interface Props {
  defaultValue?: string;
  /** When provided, search is controlled and submits via callback (no nav). */
  onSubmit?: (q: string) => void;
  placeholder?: string;
  /** When true, navigates to /search?q=... on submit. */
  navigateToSearch?: boolean;
  className?: string;
  autoFocus?: boolean;
}

export default function SearchBar({
  defaultValue = "",
  onSubmit,
  placeholder = "職種・地域・キーワードで検索",
  navigateToSearch,
  className,
  autoFocus,
}: Props) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  useEffect(() => setValue(defaultValue), [defaultValue]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    haptic("tick");
    const q = value.trim();
    if (onSubmit) {
      onSubmit(q);
      return;
    }
    if (navigateToSearch) {
      router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
    }
  }

  return (
    <form
      onSubmit={submit}
      className={`flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-3.5 h-11 md:h-12 shadow-sm focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-100 transition ${className ?? ""}`}
    >
      <svg
        className="w-4 h-4 text-gray-400 shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="flex-1 min-w-0 bg-transparent text-sm md:text-[15px] text-gray-900 placeholder:text-gray-300 focus:outline-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          aria-label="クリア"
          className="text-gray-300 hover:text-gray-500"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      <button
        type="submit"
        className="text-[12px] md:text-[13px] font-bold text-violet-600 hover:text-violet-700 px-1"
      >
        検索
      </button>
    </form>
  );
}
