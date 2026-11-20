"use client";

import type { ConnectionStatus } from "@/components/providers/SocketProvider";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export function ConnectionPill({
  status,
  onRetry,
}: {
  status: ConnectionStatus;
  onRetry?: () => void;
}) {
  const label =
    status === "connected"
      ? "Connected"
      : status === "reconnecting"
        ? "Reconnecting…"
        : status === "offline"
          ? "Can't reach server"
          : "Connecting…";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
          status === "connected" && "bg-teal/20 text-teal",
          status === "connecting" && "bg-amber/20 text-amber",
          status === "reconnecting" && "bg-amber/20 text-amber",
          status === "offline" && "bg-coral/20 text-coral"
        )}
      >
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            status === "connected" && "bg-teal",
            status !== "connected" && "bg-current animate-pulse"
          )}
        />
        {label}
      </span>
      {status === "offline" && onRetry && (
        <Button size="sm" variant="ghost" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
