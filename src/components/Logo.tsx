"use client";

import Image from "next/image";

const BASE_PATH = process.env.NODE_ENV === "production" ? "/swiply" : "";

interface LogoProps {
  /** Pixel size of the square mark. */
  size?: number;
  /** Optional rounded radius (in px). Default: size / 4 (≈ 25% rounded). */
  radius?: number;
  className?: string;
  alt?: string;
  priority?: boolean;
}

/**
 * SWIPLY square mark — uses the uploaded logo image.
 * Always renders with the logo's native dark background; consumers should
 * not add their own background.
 */
export default function Logo({
  size = 32,
  radius,
  className = "",
  alt = "SWIPLY",
  priority = false,
}: LogoProps) {
  const r = radius ?? Math.round(size / 4);
  return (
    <span
      className={`relative inline-block overflow-hidden shrink-0 ${className}`}
      style={{ width: size, height: size, borderRadius: r }}
    >
      <Image
        src={`${BASE_PATH}/logo.png`}
        alt={alt}
        fill
        sizes={`${size}px`}
        className="object-cover"
        priority={priority}
        unoptimized
      />
    </span>
  );
}
