"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const LobbyScene = dynamic(
  () => import("./LobbyScene").then((m) => m.LobbyScene),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center">
        <div className="h-24 w-24 animate-pulse rounded-full bg-teal/20" />
      </div>
    ),
  }
);

export function LobbySceneLazy() {
  const [lite, setLite] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobile = window.matchMedia("(max-width: 768px)");
    const update = () => {
      setReduced(mq.matches);
      setLite(mq.matches || mobile.matches || navigator.hardwareConcurrency <= 4);
    };
    update();
    mq.addEventListener("change", update);
    mobile.addEventListener("change", update);
    return () => {
      mq.removeEventListener("change", update);
      mobile.removeEventListener("change", update);
    };
  }, []);

  if (reduced) {
    return (
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[2rem] bg-gradient-to-br from-coral/30 via-amber/20 to-teal/20">
        <div className="h-40 w-40 rounded-full bg-coral/80 shadow-glow" />
        <div className="absolute h-56 w-56 rounded-full border border-white/20" />
      </div>
    );
  }

  return <LobbyScene lite={lite} />;
}
