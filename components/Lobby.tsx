
import React, { useState } from 'react';
import { GameMode, PlayerClass, PlayerStats } from '../types';
import { LEVEL_XP_BASE } from '../constants';
import { createPrivateRoom, joinPrivateRoom } from '../services/firebaseService';
import ChatBox from './ChatBox';

interface LobbyProps {
  onStart: (mode: GameMode, pClass: PlayerClass, name: string) => void;
  onJoinRoom: (roomId: string, mode: GameMode, pClass: PlayerClass, name: string) => void;
  stats: PlayerStats | null;
  currentName: string;
}

const Lobby: React.FC<LobbyProps> = ({ onStart, onJoinRoom, stats, currentName }) => {
  const [mode, setMode] = useState<GameMode>('1v1');
  const [pClass, setPClass] = useState<PlayerClass>('Assault');
  const [name, setName] = useState<string>(currentName);
  const [joinCode, setJoinCode] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modes: GameMode[] = ['1v1', '2v2', '3v3', '4v4', '5v5', '1v5'];
  const classes: { type: PlayerClass; desc: string }[] = [
    { type: 'Assault', desc: 'Balanced speed and damage.' },
    { type: 'Sniper', desc: 'High damage, fragile, fast bullets.' },
    { type: 'Tank', desc: 'High health, slow movement.' },
  ];

  const handleCreatePrivate = async () => {
    setLoading(true);
    setError(null);
    try {
      const roomId = await createPrivateRoom(name, mode);
      onJoinRoom(roomId, mode, pClass, name);
    } catch (e) {
      setError("Failed to create room.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinPrivate = async () => {
    if (!joinCode) return;
    setLoading(true);
    setError(null);
    try {
      const roomId = await joinPrivateRoom(name, joinCode);
      onJoinRoom(roomId, '1v1', pClass, name);
    } catch (e: any) {
      setError(e.message === "ROOM_FULL" ? "Room is full." : "Invalid code.");
    } finally {
      setLoading(false);
    }
  };

  const xpRequired = stats ? stats.level * LEVEL_XP_BASE : 1000;
  const xpProgress = stats ? (stats.xp / xpRequired) * 100 : 0;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[radial-gradient(circle_at_center,_#0f172a,_#000)] overflow-y-auto">
      <div className="mb-8 text-center">
        <h1 className="text-6xl font-black pixel-font tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-blue-400 to-indigo-600 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
          PIXEL SHOTS
        </h1>
        <p className="mt-2 text-slate-400 font-medium tracking-widest uppercase text-xs">Elite Arena Combat System</p>
      </div>

      <div className="w-full max-w-6xl mb-6 bg-slate-900/60 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center pixel-font text-2xl border-4 border-blue-400 shadow-lg shadow-blue-500/20">
            {stats?.level || 1}
          </div>
          <div>
            <div className="text-2xl font-black text-white flex items-center space-x-3">
              <span>{name}</span>
              <span className="text-xs bg-indigo-600 px-2 py-0.5 rounded text-indigo-100 uppercase pixel-font tracking-widest">
                {stats?.rank || 'Bronze'}
              </span>
            </div>
            <div className="mt-2 w-64 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div className="h-full bg-blue-500" style={{ width: `${xpProgress}%` }}></div>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Career Kills</div>
          <div className="text-2xl font-black text-emerald-400 pixel-font">{stats?.totalKills || 0}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl mb-8">
        <div className="space-y-6 bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
          <h3 className="text-indigo-400 font-bold uppercase text-[10px] tracking-widest">Identity</h3>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <h3 className="text-indigo-400 font-bold uppercase text-[10px] tracking-widest mt-4">Arena Mode</h3>
          <div className="grid grid-cols-3 gap-2">
            {modes.map((m) => (
              <button key={m} onClick={() => setMode(m)} className={`p-2 rounded border text-[10px] ${mode === m ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>{m}</button>
            ))}
          </div>
        </div>

        <div className="space-y-3 bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
          <h3 className="text-indigo-400 font-bold uppercase text-[10px] tracking-widest">Operator Class</h3>
          {classes.map((c) => (
            <button key={c.type} onClick={() => setPClass(c.type)} className={`w-full p-3 rounded-xl border flex flex-col items-start ${pClass === c.type ? 'bg-indigo-600/20 border-indigo-500' : 'bg-slate-800 border-slate-700'}`}>
              <span className={`font-bold text-xs ${pClass === c.type ? 'text-indigo-400' : 'text-slate-300'}`}>{c.type}</span>
              <span className="text-[9px] text-slate-500 uppercase tracking-tighter">{c.desc}</span>
            </button>
          ))}
        </div>

        <div className="space-y-6 bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
          <h3 className="text-rose-400 font-bold uppercase text-[10px] tracking-widest">Private Room</h3>
          <button 
            disabled={loading}
            onClick={handleCreatePrivate}
            className="w-full py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs pixel-font tracking-tighter"
          >
            {loading ? "LINKING..." : "CREATE ROOM"}
          </button>
          <div className="pt-4 border-t border-slate-800">
            <input 
              type="text" 
              placeholder="JOIN CODE"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="w-full bg-slate-950 border border-slate-800 p-3 rounded mb-2 text-center text-xs pixel-font"
            />
            <button 
              disabled={loading || !joinCode}
              onClick={handleJoinPrivate}
              className="w-full py-4 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/50 text-emerald-400 text-xs pixel-font"
            >
              JOIN ROOM
            </button>
          </div>
          {error && <p className="text-[10px] text-rose-500 text-center font-bold animate-shake">{error}</p>}
        </div>

        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
          <h3 className="text-emerald-400 font-bold uppercase text-[10px] tracking-widest mb-4">Tactical Comms</h3>
          <ChatBox playerName={name} roomId="global" />
        </div>
      </div>

      <button
        onClick={() => onStart(mode, pClass, name)}
        className="px-16 py-6 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-full shadow-[0_0_40px_rgba(37,99,235,0.4)] transform hover:scale-105 active:scale-95 transition-all pixel-font text-xl"
      >
        QUICK DEPLOYMENT
      </button>
    </div>
  );
};

export default Lobby;
