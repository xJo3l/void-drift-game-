import React from 'react';
import { HUDProps } from '../types';

const HUD: React.FC<HUDProps> = ({ scoreRef, timerContainerRef, timerDigitsRef, highScore }) => {
  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 p-4 box-border overflow-hidden">
      {/* Score Card - Compact, Left Aligned, Fit Content */}
      <div className="absolute top-4 left-4 md:top-6 md:left-6 bg-black/30 backdrop-blur-md border border-white/10 rounded-lg px-4 py-2.5 shadow-lg flex flex-col gap-0.5 w-fit">
        {/* Row 1: Current Score */}
        <div className="flex items-baseline gap-2">
            <div 
              ref={scoreRef} 
              className="text-2xl md:text-3xl font-bold tracking-tight text-white leading-none tabular-nums"
            >
              0
            </div>
            <div className="text-[10px] font-bold tracking-widest text-white/50 uppercase">
              PTS
            </div>
        </div>
        
        {/* Row 2: Best Score (Tightly Grouped) */}
        <div className="flex items-center gap-2">
             <span className="text-[9px] font-bold text-violet-400 uppercase tracking-wider">
                BEST
             </span>
             <span className="text-[9px] font-medium text-white/70 tabular-nums tracking-wide">
                {highScore.toLocaleString()}
             </span>
        </div>
      </div>

      {/* Combat Timer (Shield) */}
      <div 
        ref={timerContainerRef}
        className="absolute top-[15%] left-1/2 -translate-x-1/2 text-center hidden"
      >
        <div className="text-[10px] tracking-[3px] text-cyan-400 uppercase mb-1 drop-shadow-[0_0_10px_rgba(0,255,255,0.5)] animate-pulse-text">
          SHIELD
        </div>
        <div 
          ref={timerDigitsRef}
          className="text-4xl md:text-5xl font-extrabold text-white leading-none tracking-tighter drop-shadow-[0_0_20px_rgba(0,255,255,0.4)] tabular-nums"
        >
          15.0
        </div>
      </div>
    </div>
  );
};

export default HUD;