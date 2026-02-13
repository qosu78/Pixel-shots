
import React, { useState, useEffect } from 'react';
import Lobby from './components/Lobby';
import GameArena from './components/GameArena';
import WaitingRoom from './components/WaitingRoom';
import { GameMode, PlayerClass, PlayerStats, Room } from './types';
import { getPlayerStats, resetIdentity } from './services/firebaseService';

const App: React.FC = () => {
  const [view, setView] = useState<'lobby' | 'waiting' | 'game'>('lobby');
  const [selectedMode, setSelectedMode] = useState<GameMode>('1v1');
  const [selectedClass, setSelectedClass] = useState<PlayerClass>('Assault');
  const [playerName, setPlayerName] = useState<string>(() => {
    return localStorage.getItem('pixel_shots_last_name') || 'ShadowWalker';
  });
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [roomData, setRoomData] = useState<Room | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      const stats = await getPlayerStats(playerName);
      setPlayerStats(stats);
      localStorage.setItem('pixel_shots_last_name', playerName);
    };
    loadStats();
  }, [playerName]);

  const startQuickMatch = (mode: GameMode, pClass: PlayerClass, name: string) => {
    if (playerStats?.isBanned) return;
    setSelectedMode(mode);
    setSelectedClass(pClass);
    if (name !== playerName) setPlayerName(name);
    setView('game');
  };

  const enterWaitingRoom = (roomId: string, mode: GameMode, pClass: PlayerClass, name: string) => {
    if (playerStats?.isBanned) return;
    setCurrentRoomId(roomId);
    setSelectedMode(mode);
    setSelectedClass(pClass);
    if (name !== playerName) setPlayerName(name);
    setView('waiting');
  };

  const startPrivateMatch = (data: Room) => {
    if (playerStats?.isBanned) return;
    setRoomData(data);
    setView('game');
  };

  const backToLobby = () => {
    setView('lobby');
    setCurrentRoomId(null);
    setRoomData(null);
    getPlayerStats(playerName).then(setPlayerStats);
  };

  if (playerStats?.isBanned) {
    return (
      <div className="w-full h-screen bg-[#050000] flex flex-col items-center justify-center p-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#ff000022_0%,_transparent_70%)] animate-pulse"></div>
        <div className="z-10 text-center space-y-8 max-w-2xl">
          <h1 className="text-8xl font-black pixel-font text-rose-600 drop-shadow-[0_0_30px_#e11d48] animate-bounce">ACCESS DENIED</h1>
          <div className="h-1 w-full bg-rose-600/30"></div>
          <p className="text-xl font-bold text-rose-500/80 uppercase tracking-[0.3em] leading-relaxed italic">
            Neural link terminated. Security breach detected in your sector. This identity has been permanently blacklisted from the Tactical Net.
          </p>
          <div className="p-10 bg-rose-950/20 border border-rose-500/30 rounded-3xl backdrop-blur-xl">
             <div className="text-[10px] pixel-font text-rose-500 uppercase mb-4">VIOLATION RECORDED</div>
             <ul className="text-left text-xs text-rose-400/60 space-y-2 font-mono">
                <li>> CRITICAL_ANOMALY: Movement logic outside safety bounds</li>
                <li>> SECURITY_FLAG: External process interference detected</li>
                <li>> STATUS: Account Suspended Permanently</li>
             </ul>
          </div>
          <button 
            onClick={() => resetIdentity()}
            className="px-12 py-5 bg-rose-600 text-white font-black pixel-font rounded-full shadow-[0_0_40px_#e11d48] hover:bg-white hover:text-black transition-all hover:scale-110 active:scale-95"
          >
            PURGE IDENTITY & RESET
          </button>
          <p className="text-[9px] text-white/20 uppercase tracking-widest mt-10">Warning: All rank, coins, and unlocks will be lost forever.</p>
        </div>
        <div className="absolute inset-0 pointer-events-none opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-slate-950 text-white overflow-hidden flex flex-col">
      {view === 'lobby' && (
        <Lobby 
          onStart={startQuickMatch} 
          onJoinRoom={enterWaitingRoom}
          stats={playerStats} 
          currentName={playerName} 
        />
      )}
      {view === 'waiting' && currentRoomId && (
        <WaitingRoom 
          roomId={currentRoomId} 
          onStartMatch={startPrivateMatch} 
          onBack={backToLobby} 
        />
      )}
      {view === 'game' && (
        <GameArena 
          mode={selectedMode} 
          playerClass={selectedClass} 
          playerName={playerName}
          onQuit={backToLobby}
          privateRoomData={roomData}
        />
      )}
    </div>
  );
};

export default App;
