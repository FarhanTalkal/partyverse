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
}

export interface ChaosSettings {
  rounds: number;
  responseTimeMs: number;
  voteTimeMs: number;
}

export interface BluffSettings {
  readingTimeMs: number;
  discussionTimeMs: number;
  voteTimeMs: number;
}

export interface MindSettings {
  rounds: number;
  responseTimeMs: number;
}

export interface DilemmaSettings {
  rounds: number;
  voteTimeMs: number;
}

export interface GeetSettings {
  rounds: number;
  responseTimeMs: number;
  voteTimeMs: number;
}

export type GameSettings =
  | { mode: "brain"; brain: BrainSettings }
  | { mode: "chaos"; chaos: ChaosSettings }
  | { mode: "bluff"; bluff: BluffSettings }
  | { mode: "mind"; mind: MindSettings }
  | { mode: "dilemma"; dilemma: DilemmaSettings }
  | { mode: "geet"; geet: GeetSettings };

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
  phaseStartedAt?: number;
  briefingEndsAt?: number;
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

export interface DilemmaPrompt {
  id: string;
  prompt: string;
  options: [string, string];
  scoring: "majority" | "minority";
  timeLimitMs: number;
  startedAt: number;
  endsAt: number;
}

export interface DilemmaRoundResult {
  promptId: string;
  tallies: Array<{ option: string; count: number; playerIds: string[] }>;
  scoring: "majority" | "minority";
  submissions: Array<{
    playerId: string;
    nickname: string;
    choice: string;
    points: number;
  }>;
  leaderboard: LeaderboardEntry[];
}

export interface GeetPrompt {
  id: string;
  letter: string;
  hint?: string;
  timeLimitMs: number;
  startedAt: number;
  endsAt: number;
}

export interface GeetResponsePublic {
  id: string;
  text: string;
  anonymousLabel: string;
}

export interface GeetRoundResult {
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

export interface HowToBriefing {
  mode: GameMode;
  endsAt: number;
  ackedIds: string[];
}

export interface PublicRoom {
  code: string;
  state: RoomState;
  hostId: string;
  players: PublicPlayer[];
  chat: ChatMessage[];
  selectedMode: GameMode | null;
  settings: GameSettings | null;
  howto: HowToBriefing | null;
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
  bluffReadyIds: string[];
  mindPrompt: MindPrompt | null;
  mindResult: MindRoundResult | null;
  dilemmaPrompt: DilemmaPrompt | null;
  dilemmaVotedIds: string[];
  dilemmaResult: DilemmaRoundResult | null;
  geetPrompt: GeetPrompt | null;
  geetResponses: GeetResponsePublic[] | null;
  geetVotedIds: string[];
  geetResult: GeetRoundResult | null;
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
