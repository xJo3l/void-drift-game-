import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { GameCanvasHandle, GameCanvasProps, Point } from '../types';
import { audio } from '../utils/audio';

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
class Projectile {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number = 4;
    color: string = '#10B981';

    constructor(x: number, y: number, targetX: number, targetY: number) {
        this.x = x;
        this.y = y;
        const angle = Math.atan2(targetY - y, targetX - x);
        const speed = 4;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

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

type EnemyType = 'seeker' | 'rammer' | 'shooter';

class Enemy {
    x: number;
    y: number;
    speed: number;
    angle: number = 0;
    size: number;
    type: EnemyType;
    attackTimer: number = 0;
    dead: boolean = false;

    constructor(w: number, h: number, type: EnemyType, score: number) {
        this.x = Math.random() < 0.5 ? -50 : w + 50;
        this.y = Math.random() * h;
        this.type = type;

        const isMobile = w < 768;

        // Scale speed over 60,000 points
        const speedMultiplier = 1 + (Math.min(score, 60000) / 60000); 
        const mobileSpeedFactor = isMobile ? 0.8 : 1.0;

        if (this.type === 'shooter') {
            this.speed = (Math.random() * 0.5 + 0.3) * speedMultiplier * mobileSpeedFactor;
            this.size = 15;
        } else if (this.type === 'rammer') {
            // Reduced Rammer speed
            this.speed = (Math.random() * 1.8 + 1.2) * speedMultiplier * mobileSpeedFactor;
            this.size = 12; 
        } else {
            this.type = 'seeker';
            this.speed = (Math.random() * 1.0 + 0.5) * speedMultiplier * mobileSpeedFactor;
            this.size = 14;
        }
    }

    update(targetX: number, targetY: number, projectiles: Projectile[]) {
        if (this.dead) return;

        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const targetAngle = Math.atan2(dy, dx);
        
        if (this.type === 'shooter') {
            // Keep distance
            if (dist > 300) {
                 this.x += Math.cos(targetAngle) * this.speed;
                 this.y += Math.sin(targetAngle) * this.speed;
            } else if (dist < 200) {
                 this.x -= Math.cos(targetAngle) * this.speed;
                 this.y -= Math.sin(targetAngle) * this.speed;
            }
            
            this.attackTimer++;
            if (this.attackTimer > 150) { // Fire every ~2.5s
                projectiles.push(new Projectile(this.x, this.y, targetX, targetY));
                this.attackTimer = 0;
            }
        } else if (this.type === 'rammer') {
             // Aggressive tracking
             this.x += Math.cos(targetAngle) * this.speed;
             this.y += Math.sin(targetAngle) * this.speed;
        } else {
             // Standard seeker
             this.x += Math.cos(targetAngle) * this.speed;
             this.y += Math.sin(targetAngle) * this.speed;
        }
        
        this.angle = targetAngle;
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (this.type === 'shooter') {
            // Hexagon green
             ctx.save();
             ctx.translate(this.x, this.y);
             ctx.rotate(this.angle);
             ctx.fillStyle = '#10B981';
             ctx.beginPath();
             for (let i = 0; i < 6; i++) {
                 ctx.lineTo(this.size * Math.cos(i * Math.PI / 3), this.size * Math.sin(i * Math.PI / 3));
             }
             ctx.closePath();
             ctx.fill();
             // Eye
             ctx.fillStyle = '#fff';
             ctx.beginPath();
             ctx.arc(0, 0, 4, 0, Math.PI * 2);
             ctx.fill();
             ctx.restore();
        } else if (this.type === 'rammer') {
            // Triangle purple
             ctx.save();
             ctx.translate(this.x, this.y);
             ctx.rotate(this.angle);
             ctx.fillStyle = '#A855F7';
             ctx.beginPath();
             ctx.moveTo(this.size + 5, 0);
             ctx.lineTo(-this.size, this.size);
             ctx.lineTo(-this.size, -this.size);
             ctx.closePath();
             ctx.fill();
             ctx.restore();
        } else {
            drawModernOrb(ctx, this.x, this.y, this.size, '#FBA74B', '#EF4444');
        }
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

class Burst {
    x: number;
    y: number;
    radius: number;
    color: string;
    opacity: number = 1;

    constructor(x: number, y: number, color: string) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = 10;
    }

    update() {
        this.radius += 3;
        this.opacity -= 0.05;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.globalAlpha = Math.max(0, this.opacity);
        ctx.stroke();
        ctx.restore();
    }
}

// --- Component ---
const GameCanvas = forwardRef<GameCanvasHandle, GameCanvasProps>(({ onGameOver, scoreRef, timerContainerRef, timerDigitsRef, gameState }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);
    
    const onGameOverRef = useRef(onGameOver);
    const gameStateRef = useRef(gameState);

    useEffect(() => {
        onGameOverRef.current = onGameOver;
    }, [onGameOver]);

    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);

    // Game State
    const state = useRef({
        player: null as Player | null,
        enemies: [] as Enemy[],
        projectiles: [] as Projectile[],
        powerups: [] as PowerUp[],
        particles: [] as Particle[],
        bursts: [] as Burst[],
        stars: [] as Star[],
        score: 0,
        frame: 0,
        mouse: { x: 0, y: 0 },
        isGameOver: false,
        shieldSpawnTimer: 0,
        width: 0,
        height: 0,
        initialized: false,
        nextShooterSpawnFrame: 0,
        nextRammerSpawnFrame: 0
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
            projectiles: [],
            powerups: [],
            particles: [],
            bursts: [],
            stars: [],
            score: 0,
            frame: 0,
            isGameOver: false,
            shieldSpawnTimer: 0,
            initialized: true,
            nextShooterSpawnFrame: 0,
            nextRammerSpawnFrame: 0
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

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

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

        const handleTouchMove = (e: TouchEvent) => {
            e.preventDefault();
            state.current.mouse.x = e.touches[0].clientX;
            state.current.mouse.y = e.touches[0].clientY;
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchstart', handleTouchMove, { passive: false });

        const loop = () => {
            if (!ctx || !canvas) return;

            const s = state.current;
            const currentGameState = gameStateRef.current;

            // Start Screen / Menu Mode
            if (currentGameState === 'start') {
                ctx.fillStyle = '#08080a';
                ctx.fillRect(0, 0, s.width, s.height);
                for (const star of s.stars) {
                    star.update();
                    star.draw(ctx);
                }
                requestRef.current = requestAnimationFrame(loop);
                return;
            }

            // Game Over Mode (Freeze frame with particles)
            if (s.isGameOver) {
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

            if (scoreRef.current && s.frame % 10 === 0) {
                scoreRef.current.innerText = s.score.toLocaleString();
            }

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

            // Spawn Logic
            const isMobile = s.width < 768;
            const baseRate = isMobile ? 60 : 40;
            const minRate = isMobile ? 30 : 20;
            const currentSpawnRate = Math.max(minRate, baseRate - Math.floor(s.score / 500));
            
            if (s.frame % currentSpawnRate === 0) {
                const seconds = s.frame / 60;
                let spawnType: EnemyType = 'seeker';
                
                const shooters = s.enemies.filter(e => e.type === 'shooter').length;
                const rammers = s.enemies.filter(e => e.type === 'rammer').length;
                
                const maxRammers = isMobile ? 2 : 4;
                const maxShooters = isMobile ? 1 : 2;
                
                const canSpawnRammer = seconds >= 50 && rammers < maxRammers && s.frame >= s.nextRammerSpawnFrame;
                const canSpawnShooter = seconds >= 25 && shooters < maxShooters && s.frame >= s.nextShooterSpawnFrame;
                
                const roll = Math.random();
                
                if (canSpawnRammer && roll < 0.4) {
                    spawnType = 'rammer';
                    // Initial stagger if needed, but death resets delay
                    s.nextRammerSpawnFrame = s.frame + 120; 
                } else if (canSpawnShooter && roll < 0.7) {
                    spawnType = 'shooter';
                    s.nextShooterSpawnFrame = s.frame + 120;
                } else {
                    spawnType = 'seeker';
                }

                s.enemies.push(new Enemy(s.width, s.height, spawnType, s.score));
            }

            if (s.player && s.player.invincibleTimer <= 0 && s.powerups.length === 0) {
                s.shieldSpawnTimer++;
            }
            if (s.shieldSpawnTimer >= SHIELD_COOLDOWN) {
                s.powerups.push(new PowerUp(s.width, s.height));
                s.shieldSpawnTimer = 0;
            }

            // Powerups
            for (let i = s.powerups.length - 1; i >= 0; i--) {
                const p = s.powerups[i];
                p.update();
                p.draw(ctx, s.frame);

                if (!s.player) continue;

                const dx = p.x - s.player.x;
                const dy = p.y - s.player.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 60) {
                    s.player.invincibleTimer = 900; 
                    audio.playPowerUp();
                    for (let k = 0; k < 20; k++) {
                        s.particles.push(new Particle(p.x, p.y, '#34D399'));
                    }
                    s.powerups.splice(i, 1);
                } else if (p.life <= 0) {
                    s.powerups.splice(i, 1);
                }
            }

            // Projectiles
            for (let i = s.projectiles.length - 1; i >= 0; i--) {
                const p = s.projectiles[i];
                p.update();
                p.draw(ctx);
                
                if (p.x < 0 || p.x > s.width || p.y < 0 || p.y > s.height) {
                    s.projectiles.splice(i, 1);
                    continue;
                }
                
                if (s.player) {
                    const dx = p.x - s.player.x;
                    const dy = p.y - s.player.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 15) { 
                         if (s.player.invincibleTimer > 0) {
                             s.projectiles.splice(i, 1);
                         } else {
                             s.isGameOver = true;
                             audio.playGameOver();
                             for (let k = 0; k < 30; k++) {
                                 s.particles.push(new Particle(s.player.x, s.player.y, '#fff'));
                             }
                             if (onGameOverRef.current) {
                                 onGameOverRef.current(s.score);
                             }
                         }
                    }
                }
            }

            // Enemy Collision Check (Friendly Fire / Crash)
            for (let i = 0; i < s.enemies.length; i++) {
                for (let j = i + 1; j < s.enemies.length; j++) {
                    const e1 = s.enemies[i];
                    const e2 = s.enemies[j];
                    
                    if (!e1.dead && !e2.dead) {
                        if (e1.type === 'rammer' || e2.type === 'rammer') {
                            const dx = e1.x - e2.x;
                            const dy = e1.y - e2.y;
                            const dist = Math.sqrt(dx * dx + dy * dy);
                            
                            if (dist < (e1.size + e2.size)) {
                                e1.dead = true;
                                e2.dead = true;
                                
                                // Reduced respawn delay: 3-6s (180-360 frames)
                                if (e1.type === 'rammer' || e2.type === 'rammer') {
                                    s.nextRammerSpawnFrame = s.frame + (Math.random() * 180 + 180);
                                }
                                if (e1.type === 'shooter' || e2.type === 'shooter') {
                                    s.nextShooterSpawnFrame = s.frame + (Math.random() * 180 + 180);
                                }
                                
                                s.score += 200;
                                audio.playExplosion();
                                const cx = (e1.x + e2.x) / 2;
                                const cy = (e1.y + e2.y) / 2;
                                for (let k = 0; k < 20; k++) {
                                    s.particles.push(new Particle(cx, cy, '#A855F7'));
                                }
                            }
                        }
                    }
                }
            }

            // Enemy Loop
            for (let i = s.enemies.length - 1; i >= 0; i--) {
                const e = s.enemies[i];
                if (e.dead) {
                    s.enemies.splice(i, 1);
                    continue;
                }

                if (!s.player) continue;

                e.update(s.player.x, s.player.y, s.projectiles);
                e.draw(ctx);

                const dx = e.x - s.player.x;
                const dy = e.y - s.player.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < (e.size + 12)) {
                    if (s.player.invincibleTimer > 0) {
                        audio.playExplosion();
                        
                        let pColor = '#FBA74B';
                        if (e.type === 'rammer') pColor = '#A855F7';
                        if (e.type === 'shooter') pColor = '#10B981';
                        
                        // Add Burst
                        s.bursts.push(new Burst(e.x, e.y, pColor));
                        
                        // Reduced respawn delay: 3-6s
                        if (e.type === 'rammer') {
                            s.nextRammerSpawnFrame = s.frame + (Math.random() * 180 + 180);
                        } else if (e.type === 'shooter') {
                            s.nextShooterSpawnFrame = s.frame + (Math.random() * 180 + 180);
                        }

                        for (let k = 0; k < 15; k++) {
                            s.particles.push(new Particle(e.x, e.y, pColor));
                        }
                        s.score += 500;
                        s.enemies.splice(i, 1);
                    } else {
                        s.isGameOver = true;
                        audio.playGameOver();
                        for (let k = 0; k < 30; k++) {
                            s.particles.push(new Particle(e.x, e.y, '#fff'));
                        }
                        if (onGameOverRef.current) {
                            onGameOverRef.current(s.score);
                        }
                    }
                } else if (e.x < -200 || e.x > s.width + 200 || e.y < -200 || e.y > s.height + 200) {
                    s.enemies.splice(i, 1);
                }
            }

            for (let i = s.particles.length - 1; i >= 0; i--) {
                const p = s.particles[i];
                p.update();
                p.draw(ctx);
                if (p.life <= 0) s.particles.splice(i, 1);
            }
            
            // Bursts
            for (let i = s.bursts.length - 1; i >= 0; i--) {
                const b = s.bursts[i];
                b.update();
                b.draw(ctx);
                if (b.opacity <= 0) s.bursts.splice(i, 1);
            }

            requestRef.current = requestAnimationFrame(loop);
        };

        requestRef.current = requestAnimationFrame(loop);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchstart', handleTouchMove);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []); 

    return <canvas ref={canvasRef} className="block w-full h-full touch-none" />;
});

export default GameCanvas;