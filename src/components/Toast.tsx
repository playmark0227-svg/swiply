"use client";

import { AnimatePresence, motion } from "framer-motion";
import { createContext, useCallback, useContext, useState } from "react";

type ToastKind = "success" | "info" | "error";
type Toast = { id: number; message: string; kind: ToastKind };

const ToastContext = createContext<{
  show: (message: string, kind?: ToastKind) => void;
} | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, kind: ToastKind = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, kind }]);
    // light haptic
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(kind === "error" ? [10, 30, 10] : 10);
      } catch {}
    }
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2200);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed top-3 left-0 right-0 z-[100] flex flex-col items-center gap-2 pointer-events-none px-4">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold shadow-lg backdrop-blur-xl max-w-[90%] ${
                t.kind === "success"
                  ? "bg-emerald-500/95 text-white shadow-emerald-200/50"
                  : t.kind === "error"
                  ? "bg-red-500/95 text-white shadow-red-200/50"
                  : "bg-gray-900/95 text-white shadow-gray-300/30"
              }`}
            >
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Safe fallback for SSR / uninitialized: no-op
    return { show: () => {} };
  }
  return ctx;
}
