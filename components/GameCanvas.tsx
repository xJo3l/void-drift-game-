import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { GameCanvasHandle, GameCanvasProps, Point } from '../types';

// --- Game Constants ---
const SHIELD_COOLDOWN = 35 * 60; // Frames

// --- Helper Functions ---
function drawModernOrb(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color1: string, color2: string) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 5;
    const grad = ctx.createLinearGradient(x - radius, y - radius, x + radius, y + radius);
    grad.addColorStop(0, color1);
    grad.addColorStop(1, color2);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
}

// --- Game Entities ---
class Star {
    x: number;
    y: number;
    speed: number;
    size: number;
    opacity: number;
    width: number;
    height: number;

    constructor(w: number, h: number) {
        this.width = w;
        this.height = h;
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.speed = Math.random() * 1.5 + 0.2;
        this.size = (this.speed / 2.0) * 2.5;
        this.opacity = (this.speed / 2.0) * 0.8 + 0.1;
    }

    update() {
        this.x -= this.speed;
        if (this.x < -10) {
            this.x = this.width + Math.random() * 50;
            this.y = Math.random() * this.height;
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Player {
    x: number;
    y: number;
    trail: Point[] = [];
    invincibleTimer: number = 0;

    constructor(startX: number, startY: number) {
        this.x = startX;
        this.y = startY;
    }

    update(mouseX: number, mouseY: number) {
        this.x += (mouseX - this.x) * 0.12;
        this.y += (mouseY - this.y) * 0.12;
        
        if (this.invincibleTimer > 0) this.invincibleTimer--;
        
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 20) this.trail.shift();
    }

    draw(ctx: CanvasRenderingContext2D, frame: number) {
        let c1 = '#60A5FA';
        let c2 = '#2563EB';
        let trailColor = 'rgba(59, 130, 246, 0.4)';

        if (this.invincibleTimer > 0) {
            c1 = '#E0F2FE';
            c2 = '#06B6D4';
            trailColor = 'rgba(6, 182, 212, 0.5)';

            const pulseSpeed = frame * 0.08;
            drawModernOrb(ctx, this.x, this.y, 75 + Math.sin(pulseSpeed) * 5, 'rgba(6, 182, 212, 0.0)', 'rgba(6, 182, 212, 0.1)');

            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(-pulseSpeed * 0.5);
            ctx.strokeStyle = `rgba(103, 232, 249, ${0.5 + Math.sin(pulseSpeed) * 0.2})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, 50 + Math.sin(pulseSpeed) * 4, 0, Math.PI * 1.85);
            ctx.stroke();
            ctx.restore();

            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(pulseSpeed * 3);
            ctx.strokeStyle = `rgba(255, 255, 255, 0.9)`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 28, 0, Math.PI * 1.4);
            ctx.stroke();
            ctx.restore();
        }

        if (this.trail.length > 1) {
            ctx.beginPath();
            ctx.moveTo(this.trail[0].x, this.trail[0].y);
            for (let i = 1; i < this.trail.length; i++) {
                const xc = (this.trail[i].x + this.trail[i - 1].x) / 2;
                const yc = (this.trail[i].y + this.trail[i - 1].y) / 2;
                ctx.quadraticCurveTo(this.trail[i - 1].x, this.trail[i - 1].y, xc, yc);
            }
            ctx.lineTo(this.x, this.y);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = 15;
            ctx.strokeStyle = trailColor;
            ctx.stroke();
        }

        drawModernOrb(ctx, this.x, this.y, 12, c1, c2);
    }
}

class PowerUp {
    x: number;
    y: number;
    life: number = 300;
    size: number = 15;

    constructor(w: number, h: number) {
        this.x = Math.random() * (w - 100) + 50;
        this.y = Math.random() * (h - 100) + 50;
    }

    update() { this.life--; }

    draw(ctx: CanvasRenderingContext2D, frame: number) {
        const pulse = 1 + Math.sin(frame * 0.2) * 0.2;
        ctx.globalAlpha = Math.min(1, this.life / 50);

        drawModernOrb(ctx, this.x, this.y, 50 + pulse * 5, 'rgba(52, 211, 153, 0.0)', 'rgba(52, 211, 153, 0.2)');
        drawModernOrb(ctx, this.x, this.y, this.size * pulse, '#34D399', '#059669');

        ctx.globalAlpha = 1;
    }
}

class Enemy {
    x: number;
    y: number;
    speed: number;
    angle: number = 0;
    size: number;

    constructor(w: number, h: number) {
        this.x = Math.random() < 0.5 ? -50 : w + 50;
        this.y = Math.random() * h;
        this.speed = Math.random() * 1.0 + 0.5;
        this.size = Math.random() * 10 + 12;
    }

    update(targetX: number, targetY: number) {
        const targetAngle = Math.atan2(targetY - this.y, targetX - this.x);
        this.angle = targetAngle;
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
    }

    draw(ctx: CanvasRenderingContext2D) {
        drawModernOrb(ctx, this.x, this.y, this.size, '#FBA74B', '#EF4444');
    }
}

class Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number = 1.0;
    color: string;

    constructor(x: number, y: number, color: string) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.color = color || '#fff';
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.03;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// --- Component ---
const GameCanvas = forwardRef<GameCanvasHandle, GameCanvasProps>(({ onGameOver, scoreRef, timerContainerRef, timerDigitsRef }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);
    
    // Use a ref for onGameOver so we don't need to restart the game loop when the prop changes
    const onGameOverRef = useRef(onGameOver);

    useEffect(() => {
        onGameOverRef.current = onGameOver;
    }, [onGameOver]);
    
    // Game State stored in refs to avoid re-renders during loop
    const state = useRef({
        player: null as Player | null,
        enemies: [] as Enemy[],
        powerups: [] as PowerUp[],
        particles: [] as Particle[],
        stars: [] as Star[],
        score: 0,
        frame: 0,
        mouse: { x: 0, y: 0 },
        isGameOver: false,
        shieldSpawnTimer: 0,
        width: 0,
        height: 0,
        initialized: false
    });

    const initGame = () => {
        if (!canvasRef.current) return;
        
        const w = window.innerWidth;
        const h = window.innerHeight;
        canvasRef.current.width = w;
        canvasRef.current.height = h;

        state.current = {
            width: w,
            height: h,
            mouse: { x: w / 2, y: h / 2 },
            player: new Player(w / 2, h / 2),
            enemies: [],
            powerups: [],
            particles: [],
            stars: [],
            score: 0,
            frame: 0,
            isGameOver: false,
            shieldSpawnTimer: 0,
            initialized: true
        };

        // Init Stars
        for (let i = 0; i < 150; i++) {
            state.current.stars.push(new Star(w, h));
        }

        // Reset UI
        if (scoreRef.current) scoreRef.current.innerText = "0";
        if (timerContainerRef.current) timerContainerRef.current.style.display = "none";
    };

    useImperativeHandle(ref, () => ({
        restart: () => {
            initGame();
        }
    }));

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { alpha: false }); // Optimize
        if (!ctx) return;

        // Only init if not already initialized
        if (!state.current.initialized) {
            initGame();
        }

        const handleResize = () => {
            if (canvas) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                state.current.width = window.innerWidth;
                state.current.height = window.innerHeight;
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            state.current.mouse.x = e.clientX;
            state.current.mouse.y = e.clientY;
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);

        const loop = () => {
            if (!ctx || !canvas) return;

            const s = state.current;
            if (s.isGameOver) {
                // Keep drawing particles for effect
                 ctx.fillStyle = '#08080a';
                 ctx.fillRect(0, 0, s.width, s.height);
                 
                 for (let i = s.particles.length - 1; i >= 0; i--) {
                     const p = s.particles[i];
                     p.update();
                     p.draw(ctx);
                     if (p.life <= 0) s.particles.splice(i, 1);
                 }
                 requestRef.current = requestAnimationFrame(loop);
                 return;
            }

            s.frame++;
            s.score++;

            // Update DOM directly for performance
            if (scoreRef.current && s.frame % 10 === 0) { // Throttle slightly
                scoreRef.current.innerText = s.score.toLocaleString();
            }

            // Clear BG
            ctx.fillStyle = '#08080a';
            ctx.fillRect(0, 0, s.width, s.height);

            // Stars
            for (const star of s.stars) {
                star.update();
                star.draw(ctx);
            }

            // Player Logic
            if (s.player) {
                s.player.update(s.mouse.x, s.mouse.y);
                s.player.draw(ctx, s.frame);

                // Shield Timer UI
                if (s.player.invincibleTimer > 0) {
                    if (timerContainerRef.current && timerContainerRef.current.style.display === 'none') {
                        timerContainerRef.current.style.display = 'block';
                    }
                    if (timerDigitsRef.current) {
                        const remainingSeconds = s.player.invincibleTimer / 60;
                        const secondsStr = remainingSeconds.toFixed(1);
                        timerDigitsRef.current.innerHTML = `${secondsStr}<span class="text-[24px] text-white/50 ml-0.5">s</span>`;
                        timerDigitsRef.current.style.color = remainingSeconds <= 3.0 ? "#ff0055" : "#ffffff";
                    }
                } else {
                    if (timerContainerRef.current && timerContainerRef.current.style.display === 'block') {
                        timerContainerRef.current.style.display = 'none';
                    }
                }
            }

            // Enemies Spawning
            if (s.frame % 40 === 0) {
                s.enemies.push(new Enemy(s.width, s.height));
            }

            // Powerup Spawning
            if (s.player && s.player.invincibleTimer <= 0 && s.powerups.length === 0) {
                s.shieldSpawnTimer++;
            }
            if (s.shieldSpawnTimer >= SHIELD_COOLDOWN) {
                s.powerups.push(new PowerUp(s.width, s.height));
                s.shieldSpawnTimer = 0;
            }

            // Powerups Logic
            for (let i = s.powerups.length - 1; i >= 0; i--) {
                const p = s.powerups[i];
                p.update();
                p.draw(ctx, s.frame);

                if (!s.player) continue;

                const dx = p.x - s.player.x;
                const dy = p.y - s.player.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 60) {
                    s.player.invincibleTimer = 900; // 15s
                    for (let k = 0; k < 20; k++) {
                        s.particles.push(new Particle(p.x, p.y, '#34D399'));
                    }
                    s.powerups.splice(i, 1);
                } else if (p.life <= 0) {
                    s.powerups.splice(i, 1);
                }
            }

            // Enemies Logic
            for (let i = s.enemies.length - 1; i >= 0; i--) {
                const e = s.enemies[i];
                if (!s.player) continue;

                e.update(s.player.x, s.player.y);
                e.draw(ctx);

                const dx = e.x - s.player.x;
                const dy = e.y - s.player.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < (e.size + 12)) {
                    if (s.player.invincibleTimer > 0) {
                        // Enemy Destroyed
                        for (let k = 0; k < 15; k++) {
                            s.particles.push(new Particle(e.x, e.y, '#FBA74B'));
                        }
                        s.score += 500;
                        s.enemies.splice(i, 1);
                    } else {
                        // Game Over
                        s.isGameOver = true;
                        for (let k = 0; k < 30; k++) {
                            s.particles.push(new Particle(e.x, e.y, '#fff'));
                        }
                        // Use the Ref for onGameOver to call the latest stable function
                        if (onGameOverRef.current) {
                            onGameOverRef.current(s.score);
                        }
                    }
                } else if (e.x < -200 || e.x > s.width + 200 || e.y < -200 || e.y > s.height + 200) {
                    s.enemies.splice(i, 1);
                }
            }

            // Particles
            for (let i = s.particles.length - 1; i >= 0; i--) {
                const p = s.particles[i];
                p.update();
                p.draw(ctx);
                if (p.life <= 0) s.particles.splice(i, 1);
            }

            requestRef.current = requestAnimationFrame(loop);
        };

        requestRef.current = requestAnimationFrame(loop);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
        // Removed props from dependencies to prevent full restart on every render
        // Only empty dependency array ensures this runs once on mount
    }, []); 

    return <canvas ref={canvasRef} className="block w-full h-full" />;
});

export default GameCanvas;