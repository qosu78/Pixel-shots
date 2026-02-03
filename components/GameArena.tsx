
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameMode, PlayerClass, GameState, Player, Rect, Particle, Room, Bullet } from '../types';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  PLAYER_SPEED, 
  BULLET_SPEED, 
  RELOAD_TIME, 
  COLORS, 
  MAP_LAYOUTS,
  ROUND_DURATION,
  MAX_ROUNDS,
  XP_PER_KILL,
  XP_PER_WIN,
  TACTICAL_TIPS
} from '../constants';
import { updatePlayerAfterMatch } from '../services/firebaseService';
import HUD from './HUD';

interface GameArenaProps {
  mode: GameMode;
  playerClass: PlayerClass;
  playerName: string;
  onQuit: () => void;
  privateRoomData?: Room | null;
}

const STATIC_BOT_NAMES = [
  'Viper', 'Ghost', 'Phantom', 'Iron', 'Titan', 
  'Hunter', 'Rex', 'Shadow', 'Ace', 'Specter',
  'Blade', 'Wolf', 'Hawk', 'Neon', 'Zero'
];

const LoadingScreen: React.FC<{ tip: string; progress: number }> = ({ tip, progress }) => {
  return (
    <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center z-[200] overflow-hidden">
      {/* Neon Battle Thumbnails Grid */}
      <div className="absolute inset-0 opacity-20 pointer-events-none grid grid-cols-2 md:grid-cols-4 gap-6 p-12">
        {Array.from({ length: 8 }).map((_, i) => (
          <div 
            key={i} 
            className="relative bg-slate-900/50 rounded-xl border-2 border-cyan-500/20 overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.1)]"
          >
            <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(37,99,235,0.1)_0%,transparent_100%)]" />
            <div className="absolute top-2 right-2 px-2 py-0.5 bg-cyan-500/20 text-[6px] text-cyan-400 font-black rounded uppercase">Sector {i+1}</div>
            <div className="absolute bottom-4 left-4 right-4 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-yellow-500 animate-pulse" style={{ width: `${Math.random()*100}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="relative z-10 w-full max-w-2xl px-8 flex flex-col items-center">
        <div className="mb-12 text-center">
          <h1 className="text-6xl font-black pixel-font text-transparent bg-clip-text bg-gradient-to-b from-blue-400 via-indigo-500 to-indigo-800 mb-2 drop-shadow-[0_0_30px_rgba(59,130,246,0.5)] tracking-tighter">
            PIXEL SHOTS
          </h1>
          <div className="flex items-center justify-center space-x-3 opacity-60">
            <span className="h-px w-10 bg-slate-700"></span>
            <p className="text-[9px] text-slate-400 font-black tracking-[0.5em] uppercase italic">Neural Uplink v3.0</p>
            <span className="h-px w-10 bg-slate-700"></span>
          </div>
        </div>

        {/* Sci-Fi Yellow Loading Bar */}
        <div className="w-full mb-10">
          <div className="flex justify-between items-end mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 animate-pulse rounded-full" />
              <span className="text-yellow-500 font-black text-[10px] uppercase tracking-[0.4em]">Calibrating Optics...</span>
            </div>
            <span className="text-yellow-500 font-black text-sm pixel-font tabular-nums drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-8 bg-slate-900/90 rounded-sm border border-slate-800 p-1.5 relative overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-yellow-700 via-yellow-400 to-yellow-200 rounded-sm shadow-[0_0_20px_rgba(234,179,8,0.6)] transition-all duration-300 relative z-10" 
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.4)_50%,transparent_100%)] animate-[shimmer_2s_infinite]" />
            </div>
            {/* Background segments for sci-fi look */}
            <div className="absolute inset-0 flex px-2 space-x-1 items-center pointer-events-none opacity-20">
              {Array.from({ length: 30 }).map((_, i) => (
                <div key={i} className="flex-1 h-4 bg-slate-700 rounded-sm" />
              ))}
            </div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-700/50 p-8 rounded-3xl w-full text-center backdrop-blur-2xl shadow-2xl relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-[9px] font-black px-5 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
            Tactical Intel
          </div>
          <p className="text-white text-lg font-bold leading-relaxed tracking-tight">
            "{tip}"
          </p>
        </div>
      </div>
      
      <div className="absolute bottom-12 left-0 right-0 text-center">
        <div className="text-[10px] pixel-font text-slate-700 tracking-[0.3em] uppercase opacity-40">
          ARENA LINK: <span className="text-emerald-500">STABLE</span> | SQUAD SYNC: <span className="text-yellow-500">ACTIVE</span>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
};

const GameArena: React.FC<GameArenaProps> = ({ mode, playerClass, playerName, onQuit, privateRoomData }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const mousePos = useRef({ x: 0, y: 0 });
  const lastShotTime = useRef<number>(0);
  const timerRef = useRef<any>(null);

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [announcement, setAnnouncement] = useState<string>('INITIATING...');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingTip] = useState(() => TACTICAL_TIPS[Math.floor(Math.random() * TACTICAL_TIPS.length)]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const checkWallCollision = (x: number, y: number, walls: Rect[]) => {
    return (walls || []).some(w => x + 22 > w.x && x - 22 < w.x + w.w && y + 22 > w.y && y - 22 < w.y + w.h);
  };

  const getSafeSpawn = (team: 'A' | 'B', walls: Rect[]): { x: number, y: number } => {
    let attempts = 0;
    while (attempts < 100) {
      const x = team === 'A' ? 50 + Math.random() * 250 : CANVAS_WIDTH - 300 + Math.random() * 250;
      const y = 50 + Math.random() * (CANVAS_HEIGHT - 100);
      if (!checkWallCollision(x, y, walls)) {
        return { x, y };
      }
      attempts++;
    }
    // Fallback if no safe spot found (extremely unlikely)
    return { x: team === 'A' ? 100 : CANVAS_WIDTH - 100, y: CANVAS_HEIGHT / 2 };
  };

  const resetArena = useCallback(async (
    currentRound: number = 1, 
    roundsA: number = 0, 
    roundsB: number = 0,
    carryOverPlayers?: Player[]
  ) => {
    const showInitialLoading = currentRound === 1;
    if (showInitialLoading) {
      setIsInitialLoading(true);
      setLoadingProgress(0);
      const steps = 40;
      for (let i = 0; i <= steps; i++) {
        setLoadingProgress((i / steps) * 100);
        await new Promise(r => setTimeout(r, 15));
      }
    }

    const isPrivate = !!privateRoomData;
    const players: Player[] = [];
    const mapIndex = (currentRound - 1) % MAP_LAYOUTS.length;
    const currentWalls = MAP_LAYOUTS[mapIndex];

    if (isPrivate && privateRoomData) {
      privateRoomData.players.forEach(p => {
        const isLocal = p.name === playerName;
        const spawn = getSafeSpawn(p.team, currentWalls);
        players.push({
          id: isLocal ? 'local' : p.id,
          name: p.name,
          team: p.team,
          x: spawn.x,
          y: spawn.y,
          angle: p.team === 'A' ? 0 : Math.PI,
          health: 100,
          maxHealth: 100,
          kills: carryOverPlayers?.find(cp => cp.name === p.name)?.kills || 0,
          deaths: carryOverPlayers?.find(cp => cp.name === p.name)?.deaths || 0,
          color: p.team === 'A' ? COLORS.TEAM_A : COLORS.TEAM_B,
          isBot: !isLocal,
          class: isLocal ? playerClass : 'Assault',
          recoil: 0,
          flashTime: 0,
          walkCycle: 0
        });
      });
    } else {
      const teamSize = parseInt(mode === '1v5' ? '1' : mode.split('v')[0]);
      const enemyTeamSize = parseInt(mode === '1v5' ? '5' : mode.split('v')[1]);
      const botNames = [...STATIC_BOT_NAMES].sort(() => Math.random() - 0.5);

      const pSpawn = getSafeSpawn('A', currentWalls);
      players.push({
        id: 'local', name: playerName, team: 'A', x: pSpawn.x, y: pSpawn.y, angle: 0, 
        health: 100, maxHealth: 100, kills: carryOverPlayers?.find(p => p.id === 'local')?.kills || 0,
        deaths: carryOverPlayers?.find(p => p.id === 'local')?.deaths || 0, 
        color: COLORS.TEAM_A, isBot: false, class: playerClass, recoil: 0, flashTime: 0, walkCycle: 0
      });

      for (let i = 1; i < teamSize; i++) {
        const spawn = getSafeSpawn('A', currentWalls);
        players.push({ 
          id: `bot-a-${i}`, name: botNames.shift() || `Unit_A${i}`, team: 'A', x: spawn.x, y: spawn.y, 
          angle: 0, health: 100, maxHealth: 100, kills: 0, deaths: 0, 
          color: COLORS.TEAM_A, isBot: true, class: 'Assault', recoil: 0, flashTime: 0, walkCycle: 0 
        });
      }
      for (let i = 0; i < enemyTeamSize; i++) {
        const spawn = getSafeSpawn('B', currentWalls);
        players.push({ 
          id: `bot-b-${i}`, name: botNames.shift() || `Unit_B${i}`, team: 'B', x: spawn.x, y: spawn.y, 
          angle: Math.PI, health: 100, maxHealth: 100, kills: 0, deaths: 0, 
          color: COLORS.TEAM_B, isBot: true, class: 'Assault', recoil: 0, flashTime: 0, walkCycle: 0 
        });
      }
    }

    setGameState({
      players,
      bullets: [],
      particles: [],
      decals: [], 
      walls: currentWalls,
      score: { A: 0, B: 0 },
      rounds: { A: roundsA, B: roundsB, current: currentRound, max: MAX_ROUNDS },
      status: 'playing',
      mode,
      timeLeft: ROUND_DURATION,
      shake: 0,
      isPrivate
    });
    
    setAnnouncement(`ROUND ${currentRound}`);
    setIsInitialLoading(false);
    setTimeout(() => setAnnouncement('ENGAGE'), 1200);
  }, [mode, playerClass, playerName, privateRoomData]);

  useEffect(() => {
    resetArena();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [resetArena]);

  useEffect(() => {
    if (gameState?.status === 'playing') {
      if (!timerRef.current) {
        timerRef.current = setInterval(() => {
          setGameState(prev => {
            if (!prev || prev.status !== 'playing') return prev;
            if (prev.timeLeft <= 1) { 
              handleRoundEnd(prev, 'draw'); 
              return { ...prev, timeLeft: 0 }; 
            }
            return { ...prev, timeLeft: prev.timeLeft - 1 };
          });
        }, 1000);
      }
    } else if (timerRef.current) { 
      clearInterval(timerRef.current); 
      timerRef.current = null; 
    }
  }, [gameState?.status]);

  const handleRoundEnd = async (state: GameState, resultType: 'win' | 'draw' = 'win', winningTeam: 'A' | 'B' | null = null) => {
    if (state.status !== 'playing') return;
    
    let winner = winningTeam;
    if (resultType === 'draw') winner = state.score.A > state.score.B ? 'A' : (state.score.B > state.score.A ? 'B' : null);
    
    const newRoundsA = state.rounds.A + (winner === 'A' ? 1 : 0);
    const newRoundsB = state.rounds.B + (winner === 'B' ? 1 : 0);
    setAnnouncement(winner ? `TEAM ${winner === 'A' ? 'ALPHA' : 'BRAVO'} VICTORY` : 'STALEMATE');
    
    const isMatchOver = newRoundsA >= Math.ceil(MAX_ROUNDS / 2) || newRoundsB >= Math.ceil(MAX_ROUNDS / 2) || state.rounds.current >= MAX_ROUNDS;

    if (isMatchOver) {
      setGameState({ ...state, status: 'match-ended', rounds: { ...state.rounds, A: newRoundsA, B: newRoundsB } });
      const matchWinner = newRoundsA > newRoundsB ? 'A' : 'B';
      const local = state.players.find(p => p.id === 'local');
      if (local) {
        const totalXp = (local.kills * XP_PER_KILL) + (matchWinner === 'A' ? XP_PER_WIN : 0);
        await updatePlayerAfterMatch(playerName, local.kills, local.deaths, matchWinner === 'A', totalXp);
      }
    } else {
      setGameState({ ...state, status: 'round-ended', rounds: { ...state.rounds, A: newRoundsA, B: newRoundsB } });
      setTimeout(() => resetArena(state.rounds.current + 1, newRoundsA, newRoundsB, state.players), 2500);
    }
  };

  const emitParticles = (state: GameState, x: number, y: number, color: string, count: number, type: Particle['type'], vxBase: number = 0, vyBase: number = 0) => {
    for (let i = 0; i < count; i++) {
      state.particles.push({
        id: Math.random().toString(),
        x, y,
        vx: vxBase + (Math.random() - 0.5) * (type === 'shell' ? 8 : 14),
        vy: vyBase + (Math.random() - 0.5) * (type === 'shell' ? 8 : 14),
        life: 0,
        maxLife: type === 'blood' ? 180 : type === 'shell' ? 220 : 45,
        color,
        size: type === 'shell' ? 3.5 : type === 'blood' ? Math.random()*5+2 : 3,
        type
      });
    }
  };

  const handleInput = (state: GameState) => {
    const local = (state.players || []).find(p => p.id === 'local');
    if (!local || local.health <= 0) return;

    let dx = 0, dy = 0;
    if (keysPressed.current['w']) dy -= 1;
    if (keysPressed.current['s']) dy += 1;
    if (keysPressed.current['a']) dx -= 1;
    if (keysPressed.current['d']) dx += 1;

    if (dx !== 0 || dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      const moveX = (dx / len) * PLAYER_SPEED;
      const moveY = (dy / len) * PLAYER_SPEED;
      
      if (!checkWallCollision(local.x + moveX, local.y, state.walls)) local.x += moveX;
      if (!checkWallCollision(local.x, local.y + moveY, state.walls)) local.y += moveY;
      local.walkCycle += 0.35;
    } else {
      local.walkCycle *= 0.7;
    }

    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) local.angle = Math.atan2(mousePos.current.y - (local.y + rect.top), mousePos.current.x - (local.x + rect.left));

    if ((keysPressed.current[' '] || keysPressed.current['click']) && Date.now() - lastShotTime.current > RELOAD_TIME) {
      local.recoil = 20; 
      state.bullets.push({ 
        id: Math.random().toString(), ownerId: local.id, 
        x: local.x + Math.cos(local.angle) * 45, y: local.y + Math.sin(local.angle) * 45, 
        vx: Math.cos(local.angle) * BULLET_SPEED, vy: Math.sin(local.angle) * BULLET_SPEED, 
        damage: 25, team: local.team, life: 1 
      });
      const shellAngle = local.angle - Math.PI/2 + (Math.random()-0.5)*0.8;
      emitParticles(state, local.x, local.y, COLORS.SHELL, 1, 'shell', Math.cos(shellAngle)*7, Math.sin(shellAngle)*7);
      emitParticles(state, local.x + Math.cos(local.angle) * 45, local.y + Math.sin(local.angle) * 45, COLORS.MUZZLE, 18, 'spark');
      state.shake = 18;
      lastShotTime.current = Date.now();
    }
  };

  const updateEntities = (state: GameState) => {
    state.shake *= 0.85;
    
    state.particles = (state.particles || []).filter(p => {
      p.x += p.vx; p.y += p.vy;
      p.vx *= 0.93; p.vy *= 0.93;
      p.life++;
      if (p.type === 'shell' && p.life > 22) { p.vy += 0.45; }
      return p.life < p.maxLife;
    });

    (state.players || []).forEach(p => {
      p.recoil *= 0.65;
      p.flashTime = Math.max(0, p.flashTime - 1);
      if (!p.isBot || p.health <= 0) return;
      
      const enemies = (state.players || []).filter(e => e.team !== p.team && e.health > 0);
      
      if (enemies.length > 0) {
        // Combat AI
        let nearest = enemies[0];
        let minD = Math.hypot(nearest.x - p.x, nearest.y - p.y);
        enemies.forEach(e => { const d = Math.hypot(e.x-p.x, e.y-p.y); if(d < minD){ minD = d; nearest = e; }});
        
        p.angle = Math.atan2(nearest.y - p.y, nearest.x - p.x);
        
        // Dynamic Movement
        if (minD > 300) { 
          // Move towards enemy
          const mx = Math.cos(p.angle) * 3.2;
          const my = Math.sin(p.angle) * 3.2;
          if (!checkWallCollision(p.x + mx, p.y + my, state.walls)) { p.x += mx; p.y += my; p.walkCycle += 0.3; }
          else {
            // Pathfinding simple: Try sidestepping if blocked
            const sidewayAngle = p.angle + Math.PI / 2;
            const sx = Math.cos(sidewayAngle) * 3.2;
            const sy = Math.sin(sidewayAngle) * 3.2;
            if (!checkWallCollision(p.x + sx, p.y + sy, state.walls)) { p.x += sx; p.y += sy; }
          }
        } else if (minD < 150) {
          // Retreat or strafe
          const strafeAngle = p.angle + Math.PI / 2;
          const sx = Math.cos(strafeAngle) * 2.5;
          const sy = Math.sin(strafeAngle) * 2.5;
          if (!checkWallCollision(p.x + sx, p.y + sy, state.walls)) { p.x += sx; p.y += sy; p.walkCycle += 0.2; }
        }

        if (Math.random() < 0.04) {
          state.bullets.push({ 
            id: Math.random().toString(), ownerId: p.id, 
            x: p.x + Math.cos(p.angle) * 45, y: p.y + Math.sin(p.angle) * 45, 
            vx: Math.cos(p.angle) * BULLET_SPEED, vy: Math.sin(p.angle) * BULLET_SPEED, 
            damage: 15, team: p.team, life: 1 
          });
          const sa = p.angle - Math.PI/2;
          emitParticles(state, p.x, p.y, COLORS.SHELL, 1, 'shell', Math.cos(sa)*7, Math.sin(sa)*7);
        }
      } else {
        // Wandering AI when no enemies visible
        const wanderSpeed = 2.0;
        const mx = Math.cos(p.angle) * wanderSpeed;
        const my = Math.sin(p.angle) * wanderSpeed;
        
        if (!checkWallCollision(p.x + mx, p.y + my, state.walls)) {
          p.x += mx; p.y += my;
          p.walkCycle += 0.15;
        } else {
          // Change direction on wall hit
          p.angle += Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
        }
        
        // Occasional direction change
        if (Math.random() < 0.01) p.angle += (Math.random() - 0.5) * Math.PI;
      }
    });

    state.bullets = (state.bullets || []).filter(b => {
      b.x += b.vx; b.y += b.vy;
      const hitWall = (state.walls || []).some(w => b.x > w.x && b.x < w.x + w.w && b.y > w.y && b.y < w.y + w.h);
      if (hitWall) {
        emitParticles(state, b.x, b.y, COLORS.SPARK, 15, 'spark');
        state.decals.push({ x: b.x, y: b.y, size: 8, color: 'rgba(0,0,0,0.8)', type: 'bullet_hole', angle: Math.random()*Math.PI*2 });
        return false;
      }
      let hitPlayer = false;
      (state.players || []).forEach(p => {
        if (p.team !== b.team && p.health > 0 && Math.hypot(p.x - b.x, p.y - b.y) < 32) {
          p.health -= b.damage; hitPlayer = true;
          p.flashTime = 8;
          emitParticles(state, b.x, b.y, COLORS.BLOOD, 30, 'blood', b.vx * 0.3, b.vy * 0.3);
          state.decals.push({ x: b.x, y: b.y, size: 30 + Math.random()*40, color: COLORS.BLOOD + '88', type: 'blood', angle: Math.random()*Math.PI*2 });
          if (p.health <= 0) {
            state.score[b.team]++;
            const shooter = state.players.find(s => s.id === b.ownerId);
            if (shooter) shooter.kills++;
            p.deaths++;
            state.shake = 25;
            for(let i=0; i<10; i++) state.decals.push({ x: p.x + (Math.random()-0.5)*50, y: p.y + (Math.random()-0.5)*50, size: 50, color: COLORS.BLOOD + 'AA', type: 'blood', angle: Math.random()*Math.PI*2 });
          }
        }
      });
      return !hitPlayer && b.x > 0 && b.x < CANVAS_WIDTH && b.y > 0 && b.y < CANVAS_HEIGHT;
    });

    const teamALive = (state.players || []).filter(p => p.team === 'A' && p.health > 0).length;
    const teamBLive = (state.players || []).filter(p => p.team === 'B' && p.health > 0).length;
    if (teamALive === 0 && state.status === 'playing') handleRoundEnd(state, 'win', 'B');
    else if (teamBLive === 0 && state.status === 'playing') handleRoundEnd(state, 'win', 'A');
  };

  const drawSoldier = (ctx: CanvasRenderingContext2D, p: Player) => {
    ctx.save();
    const bob = Math.sin(p.walkCycle) * 5.2;
    const recoilX = -Math.cos(p.angle) * p.recoil;
    const recoilY = -Math.sin(p.angle) * p.recoil;
    ctx.translate(p.x + recoilX, p.y + recoilY + bob);
    ctx.rotate(p.angle);
    
    ctx.shadowBlur = 35; ctx.shadowColor = 'rgba(0,0,0,0.85)';
    if (p.flashTime > 0) ctx.filter = 'brightness(5) contrast(1.2)';
    const px = 4.0;
    
    // Shadows
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(-px*6, -px*5, px*5, px*4);
    ctx.fillRect(-px*6, px*1, px*5, px*4);

    // Backpack
    ctx.fillStyle = '#0f172a'; 
    ctx.beginPath();
    ctx.roundRect(-px*9, -px*4, px*5, px*8, 4);
    ctx.fill();

    // Body Armor
    const baseColor = p.team === 'A' ? '#991b1b' : '#1e40af';
    const darkColor = p.team === 'A' ? '#450a0a' : '#1e3a8a';
    
    ctx.fillStyle = darkColor;
    ctx.fillRect(-px*6.5, -px*6.5, px*13, px*13);
    ctx.fillStyle = baseColor;
    ctx.fillRect(-px*5.5, -px*5.5, px*11, px*11);
    
    // Helmet
    ctx.fillStyle = '#020617'; 
    ctx.beginPath();
    ctx.arc(-px*4, 0, px*4.8, 0, Math.PI*2);
    ctx.fill();
    const visorColor = p.team === 'A' ? '#fbbf24' : '#22d3ee';
    ctx.fillStyle = visorColor;
    ctx.globalAlpha = 0.9;
    ctx.fillRect(-px*4, -px*3, px*1.8, px*6);
    ctx.globalAlpha = 1;
    
    // Weapon
    ctx.fillStyle = '#020617'; 
    ctx.fillRect(px*3, -px*2.8, px*20, px*5.6);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(px*18, -px*1.4, px*9, px*2.8);
    
    ctx.strokeStyle = p.team === 'A' ? 'rgba(244,63,94,0.4)' : 'rgba(14,165,233,0.4)';
    ctx.lineWidth = 2.5; ctx.strokeRect(-px*6.5, -px*6.5, px*13, px*13);
    
    ctx.restore();
  };

  const draw = (ctx: CanvasRenderingContext2D, state: GameState) => {
    ctx.save();
    if (state.shake > 0.5) ctx.translate((Math.random()-0.5)*state.shake, (Math.random()-0.5)*state.shake);
    
    ctx.fillStyle = COLORS.BACKGROUND; ctx.fillRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
    ctx.strokeStyle = 'rgba(15,23,42,1)'; ctx.lineWidth = 1.5;
    for(let x=0; x<CANVAS_WIDTH; x+=100) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,CANVAS_HEIGHT); ctx.stroke(); }
    for(let y=0; y<CANVAS_HEIGHT; y+=100) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(CANVAS_WIDTH,y); ctx.stroke(); }

    (state.decals || []).forEach(d => {
      ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(d.angle);
      ctx.fillStyle = d.color;
      if (d.type === 'blood') { 
        ctx.beginPath(); ctx.arc(0, 0, d.size/2, 0, Math.PI*2); ctx.fill(); 
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.arc(6, 6, d.size/2.2, 0, Math.PI*2); ctx.fill();
      } else { 
        ctx.fillRect(-d.size/2, -d.size/2, d.size, d.size); 
      }
      ctx.restore();
    });

    (state.particles || []).forEach(p => {
      ctx.globalAlpha = 1 - (p.life / p.maxLife);
      ctx.fillStyle = p.color;
      if (p.type === 'shell') {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.life*0.4);
        ctx.fillRect(-4, -2, 8, 4); ctx.restore();
      } else {
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
    });
    ctx.globalAlpha = 1;

    (state.walls || []).forEach(w => {
      ctx.shadowBlur = 50; ctx.shadowColor = 'black';
      ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(w.x+12, w.y+12, w.w, w.h);
      const g = ctx.createLinearGradient(w.x, w.y, w.x, w.y+w.h);
      g.addColorStop(0, '#475569'); g.addColorStop(1, '#0f172a');
      ctx.fillStyle = g; ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 4; ctx.strokeRect(w.x, w.y, w.w, w.h);
      ctx.shadowBlur = 0;
    });

    (state.bullets || []).forEach(b => {
      ctx.save();
      const trailLen = 70;
      const bColor = b.team === 'A' ? '#f43f5e' : '#0ea5e9';
      const grad = ctx.createLinearGradient(b.x, b.y, b.x - (b.vx/BULLET_SPEED)*trailLen, b.y - (b.vy/BULLET_SPEED)*trailLen);
      grad.addColorStop(0, '#fff'); grad.addColorStop(0.2, bColor); grad.addColorStop(1, 'transparent');
      ctx.strokeStyle = grad; ctx.lineWidth = 10; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - (b.vx/BULLET_SPEED)*trailLen, b.y - (b.vy/BULLET_SPEED)*trailLen); ctx.stroke();
      ctx.shadowBlur = 40; ctx.shadowColor = bColor;
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(b.x, b.y, 8, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    });

    (state.players || []).forEach(p => {
      if (p.health <= 0) return;
      drawSoldier(ctx, p);
      const barW = 70; 
      ctx.fillStyle = 'rgba(0,0,0,0.95)'; 
      ctx.fillRect(p.x - barW/2, p.y - 80, barW, 14);
      ctx.fillStyle = p.team === 'A' ? '#f43f5e' : '#0ea5e9';
      ctx.fillRect(p.x - barW/2, p.y - 80, barW * (p.health/100), 14);
      ctx.strokeStyle = p.team === 'A' ? 'rgba(244,63,94,0.08)' : 'rgba(14,165,233,0.08)';
      ctx.beginPath(); ctx.arc(p.x, p.y, 60, 0, Math.PI*2); ctx.stroke();
    });

    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    for (let i = 0; i < CANVAS_HEIGHT; i += 8) ctx.fillRect(0, i, CANVAS_WIDTH, 2);
    ctx.globalCompositeOperation = 'multiply';
    const vignette = ctx.createRadialGradient(CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 400, CANVAS_WIDTH/2, CANVAS_HEIGHT/2, CANVAS_WIDTH*1.1);
    vignette.addColorStop(0, 'rgba(255,255,255,1)');
    vignette.addColorStop(1, 'rgba(5,10,30,1)');
    ctx.fillStyle = vignette; ctx.fillRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
    ctx.restore();
    
    ctx.restore();
  };

  const gameLoop = useCallback(() => {
    if (!gameState || isInitialLoading) return;
    const ns = { ...gameState };
    if (ns.status === 'playing') { 
      handleInput(ns); 
      updateEntities(ns); 
    }
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) draw(ctx, ns);
    setGameState(ns);
    requestRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, isInitialLoading, handleRoundEnd]);

  useEffect(() => {
    if (gameState && !isInitialLoading) {
      requestRef.current = requestAnimationFrame(gameLoop);
      return () => cancelAnimationFrame(requestRef.current!);
    }
  }, [gameState, isInitialLoading, gameLoop]);

  useEffect(() => {
    const d = (e: KeyboardEvent) => keysPressed.current[e.key.toLowerCase()] = true;
    const u = (e: KeyboardEvent) => keysPressed.current[e.key.toLowerCase()] = false;
    const mm = (e: MouseEvent) => mousePos.current = { x: e.clientX, y: e.clientY };
    const md = () => keysPressed.current['click'] = true;
    const mu = () => keysPressed.current['click'] = false;
    window.addEventListener('keydown', d); window.addEventListener('keyup', u); window.addEventListener('mousemove', mm);
    window.addEventListener('mousedown', md); window.addEventListener('mouseup', mu);
    return () => { 
      window.removeEventListener('keydown', d); window.removeEventListener('keyup', u); window.removeEventListener('mousemove', mm);
      window.removeEventListener('mousedown', md); window.removeEventListener('mouseup', mu);
    };
  }, []);

  return (
    <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden cursor-crosshair">
      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="shadow-[0_0_100px_rgba(0,0,0,1)]" />
      {gameState && !isInitialLoading && <HUD gameState={gameState} onQuit={onQuit} announcement={announcement} />}
      {isInitialLoading && <LoadingScreen tip={loadingTip} progress={loadingProgress} />}
    </div>
  );
};

export default GameArena;
