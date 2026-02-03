
import React, { useState, useEffect } from 'react';
import Lobby from './components/Lobby';
import GameArena from './components/GameArena';
import WaitingRoom from './components/WaitingRoom';
import { GameMode, PlayerClass, PlayerStats, Room } from './types';
import { getPlayerStats } from './services/firebaseService';

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
    setSelectedMode(mode);
    setSelectedClass(pClass);
    if (name !== playerName) setPlayerName(name);
    setView('game');
  };

  const enterWaitingRoom = (roomId: string, mode: GameMode, pClass: PlayerClass, name: string) => {
    setCurrentRoomId(roomId);
    setSelectedMode(mode);
    setSelectedClass(pClass);
    if (name !== playerName) setPlayerName(name);
    setView('waiting');
  };

  const startPrivateMatch = (data: Room) => {
    setRoomData(data);
    setView('game');
  };

  const backToLobby = () => {
    setView('lobby');
    setCurrentRoomId(null);
    setRoomData(null);
    getPlayerStats(playerName).then(setPlayerStats);
  };

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
