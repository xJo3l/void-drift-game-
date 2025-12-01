import React, { useState, useRef, useEffect, useCallback } from 'react';
import HUD from './components/HUD';
import GameOverModal from './components/GameOverModal';
import StartScreen from './components/StartScreen';
import GameCanvas from './components/GameCanvas';
import { GameCanvasHandle } from './types';
import { audio } from './utils/audio';

const STORAGE_KEY = 'voiddrift_highscore';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [finalScore, setFinalScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  
  const scoreRef = useRef<HTMLDivElement>(null);
  const timerContainerRef = useRef<HTMLDivElement>(null);
  const timerDigitsRef = useRef<HTMLDivElement>(null);
  const gameCanvasRef = useRef<GameCanvasHandle>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setHighScore(parseInt(stored, 10));
    }
  }, []);

  const handleStart = () => {
    setGameState('playing');
    audio.ready();
    audio.playTheme('game');
    if (gameCanvasRef.current) {
        gameCanvasRef.current.restart();
    }
  };

  const handleGameOver = useCallback((score: number) => {
    setFinalScore(score);
    
    setHighScore(prevHigh => {
        if (score > prevHigh) {
            setIsNewHighScore(true);
            localStorage.setItem(STORAGE_KEY, score.toString());
            return score;
        } else {
            setIsNewHighScore(false);
            return prevHigh;
        }
    });

    setGameState('gameover');
    audio.playTheme('menu');
  }, []);

  const handleRestart = () => {
    setGameState('playing');
    if (gameCanvasRef.current) {
      gameCanvasRef.current.restart();
    }
    audio.playTheme('game');
  };

  const handleHome = () => {
    setGameState('start');
    audio.playTheme('menu');
  };

  return (
    <div className={`relative w-screen h-screen overflow-hidden bg-[#08080a] text-white select-none ${gameState === 'playing' ? 'cursor-none' : 'cursor-default'}`}>
       
       {gameState === 'start' && (
           <StartScreen onStart={handleStart} />
       )}

       <HUD 
         scoreRef={scoreRef} 
         timerContainerRef={timerContainerRef} 
         timerDigitsRef={timerDigitsRef} 
         highScore={highScore}
       />
       
       {gameState === 'gameover' && (
         <GameOverModal 
           score={finalScore} 
           highScore={highScore}
           isNewHighScore={isNewHighScore}
           onRestart={handleRestart}
           onHome={handleHome}
         />
       )}
       
       <GameCanvas 
         ref={gameCanvasRef}
         onGameOver={handleGameOver} 
         scoreRef={scoreRef} 
         timerContainerRef={timerContainerRef} 
         timerDigitsRef={timerDigitsRef}
         gameState={gameState}
       />

    </div>
  );
};

export default App;