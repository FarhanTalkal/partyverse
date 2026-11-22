"use client";

import type { ReactNode } from "react";
import { MusicProvider } from "@/components/ui/MusicProvider";
import { SocketProvider } from "./SocketProvider";
import { ThemeProvider } from "./ThemeProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <MusicProvider>
        <SocketProvider>{children}</SocketProvider>
      </MusicProvider>
    </ThemeProvider>
  );
}
