import { Square, PieceSymbol, Color } from 'chess.js';

export type GameDifficulty = 'beginner' | 'easy' | 'medium' | 'hard' | 'expert' | 'custom';

export interface DifficultyConfig {
  name: string;
  depth: number;
  skillLevel: number; // UCI Skill Level: 0 to 20
  moveTime?: number; // max thinking time in ms
  description: string;
}

export const DIFFICULTY_PRESETS: Record<Exclude<GameDifficulty, 'custom'>, DifficultyConfig> = {
  beginner: {
    name: 'Beginner',
    depth: 3,
    skillLevel: 2,
    moveTime: 500,
    description: 'Fast, casual moves with occasional tactical slips. Great for warm-ups.',
  },
  easy: {
    name: 'Easy',
    depth: 6,
    skillLevel: 7,
    moveTime: 800,
    description: 'Moderate depth. Plays solid opening principles with occasional blunders.',
  },
  medium: {
    name: 'Medium',
    depth: 10,
    skillLevel: 13,
    moveTime: 1200,
    description: 'Strong club-level player. Capitalizes on tactical mistakes.',
  },
  hard: {
    name: 'Hard',
    depth: 14,
    skillLevel: 18,
    moveTime: 2000,
    description: 'Candidate Master strength. Sharp tactical precision and deep calculations.',
  },
  expert: {
    name: 'Expert',
    depth: 18,
    skillLevel: 20,
    moveTime: 3000,
    description: 'Stockfish at full skill level. Maximum depth and grandmaster positional play.',
  },
};

export type TimeControlCategory = 'bullet' | 'blitz' | 'rapid' | 'classical' | 'unlimited' | 'custom';

export interface TimeControlConfig {
  id: string;
  name: string;
  category: TimeControlCategory;
  initialMinutes: number;
  incrementSeconds: number;
  isUnlimited?: boolean;
}

export const TIME_CONTROL_PRESETS: TimeControlConfig[] = [
  { id: 'bullet_1_0', name: '1 min', category: 'bullet', initialMinutes: 1, incrementSeconds: 0 },
  { id: 'bullet_2_1', name: '2 | 1', category: 'bullet', initialMinutes: 2, incrementSeconds: 1 },
  { id: 'blitz_3_2', name: '3 | 2', category: 'blitz', initialMinutes: 3, incrementSeconds: 2 },
  { id: 'blitz_5_0', name: '5 min', category: 'blitz', initialMinutes: 5, incrementSeconds: 0 },
  { id: 'blitz_5_3', name: '5 | 3', category: 'blitz', initialMinutes: 5, incrementSeconds: 3 },
  { id: 'rapid_10_0', name: '10 min', category: 'rapid', initialMinutes: 10, incrementSeconds: 0 },
  { id: 'rapid_15_10', name: '15 | 10', category: 'rapid', initialMinutes: 15, incrementSeconds: 10 },
  { id: 'classical_30_0', name: '30 min', category: 'classical', initialMinutes: 30, incrementSeconds: 0 },
  { id: 'unlimited', name: 'Casual (No Timer)', category: 'unlimited', initialMinutes: 0, incrementSeconds: 0, isUnlimited: true },
];

export interface MoveRecord {
  san: string;
  from: Square;
  to: Square;
  piece: PieceSymbol;
  color: Color;
  captured?: PieceSymbol;
  promotion?: PieceSymbol;
  fenAfter: string;
  moveNumber: number;
}

export interface PvMoveItem {
  ply: number;
  moveNumber: number;
  color: Color;
  san: string;
  uci: string;
}

export interface EngineEvaluation {
  depth: number;
  seldepth?: number;
  scoreCp?: number; // Centipawns from side-to-move's perspective (UCI standard)
  scoreMate?: number; // Moves to mate from side-to-move's perspective
  nodes?: number;
  nps?: number; // Nodes per second
  timeMs?: number;
  pv?: string; // Raw UCI principal variation string
  pvFormatted?: PvMoveItem[]; // Formatted SAN sequence
  bestMove?: string; // UCI move (e.g. 'e2e4')
  bestMoveSan?: string; // SAN move (e.g. 'e4' or 'Nf3')
  ponder?: string;
  whiteCp?: number; // Normalized centipawns from White's perspective (+ = White, - = Black)
  whiteMate?: number; // Normalized mate moves (+ = White, - = Black)
  playerCp?: number; // Normalized centipawns from human Player's perspective
  playerMate?: number; // Normalized mate moves from human Player's perspective
  winPercentageWhite?: number; // 0 to 100%
}

export interface EngineStatus {
  isReady: boolean;
  isThinking: boolean;
  isAnalyzing: boolean;
  isError: boolean;
  errorMessage?: string;
  evalInfo: EngineEvaluation | null;
}

export interface HintInfo {
  from: Square;
  to: Square;
  san: string;
  promotion?: PieceSymbol;
  scoreDisplay?: string;
  explanation?: string;
}

export type GameStatus = 
  | 'in_progress'
  | 'check'
  | 'checkmate'
  | 'stalemate'
  | 'insufficient_material'
  | 'threefold_repetition'
  | 'fifty_moves'
  | 'timeout'
  | 'resigned';
