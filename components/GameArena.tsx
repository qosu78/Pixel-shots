
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameMode, PlayerClass, GameState, Player, Rect, Room } from '../types';
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
  COINS_PER_KILL,
  XP_PER_WIN,
  COINS_PER_WIN,
  CHARACTER_CATALOG
} from '../constants';
import { updatePlayerAfterMatch, getPlayerStats, banPlayer } from '../services/firebaseService';
import HUD from './HUD';

interface GameArenaProps {
  mode: GameMode;
  playerClass: PlayerClass;
  playerName: string;
  onQuit: () => void;
  privateRoomData?: Room | null;
}

const GameArena: React.FC<GameArenaProps> = ({ mode, playerClass, playerName, onQuit, privateRoomData }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const mousePos = useRef({ x: 0, y: 0 });
  const lastShotTime1 = useRef<number>(0);
  const lastShotTime2 = useRef<number>(0);
  const timerRef = useRef<any>(null);

  // --- ANTICHEAT REFS ---
  const lastPosition = useRef({ x: 0, y: 0 });
  const suspicionCount = useRef(0);
  const lastFrameTime = useRef(performance.now());
  const goldenSpeed = useRef(PLAYER_SPEED); // Protection against constant tampering

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [announcement, setAnnouncement] = useState<string>('SYNCHING...');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [playerSkin, setPlayerSkin] = useState<string>('default');

  useEffect(() => {
    getPlayerStats(playerName).then(s => setPlayerSkin(s.equippedSkin));
  }, [playerName]);

  const checkWallCollision = (x: number, y: number, walls: Rect[]) => {
    return (walls || []).some(w => x + 25 > w.x && x - 25 < w.x + w.w && y + 25 > w.y && y - 25 < w.y + w.h);
  };

  const getSafeSpawn = (team: 'A' | 'B', walls: Rect[]): { x: number, y: number } => {
    let attempts = 0;
    while (attempts < 100) {
      const x = team === 'A' ? 100 + Math.random() * 200 : CANVAS_WIDTH - 300 + Math.random() * 200;
      const y = 100 + Math.random() * (CANVAS_HEIGHT - 200);
      if (!checkWallCollision(x, y, walls)) return { x, y };
      attempts++;
    }
    return { x: team === 'A' ? 100 : CANVAS_WIDTH - 100, y: CANVAS_HEIGHT / 2 };
  };

  const handleRoundEnd = useCallback(async (state: GameState, winningTeam: 'A' | 'B' | 'draw') => {
    if (state.status !== 'playing') return;

    const newRoundsA = state.rounds.A + (winningTeam === 'A' ? 1 : 0);
    const newRoundsB = state.rounds.B + (winningTeam === 'B' ? 1 : 0);
    const currentRound = state.rounds.current;

    setAnnouncement(winningTeam === 'draw' ? 'STALEMATE' : `TEAM ${winningTeam === 'A' ? 'ALPHA' : 'BRAVO'} VICTORY`);

    const isMatchOver = newRoundsA >= Math.ceil(MAX_ROUNDS / 2) || newRoundsB >= Math.ceil(MAX_ROUNDS / 2) || currentRound >= MAX_ROUNDS;

    if (isMatchOver) {
      setGameState(prev => prev ? { ...prev, status: 'match-ended', rounds: { ...prev.rounds, A: newRoundsA, B: newRoundsB } } : null);
      if (mode !== '1v1-local') {
        const local = state.players.find(p => p.id === 'local');
        if (local) {
          const won = (local.team === 'A' && newRoundsA > newRoundsB) || (local.team === 'B' && newRoundsB > newRoundsA);
          const xp = (local.kills * XP_PER_KILL) + (won ? XP_PER_WIN : 0);
          const coins = (local.kills * COINS_PER_KILL) + (won ? COINS_PER_WIN : 0);
          await updatePlayerAfterMatch(playerName, local.kills, local.deaths, won, xp, coins);
        }
      }
    } else {
      setGameState(prev => prev ? { ...prev, status: 'round-ended', rounds: { ...prev.rounds, A: newRoundsA, B: newRoundsB } } : null);
      setTimeout(() => {
        resetArena(currentRound + 1, newRoundsA, newRoundsB, state.players);
      }, 2500);
    }
  }, [mode, playerName]);

  const resetArena = useCallback(async (
    currentRound: number = 1, 
    roundsA: number = 0, 
    roundsB: number = 0,
    carryOverPlayers?: Player[]
  ) => {
    if (currentRound === 1) setIsInitialLoading(true);

    const players: Player[] = [];
    const mapIndex = (currentRound - 1) % MAP_LAYOUTS.length;
    const currentWalls = MAP_LAYOUTS[mapIndex];

    let teamASize = 1;
    let teamBSize = 1;
    
    if (mode === '1v1-local') {
      teamASize = 1; teamBSize = 1;
    } else if (mode === '1v5') {
      teamASize = 1; teamBSize = 5;
    } else {
      const parts = mode.split('v');
      teamASize = parseInt(parts[0]) || 1;
      teamBSize = parseInt(parts[1]) || 1;
    }

    if (mode === '1v1-local') {
      const s1 = getSafeSpawn('A', currentWalls);
      players.push({
        id: 'local1', name: playerName, team: 'A', x: s1.x, y: s1.y, angle: 0, 
        health: 100, maxHealth: 100, kills: carryOverPlayers?.find(p => p.id === 'local1')?.kills || 0,
        deaths: carryOverPlayers?.find(p => p.id === 'local1')?.deaths || 0, 
        color: COLORS.TEAM_A, isBot: false, class: playerClass, recoil: 0, flashTime: 0, walkCycle: 0
      });
      const s2 = getSafeSpawn('B', currentWalls);
      players.push({
        id: 'local2', name: 'PLAYER 2', team: 'B', x: s2.x, y: s2.y, angle: Math.PI, 
        health: 100, maxHealth: 100, kills: carryOverPlayers?.find(p => p.id === 'local2')?.kills || 0,
        deaths: carryOverPlayers?.find(p => p.id === 'local2')?.deaths || 0, 
        color: COLORS.TEAM_B, isBot: false, class: 'Assault', recoil: 0, flashTime: 0, walkCycle: 0
      });
    } else {
      const s1 = getSafeSpawn('A', currentWalls);
      players.push({
        id: 'local', name: playerName, team: 'A', x: s1.x, y: s1.y, angle: 0, 
        health: 100, maxHealth: 100, kills: carryOverPlayers?.find(p => p.id === 'local')?.kills || 0,
        deaths: carryOverPlayers?.find(p => p.id === 'local')?.deaths || 0, 
        color: COLORS.TEAM_A, isBot: false, class: playerClass, recoil: 0, flashTime: 0, walkCycle: 0, skinId: playerSkin
      });
      for(let i = 1; i < teamASize; i++) {
        const s = getSafeSpawn('A', currentWalls);
        players.push({
          id: `botA${i}`, name: `ALPHA-DRONE ${i}`, team: 'A', x: s.x, y: s.y, angle: 0, 
          health: 100, maxHealth: 100, kills: 0, deaths: 0, 
          color: COLORS.TEAM_A, isBot: true, class: 'Assault', recoil: 0, flashTime: 0, walkCycle: 0
        });
      }
      for(let i = 0; i < teamBSize; i++) {
        const s = getSafeSpawn('B', currentWalls);
        players.push({
          id: `botB${i}`, name: `BRAVO-DRONE ${i+1}`, team: 'B', x: s.x, y: s.y, angle: Math.PI, 
          health: 100, maxHealth: 100, kills: 0, deaths: 0, 
          color: COLORS.TEAM_B, isBot: true, class: 'Assault', recoil: 0, flashTime: 0, walkCycle: 0
        });
      }
    }

    setGameState({
      players, bullets: [], walls: currentWalls, score: { A: 0, B: 0 },
      rounds: { A: roundsA, B: roundsB, current: currentRound, max: MAX_ROUNDS },
      status: 'playing', mode, timeLeft: ROUND_DURATION, shake: 0, isPrivate: !!privateRoomData
    });
    
    setAnnouncement(`GRID SECTOR ${currentRound}`);
    
    setTimeout(() => {
      setIsInitialLoading(false);
      setAnnouncement('OPERATIONAL');
    }, 1500);
  }, [mode, playerClass, playerName, privateRoomData, playerSkin]);

  useEffect(() => {
    resetArena();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [mode, playerClass, playerName, playerSkin, resetArena]);

  const shoot = (state: GameState, p: Player, lastTimeRef: React.MutableRefObject<number>) => {
    if (Date.now() - lastTimeRef.current > RELOAD_TIME) {
      p.recoil = 24;
      // Fix: Removed duplicate 'team' property in the bullet object literal to resolve the 'multiple properties with the same name' error.
      state.bullets.push({
        id: Math.random().toString(), ownerId: p.id, team: p.team,
        x: p.x + Math.cos(p.angle) * 48, y: p.y + Math.sin(p.angle) * 48,
        vx: Math.cos(p.angle) * BULLET_SPEED, vy: Math.sin(p.angle) * BULLET_SPEED,
        damage: 25, life: 1
      });
      lastTimeRef.current = Date.now();
      state.shake = 16;
    }
  };

  const performSecurityCheck = (p: Player) => {
    // Variable Tampering Check
    if (PLAYER_SPEED !== goldenSpeed.current) {
      banPlayer(playerName).then(() => window.location.reload());
      return;
    }

    // Speed Hack Check
    const dist = Math.hypot(p.x - lastPosition.current.x, p.y - lastPosition.current.y);
    const now = performance.now();
    const dt = (now - lastFrameTime.current) / 1000; // in seconds
    
    // Theoretical max speed allowing for 1.5x buffer for network lag simulation
    const maxAllowedDist = PLAYER_SPEED * (dt * 120); 
    
    if (dist > maxAllowedDist && !isInitialLoading) {
      suspicionCount.current++;
      if (suspicionCount.current > 5) {
         banPlayer(playerName).then(() => window.location.reload());
      }
    } else {
      suspicionCount.current = Math.max(0, suspicionCount.current - 0.1);
    }

    lastPosition.current = { x: p.x, y: p.y };
    lastFrameTime.current = now;
  };

  const handleInput = (state: GameState) => {
    if (state.status !== 'playing') return;
    
    const p1 = state.players.find(p => p.id === 'local' || p.id === 'local1');
    if (p1 && p1.health > 0) {
      // Security Check before any state changes
      performSecurityCheck(p1);

      let dx = 0, dy = 0;
      if (keysPressed.current['w']) dy -= 1;
      if (keysPressed.current['s']) dy += 1;
      if (keysPressed.current['a']) dx -= 1;
      if (keysPressed.current['d']) dx += 1;
      if (dx !== 0 || dy !== 0) {
        const len = Math.sqrt(dx*dx + dy*dy);
        const mx = (dx/len) * PLAYER_SPEED; const my = (dy/len) * PLAYER_SPEED;
        if (!checkWallCollision(p1.x + mx, p1.y, state.walls)) p1.x += mx;
        if (!checkWallCollision(p1.x, p1.y + my, state.walls)) p1.y += my;
        p1.walkCycle += 0.45;
      }
      if (mode !== '1v1-local') {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) p1.angle = Math.atan2(mousePos.current.y - (p1.y + rect.top), mousePos.current.x - (p1.x + rect.left));
      } else {
        if (keysPressed.current['q']) p1.angle -= 0.1;
        if (keysPressed.current['e']) p1.angle += 0.1;
      }
      if (keysPressed.current['click'] || keysPressed.current[' '] || keysPressed.current['f']) shoot(state, p1, lastShotTime1);
    }

    const p2 = state.players.find(p => p.id === 'local2');
    if (p2 && p2.health > 0) {
      let dx = 0, dy = 0;
      if (keysPressed.current['arrowup']) dy -= 1;
      if (keysPressed.current['arrowdown']) dy += 1;
      if (keysPressed.current['arrowleft']) dx -= 1;
      if (keysPressed.current['arrowright']) dx += 1;
      if (dx !== 0 || dy !== 0) {
        const len = Math.sqrt(dx*dx + dy*dy);
        const mx = (dx/len) * PLAYER_SPEED; const my = (dy/len) * PLAYER_SPEED;
        if (!checkWallCollision(p2.x + mx, p2.y, state.walls)) p2.x += mx;
        if (!checkWallCollision(p2.x, p2.y + my, state.walls)) p2.y += my;
        p2.walkCycle += 0.45;
      }
      if (keysPressed.current['k']) p2.angle -= 0.1;
      if (keysPressed.current['l']) p2.angle += 0.1;
      if (keysPressed.current['m'] || keysPressed.current['enter']) shoot(state, p2, lastShotTime2);
    }
  };

  const update = useCallback((state: GameState) => {
    state.shake *= 0.88;
    
    // Player-to-Player Physical Collision Resolution
    const collisionRadius = 24; 
    const collisionDist = collisionRadius * 2;
    const pushStrength = 0.4; // How strongly they push away from each other
    
    for (let i = 0; i < state.players.length; i++) {
      for (let j = i + 1; j < state.players.length; j++) {
        const p1 = state.players[i];
        const p2 = state.players[j];
        if (p1.health <= 0 || p2.health <= 0) continue;

        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < collisionDist * collisionDist && distSq > 0) {
          const dist = Math.sqrt(distSq);
          const overlap = (collisionDist - dist) * pushStrength;
          const nx = dx / dist;
          const ny = dy / dist;
          
          const moveX = nx * overlap;
          const moveY = ny * overlap;

          // Attempt to resolve overlap by moving both players apart while respecting walls
          if (!checkWallCollision(p1.x + moveX, p1.y + moveY, state.walls)) {
            p1.x += moveX; p1.y += moveY;
          }
          if (!checkWallCollision(p2.x - moveX, p2.y - moveY, state.walls)) {
            p2.x -= moveX; p2.y -= moveY;
          }
        }
      }
    }

    state.players.forEach(p => {
      p.recoil *= 0.68; p.flashTime = Math.max(0, p.flashTime - 1);
      if (p.isBot && p.health > 0) {
        const target = state.players.find(e => e.team !== p.team && e.health > 0);
        if (target) {
          p.angle = Math.atan2(target.y - p.y, target.x - p.x);
          const dist = Math.hypot(target.x - p.x, target.y - p.y);
          if (dist > 300) { 
            const mx = Math.cos(p.angle) * 3.0;
            const my = Math.sin(p.angle) * 3.0;
            if(!checkWallCollision(p.x + mx, p.y + my, state.walls)) {
               p.x += mx; p.y += my; p.walkCycle += 0.28; 
            }
          }
          if (Math.random() < 0.04) shoot(state, p, { current: 0 } as any);
        }
      }
    });

    state.bullets = state.bullets.filter(b => {
      b.x += b.vx; b.y += b.vy;
      const hitWall = state.walls.some(w => b.x > w.x && b.x < w.x+w.w && b.y > w.y && b.y < w.y+w.h);
      if (hitWall) return false;
      let hitPlayer = false;
      state.players.forEach(p => {
        if (p.team !== b.team && p.health > 0 && Math.hypot(p.x - b.x, p.y - b.y) < 32) {
          p.health -= b.damage; p.flashTime = 12; hitPlayer = true;
          if (p.health <= 0) { state.shake = 35; }
        }
      });
      return !hitPlayer && b.x > 0 && b.x < CANVAS_WIDTH && b.y > 0 && b.y < CANVAS_HEIGHT;
    });

    if (state.status === 'playing') {
      const aliveA = state.players.filter(p => p.team === 'A' && p.health > 0).length;
      const aliveB = state.players.filter(p => p.team === 'B' && p.health > 0).length;
      if (aliveA === 0) handleRoundEnd(state, 'B');
      else if (aliveB === 0) handleRoundEnd(state, 'A');
      else if (state.timeLeft <= 0) handleRoundEnd(state, 'draw');
    }
  }, [handleRoundEnd, mode]);

  const drawHuman = (ctx: CanvasRenderingContext2D, p: Player) => {
    ctx.save();
    const bob = Math.sin(p.walkCycle) * 5.5;
    const recoilX = -Math.cos(p.angle) * p.recoil;
    const recoilY = -Math.sin(p.angle) * p.recoil;
    ctx.translate(p.x + recoilX, p.y + recoilY + bob);
    ctx.rotate(p.angle);

    const skin = CHARACTER_CATALOG.find(s => s.id === p.skinId) || CHARACTER_CATALOG[0];
    const neonColor = p.team === 'A' ? COLORS.TEAM_A : (p.id.startsWith('bot') ? COLORS.TEAM_B : skin.color);
    
    ctx.shadowBlur = 30; ctx.shadowColor = 'rgba(0,0,0,0.8)';
    if (p.flashTime > 0) ctx.filter = 'brightness(5)';
    
    ctx.strokeStyle = neonColor;
    ctx.lineWidth = 3;
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath(); ctx.roundRect(-20, -22, 32, 44, 12); ctx.fill(); ctx.stroke();
    
    ctx.fillStyle = '#050505';
    ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    
    ctx.fillStyle = neonColor;
    ctx.shadowBlur = 15; ctx.shadowColor = neonColor;
    ctx.fillRect(8, -6, 6, 12);
    
    ctx.fillStyle = '#111';
    ctx.fillRect(15, -4, 30, 8);
    ctx.strokeRect(15, -4, 30, 8);
    
    ctx.restore();
  };

  const draw = useCallback((ctx: CanvasRenderingContext2D, state: GameState) => {
    ctx.save();
    if (state.shake > 0.5) ctx.translate((Math.random()-0.5)*state.shake, (Math.random()-0.5)*state.shake);
    ctx.fillStyle = COLORS.BACKGROUND;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    ctx.strokeStyle = '#0a1020'; ctx.lineWidth = 1;
    for(let i=0; i<CANVAS_WIDTH; i+=100){ ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,CANVAS_HEIGHT); ctx.stroke(); }
    for(let i=0; i<CANVAS_HEIGHT; i+=100){ ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(CANVAS_WIDTH,i); ctx.stroke(); }

    state.walls.forEach(w => {
      ctx.fillStyle = '#0f172a'; ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 4; ctx.strokeRect(w.x, w.y, w.w, w.h);
    });

    state.bullets.forEach(b => {
      const neon = b.team === 'A' ? COLORS.TEAM_A : COLORS.TEAM_B;
      ctx.shadowBlur = 25; ctx.shadowColor = neon;
      ctx.strokeStyle = neon; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - b.vx * 1.5, b.y - b.vy * 1.5); ctx.stroke();
    });

    state.players.forEach(p => { if (p.health > 0) drawHuman(ctx, p); });
    ctx.restore();
  }, []);

  const loop = useCallback(() => {
    if (isInitialLoading) return;
    setGameState(prev => {
      if (!prev || prev.status === 'match-ended') return prev;
      const ns = { ...prev };
      handleInput(ns); update(ns);
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) draw(ctx, ns);
      return ns;
    });
    requestRef.current = requestAnimationFrame(loop);
  }, [isInitialLoading, update, draw, handleInput]);

  useEffect(() => {
    if (!isInitialLoading) requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current);
  }, [isInitialLoading, loop]);

  useEffect(() => {
    const kd = (e: KeyboardEvent) => keysPressed.current[e.key.toLowerCase()] = true;
    const ku = (e: KeyboardEvent) => keysPressed.current[e.key.toLowerCase()] = false;
    const mm = (e: MouseEvent) => mousePos.current = { x: e.clientX, y: e.clientY };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku); window.addEventListener('mousemove', mm);
    window.addEventListener('mousedown', () => keysPressed.current['click'] = true);
    window.addEventListener('mouseup', () => keysPressed.current['click'] = false);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); window.removeEventListener('mousemove', mm); };
  }, []);

  if (isInitialLoading) return (
    <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-[300]">
      <div className="text-center space-y-12">
        <h1 className="text-8xl font-black pixel-font text-cyan-500 animate-pulse drop-shadow-[0_0_40px_rgba(6,182,212,0.9)]">PIXEL SHOTS</h1>
        <div className="text-[12px] pixel-font text-white/20 uppercase tracking-[1em]">Establishing Link to Sector {gameState?.rounds.current || 1}...</div>
        <div className="w-96 h-2 bg-white/5 rounded-full overflow-hidden border border-white/10 relative">
           <div className="absolute inset-0 bg-cyan-500/10 animate-pulse"></div>
           <div className="h-full bg-cyan-500 shadow-[0_0_20px_#06b6d4] animate-[shimmer_2s_infinite]"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden cursor-crosshair">
      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="max-w-full max-h-full" />
      {gameState && <HUD gameState={gameState} onQuit={onQuit} announcement={announcement} />}
      <div className="absolute inset-0 pointer-events-none z-[50] bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.6)_100%)]"></div>
    </div>
  );
};

export default GameArena;
