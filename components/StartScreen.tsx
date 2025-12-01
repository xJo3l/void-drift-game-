import React from 'react';
import { StartScreenProps } from '../types';

const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  return (
    <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center z-50 bg-[#08080a] animate-float-up">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/20 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-[100px]"></div>
        </div>

      <div className="relative z-10 text-center px-6">
        <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-2 drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
          VOID DRIFT
        </h1>
        <h2 className="text-xl md:text-2xl text-cyan-400 font-bold tracking-[0.5em] uppercase mb-16 opacity-90">
          Deep Space
        </h2>
        
        <div className="flex flex-col gap-6 mb-16 text-gray-400 text-sm tracking-widest uppercase font-semibold">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center mb-1">
                <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
            </div>
            <p><span className="text-white">Mouse / Touch</span> to Move</p>
          </div>
          
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto"></div>

          <p>
            <span className="text-violet-400">Crash Violets</span> together
          </p>
        </div>

        <button 
          onClick={onStart}
          className="group relative px-16 py-5 bg-white text-black font-extrabold text-lg tracking-[0.2em] uppercase transition-all duration-300 hover:bg-cyan-400 hover:shadow-[0_0_40px_rgba(34,211,238,0.4)]"
        >
          <span className="relative z-10">Initialize System</span>
          <div className="absolute inset-0 border border-white/40 translate-x-1.5 translate-y-1.5 -z-10 transition-transform duration-300 group-hover:translate-x-2.5 group-hover:translate-y-2.5"></div>
        </button>
      </div>
    </div>
  );
};

export default StartScreen;