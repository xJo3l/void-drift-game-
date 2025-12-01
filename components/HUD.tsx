import React from 'react';
import { HUDProps } from '../types';

const HUD: React.FC<HUDProps> = ({ scoreRef, timerContainerRef, timerDigitsRef, highScore }) => {
  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 p-[30px] box-border">
      {/* Score Card */}
      <div className="absolute top-[30px] left-[30px] bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-6 py-4 shadow-2xl min-w-[160px]">
        <div className="text-[11px] font-semibold tracking-[1.5px] text-white/40 uppercase mb-1">
          Session Score
        </div>
        <div 
          ref={scoreRef} 
          className="text-[28px] font-extrabold tracking-tight bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent"
        >
          0
        </div>
        <div className="mt-2 pt-2 border-t border-white/10 flex justify-between items-center">
            <span className="text-[10px] font-bold tracking-widest text-white/30 uppercase">Best</span>
            <span className="text-[12px] font-bold text-white/60 tabular-nums">{highScore.toLocaleString()}</span>
        </div>
      </div>

      {/* Combat Timer (Shield) */}
      <div 
        ref={timerContainerRef}
        className="absolute top-[40px] left-1/2 -translate-x-1/2 text-center hidden"
      >
        <div className="text-[12px] tracking-[4px] text-cyan-400 uppercase mb-1 drop-shadow-[0_0_10px_rgba(0,255,255,0.5)] animate-pulse-text">
          SHIELD ACTIVE
        </div>
        <div 
          ref={timerDigitsRef}
          className="text-[60px] font-extrabold text-white leading-none tracking-tighter drop-shadow-[0_0_30px_rgba(0,255,255,0.4)]"
        >
          15.0<span className="text-[24px] text-white/50 ml-0.5">s</span>
        </div>
      </div>
    </div>
  );
};

export default HUD;