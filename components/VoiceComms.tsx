
import React from 'react';

interface VoiceCommsProps {
  active: boolean;
  onTranscription?: (text: string) => void;
}

const VoiceComms: React.FC<VoiceCommsProps> = ({ active }) => {
  if (!active) return null;

  return (
    <div className="flex items-center space-x-3 bg-slate-900/80 px-4 py-2 rounded-full border border-slate-700 opacity-50">
      <div className="w-2 h-2 rounded-full bg-slate-600"></div>
      <span className="text-[9px] pixel-font text-slate-400 uppercase tracking-widest">
        COMMS OFFLINE (AI DISABLED)
      </span>
    </div>
  );
};

export default VoiceComms;
