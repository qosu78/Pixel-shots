
export type GameMode = '1v1' | '2v2' | '3v3' | '4v4' | '5v5' | '1v5' | '1v1-local';

export interface PlayerStats {
  xp: number;
  level: number;
  totalKills: number;
  totalDeaths: number;
  rank: string;
  coins: number;
  diamonds: number;
  equippedSkin: string;
  ownedSkins: string[];
  isBanned?: boolean;
}

export interface CharacterSkin {
  id: string;
  name: string;
  color: string;
  costCoins: number;
  costDiamonds: number;
  description: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
  team?: 'A' | 'B';
}

export interface RoomPlayer {
  id: string;
  name: string;
  team: 'A' | 'B';
  isHost: boolean;
  ready: boolean;
}

export interface Room {
  id: string;
  code: string;
  mode: GameMode;
  status: 'waiting' | 'starting' | 'playing' | 'ended';
  players: RoomPlayer[];
  createdAt: number;
}

export interface Player {
  id: string;
  name: string;
  team: 'A' | 'B';
  x: number;
  y: number;
  angle: number;
  health: number;
  maxHealth: number;
  kills: number;
  deaths: number;
  color: string;
  isBot: boolean;
  class: PlayerClass;
  recoil: number;
  flashTime: number;
  walkCycle: number;
  skinId?: string;
}

export type PlayerClass = 'Assault' | 'Sniper' | 'Tank';

export interface Bullet {
  id: string;
  ownerId: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  team: 'A' | 'B';
  life: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}

export interface GameState {
  players: Player[];
  bullets: Bullet[];
  walls: Rect[];
  score: { A: number; B: number };
  rounds: { A: number; B: number; current: number; max: number };
  status: 'lobby' | 'playing' | 'round-ended' | 'match-ended';
  mode: GameMode;
  timeLeft: number;
  shake: number;
  isPrivate?: boolean;
}
