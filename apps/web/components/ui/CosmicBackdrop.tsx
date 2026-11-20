"use client";

import { useMemo } from "react";

export function CosmicBackdrop() {
  const sparks = useMemo(
    () =>
      Array.from({ length: 36 }).map((_, i) => ({
        id: i,
        left: `${(i * 29) % 100}%`,
        top: `${(i * 47) % 100}%`,
        delay: `${(i % 14) * 0.45}s`,
        duration: `${7 + (i % 8)}s`,
        size: 2 + (i % 4),
      })),
    []
  );

  return (
    <div className="pv-backdrop" aria-hidden>
      <div className="pv-mesh" />
      <div className="pv-aurora" />
      <div className="pv-beam pv-beam-a" />
      <div className="pv-beam pv-beam-b" />
      <div className="pv-blob pv-blob-a" />
      <div className="pv-blob pv-blob-b" />
      <div className="pv-blob pv-blob-c" />
      <div className="pv-ring pv-ring-a" />
      <div className="pv-ring pv-ring-b" />
      <div className="pv-particles">
        {sparks.map((p) => (
          <span
            key={p.id}
            style={{
              left: p.left,
              top: p.top,
              animationDelay: p.delay,
              animationDuration: p.duration,
              width: p.size,
              height: p.size,
            }}
          />
        ))}
      </div>
    </div>
  );
}
