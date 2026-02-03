
export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 800;

export const PLAYER_SIZE = 26;
export const PLAYER_SPEED = 4.2;
export const BULLET_SPEED = 24; // Faster for realism
export const RELOAD_TIME = 120; 
export const ROUND_DURATION = 90; 
export const MAX_ROUNDS = 7;

export const XP_PER_KILL = 50;
export const XP_PER_WIN = 500;
export const LEVEL_XP_BASE = 1000;

export const RANKS = [
  { name: 'Bronze', minLevel: 0, color: '#cd7f32' },
  { name: 'Silver', minLevel: 5, color: '#c0c0c0' },
  { name: 'Gold', minLevel: 10, color: '#ffd700' },
  { name: 'Platinum', minLevel: 20, color: '#e5e4e2' },
  { name: 'Diamond', minLevel: 40, color: '#b9f2ff' },
  { name: 'Elite', minLevel: 100, color: '#ff00ff' }
];

export const TACTICAL_TIPS = [
  "Stay moving! A stationary target is an easy target.",
  "Use walls for cover. The tactical environment is your best friend.",
  "Coordinate with your squad. Alpha and Bravo units are stronger together.",
  "Watch your health sync. Abort and regroup if vital signs are low.",
  "Sniper units deal massive damage but are vulnerable at close range.",
  "Tank units can absorb significant fire. Lead the charge.",
  "Muzzle flashes reveal your position. Fire in controlled bursts."
];

export const MAP_LAYOUTS = [
  // Map 1: CQC Killhouse
  [
    { x: 250, y: 150, w: 40, h: 500, color: '#334155' },
    { x: 910, y: 150, w: 40, h: 500, color: '#334155' },
    { x: 500, y: 350, w: 200, h: 100, color: '#475569' },
    { x: 550, y: 60, w: 100, h: 60, color: '#334155' },
    { x: 550, y: 680, w: 100, h: 60, color: '#334155' },
    { x: 400, y: 100, w: 20, h: 120, color: '#1e293b' },
    { x: 780, y: 580, w: 20, h: 120, color: '#1e293b' },
  ],
  // Map 2: Industrial Corridor
  [
    { x: 0, y: 200, w: 400, h: 40, color: '#334155' },
    { x: 800, y: 560, w: 400, h: 40, color: '#334155' },
    { x: 580, y: 100, w: 40, h: 600, color: '#475569' },
    { x: 200, y: 400, w: 100, h: 100, color: '#1e293b' },
    { x: 900, y: 300, w: 100, h: 100, color: '#1e293b' },
  ],
  // Map 3: The Lab
  [
    { x: 200, y: 200, w: 800, h: 20, color: '#475569' },
    { x: 200, y: 580, w: 800, h: 20, color: '#475569' },
    { x: 590, y: 0, w: 20, h: 250, color: '#334155' },
    { x: 590, y: 550, w: 20, h: 250, color: '#334155' },
    { x: 350, y: 380, w: 100, h: 40, color: '#1e293b' },
    { x: 750, y: 380, w: 100, h: 40, color: '#1e293b' },
  ],
  // Map 4: Central Command
  [
    { x: 500, y: 0, w: 200, h: 150, color: '#334155' },
    { x: 500, y: 650, w: 200, h: 150, color: '#334155' },
    { x: 0, y: 350, w: 300, h: 100, color: '#475569' },
    { x: 900, y: 350, w: 300, h: 100, color: '#475569' },
    { x: 580, y: 380, w: 40, h: 40, color: '#f59e0b' }, // Power core
  ],
  // Map 5: Bridge Crossing
  [
    { x: 0, y: 0, w: 1200, h: 250, color: '#1e293b' },
    { x: 0, y: 550, w: 1200, h: 250, color: '#1e293b' },
    { x: 200, y: 250, w: 40, h: 300, color: '#475569' },
    { x: 960, y: 250, w: 40, h: 300, color: '#475569' },
    { x: 550, y: 380, w: 100, h: 40, color: '#334155' },
  ]
];

export const COLORS = {
  TEAM_A: '#ff3131', 
  TEAM_B: '#00d2ff', 
  WALL: '#1e293b',
  BACKGROUND: '#010409',
  BLOOD: '#9f1239',
  MUZZLE: '#fbbf24',
  SPARK: '#fef08a',
  SHELL: '#eab308'
};
