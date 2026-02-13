
import React from 'react';
import { GameState, Player } from '../types';
import ChatBox from './ChatBox';

interface HUDProps {
  gameState: GameState;
  onQuit: () => void;
  announcement: string;
}

const HUD: React.FC<HUDProps> = ({ gameState, onQuit, announcement }) => {
  if (!gameState || !gameState.players) return null;

  const localPlayers = gameState.mode === '1v1-local' 
    ? gameState.players.filter(p => p.id === 'local1' || p.id === 'local2')
    : [gameState.players.find(p => p.id === 'local')].filter(Boolean) as Player[];

  const renderPlayerPanel = (player: Player) => {
    const isTeamA = player.team === 'A';
    const neon = isTeamA ? '#ff0055' : '#00f2ff';
    
    return (
      <div key={player.id} className="bg-black/40 backdrop-blur-xl p-6 rounded-[40px] border border-white/5 w-80 shadow-2xl relative overflow-hidden group">
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
         
         <div className="flex justify-between items-end mb-5">
           <div>
             <div className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em] mb-1">OPERATOR</div>
             <div className="text-xl font-black text-white tracking-tighter uppercase">{player.name}</div>
           </div>
           <div className="text-right">
             <div className="text-[8px] font-black uppercase tracking-[0.3em] mb-1 text-white/30">STATUS</div>
             <div className="flex items-center space-x-1.5">
               <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: neon }}></div>
               <span className="text-[10px] font-black" style={{ color: neon }}>ACTIVE</span>
             </div>
           </div>
         </div>
         
         <div className="mb-5">
           <div className="flex justify-between items-center mb-1.5 px-1">
              <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">NEURAL BIO-SYNC</span>
              <span className="text-[10px] font-black tabular-nums" style={{ color: neon }}>
                {Math.ceil(player.health)}%
              </span>
           </div>
           <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden p-0.5 border border-white/10">
             <div 
               className="h-full transition-all duration-700 rounded-full"
               style={{ 
                 width: `${player.health}%`,
                 backgroundColor: neon,
                 boxShadow: `0 0 10px ${neon}`
               }}
             ></div>
           </div>
         </div>

         <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
           <div>
             <span className="text-[8px] text-white/30 font-black uppercase tracking-[0.2em]">KILLS</span>
             <div className="text-2xl font-black text-white">{player.kills}</div>
           </div>
           <div className="text-right">
             <span className="text-[8px] text-white/30 font-black uppercase tracking-[0.2em]">DEATHS</span>
             <div className="text-2xl font-black text-white">{player.deaths}</div>
           </div>
         </div>
      </div>
    );
  };

  return (
    <div className="absolute inset-0 pointer-events-none p-10 flex flex-col justify-between select-none">
      <div className="flex justify-between items-start">
        <div className="flex space-x-6">
           <div className="bg-black/60 backdrop-blur-xl border border-white/5 p-5 rounded-[25px] shadow-2xl min-w-[120px]">
             <div className="text-[8px] text-white/30 uppercase font-black tracking-[0.3em] mb-1">ALPHA SCORE</div>
             <div className="text-4xl font-black pixel-font text-[#ff0055] drop-shadow-[0_0_10px_rgba(255,0,85,0.4)]">{gameState.rounds.A}</div>
           </div>
           <div className="bg-black/60 backdrop-blur-xl border border-white/5 p-5 rounded-[25px] shadow-2xl min-w-[120px]">
             <div className="text-[8px] text-white/30 uppercase font-black tracking-[0.3em] mb-1">BRAVO SCORE</div>
             <div className="text-4xl font-black pixel-font text-[#00f2ff] drop-shadow-[0_0_10px_rgba(0,242,255,0.4)]">{gameState.rounds.B}</div>
           </div>
        </div>

        <div className="bg-black/80 backdrop-blur-md p-6 rounded-[30px] border border-white/10 flex flex-col items-center shadow-2xl">
          <div className="text-[8px] text-white/30 font-black tracking-[0.4em] mb-1.5 uppercase">GRID TIME</div>
          <div className="text-4xl font-black text-white font-mono tracking-tight">
            {Math.floor(gameState.timeLeft / 60)}:{(gameState.timeLeft % 60).toString().padStart(2, '0')}
          </div>
        </div>

        <button onClick={onQuit} className="pointer-events-auto bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-3 rounded-2xl text-[10px] pixel-font text-white/50 hover:text-white transition-all uppercase tracking-widest shadow-lg">Abort Link</button>
      </div>

      <div className="text-center">
        {announcement && (
          <div className="bg-white/5 backdrop-blur-3xl px-12 py-5 rounded-[40px] border border-white/10 text-white text-xl font-black tracking-[0.6em] animate-pulse inline-block shadow-[0_0_40px_rgba(255,255,255,0.1)] uppercase">
             {announcement}
          </div>
        )}
      </div>

      <div className="flex justify-between items-end w-full">
        {localPlayers.map(renderPlayerPanel)}
        {localPlayers.length === 1 && (
          <div className="pointer-events-auto scale-90 origin-bottom-right">
            <ChatBox playerName={localPlayers[0].name} roomId={gameState.isPrivate ? 'SQUAD' : 'GLOBAL'} compact={true} />
          </div>
        )}
      </div>
    </div>
  );
};

export default HUD;
