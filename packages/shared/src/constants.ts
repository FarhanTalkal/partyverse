export const ROOM_CODE_LENGTH = 6;
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 8;
export const BLUFF_RECOMMENDED_MIN = 4;
export const NICKNAME_MIN = 2;
export const NICKNAME_MAX = 16;
export const CHAT_MAX_LENGTH = 200;
export const DEFAULT_QUESTION_TIME_MS = 20000;
export const DEFAULT_RESULT_TIME_MS = 5000;
export const DEFAULT_DISCUSSION_TIME_MS = 60000;
export const DEFAULT_VOTE_TIME_MS = 30000;
export const DEFAULT_RESPONSE_TIME_MS = 45000;
export const BRAIN_BASE_POINTS = 100;
export const BRAIN_SPEED_BONUS_MAX = 50;
export const CHAOS_VOTE_POINTS = 50;
export const CHAOS_RESPONSE_POINTS = 25;
export const MIND_MATCH_POINTS = 60;
export const MIND_TRIPLE_BONUS = 40;
export const DILEMMA_MAJORITY_POINTS = 40;
export const DILEMMA_MINORITY_POINTS = 70;
export const GEET_VOTE_POINTS = 50;
export const GEET_RESPONSE_POINTS = 20;

export const AVATARS = [
  "cat",
  "lion",
  "ironman",
  "panda",
  "fox",
  "tiger",
  "peacock",
  "robot",
] as const;

export type AvatarId = (typeof AVATARS)[number];

export const AVATAR_META: Record<
  AvatarId,
  { label: string; emoji: string }
> = {
  cat: { label: "Cat", emoji: "🐱" },
  lion: { label: "Lion", emoji: "🦁" },
  ironman: { label: "Hero", emoji: "🦸" },
  panda: { label: "Panda", emoji: "🐼" },
  fox: { label: "Fox", emoji: "🦊" },
  tiger: { label: "Tiger", emoji: "🐯" },
  peacock: { label: "Bird", emoji: "🦚" },
  robot: { label: "Bot", emoji: "🤖" },
};

export const GAME_MODES = [
  "brain",
  "chaos",
  "bluff",
  "mind",
  "dilemma",
  "geet",
] as const;
export type GameMode = (typeof GAME_MODES)[number];

export const GAME_MODE_META: Record<
  GameMode,
  { name: string; tagline: string; blurb: string }
> = {
  brain: {
    name: "Brain Battle",
    tagline: "Family trivia night",
    blurb: "Festivals, food, cricket, films, and fun riddles for every age.",
  },
  chaos: {
    name: "Chaos Challenge",
    tagline: "Laugh-out-loud prompts",
    blurb: "Would-you-rathers, chai debates, and silly voting rounds together.",
  },
  bluff: {
    name: "Bluff & Betray",
    tagline: "Friendly mystery",
    blurb: "Secret roles, gentle clues, chat, and a playful group reveal.",
  },
  mind: {
    name: "Mind Match",
    tagline: "Think alike",
    blurb: "Same prompt for everyone — matching answers bring you closer.",
  },
  dilemma: {
    name: "Desi Dilemma",
    tagline: "Two choices. Pick a side.",
    blurb: "India debates in seconds — majority or minority scoring keeps it spicy.",
  },
  geet: {
    name: "Geet Round",
    tagline: "Song titles under pressure",
    blurb: "Get a letter, drop a song title, then vote for the catchiest pick.",
  },
};

export const ROOM_STATES = [
  "WAITING",
  "GAME_SELECTION",
  "PREPARING_ROUND",
  "IN_PROGRESS",
  "ROUND_RESULTS",
  "GAME_RESULTS",
  "CLOSED",
] as const;

export type RoomState = (typeof ROOM_STATES)[number];

export const BRAIN_CATEGORIES = [
  "festivals",
  "bollywood",
  "food",
  "cricket",
  "geography",
  "mythology",
  "riddles",
  "random",
] as const;

export type BrainCategory = (typeof BRAIN_CATEGORIES)[number];

export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const CHAT_EMOJI_SUGGESTIONS = [
  "😀",
  "😂",
  "🥳",
  "🔥",
  "👏",
  "❤️",
  "🎉",
  "🇮🇳",
] as const;

export const CHAT_EMOJIS = [
  ...CHAT_EMOJI_SUGGESTIONS,
  "😎",
  "🤯",
  "🙌",
  "💯",
  "🏏",
  "👀",
  "🧠",
  "🎭",
  "😅",
  "🥰",
  "😇",
  "🤩",
  "😴",
  "🤔",
  "😭",
  "😤",
  "🤗",
  "😜",
  "✨",
  "💪",
  "🙏",
  "🏆",
  "🎯",
  "🍕",
  "☕",
  "🎵",
  "🌟",
  "🚀",
  "🦄",
  "🐱",
] as const;
