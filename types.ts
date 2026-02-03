
export type GameMode = '1v1' | '2v2' | '3v3' | '4v4' | '5v5' | '1v5';

export interface PlayerStats {
  xp: number;
  level: number;
  totalKills: number;
  totalDeaths: number;
  rank: string;
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

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'blood' | 'dust' | 'spark' | 'smoke' | 'shell';
}

export interface Decal {
  x: number;
  y: number;
  size: number;
  color: string;
  type: 'blood' | 'bullet_hole';
  angle: number;
}

export interface GameState {
  players: Player[];
  bullets: Bullet[];
  particles: Particle[];
  decals: Decal[];
  walls: Rect[];
  score: { A: number; B: number };
  rounds: { A: number; B: number; current: number; max: number };
  status: 'lobby' | 'playing' | 'round-ended' | 'match-ended';
  mode: GameMode;
  timeLeft: number;
  shake: number;
  isPrivate?: boolean;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}
