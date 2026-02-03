
import React, { useEffect, useState } from 'react';
import { Room, RoomPlayer } from '../types';
import { listenToRoom } from '../services/firebaseService';
import ChatBox from './ChatBox';

interface WaitingRoomProps {
  roomId: string;
  onStartMatch: (room: Room) => void;
  onBack: () => void;
}

const WaitingRoom: React.FC<WaitingRoomProps> = ({ roomId, onStartMatch, onBack }) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    const unsub = listenToRoom(roomId, (updatedRoom) => {
      setRoom(updatedRoom);
      const teamASize = parseInt(updatedRoom.mode.split('v')[0]) || 1;
      const teamBSize = updatedRoom.mode === '1v5' ? 5 : (parseInt(updatedRoom.mode.split('v')[1]) || 1);
      const required = teamASize + teamBSize;

      if (updatedRoom.players.length >= required && !countdown) {
        setCountdown(5);
      } else if (updatedRoom.players.length < required) {
        setCountdown(null);
      }
    });
    return () => unsub();
  }, [roomId, countdown]);

  useEffect(() => {
    if (countdown !== null) {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
      } else if (room) {
        onStartMatch(room);
      }
    }
  }, [countdown, room, onStartMatch]);

  if (!room) return (
    <div className="flex-1 flex flex-col items-center justify-center bg-black">
      <div className="text-cyan-400 pixel-font animate-pulse">ESTABLISHING UPLINK...</div>
    </div>
  );

  const teamA = room.players.filter(p => p.team === 'A');
  const teamB = room.players.filter(p => p.team === 'B');
  const teamASize = parseInt(room.mode.split('v')[0]) || 1;
  const teamBSize = room.mode === '1v5' ? 5 : (parseInt(room.mode.split('v')[1]) || 1);

  const localPlayer = room.players.find(p => p.id.startsWith('local_')) || room.players[0];

  const renderSlot = (player?: RoomPlayer, teamColor?: string) => (
    <div className={`h-16 border border-slate-800 rounded-lg mb-3 flex items-center px-4 bg-slate-900/40 backdrop-blur-sm ${player ? 'border-l-4' : 'border-dashed opacity-50'}`} style={{ borderLeftColor: player ? teamColor : undefined }}>
      {player ? (
        <div className="flex items-center justify-between w-full">
          <span className="pixel-font text-xs text-white uppercase">{player.name}</span>
          <div className="flex items-center space-x-2">
            {player.isHost && <span className="text-[8px] bg-yellow-500 text-black px-1 font-bold rounded">HOST</span>}
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
          </div>
        </div>
      ) : (
        <span className="text-[10px] text-slate-700 font-bold italic tracking-widest">SCANNING...</span>
      )}
    </div>
  );

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_top,_#0f172a,_#000)] p-8">
      <div className="absolute top-8 left-8">
        <button onClick={onBack} className="text-slate-500 hover:text-white text-xs uppercase font-black tracking-widest transition-colors hover:text-rose-500">← ABORT LINK</button>
      </div>

      <div className="text-center mb-12">
        <h2 className="text-4xl font-black text-white mb-2 uppercase tracking-tighter">Squad Deployment</h2>
        <div className="bg-cyan-500/10 border border-cyan-500/20 px-6 py-2 rounded-full inline-block">
          <span className="text-slate-500 text-[10px] font-bold uppercase mr-3">JOIN CODE:</span>
          <span className="text-cyan-400 pixel-font text-xl tracking-[0.2em]">{room.code}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8 w-full max-w-7xl h-[450px]">
        <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800/50 overflow-y-auto">
          <h3 className="text-rose-500 font-black uppercase text-[10px] tracking-[0.3em] mb-6 flex justify-between">
            <span>TEAM ALPHA</span>
            <span>{teamA.length} / {teamASize}</span>
          </h3>
          {Array.from({ length: teamASize }).map((_, i) => renderSlot(teamA[i], '#f43f5e'))}
        </div>

        <div className="flex flex-col space-y-4">
          <h3 className="text-indigo-400 font-black uppercase text-[10px] tracking-[0.3em] text-center">Room Comms</h3>
          <div className="flex-1">
             <ChatBox roomId={room.id} playerName={localPlayer.name} team={localPlayer.team} />
          </div>
        </div>

        <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800/50 overflow-y-auto">
          <h3 className="text-cyan-400 font-black uppercase text-[10px] tracking-[0.3em] mb-6 flex justify-between">
            <span>TEAM BRAVO</span>
            <span>{teamB.length} / {teamBSize}</span>
          </h3>
          {Array.from({ length: teamBSize }).map((_, i) => renderSlot(teamB[i], '#22d3ee'))}
        </div>
      </div>

      <div className="mt-12 text-center h-24">
        {countdown !== null ? (
          <div className="animate-bounce">
            <div className="text-rose-500 pixel-font text-5xl mb-4">{countdown}</div>
            <div className="text-white text-xs font-black tracking-[0.8em] uppercase">ENGAGEMENT COMMENCING</div>
          </div>
        ) : (
          <div className="text-slate-500 text-xs font-bold uppercase tracking-widest animate-pulse">
            Waiting for squad link synchronization...
          </div>
        )}
      </div>
    </div>
  );
};

export default WaitingRoom;
