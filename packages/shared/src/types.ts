import type {
  AvatarId,
  BrainCategory,
  Difficulty,
  GameMode,
  RoomState,
} from "./constants";

export interface PublicPlayer {
  id: string;
  nickname: string;
  avatar: AvatarId;
  ready: boolean;
  connected: boolean;
  score: number;
  isHost: boolean;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  nickname: string;
  text: string;
  createdAt: number;
}

export interface BrainSettings {
  category: BrainCategory;
  difficulty: Difficulty;
  rounds: number;
  timePerQuestionMs: number;
  practice?: boolean;
}

export interface ChaosSettings {
  rounds: number;
  responseTimeMs: number;
  voteTimeMs: number;
}

export interface BluffSettings {
  discussionTimeMs: number;
  voteTimeMs: number;
}

export interface MindSettings {
  rounds: number;
  responseTimeMs: number;
  practice?: boolean;
}

export type GameSettings =
  | { mode: "brain"; brain: BrainSettings }
  | { mode: "chaos"; chaos: ChaosSettings }
  | { mode: "bluff"; bluff: BluffSettings }
  | { mode: "mind"; mind: MindSettings };

export interface LeaderboardEntry {
  playerId: string;
  nickname: string;
  avatar: AvatarId;
  score: number;
}

export interface BrainPublicQuestion {
  id: string;
  type: "multiple_choice" | "text";
  prompt: string;
  options?: string[];
  category: string;
  difficulty: Difficulty;
  timeLimitMs: number;
  startedAt: number;
  endsAt: number;
}

export interface BrainRoundResult {
  questionId: string;
  correctAnswer: string;
  explanation?: string;
  submissions: Array<{
    playerId: string;
    nickname: string;
    answer: string;
    correct: boolean;
    points: number;
    timeMs: number;
  }>;
  leaderboard: LeaderboardEntry[];
}

export interface ChaosPrompt {
  id: string;
  type: "would_you_rather" | "hypothetical" | "popular" | "creative" | "vote";
  prompt: string;
  options?: string[];
  timeLimitMs: number;
  startedAt: number;
  endsAt: number;
}

export interface ChaosResponsePublic {
  id: string;
  text: string;
  anonymousLabel: string;
}

export interface ChaosRoundResult {
  promptId: string;
  responses: Array<{
    id: string;
    playerId: string;
    nickname: string;
    text: string;
    votes: number;
    points: number;
  }>;
  leaderboard: LeaderboardEntry[];
}

export interface BluffPublicScenario {
  id: string;
  title: string;
  synopsis: string;
  phase: "briefing" | "discussion" | "voting" | "reveal";
  publicClues: string[];
  discussionEndsAt?: number;
  voteEndsAt?: number;
}

export interface BluffPrivateInfo {
  role: string;
  background: string;
  secretObjective: string;
  privateClues: string[];
}

export interface BluffReveal {
  culpritPlayerId: string;
  culpritNickname: string;
  roles: Array<{ playerId: string; nickname: string; role: string }>;
  votedFor: Array<{ voterId: string; targetId: string }>;
  correctVoters: string[];
  leaderboard: LeaderboardEntry[];
}

export interface MindPrompt {
  id: string;
  prompt: string;
  hint?: string;
  timeLimitMs: number;
  startedAt: number;
  endsAt: number;
}

export interface MindRoundResult {
  promptId: string;
  submissions: Array<{
    playerId: string;
    nickname: string;
    answer: string;
    matchCount: number;
    points: number;
  }>;
  clusters: Array<{ answer: string; playerIds: string[]; size: number }>;
  leaderboard: LeaderboardEntry[];
}

export interface PublicRoom {
  code: string;
  state: RoomState;
  hostId: string;
  players: PublicPlayer[];
  chat: ChatMessage[];
  selectedMode: GameMode | null;
  settings: GameSettings | null;
  roundIndex: number;
  totalRounds: number;
  brainQuestion: BrainPublicQuestion | null;
  brainResult: BrainRoundResult | null;
  chaosPrompt: ChaosPrompt | null;
  chaosResponses: ChaosResponsePublic[] | null;
  chaosVotedIds: string[];
  chaosResult: ChaosRoundResult | null;
  bluffScenario: BluffPublicScenario | null;
  bluffReveal: BluffReveal | null;
  mindPrompt: MindPrompt | null;
  mindResult: MindRoundResult | null;
  winnerIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface RoomJoinSuccess {
  room: PublicRoom;
  playerId: string;
  membershipToken: string;
  privateBluff?: BluffPrivateInfo;
}
