
import { CharacterSkin, Rect } from './types';

export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 800;

export const PLAYER_SIZE = 26;
export const PLAYER_SPEED = 4.4;
export const BULLET_SPEED = 28; 
export const RELOAD_TIME = 100; 
export const ROUND_DURATION = 90; 
export const MAX_ROUNDS = 7;

export const XP_PER_KILL = 50;
export const COINS_PER_KILL = 10;
export const XP_PER_WIN = 500;
export const COINS_PER_WIN = 100;
export const DIAMONDS_PER_LEVEL = 5;
export const LEVEL_XP_BASE = 1000;

export const RANKS = [
  { name: 'Bronze', minLevel: 0, color: '#cd7f32' },
  { name: 'Silver', minLevel: 5, color: '#c0c0c0' },
  { name: 'Gold', minLevel: 10, color: '#ffd700' },
  { name: 'Platinum', minLevel: 20, color: '#e5e4e2' },
  { name: 'Diamond', minLevel: 40, color: '#b9f2ff' },
  { name: 'Elite', minLevel: 100, color: '#ff00ff' }
];

export const CHARACTER_CATALOG: CharacterSkin[] = [
  { id: 'default', name: 'Neon Stalker', color: '#00f2ff', costCoins: 0, costDiamonds: 0, description: 'The standard issue grid operator.' },
  { id: 'phantom', name: 'Ghost Protocol', color: '#94a3b8', costCoins: 500, costDiamonds: 0, description: 'Stealth-optimized neural sync.' },
  { id: 'flare', name: 'Solar Flare', color: '#fbbf24', costCoins: 1000, costDiamonds: 0, description: 'High-intensity energy signature.' },
  { id: 'void', name: 'Void Specter', color: '#a855f7', costCoins: 2000, costDiamonds: 5, description: 'Operator from the dark sectors.' },
  { id: 'titan', name: 'Chrome Titan', color: '#e2e8f0', costCoins: 5000, costDiamonds: 10, description: 'Heavy armored assault unit.' },
  { id: 'crimson', name: 'Red Overlord', color: '#ef4444', costCoins: 3000, costDiamonds: 5, description: 'Aggressive tactical dominance.' },
  { id: 'emerald', name: 'Jade Blade', color: '#10b981', costCoins: 1500, costDiamonds: 0, description: 'Balanced grid performance.' },
  { id: 'glitch', name: 'System Error', color: '#ec4899', costCoins: 4000, costDiamonds: 20, description: 'Unpredictable neural link.' },
  { id: 'cyber', name: 'Cyberspace', color: '#3b82f6', costCoins: 2500, costDiamonds: 0, description: 'Pure digital intelligence.' },
  { id: 'plasma', name: 'Plasma Core', color: '#f97316', costCoins: 6000, costDiamonds: 25, description: 'Nuclear-grade reactor suit.' },
  { id: 'onyx', name: 'Onyx Guard', color: '#111827', costCoins: 8000, costDiamonds: 50, description: 'The ultimate grid shadow.' },
  { id: 'neon_pink', name: 'Neon Rose', color: '#ff00ff', costCoins: 1200, costDiamonds: 0, description: 'Style meets lethal precision.' },
  { id: 'deep_sea', name: 'Abyss Walker', color: '#0369a1', costCoins: 1800, costDiamonds: 2, description: 'Pressure-resistant grid gear.' },
  { id: 'gold_elite', name: 'Golden Ace', color: '#fbbf24', costCoins: 15000, costDiamonds: 100, description: 'The sign of true grid mastery.' },
  { id: 'frozen', name: 'Zero Kelvin', color: '#60a5fa', costCoins: 2200, costDiamonds: 0, description: 'Cold and calculated movements.' },
  { id: 'acid', name: 'Toxic Hazard', color: '#84cc16', costCoins: 2800, costDiamonds: 5, description: 'Unstable biochemical armor.' },
  { id: 'retro', name: 'Vapor Wave', color: '#8b5cf6', costCoins: 3500, costDiamonds: 10, description: 'Retro-future aesthetic unit.' },
  { id: 'lightning', name: 'Volt Raider', color: '#eab308', costCoins: 4500, costDiamonds: 15, description: 'Supercharged neural pathways.' },
  { id: 'blood', name: 'Blood Moon', color: '#b91c1c', costCoins: 5500, costDiamonds: 20, description: 'Eclipse-synchronized gear.' },
  { id: 'starlight', name: 'Astro Knight', color: '#ffffff', costCoins: 10000, costDiamonds: 40, description: 'Forged in the stellar grid.' },
  { id: 'inferno', name: 'Hellfire', color: '#dc2626', costCoins: 7000, costDiamonds: 30, description: 'Burning tactical rage.' },
  { id: 'quantum', name: 'Shift Runner', color: '#2dd4bf', costCoins: 9000, costDiamonds: 45, description: 'Multi-dimensional grid tech.' }
];

export const COLORS = {
  TEAM_A: '#ff0055', 
  TEAM_B: '#00f2ff', 
  WALL: '#1e293b',
  BACKGROUND: '#050505',
  BLOOD: '#ff0055',
  MUZZLE: '#ffffff',
  SPARK: '#00f2ff',
  SHELL: '#eab308'
};

// Tactical Map Layouts for different rounds
export const MAP_LAYOUTS: Rect[][] = [
  // Layout 1: Symmetric Defensive Barriers
  [
    { x: 300, y: 200, w: 40, h: 400, color: COLORS.WALL },
    { x: 860, y: 200, w: 40, h: 400, color: COLORS.WALL },
    { x: 500, y: 150, w: 200, h: 40, color: COLORS.WALL },
    { x: 500, y: 610, w: 200, h: 40, color: COLORS.WALL },
  ],
  // Layout 2: Central Hub and Tactical Cover
  [
    { x: 550, y: 350, w: 100, h: 100, color: COLORS.WALL },
    { x: 100, y: 100, w: 150, h: 30, color: COLORS.WALL },
    { x: 100, y: 670, w: 150, h: 30, color: COLORS.WALL },
    { x: 950, y: 100, w: 150, h: 30, color: COLORS.WALL },
    { x: 950, y: 670, w: 150, h: 30, color: COLORS.WALL },
  ],
  // Layout 3: Long Range Corridors
  [
    { x: 0, y: 380, w: 250, h: 40, color: COLORS.WALL },
    { x: 950, y: 380, w: 250, h: 40, color: COLORS.WALL },
    { x: 400, y: 0, w: 40, h: 250, color: COLORS.WALL },
    { x: 400, y: 550, w: 40, h: 250, color: COLORS.WALL },
    { x: 760, y: 0, w: 40, h: 250, color: COLORS.WALL },
    { x: 760, y: 550, w: 40, h: 250, color: COLORS.WALL },
  ]
];
