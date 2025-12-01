import React from 'react';
import { GameOverModalProps } from '../types';

const GameOverModal: React.FC<GameOverModalProps> = ({ score, highScore, isNewHighScore, onRestart }) => {
  return (
    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm animate-float-up">
      <div className="bg-[#18181b] px-16 py-12 rounded-3xl text-center border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        <div className="text-[12px] text-gray-400 tracking-[2px] uppercase mb-3">
          Game Over
        </div>
        <div className="text-[42px] font-extrabold text-white mb-4 tracking-tighter">
          {score.toLocaleString()}
        </div>
        
        {isNewHighScore ? (
            <div className="mb-8 flex flex-col items-center gap-1">
                <span className="text-cyan-400 text-sm tracking-widest font-bold uppercase animate-pulse-text">New High Score!</span>
            </div>
        ) : (
            <div className="mb-8 text-gray-500 text-xs tracking-widest uppercase font-bold">
                Best: {highScore.toLocaleString()}
            </div>
        )}

        <button 
          onClick={onRestart}
          className="bg-white text-black border-none px-10 py-4 rounded-xl font-extrabold text-[14px] tracking-widest uppercase cursor-pointer hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
        >
          Play Again
        </button>
      </div>
    </div>
  );
};

export default GameOverModal;