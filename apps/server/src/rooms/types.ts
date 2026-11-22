import type {
  AvatarId,
  BluffPrivateInfo,
  BluffPublicScenario,
  BluffReveal,
  BrainPublicQuestion,
  BrainRoundResult,
  ChaosPrompt,
  ChaosResponsePublic,
  ChaosRoundResult,
  ChatMessage,
  DilemmaPrompt,
  DilemmaRoundResult,
  GameMode,
  GameSettings,
  GeetPrompt,
  GeetResponsePublic,
  GeetRoundResult,
  MindPrompt,
  MindRoundResult,
  RoomState,
} from "@partyverse/shared";

export interface InternalPlayer {
  id: string;
  nickname: string;
  avatar: AvatarId;
  ready: boolean;
  connected: boolean;
  score: number;
  membershipToken: string;
  socketId: string | null;
  lastSeenAt: number;
}

export interface BrainSubmission {
  playerId: string;
  answer: string;
  timeMs: number;
  submittedAt: number;
}

export interface ChaosSubmission {
  id: string;
  playerId: string;
  text: string;
  votes: Set<string>;
}

export interface MindSubmission {
  playerId: string;
  answer: string;
  submittedAt: number;
}

export interface GeetSubmission {
  id: string;
  playerId: string;
  text: string;
  votes: Set<string>;
}

export interface InternalRoom {
  code: string;
  state: RoomState;
  hostId: string;
  players: Map<string, InternalPlayer>;
  chat: ChatMessage[];
  selectedMode: GameMode | null;
  settings: GameSettings | null;
  roundIndex: number;
  totalRounds: number;
  createdAt: number;
  updatedAt: number;
  timer: NodeJS.Timeout | null;
  usedQuestionIds: Set<string>;
  brainQuestion: BrainPublicQuestion | null;
  brainCorrectAnswer: string | null;
  brainExplanation: string | null;
  brainSubmissions: Map<string, BrainSubmission>;
  brainResult: BrainRoundResult | null;
  chaosPrompt: ChaosPrompt | null;
  chaosSubmissions: Map<string, ChaosSubmission>;
  chaosResponses: ChaosResponsePublic[] | null;
  chaosResult: ChaosRoundResult | null;
  chaosPhase: "respond" | "vote" | null;
  bluffScenario: BluffPublicScenario | null;
  bluffPrivate: Map<string, BluffPrivateInfo>;
  bluffCulpritId: string | null;
  bluffVotes: Map<string, string>;
  bluffReady: Set<string>;
  bluffReveal: BluffReveal | null;
  mindPrompt: MindPrompt | null;
  mindSubmissions: Map<string, MindSubmission>;
  mindResult: MindRoundResult | null;
  dilemmaPrompt: DilemmaPrompt | null;
  dilemmaVotes: Map<string, 0 | 1>;
  dilemmaResult: DilemmaRoundResult | null;
  geetPrompt: GeetPrompt | null;
  geetSubmissions: Map<string, GeetSubmission>;
  geetResponses: GeetResponsePublic[] | null;
  geetResult: GeetRoundResult | null;
  geetPhase: "respond" | "vote" | null;
  winnerIds: string[];
}

export const VALID_TRANSITIONS: Record<RoomState, RoomState[]> = {
  WAITING: ["GAME_SELECTION", "CLOSED"],
  GAME_SELECTION: ["PREPARING_ROUND", "WAITING", "CLOSED"],
  PREPARING_ROUND: ["IN_PROGRESS", "WAITING", "CLOSED"],
  IN_PROGRESS: ["ROUND_RESULTS", "GAME_RESULTS", "WAITING", "CLOSED"],
  ROUND_RESULTS: ["PREPARING_ROUND", "GAME_RESULTS", "WAITING", "CLOSED"],
  GAME_RESULTS: ["WAITING", "GAME_SELECTION", "CLOSED"],
  CLOSED: [],
};
