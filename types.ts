import React from 'react';

export interface Point {
    x: number;
    y: number;
}

export interface GameCanvasHandle {
    restart: () => void;
}

export interface HUDProps {
    scoreRef: React.RefObject<HTMLDivElement>;
    timerContainerRef: React.RefObject<HTMLDivElement>;
    timerDigitsRef: React.RefObject<HTMLDivElement>;
    highScore: number;
}

export interface GameCanvasProps {
    onGameOver: (finalScore: number) => void;
    scoreRef: React.RefObject<HTMLDivElement>;
    timerContainerRef: React.RefObject<HTMLDivElement>;
    timerDigitsRef: React.RefObject<HTMLDivElement>;
    gameState: 'start' | 'playing' | 'gameover';
}

export interface GameOverModalProps {
    score: number;
    highScore: number;
    isNewHighScore: boolean;
    onRestart: () => void;
    onHome: () => void;
}

export interface StartScreenProps {
    onStart: () => void;
}