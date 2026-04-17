/**
 * Lightweight haptic feedback helper.
 * Uses navigator.vibrate where available (Android Chrome, some others).
 * On iOS Safari this silently no-ops (iOS doesn't expose vibrate),
 * but still provides subtle delight on supported devices.
 */

type HapticKind = "tick" | "soft" | "success" | "warn" | "error";

const PATTERNS: Record<HapticKind, number | number[]> = {
  tick: 5,
  soft: 10,
  success: [8, 30, 16],
  warn: [15, 40, 15],
  error: [20, 60, 20, 60, 20],
};

export function haptic(kind: HapticKind = "tick") {
  if (typeof navigator === "undefined") return;
  if (!("vibrate" in navigator)) return;
  try {
    navigator.vibrate(PATTERNS[kind]);
  } catch {
    // ignore
  }
}
