import type { GameMode } from "@partyverse/shared";

export function defaultSettingsFor(mode: GameMode, practice = false) {
  if (mode === "chaos") {
    return {
      mode: "chaos" as const,
      chaos: { rounds: 10, responseTimeMs: 45000, voteTimeMs: 30000 },
    };
  }
  if (mode === "bluff") {
    return {
      mode: "bluff" as const,
      bluff: { discussionTimeMs: 60000, voteTimeMs: 30000 },
    };
  }
  if (mode === "mind") {
    return {
      mode: "mind" as const,
      mind: {
        rounds: practice ? 5 : 10,
        responseTimeMs: 25000,
        practice: practice || undefined,
      },
    };
  }
  return {
    mode: "brain" as const,
    brain: {
      category: "random" as const,
      difficulty: "medium" as const,
      rounds: practice ? 5 : 12,
      timePerQuestionMs: 20000,
      practice: practice || undefined,
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
  if (raw === "brain" || raw === "chaos" || raw === "bluff" || raw === "mind") {
    return raw;
  }
  return null;
}

export function clearPreferredMode() {
  sessionStorage.removeItem(PREFERRED_MODE_KEY);
}

export function inviteUrl(code: string) {
  if (typeof window === "undefined") return `/join?code=${code}`;
  return `${window.location.origin}/join?code=${code}`;
}
