"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

export function ConfettiBurst() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 24 }).map((_, i) => ({
        id: i,
        x: (i % 8) * 12 - 40,
        delay: (i % 6) * 0.05,
        color: ["#ff6b5b", "#1f8a7a", "#f0b429", "#38bdf8"][i % 4],
      })),
    []
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ opacity: 0, y: 20, x: p.x, scale: 0.6 }}
          animate={{ opacity: [0, 1, 0], y: -120, rotate: 180 }}
          transition={{ duration: 1.4, delay: p.delay }}
          className="absolute left-1/2 top-1/2 h-2 w-2 rounded-sm"
          style={{ background: p.color }}
        />
      ))}
    </div>
  );
}
