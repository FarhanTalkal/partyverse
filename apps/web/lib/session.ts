import type { AvatarId } from "@partyverse/shared";

const PROFILE_KEY = "partyverse.profile";
const MEMBERSHIP_KEY = "partyverse.membership";

export interface PlayerProfile {
  nickname: string;
  avatar: AvatarId;
}

export interface Membership {
  code: string;
  playerId: string;
  membershipToken: string;
}

export function loadProfile(): PlayerProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as PlayerProfile) : null;
  } catch {
    return null;
  }
}

export function saveProfile(profile: PlayerProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function loadMembership(): Membership | null {
  if (typeof window === "undefined") return null;
  try {
    // Prefer localStorage so switching apps/tabs doesn't drop the seat
    const raw =
      localStorage.getItem(MEMBERSHIP_KEY) ??
      sessionStorage.getItem(MEMBERSHIP_KEY);
    return raw ? (JSON.parse(raw) as Membership) : null;
  } catch {
    return null;
  }
}

export function saveMembership(membership: Membership) {
  localStorage.setItem(MEMBERSHIP_KEY, JSON.stringify(membership));
  sessionStorage.setItem(MEMBERSHIP_KEY, JSON.stringify(membership));
}

export function clearMembership() {
  localStorage.removeItem(MEMBERSHIP_KEY);
  sessionStorage.removeItem(MEMBERSHIP_KEY);
}
