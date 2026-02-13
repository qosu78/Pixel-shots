
import React, { useState, useEffect, useRef } from 'react';
import { GameMode, PlayerClass, PlayerStats, CharacterSkin } from '../types';
import { LEVEL_XP_BASE, CHARACTER_CATALOG } from '../constants';
import { buySkin, equipSkin, getPlayerStats, buyDiamonds } from '../services/firebaseService';
import ChatBox from './ChatBox';

interface LobbyProps {
  onStart: (mode: GameMode, pClass: PlayerClass, name: string) => void;
  onJoinRoom: (roomId: string, mode: GameMode, pClass: PlayerClass, name: string) => void;
  stats: PlayerStats | null;
  currentName: string;
}

const Lobby: React.FC<LobbyProps> = ({ onStart, onJoinRoom, stats: initialStats, currentName }) => {
  const [activeTab, setActiveTab] = useState<'arena' | 'shop' | 'quests'>('arena');
  const [selectedMode, setSelectedMode] = useState<GameMode>('1v1');
  const [selectedClass, setSelectedClass] = useState<PlayerClass>('Assault');
  const [playerName, setPlayerName] = useState<string>(currentName);
  const [stats, setStats] = useState<PlayerStats | null>(initialStats);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [skinPreview, setSkinPreview] = useState<CharacterSkin>(() => {
    return CHARACTER_CATALOG.find(s => s.id === initialStats?.equippedSkin) || CHARACTER_CATALOG[0];
  });

  useEffect(() => {
    if (initialStats) {
      setStats(initialStats);
      const skin = CHARACTER_CATALOG.find(s => s.id === initialStats.equippedSkin);
      if (skin) setSkinPreview(skin);
    }
  }, [initialStats]);

  // Reliable Character Preview Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    let animationId: number;

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2 + 20;
      const bob = Math.sin(frame * 0.05) * 10;
      const neon = skinPreview.color;

      ctx.save();
      ctx.translate(centerX, centerY + bob);
      
      // Shadow Glow
      ctx.shadowBlur = 40; ctx.shadowColor = neon;
      ctx.fillStyle = `${neon}22`;
      ctx.beginPath(); ctx.ellipse(0, 150, 80, 20, 0, 0, Math.PI * 2); ctx.fill();

      // Proportional Humanoid Grid-Operator
      ctx.strokeStyle = neon;
      ctx.lineWidth = 4;
      ctx.lineJoin = 'round';
      
      // Legs
      ctx.fillStyle = '#0a0a0a';
      ctx.beginPath(); ctx.roundRect(-25, 40, 16, 85, 5); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.roundRect(10, 40, 16, 85, 5); ctx.fill(); ctx.stroke();

      // Torso
      ctx.beginPath(); ctx.roundRect(-40, -85, 80, 130, 20); ctx.fill(); ctx.stroke();
      
      // Arms
      ctx.beginPath(); ctx.roundRect(-65, -75, 22, 75, 8); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.roundRect(43, -75, 22, 75, 8); ctx.fill(); ctx.stroke();

      // Head / Helmet
      ctx.beginPath(); ctx.arc(0, -125, 32, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      
      // Visor
      ctx.shadowBlur = 30;
      ctx.fillStyle = neon;
      ctx.fillRect(-18, -135, 45, 12);
      
      // Tactical Equipment (Weapon)
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#050505';
      ctx.strokeStyle = neon;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(30, -30, 130, 25, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = neon; ctx.shadowBlur = 20; ctx.shadowColor = neon;
      ctx.fillRect(130, -25, 20, 15);

      ctx.restore();
      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [skinPreview]);

  const handleBuySkin = async (skin: CharacterSkin) => {
    if (!stats) return;
    const success = await buySkin(playerName, skin.id, skin.costCoins, skin.costDiamonds);
    if (success) {
      const newStats = await getPlayerStats(playerName);
      setStats(newStats);
    } else {
      alert("Insufficient Resources. Premium Diamonds required.");
    }
  };

  const handleEquipSkin = async (skinId: string) => {
    await equipSkin(playerName, skinId);
    const newStats = await getPlayerStats(playerName);
    setStats(newStats);
    const skin = CHARACTER_CATALOG.find(s => s.id === skinId);
    if (skin) setSkinPreview(skin);
  };

  const handleTopUp = async () => {
    if (window.confirm("Authorize payment for 100 Premium Diamonds? (Demo Transaction)")) {
      await buyDiamonds(playerName, 100);
      const newStats = await getPlayerStats(playerName);
      setStats(newStats);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#02040a] overflow-hidden relative font-sans text-white">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,_#0a1a2f_0%,_#02040a_100%)] opacity-80"></div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>

      {/* Top Header Section */}
      <header className="relative z-10 flex items-center justify-between px-12 py-8 bg-black/40 backdrop-blur-2xl border-b border-white/5">
        <div className="flex items-center space-x-12">
          <div className="group cursor-pointer">
            <h1 className="text-4xl font-black pixel-font text-cyan-500 drop-shadow-[0_0_15px_rgba(6,182,212,0.8)] tracking-tighter">PIXEL SHOTS</h1>
            <div className="h-0.5 w-0 group-hover:w-full bg-cyan-500 transition-all duration-500"></div>
          </div>
          
          <nav className="flex space-x-10">
            {['arena', 'shop', 'quests'].map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab as any)}
                className={`text-[11px] pixel-font uppercase tracking-[0.3em] transition-all relative ${activeTab === tab ? 'text-white' : 'text-white/20 hover:text-white/60'}`}
              >
                {tab}
                {activeTab === tab && <div className="absolute -bottom-2 left-0 w-full h-1 bg-cyan-500 shadow-[0_0_10px_#06b6d4]"></div>}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
              <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_8px_#eab308]"></div>
              <span className="text-sm font-black tabular-nums">{stats?.coins || 0}</span>
            </div>
            <div className="flex items-center space-x-2 bg-cyan-500/10 border border-cyan-500/30 px-4 py-2 rounded-xl group relative cursor-pointer" onClick={handleTopUp}>
              <div className="w-3 h-3 rotate-45 bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></div>
              <span className="text-sm font-black text-cyan-400 tabular-nums">{stats?.diamonds || 0}</span>
              <div className="absolute -top-2 -right-2 bg-cyan-500 text-black text-[7px] font-black px-1 rounded animate-bounce">BUY</div>
            </div>
          </div>

          <div className="h-10 w-px bg-white/10"></div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-[9px] font-black text-cyan-600 uppercase tracking-widest">RANK: {stats?.rank || 'BRONZE'}</div>
              <div className="text-sm font-black text-white">{playerName}</div>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-cyan-600 to-indigo-900 rounded-2xl border border-white/10 flex items-center justify-center font-black text-lg shadow-xl relative overflow-hidden">
               {stats?.level || 1}
               <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <main className="flex-1 flex overflow-hidden relative z-10">
        {activeTab === 'arena' && (
          <>
            {/* Left: Operative Preview */}
            <div className="w-2/5 p-12 flex flex-col items-center justify-center border-r border-white/5 bg-black/20">
              <div className="w-full h-full relative flex flex-col">
                <div className="text-center mb-8">
                  <h3 className="text-cyan-500/40 text-[10px] pixel-font uppercase tracking-[0.5em] mb-2">Neural Frame Preview</h3>
                  <div className="h-px w-24 bg-cyan-500/20 mx-auto"></div>
                </div>
                
                <canvas ref={canvasRef} width={600} height={700} className="w-full h-auto drop-shadow-[0_0_100px_rgba(6,182,212,0.1)]" />
                
                <div className="mt-auto text-center space-y-4">
                   <h2 className="text-3xl font-black text-white uppercase tracking-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">{skinPreview.name}</h2>
                   <p className="text-[10px] text-white/40 uppercase tracking-[0.4em] max-w-xs mx-auto leading-loose">{skinPreview.description}</p>
                </div>
              </div>
            </div>

            {/* Right: Mission Parameters */}
            <div className="flex-1 p-20 flex flex-col justify-center space-y-16 overflow-y-auto">
              <section className="max-w-4xl space-y-12">
                <div>
                  <h3 className="text-white font-black text-xs uppercase tracking-[0.8em] mb-8 flex items-center">
                    <span className="w-2 h-2 bg-cyan-500 rounded-full mr-4 shadow-[0_0_10px_#06b6d4]"></span>
                    DEPLOYMENT SECTOR
                  </h3>
                  <div className="grid grid-cols-4 gap-4">
                    {['1v1', '2v2', '3v3', '4v4', '5v5', '1v5', '1v1-local'].map(m => (
                      <button 
                        key={m} 
                        onClick={() => setSelectedMode(m as any)}
                        className={`p-6 rounded-3xl border-2 text-[10px] pixel-font uppercase transition-all duration-300 ${selectedMode === m ? 'bg-cyan-500 border-cyan-400 text-black shadow-[0_0_30px_rgba(6,182,212,0.4)] scale-105' : 'bg-white/5 border-white/5 text-white/30 hover:border-white/20'}`}
                      >
                        {m.replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-white font-black text-xs uppercase tracking-[0.8em] mb-8 flex items-center">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full mr-4 shadow-[0_0_10px_#6366f1]"></span>
                    OPERATIVE CLASS
                  </h3>
                  <div className="grid grid-cols-3 gap-6">
                    {['Assault', 'Sniper', 'Tank'].map(c => (
                      <button 
                        key={c} 
                        onClick={() => setSelectedClass(c as any)}
                        className={`p-10 rounded-[40px] border-2 flex flex-col items-center group transition-all duration-500 ${selectedClass === c ? 'bg-white/10 border-white/30' : 'bg-white/5 border-white/5 opacity-50 hover:opacity-80'}`}
                      >
                         <div className={`text-2xl font-black tracking-tighter mb-2 transition-all ${selectedClass === c ? 'text-white' : 'text-white/40'}`}>{c.toUpperCase()}</div>
                         <div className={`h-1 w-8 rounded-full transition-all ${selectedClass === c ? 'bg-cyan-500 w-16 shadow-[0_0_10px_#06b6d4]' : 'bg-white/10'}`}></div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-12">
                   <button 
                    onClick={() => onStart(selectedMode, selectedClass, playerName)}
                    className="w-full py-12 bg-white text-black font-black rounded-[50px] transition-all hover:scale-[1.03] active:scale-95 shadow-[0_0_100px_rgba(255,255,255,0.15)] group relative overflow-hidden"
                   >
                     <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                     <span className="pixel-font text-3xl uppercase tracking-tighter group-hover:tracking-normal transition-all">LINK NEURAL CORES</span>
                   </button>
                </div>
              </section>
            </div>
          </>
        )}

        {activeTab === 'shop' && (
          <div className="flex-1 p-20 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-between items-end mb-16">
                <div>
                  <h2 className="text-6xl font-black text-white uppercase tracking-tighter">THE VAULT</h2>
                  <p className="text-cyan-500 text-[11px] font-black uppercase tracking-[0.8em] mt-4">NEURAL FRAME ACQUISITION</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-10">
                {CHARACTER_CATALOG.map(skin => {
                  const isOwned = stats?.ownedSkins?.includes(skin.id);
                  const isEquipped = stats?.equippedSkin === skin.id;
                  
                  return (
                    <div key={skin.id} className={`bg-black/40 border-2 rounded-[50px] p-10 flex flex-col items-center transition-all duration-500 group ${isEquipped ? 'border-cyan-500 shadow-[0_0_40px_rgba(6,182,212,0.15)]' : 'border-white/5 hover:border-white/20'}`}>
                      <div className="w-32 h-32 rounded-full flex items-center justify-center mb-10 relative">
                        <div className="absolute inset-0 rounded-full blur-3xl opacity-20 transition-opacity group-hover:opacity-40" style={{ backgroundColor: skin.color }}></div>
                        <div className="w-24 h-24 rounded-[30px] border-4 rotate-12 flex items-center justify-center bg-black/60 relative z-10" style={{ borderColor: skin.color }}>
                          <div className="w-8 h-8 rounded-full" style={{ backgroundColor: skin.color, boxShadow: `0 0 20px ${skin.color}` }}></div>
                        </div>
                      </div>

                      <h4 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">{skin.name}</h4>
                      <p className="text-[10px] text-white/30 text-center uppercase tracking-widest leading-loose h-12 overflow-hidden">{skin.description}</p>

                      <div className="mt-10 w-full">
                        {isOwned ? (
                          <button 
                            onClick={() => handleEquipSkin(skin.id)}
                            disabled={isEquipped}
                            className={`w-full py-5 rounded-3xl font-black text-[10px] pixel-font uppercase transition-all ${isEquipped ? 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20' : 'bg-white/10 text-white hover:bg-white hover:text-black'}`}
                          >
                            {isEquipped ? 'ACTIVE' : 'SYNC'}
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleBuySkin(skin)}
                            className="w-full py-5 bg-white text-black rounded-3xl font-black text-[10px] pixel-font uppercase transition-all flex items-center justify-center space-x-3 hover:bg-cyan-400"
                          >
                            {skin.costDiamonds > 0 ? (
                              <><div className="w-3 h-3 rotate-45 bg-black"></div><span>{skin.costDiamonds}</span></>
                            ) : (
                              <><div className="w-3 h-3 rounded-full bg-black"></div><span>{skin.costCoins}</span></>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'quests' && (
          <div className="flex-1 p-20 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-10">
               <h2 className="text-5xl font-black text-white uppercase tracking-tighter mb-16 underline decoration-cyan-500 underline-offset-8">DIRECTIVES</h2>
               {[
                 { title: 'Sector Wipeout', reward: '1000 Coins', task: 'Neutralize 50 Enemy Units', progress: '14/50' },
                 { title: 'Victory Protocol', reward: '2500 Coins', task: 'Achieve 5 Sequential Match Wins', progress: '2/5' },
                 { title: 'Ghost Mode', reward: '1500 Coins', task: 'Complete Round with 0 Damage Taken', progress: '0/1' }
               ].map((q, i) => (
                 <div key={i} className="bg-white/5 border border-white/10 p-12 rounded-[50px] flex justify-between items-center group hover:bg-white/10 transition-all cursor-default">
                    <div className="space-y-3">
                       <div className="text-3xl font-black text-white uppercase tracking-tight group-hover:text-cyan-400 transition-colors">{q.title}</div>
                       <div className="text-xs text-white/30 font-bold uppercase tracking-widest">{q.task}</div>
                       <div className="text-[11px] text-cyan-500 font-black uppercase mt-6 bg-cyan-500/10 px-4 py-1.5 rounded-full inline-block">PAYOUT: {q.reward}</div>
                    </div>
                    <div className="text-right space-y-4">
                       <div className="text-4xl font-black text-white/10 group-hover:text-white transition-colors tabular-nums">{q.progress}</div>
                       <div className="w-48 bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                          <div className="h-full bg-cyan-500 shadow-[0_0_10px_#06b6d4]" style={{ width: '30%' }}></div>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}
      </main>

      {/* Persistent Visual Overlays */}
      <div className="absolute inset-0 pointer-events-none z-[100] border-[20px] border-black/20 blur-xl"></div>
      <div className="absolute inset-0 pointer-events-none z-[101] opacity-5 bg-[linear-gradient(to_bottom,transparent_50%,black_50%)] bg-[length:100%_4px]"></div>
    </div>
  );
};

export default Lobby;
