import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameStatus, Player, Enemy, Projectile, Particle, Star, Entity } from '../types';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  PLAYER_SPEED,
  PROJECTILE_SPEED,
  ENEMY_SPEED_X,
  ENEMY_DROP_HEIGHT,
  COLORS,
  KEYS,
  FIRE_COOLDOWN,
  ENEMY_ROWS,
  ENEMY_COLS,
  ENEMY_SIZE,
  ENEMY_PADDING,
  PLAYER_SIZE,
  ENEMY_PROJECTILE_SPEED
} from '../constants';
import { TouchControls } from './TouchControls';
import { RotateCcw, Play, Trophy } from 'lucide-react';

export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // React state for UI
  const [status, setStatus] = useState<GameStatus>(GameStatus.MENU);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [scale, setScale] = useState(1);

  // Mutable game state (Refs for performance)
  const playerRef = useRef<Player>({
    id: 'player',
    position: { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 60 },
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    color: COLORS.PLAYER,
    markedForDeletion: false,
    velocity: 0,
    isShooting: false,
    cooldown: 0,
    hp: 3
  });
  
  const enemiesRef = useRef<Enemy[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const starsRef = useRef<Star[]>([]);
  const enemyDirectionRef = useRef(1); // 1 = right, -1 = left
  const frameIdRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // --- Initialization Helpers ---
  
  const initStars = () => {
    const stars: Star[] = [];
    for (let i = 0; i < 100; i++) {
      stars.push({
        x: Math.random() * GAME_WIDTH,
        y: Math.random() * GAME_HEIGHT,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 3 + 0.5,
        brightness: Math.random()
      });
    }
    starsRef.current = stars;
  };

  const initEnemies = (currentLevel: number) => {
    const enemies: Enemy[] = [];
    const startX = (GAME_WIDTH - (ENEMY_COLS * (ENEMY_SIZE + ENEMY_PADDING))) / 2;
    const startY = 60;

    for (let row = 0; row < ENEMY_ROWS; row++) {
      for (let col = 0; col < ENEMY_COLS; col++) {
        enemies.push({
          id: `e-${row}-${col}`,
          position: {
            x: startX + col * (ENEMY_SIZE + ENEMY_PADDING),
            y: startY + row * (ENEMY_SIZE + ENEMY_PADDING)
          },
          width: ENEMY_SIZE,
          height: ENEMY_SIZE,
          color: row === 0 ? COLORS.ENEMY_SHOOTER : COLORS.ENEMY_BASIC,
          markedForDeletion: false,
          type: row === 0 ? 'shooter' : 'basic',
          row,
          col,
          velocity: { x: ENEMY_SPEED_X + (currentLevel * 0.5), y: 0 }
        });
      }
    }
    enemiesRef.current = enemies;
    enemyDirectionRef.current = 1;
  };

  const createExplosion = (x: number, y: number, color: string) => {
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1;
      particlesRef.current.push({
        id: `p-${Date.now()}-${i}`,
        position: { x, y },
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed
        },
        width: Math.random() * 4 + 2,
        height: Math.random() * 4 + 2,
        color: color,
        life: 1.0,
        maxLife: 1.0,
        alpha: 1,
        markedForDeletion: false
      });
    }
  };

  const resetGame = (fullReset: boolean) => {
    playerRef.current = {
      ...playerRef.current,
      position: { x: GAME_WIDTH / 2 - PLAYER_SIZE / 2, y: GAME_HEIGHT - 60 },
      velocity: 0,
      isShooting: false,
      cooldown: 0,
      hp: fullReset ? 3 : lives
    };
    projectilesRef.current = [];
    particlesRef.current = [];
    
    if (fullReset) {
      setScore(0);
      setLives(3);
      setLevel(1);
      initEnemies(1);
    } else {
      initEnemies(level);
    }
    
    // Maintain stars
    if (starsRef.current.length === 0) initStars();
  };

  const startGame = () => {
    resetGame(true);
    setStatus(GameStatus.PLAYING);
    lastTimeRef.current = performance.now();
  };

  const nextLevel = () => {
    setLevel(l => l + 1);
    resetGame(false); // Reset entities but keep score/lives
    initEnemies(level + 1);
  };

  // --- Game Loop Logic ---

  const update = (dt: number) => {
    if (status !== GameStatus.PLAYING) return;

    const player = playerRef.current;

    // 1. Update Player
    player.position.x += player.velocity;
    // Boundary checks
    if (player.position.x < 0) player.position.x = 0;
    if (player.position.x > GAME_WIDTH - player.width) player.position.x = GAME_WIDTH - player.width;

    // Player Shoot
    if (player.cooldown > 0) player.cooldown--;
    if (player.isShooting && player.cooldown <= 0) {
      projectilesRef.current.push({
        id: `bull-${Date.now()}`,
        position: { 
          x: player.position.x + player.width / 2 - 2, 
          y: player.position.y 
        },
        width: 4,
        height: 12,
        color: COLORS.PLAYER_BULLET,
        velocity: { x: 0, y: -PROJECTILE_SPEED },
        isEnemy: false,
        markedForDeletion: false
      });
      player.cooldown = FIRE_COOLDOWN;
      // Pew pew sound could go here
    }

    // 2. Update Projectiles
    projectilesRef.current.forEach(p => {
      p.position.y += p.velocity.y;
      if (p.position.y < 0 || p.position.y > GAME_HEIGHT) {
        p.markedForDeletion = true;
      }
    });

    // 3. Update Enemies
    let hitEdge = false;
    let lowestEnemyY = 0;
    const livingEnemies = enemiesRef.current.filter(e => !e.markedForDeletion);
    
    if (livingEnemies.length === 0) {
      // Victory/Next Level
      nextLevel();
      return;
    }

    livingEnemies.forEach(e => {
      e.position.x += (e.velocity.x * enemyDirectionRef.current);
      lowestEnemyY = Math.max(lowestEnemyY, e.position.y + e.height);

      if (e.position.x <= 0 || e.position.x >= GAME_WIDTH - e.width) {
        hitEdge = true;
      }

      // Random Enemy Shoot
      if (Math.random() < 0.0005 * level + (e.type === 'shooter' ? 0.002 : 0)) {
        projectilesRef.current.push({
          id: `ebull-${Math.random()}`,
          position: {
            x: e.position.x + e.width / 2,
            y: e.position.y + e.height
          },
          width: 6,
          height: 12,
          color: COLORS.ENEMY_BULLET,
          velocity: { x: 0, y: ENEMY_PROJECTILE_SPEED },
          isEnemy: true,
          markedForDeletion: false
        });
      }
    });

    if (hitEdge) {
      enemyDirectionRef.current *= -1;
      livingEnemies.forEach(e => {
        e.position.y += ENEMY_DROP_HEIGHT;
      });
    }

    if (lowestEnemyY >= player.position.y) {
      setLives(0);
      setStatus(GameStatus.GAME_OVER);
    }

    // 4. Collision Detection
    // AABB Collision
    const isColliding = (a: Entity, b: Entity) => {
      return (
        a.position.x < b.position.x + b.width &&
        a.position.x + a.width > b.position.x &&
        a.position.y < b.position.y + b.height &&
        a.position.y + a.height > b.position.y
      );
    };

    projectilesRef.current.forEach(p => {
      if (p.markedForDeletion) return;

      if (!p.isEnemy) {
        // Player bullet hitting Enemy
        livingEnemies.forEach(e => {
          if (!e.markedForDeletion && isColliding(p, e)) {
            e.markedForDeletion = true;
            p.markedForDeletion = true;
            createExplosion(e.position.x + e.width/2, e.position.y + e.height/2, e.color);
            setScore(prev => prev + (e.type === 'shooter' ? 200 : 100));
          }
        });
      } else {
        // Enemy bullet hitting Player
        if (isColliding(p, player)) {
          p.markedForDeletion = true;
          createExplosion(player.position.x + player.width/2, player.position.y + player.height/2, COLORS.PLAYER);
          setLives(prev => {
            const newLives = prev - 1;
            if (newLives <= 0) {
              setStatus(GameStatus.GAME_OVER);
            } else {
               // Respawn invulnerability logic could go here
            }
            return newLives;
          });
        }
      }
    });

    // Cleanup dead entities
    enemiesRef.current = enemiesRef.current.filter(e => !e.markedForDeletion);
    projectilesRef.current = projectilesRef.current.filter(p => !p.markedForDeletion);

    // 5. Update Particles
    particlesRef.current.forEach(p => {
      p.position.x += p.velocity.x;
      p.position.y += p.velocity.y;
      p.life -= 0.02;
      p.alpha = p.life;
      if (p.life <= 0) p.markedForDeletion = true;
    });
    particlesRef.current = particlesRef.current.filter(p => !p.markedForDeletion);

    // 6. Update Stars
    starsRef.current.forEach(s => {
      s.y += s.speed;
      if (s.y > GAME_HEIGHT) {
        s.y = 0;
        s.x = Math.random() * GAME_WIDTH;
      }
    });
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    // Clear
    ctx.fillStyle = COLORS.BACKGROUND;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Stars
    starsRef.current.forEach(s => {
      ctx.fillStyle = `rgba(255, 255, 255, ${s.brightness})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Player
    const p = playerRef.current;
    if (lives > 0) {
      ctx.fillStyle = COLORS.BACKGROUND;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 10;
      ctx.shadowColor = p.color;
      
      // Draw futuristic ship (Triangle with detailing)
      ctx.beginPath();
      ctx.moveTo(p.position.x + p.width / 2, p.position.y);
      ctx.lineTo(p.position.x + p.width, p.position.y + p.height);
      ctx.lineTo(p.position.x + p.width / 2, p.position.y + p.height - 5);
      ctx.lineTo(p.position.x, p.position.y + p.height);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      ctx.shadowBlur = 0;
    }

    // Enemies
    enemiesRef.current.forEach(e => {
      ctx.fillStyle = COLORS.BACKGROUND;
      ctx.strokeStyle = e.color;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 5;
      ctx.shadowColor = e.color;
      
      // Draw Enemy (Geometric shapes depending on type)
      const cx = e.position.x + e.width/2;
      const cy = e.position.y + e.height/2;
      const r = e.width/2;

      ctx.beginPath();
      if (e.type === 'shooter') {
        // Hexagon
        for (let i = 0; i < 6; i++) {
          ctx.lineTo(cx + r * Math.cos(i * Math.PI / 3), cy + r * Math.sin(i * Math.PI / 3));
        }
      } else {
        // Diamond/Box
        ctx.rect(e.position.x, e.position.y, e.width, e.height);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Glow center
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Projectiles
    projectilesRef.current.forEach(proj => {
      ctx.fillStyle = proj.color;
      ctx.shadowBlur = 5;
      ctx.shadowColor = proj.color;
      ctx.fillRect(proj.position.x, proj.position.y, proj.width, proj.height);
      ctx.shadowBlur = 0;
    });

    // Particles
    particlesRef.current.forEach(part => {
      ctx.globalAlpha = part.alpha;
      ctx.fillStyle = part.color;
      ctx.beginPath();
      ctx.arc(part.position.x, part.position.y, part.width, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
  };

  const loop = useCallback((time: number) => {
    const dt = time - lastTimeRef.current;
    lastTimeRef.current = time;

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        update(dt);
        draw(ctx);
      }
    }
    frameIdRef.current = requestAnimationFrame(loop);
  }, [status]);

  // --- Effects ---

  // Handle Resize for Responsiveness
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      
      const scaleX = containerWidth / GAME_WIDTH;
      const scaleY = containerHeight / GAME_HEIGHT;
      const newScale = Math.min(scaleX, scaleY, 1.2); // Cap scale at 1.2
      
      setScale(newScale);
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Game Loop
  useEffect(() => {
    frameIdRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameIdRef.current);
  }, [loop]);

  // Keyboard Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (KEYS.LEFT.includes(e.key)) {
        playerRef.current.velocity = -PLAYER_SPEED;
      }
      if (KEYS.RIGHT.includes(e.key)) {
        playerRef.current.velocity = PLAYER_SPEED;
      }
      if (KEYS.SHOOT.includes(e.key)) {
        if (status === GameStatus.PLAYING) {
          playerRef.current.isShooting = true;
        } else if (status === GameStatus.MENU || status === GameStatus.GAME_OVER) {
          startGame();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (KEYS.LEFT.includes(e.key) && playerRef.current.velocity < 0) {
        playerRef.current.velocity = 0;
      }
      if (KEYS.RIGHT.includes(e.key) && playerRef.current.velocity > 0) {
        playerRef.current.velocity = 0;
      }
      if (KEYS.SHOOT.includes(e.key)) {
        playerRef.current.isShooting = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [status]);

  // High Score Logic
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('neon-swarm-highscore', score.toString());
    }
  }, [score]);

  useEffect(() => {
    const saved = localStorage.getItem('neon-swarm-highscore');
    if (saved) setHighScore(parseInt(saved));
    initStars();
    initEnemies(1);
  }, []);

  // --- Touch Control Handlers ---
  const handleLeftStart = () => { playerRef.current.velocity = -PLAYER_SPEED; };
  const handleLeftEnd = () => { if (playerRef.current.velocity < 0) playerRef.current.velocity = 0; };
  const handleRightStart = () => { playerRef.current.velocity = PLAYER_SPEED; };
  const handleRightEnd = () => { if (playerRef.current.velocity > 0) playerRef.current.velocity = 0; };
  const handleShootStart = () => { 
    if (status === GameStatus.PLAYING) playerRef.current.isShooting = true;
    else startGame();
  };
  const handleShootEnd = () => { playerRef.current.isShooting = false; };

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-gray-950 font-mono relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-gray-950 to-black pointer-events-none" />

      {/* Game HUD */}
      <div className="absolute top-0 w-full max-w-[800px] p-4 flex justify-between text-cyan-400 z-10 pointer-events-none">
        <div className="flex flex-col">
          <span className="text-sm opacity-70">SCORE</span>
          <span className="text-2xl font-bold tracking-widest neon-text">{score.toString().padStart(6, '0')}</span>
        </div>
        
        <div className="flex flex-col items-center">
           <span className="text-xs opacity-70 tracking-[0.5em] text-pink-500 font-bold">WAVE {level}</span>
        </div>

        <div className="flex flex-col items-end text-right">
          <span className="text-sm opacity-70">HIGH SCORE</span>
          <span className="text-xl font-bold">{highScore.toString().padStart(6, '0')}</span>
        </div>
      </div>

      <div className="absolute top-16 right-4 z-10 flex gap-1">
         {Array.from({length: lives}).map((_, i) => (
           <div key={i} className="w-6 h-6 border border-cyan-500 bg-cyan-900/50 skew-x-[-12deg]" />
         ))}
      </div>

      {/* Main Game Container */}
      <div 
        ref={containerRef}
        className="relative flex items-center justify-center w-full h-full max-w-7xl max-h-[80vh] p-2"
      >
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          style={{
            transform: `scale(${scale})`,
            boxShadow: '0 0 50px rgba(0, 255, 255, 0.1), inset 0 0 20px rgba(0,0,0,0.5)',
            border: '2px solid rgba(0, 255, 255, 0.2)'
          }}
          className="bg-[#050510] rounded-sm"
        />
        
        {/* CRT Scanline Effect */}
        <div 
            className="absolute inset-0 pointer-events-none scanline opacity-30" 
            style={{ 
                width: GAME_WIDTH, 
                height: GAME_HEIGHT,
                transform: `scale(${scale})`
            }} 
        />

        {/* Start / Game Over Overlays */}
        {status === GameStatus.MENU && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/70 backdrop-blur-sm"
               style={{ transform: `scale(${scale})`, width: GAME_WIDTH, height: GAME_HEIGHT }}>
            <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-blue-600 mb-8 tracking-tighter filter drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">
              NEON SWARM
            </h1>
            <p className="text-cyan-200 mb-12 text-lg tracking-widest animate-pulse">PRESS START TO DEFEND</p>
            <button
              onClick={startGame}
              className="group relative px-8 py-4 bg-cyan-950 border border-cyan-500 text-cyan-400 text-xl hover:bg-cyan-900 transition-all uppercase tracking-widest overflow-hidden"
            >
              <div className="absolute inset-0 w-0 bg-cyan-500/20 transition-all duration-[250ms] ease-out group-hover:w-full"></div>
              <span className="relative flex items-center gap-3">
                 <Play className="w-5 h-5 fill-current" /> Start Mission
              </span>
            </button>
            <div className="mt-8 text-xs text-gray-500 font-mono">
              KEYBOARD: ARROWS TO MOVE • SPACE TO FIRE<br/>
              TABLET: USE ON-SCREEN CONTROLS
            </div>
          </div>
        )}

        {status === GameStatus.GAME_OVER && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-red-950/80 backdrop-blur-sm"
               style={{ transform: `scale(${scale})`, width: GAME_WIDTH, height: GAME_HEIGHT }}>
            <h2 className="text-6xl font-black text-red-500 mb-4 tracking-widest filter drop-shadow-[0_0_15px_rgba(255,0,0,0.6)]">
              MISSION FAILED
            </h2>
            <div className="flex flex-col items-center gap-2 mb-8">
                <span className="text-red-200 text-xl">FINAL SCORE</span>
                <span className="text-4xl text-white font-bold">{score}</span>
            </div>
            
            <button
              onClick={() => startGame()}
              className="px-8 py-3 bg-red-900/50 border border-red-500 text-red-300 hover:bg-red-800 transition-all uppercase tracking-widest flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" /> Retry
            </button>
          </div>
        )}
      </div>

      {/* Mobile/Tablet Controls - Only visible on touch devices mainly, but rendered always for responsiveness testing */}
      <div className="lg:hidden">
          <TouchControls
            onLeftStart={handleLeftStart}
            onLeftEnd={handleLeftEnd}
            onRightStart={handleRightStart}
            onRightEnd={handleRightEnd}
            onShootStart={handleShootStart}
            onShootEnd={handleShootEnd}
          />
      </div>
    </div>
  );
};