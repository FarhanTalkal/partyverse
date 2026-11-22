import type { GameMode } from "@partyverse/shared";

export function defaultSettingsFor(mode: GameMode) {
  if (mode === "chaos") {
    return {
      mode: "chaos" as const,
      chaos: { rounds: 10, responseTimeMs: 45000, voteTimeMs: 30000 },
    };
  }
  if (mode === "bluff") {
    return {
      mode: "bluff" as const,
      bluff: {
        readingTimeMs: 45000,
        discussionTimeMs: 90000,
        voteTimeMs: 30000,
      },
    };
  }
  if (mode === "mind") {
    return {
      mode: "mind" as const,
      mind: {
        rounds: 10,
        responseTimeMs: 25000,
      },
    };
  }
  if (mode === "dilemma") {
    return {
      mode: "dilemma" as const,
      dilemma: { rounds: 10, voteTimeMs: 20000 },
    };
  }
  if (mode === "geet") {
    return {
      mode: "geet" as const,
      geet: { rounds: 8, responseTimeMs: 35000, voteTimeMs: 25000 },
    };
  }
  return {
    mode: "brain" as const,
    brain: {
      category: "random" as const,
      difficulty: "medium" as const,
      rounds: 12,
      timePerQuestionMs: 20000,
    },
  };
}

const PREFERRED_MODE_KEY = "partyverse.preferredMode";

export function savePreferredMode(mode: GameMode) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PREFERRED_MODE_KEY, mode);
}

export function loadPreferredMode(): GameMode | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(PREFERRED_MODE_KEY);
  if (
    raw === "brain" ||
    raw === "chaos" ||
    raw === "bluff" ||
    raw === "mind" ||
    raw === "dilemma" ||
    raw === "geet"
  ) {
    return raw;
  }
  return null;
}

export function clearPreferredMode() {
  sessionStorage.removeItem(PREFERRED_MODE_KEY);
}

export function inviteUrl(code: string) {
  const path = `/setup?code=${encodeURIComponent(code.toUpperCase())}`;
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
}
