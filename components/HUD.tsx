
import React from 'react';
import { GameState } from '../types';
import ChatBox from './ChatBox';

interface HUDProps {
  gameState: GameState;
  onQuit: () => void;
  announcement: string;
}

const HUD: React.FC<HUDProps> = ({ gameState, onQuit, announcement }) => {
  if (!gameState || !gameState.players) return null;

  const localPlayer = gameState.players.find(p => p.id === 'local');
  const teamALive = gameState.players.filter(p => p.team === 'A' && p.health > 0).length;
  const teamBLive = gameState.players.filter(p => p.team === 'B' && p.health > 0).length;

  return (
    <div className="absolute inset-0 pointer-events-none p-10 flex flex-col justify-between select-none font-sans">
      <div className="flex justify-between items-start">
        <div className="flex space-x-8">
           <div className="bg-slate-900/90 backdrop-blur-xl border-l-4 border-rose-600 p-5 rounded-r-xl shadow-2xl">
             <div className="text-[10px] text-rose-500 uppercase font-black tracking-[0.2em] mb-1">ALPHA SQUAD</div>
             <div className="flex items-end space-x-4">
               <span className="text-5xl font-black pixel-font text-white leading-none">{gameState.rounds.A}</span>
               <span className="text-[10px] text-slate-500 font-bold uppercase mb-1">{teamALive} ACTIVE</span>
             </div>
           </div>
           <div className="bg-slate-900/90 backdrop-blur-xl border-l-4 border-cyan-400 p-5 rounded-r-xl shadow-2xl">
             <div className="text-[10px] text-cyan-400 uppercase font-black tracking-[0.2em] mb-1">BRAVO SQUAD</div>
             <div className="flex items-end space-x-4">
               <span className="text-5xl font-black pixel-font text-white leading-none">{gameState.rounds.B}</span>
               <span className="text-[10px] text-slate-500 font-bold uppercase mb-1">{teamBLive} ACTIVE</span>
             </div>
           </div>

           <div className="pointer-events-auto opacity-40 hover:opacity-100 transition-all scale-90 origin-top-left">
              <ChatBox 
                playerName={localPlayer?.name || 'Observer'} 
                roomId={gameState.isPrivate ? 'SQUAD_NET' : 'GLOBAL_NET'} 
                compact={true} 
              />
           </div>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-3xl border border-slate-800 flex flex-col items-center min-w-[160px] shadow-2xl">
          <div className="text-[11px] text-slate-500 font-black tracking-[0.4em] mb-2 uppercase">MISSION TIME</div>
          <div className="text-4xl font-black tracking-widest text-white leading-none font-mono">
            {Math.floor(gameState.timeLeft / 60)}:{(gameState.timeLeft % 60).toString().padStart(2, '0')}
          </div>
          <div className="flex space-x-2 mt-4">
            {Array.from({ length: gameState.rounds.max }).map((_, i) => (
              <div key={i} className={`w-6 h-1 rounded-full transition-all duration-500 ${i < gameState.rounds.current ? 'bg-cyan-500 shadow-[0_0_12px_#22d3ee]' : 'bg-slate-800'}`}></div>
            ))}
          </div>
        </div>

        <button 
          onClick={onQuit}
          className="pointer-events-auto bg-rose-950/20 hover:bg-rose-600 border border-rose-500/30 p-4 rounded-xl text-[10px] pixel-font text-rose-500 hover:text-white transition-all uppercase tracking-widest shadow-lg"
        >
          Abort
        </button>
      </div>

      <div className="text-center">
        {announcement && (
          <div className="bg-black/60 backdrop-blur-xl px-12 py-5 rounded-full border border-cyan-500/40 text-cyan-400 text-xl font-black tracking-[0.3em] animate-pulse shadow-[0_0_50px_rgba(6,182,212,0.3)] inline-block">
             {announcement.toUpperCase()}
          </div>
        )}
      </div>

      <div className="flex justify-between items-end">
        <div className="bg-slate-900/90 backdrop-blur-2xl p-8 rounded-[40px] border border-slate-800 w-96 shadow-2xl relative overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent h-24 -translate-y-24 animate-[scan_4s_linear_infinite] pointer-events-none opacity-50"></div>
           
           <div className="flex justify-between items-end mb-6">
             <div>
               <div className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">OPERATOR SIG</div>
               <div className="text-2xl font-black text-white uppercase tracking-tighter">{localPlayer?.name || 'SYNCING...'}</div>
             </div>
             <div className="text-right">
               <div className="text-xs text-cyan-500 font-black uppercase tracking-widest">{localPlayer?.class || 'CLASS-D'}</div>
               <div className="text-[10px] text-slate-500 font-bold uppercase">UPLINK ESTABLISHED</div>
             </div>
           </div>
           
           <div className="mb-6">
             <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">BIO-STATUS</span>
                <span className={`text-sm font-black pixel-font ${localPlayer?.health! < 30 ? 'text-rose-500 animate-pulse' : 'text-cyan-400'}`}>
                  {Math.ceil(localPlayer?.health || 0)}%
                </span>
             </div>
             <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800 p-0.5">
               <div 
                 className={`h-full transition-all duration-700 rounded-full ${
                   localPlayer?.health! < 30 ? 'bg-rose-600' : 'bg-gradient-to-r from-cyan-600 via-blue-500 to-indigo-600'
                 }`}
                 style={{ width: `${localPlayer?.health || 0}%` }}
               ></div>
             </div>
           </div>

           <div className="grid grid-cols-3 gap-6 border-t border-slate-800 pt-6">
             <div className="flex flex-col">
               <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">ELIMINATIONS</span>
               <span className="text-2xl font-black text-white">{localPlayer?.kills || 0}</span>
             </div>
             <div className="flex flex-col items-center">
               <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">EFFICIENCY</span>
               <span className="text-2xl font-black text-yellow-500">
                {(localPlayer?.kills! / (localPlayer?.deaths || 1)).toFixed(1)}
               </span>
             </div>
             <div className="flex flex-col items-end">
               <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">DEFEATS</span>
               <span className="text-2xl font-black text-white">{localPlayer?.deaths || 0}</span>
             </div>
           </div>
        </div>

        <div className="w-72">
           <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800 text-[10px] text-slate-500 font-black uppercase tracking-[0.25em] text-center leading-relaxed shadow-xl">
              ENGAGEMENT RULES: TERMINATE HOSTILE OPERATORS. <br/>
              <span className="text-cyan-500 mt-2 block">SECURE VICTORY FOR SQUAD</span>
           </div>
        </div>
      </div>

      <style>{`
        @keyframes scan {
          from { transform: translateY(-100%); }
          to { transform: translateY(300%); }
        }
      `}</style>
    </div>
  );
};

export default HUD;
