export type PlayerColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange' | 'cyan' | 'pink';

export interface Player {
  id: string;
  name: string;
  color: PlayerColor;
  isReady: boolean;
  isHost: boolean;
  isEliminated: boolean;
  isAI?: boolean;
  userId?: string;
  avatar?: {
    icon: string;
    color: string;
  };
  stats?: {
    explosionsTriggered: number;
    cellsCaptured: number;
    movesMade: number;
  };
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  type: 'room' | 'global';
  avatar?: { icon: string; color: string };
}

export interface Cell {
  x: number;
  y: number;
  playerId: string | null;
  count: number;
  capacity: number;
}

export type GameStatus = 'lobby' | 'playing' | 'gameover';

export interface GameState {
  id: string;
  gridWidth: number;
  gridHeight: number;
  players: Player[];
  status: GameStatus;
  currentTurnIndex: number;
  board: Cell[][];
  winnerId: string | null;
  lastMoveTimestamp: number;
  spectatorCount: number;
  lastExplosions: { x: number; y: number; color: string }[];
  maxPlayers: number;
  moveHistory: ReplayMove[];
}

export interface ReplayMove extends Move {
  timestamp: number;
}

export interface Replay {
  id: string;
  gridWidth: number;
  gridHeight: number;
  players: Player[];
  moves: ReplayMove[];
  winnerId: string | null;
  createdAt: number;
}

export interface Move {
  x: number;
  y: number;
  playerId: string;
}

export const PLAYER_COLORS: PlayerColor[] = [
  'red', 'blue', 'green', 'yellow', 'purple', 'orange', 'cyan', 'pink'
];

export const COLOR_MAP: Record<PlayerColor, string> = {
  red: '#ff2e63',
  blue: '#08f7fe',
  green: '#22c55e',
  yellow: '#f5d300',
  purple: '#a855f7',
  orange: '#f97316',
  cyan: '#08f7fe',
  pink: '#ff2e63',
};
