"use client";

import type { ReactNode } from "react";
import { SocketProvider } from "./SocketProvider";
import { ThemeProvider } from "./ThemeProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <SocketProvider>{children}</SocketProvider>
    </ThemeProvider>
  );
}
