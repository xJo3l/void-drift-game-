import React, { useState, useRef, useEffect, useCallback } from 'react';
import HUD from './components/HUD';
import GameOverModal from './components/GameOverModal';
import GameCanvas from './components/GameCanvas';
import { GameCanvasHandle } from './types';

const STORAGE_KEY = 'flowstate_highscore';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<'playing' | 'gameover'>('playing');
  const [finalScore, setFinalScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  
  // Refs to direct DOM elements for high-performance updates
  const scoreRef = useRef<HTMLDivElement>(null);
  const timerContainerRef = useRef<HTMLDivElement>(null);
  const timerDigitsRef = useRef<HTMLDivElement>(null);
  const gameCanvasRef = useRef<GameCanvasHandle>(null);

  // Load high score on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setHighScore(parseInt(stored, 10));
    }
  }, []);

  const handleGameOver = useCallback((score: number) => {
    setFinalScore(score);
    
    // We need to check against the current high score state
    // To ensure we have the latest value in the callback without adding it as a dependency
    // (which would reset the GameCanvas), we can use the functional state update or just rely on the 
    // fact that this callback will be stable if we use a ref pattern, 
    // BUT since we are passing it to GameCanvas which now handles stability internally, 
    // we can just use the state variable.
    // Actually, to update state correctly based on previous state:
    
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
  }, []);

  const handleRestart = () => {
    setGameState('playing');
    if (gameCanvasRef.current) {
      gameCanvasRef.current.restart();
    }
  };

  return (
    <div className={`relative w-screen h-screen overflow-hidden bg-[#08080a] text-white select-none ${gameState === 'playing' ? 'cursor-none' : 'cursor-default'}`}>
       
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
         />
       )}
       
       <GameCanvas 
         ref={gameCanvasRef}
         onGameOver={handleGameOver} 
         scoreRef={scoreRef} 
         timerContainerRef={timerContainerRef} 
         timerDigitsRef={timerDigitsRef}
       />

    </div>
  );
};

export default App;