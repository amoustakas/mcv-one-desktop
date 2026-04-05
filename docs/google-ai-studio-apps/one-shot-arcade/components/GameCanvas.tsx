/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useRef, useEffect, useState } from 'react';
import { Difficulty, LevelStats } from '../types';
import { playDot, playEatVillain, playGameOver, playLevelWin, playSuperCharge } from '../services/sound';

// --- MAZE DEFINITIONS ---
// 1 = wall, 0 = dot, 2 = empty (eaten/path), 3 = super charge
const MAP_L1 = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
  [1,3,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,3,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,0,1],
  [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
  [1,1,1,1,0,1,1,1,2,1,2,1,1,1,0,1,1,1,1],
  [2,2,2,1,0,1,2,2,2,2,2,2,2,1,0,1,2,2,2],
  [1,1,1,1,0,1,2,1,1,2,1,1,2,1,0,1,1,1,1],
  [2,2,2,2,0,2,2,1,2,2,2,1,2,2,0,2,2,2,2], // Tunnel row
  [1,1,1,1,0,1,2,1,1,1,1,1,2,1,0,1,1,1,1],
  [2,2,2,1,0,1,2,2,2,2,2,2,2,1,0,1,2,2,2],
  [1,1,1,1,0,1,2,1,1,1,1,1,2,1,0,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
  [1,3,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,3,1],
  [1,1,0,1,0,1,0,1,1,1,1,1,0,1,0,1,0,1,1],
  [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

const MAP_L2 = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,3,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,3,1],
  [1,0,1,1,1,0,1,0,1,1,1,0,1,0,1,1,1,0,1],
  [1,0,1,2,1,0,0,0,0,2,0,0,0,0,1,2,1,0,1],
  [1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1],
  [1,0,0,0,0,0,1,2,2,2,2,2,1,0,0,0,0,0,1],
  [1,1,1,0,1,1,1,2,1,2,1,2,1,1,1,0,1,1,1],
  [1,0,0,0,0,0,0,2,1,2,1,2,0,0,0,0,0,0,1],
  [1,0,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,0,1],
  [2,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,2], // Tunnel row
  [1,1,1,0,1,0,1,1,1,2,1,1,1,0,1,0,1,1,1],
  [2,2,1,0,0,0,1,2,2,2,2,2,1,0,0,0,1,2,2],
  [1,1,1,0,1,0,1,1,1,1,1,1,1,0,1,0,1,1,1],
  [1,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,1],
  [1,0,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1],
  [1,3,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,3,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

const MAP_L3 = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,3,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,3,1],
  [1,0,1,0,1,0,1,1,0,1,0,1,1,0,1,0,1,0,1],
  [1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1],
  [1,0,1,1,1,1,0,1,1,2,1,1,0,1,1,1,1,0,1],
  [1,0,0,0,0,0,0,1,2,2,2,1,0,0,0,0,0,0,1],
  [1,1,1,1,1,0,1,1,2,1,2,1,1,0,1,1,1,1,1],
  [2,2,2,2,2,0,1,2,2,1,2,2,1,0,2,2,2,2,2], // Tunnel row
  [1,1,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1],
  [1,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,1],
  [1,1,1,0,1,0,1,0,1,1,1,0,1,0,1,0,1,1,1],
  [1,3,0,0,0,0,1,0,0,1,0,0,1,0,0,0,0,3,1],
  [1,0,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

const LEVELS = [MAP_L1, MAP_L2, MAP_L3];

// SIZE CONSTANTS
const TILE_SIZE = 40;
const PLAYER_SPEED = 5;
const EATEN_VILLAIN_SPEED = 10;
const DROP_IN_SPEED = 15; // Speed of the intro drop animation

type VillainStatus = 'NORMAL' | 'SCARED' | 'EATEN';

interface Pos { x: number, y: number }
interface Entity extends Pos { dir: Pos, nextDir: Pos }
interface Villain extends Entity {
    color: string;
    status: VillainStatus;
    home: Pos;
    lastDecisionTile: Pos;
}

interface GameCanvasProps {
  appState: string;
  playerSpriteUrl?: string | null;
  villainSpriteUrl?: string | null;
  difficulty: Difficulty;
  speedModifier: number;
  currentLevelIndex: number;
  viewMode: '2D' | '3D';
  onLevelComplete: (stats: LevelStats) => void;
  onGameOver: (stats: LevelStats) => void;
  theme: 'DARK' | 'LIGHT';
  isPaused?: boolean;
}

const GameCanvas: React.FC<GameCanvasProps> = ({
    appState,
    playerSpriteUrl,
    villainSpriteUrl,
    difficulty,
    speedModifier,
    currentLevelIndex,
    viewMode,
    onLevelComplete,
    onGameOver,
    theme,
    isPaused = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [isGameOverLocal, setIsGameOverLocal] = useState(false);

  // Game State
  const gameState = useRef({
    map: [] as number[][],
    dotsRemaining: 0,
    totalDotsInLevel: 0,
    player: { x: 9 * TILE_SIZE, y: 15 * TILE_SIZE, dir: {x:0, y:0}, nextDir: {x:0, y:0} } as Entity,
    villains: [] as Villain[],
    score: 0,
    superChargeTimer: 0,
    levelStartTime: 0,
    isPaused: false,
    isIntroAnimating: false,
    playerStartY: 15 * TILE_SIZE,
    baseLevelStats: { villainSpeed: 4, superChargeDuration: 6000 },
    stats: { stepsTaken: 0, visitedTiles: new Set<string>(), lastTile: { col: -1, row: -1 } },
    lastVisualDirX: 1, // 1 for right, -1 for left. Persists even when moving vertical.
    
    // 3D Camera State
    camera: {
        angle: 0,
        targetAngle: 0,
        height: 450, 
        distance: 300
    },
    viewQuadrant: 0,
    isAutoRunning: false
  });

  const assets = useRef({
    player: new Image(),
    villain: new Image(),
    playerLoaded: false,
    villainLoaded: false
  });

  // Theme colors helper
  const getThemeColors = () => {
      return theme === 'LIGHT' ? {
          bg: '#e0e0e0',
          wallFill: '#333333', // Dark grey walls for contrast
          wallStroke: '#000000',
          dot: '#d97706', // Dark Amber
          superCharge: '#ef4444', // Red
          playerPlaceholder: '#0ea5e9', // Sky Blue
          text: '#000000',
          grid: 'rgba(0,0,0,0.1)',
          skyTop: '#ffffff',
          skyBottom: '#cccccc',
          wall3D: {
              fill: (shade: number) => `rgba(80, 80, 80, ${shade})`,
              top: (shade: number) => `rgba(150, 150, 150, ${shade})`,
              stroke: (shade: number) => `rgba(0, 0, 0, ${shade * 0.5})`
          }
      } : {
          bg: '#000000',
          wallFill: '#002200',
          wallStroke: '#39ff14',
          dot: '#f9c80e',
          superCharge: '#f9c80e',
          playerPlaceholder: '#f9c80e',
          text: '#ffffff',
          grid: 'rgba(57, 255, 20, 0.2)',
          skyTop: '#050011',
          skyBottom: '#000000',
          wall3D: {
              fill: (shade: number) => `rgba(0, 34, 0, ${shade})`,
              top: (shade: number) => `rgba(57, 255, 20, ${shade})`,
              stroke: (shade: number) => `rgba(57, 255, 20, ${shade * 0.5})`
          }
      };
  };


  // --- INITIALIZE LEVEL ---
  const initLevel = (lvlIdx: number) => {
      const safeIdx = Math.min(lvlIdx, LEVELS.length - 1);
      const mapData = JSON.parse(JSON.stringify(LEVELS[safeIdx]));

      let dots = 0;
      for(let r=0; r<mapData.length; r++) {
          for(let c=0; c<mapData[r].length; c++) {
              if (mapData[r][c] === 0 || mapData[r][c] === 3) dots++;
          }
      }

      let vSpeed = 4;
      if (safeIdx === 1) vSpeed = 4.5;
      if (safeIdx === 2) vSpeed = 5;
      const pDuration = Math.max(3000, 6000 - (safeIdx * 1000));

      gameState.current.map = mapData;
      gameState.current.dotsRemaining = dots;
      gameState.current.totalDotsInLevel = dots;
      gameState.current.baseLevelStats = { villainSpeed: vSpeed, superChargeDuration: pDuration };
      gameState.current.isPaused = false;
      gameState.current.isIntroAnimating = true;
      gameState.current.stats = { stepsTaken: 0, visitedTiles: new Set<string>(), lastTile: { col: 9, row: 15 } };
      gameState.current.stats.visitedTiles.add(`9,15`);
      gameState.current.lastVisualDirX = 1;

      gameState.current.playerStartY = 15 * TILE_SIZE;
      gameState.current.player.x = 9 * TILE_SIZE;
      gameState.current.player.y = -TILE_SIZE * 3;
      gameState.current.player.dir = {x:0, y:0};
      gameState.current.player.nextDir = {x:0, y:0};
      gameState.current.isAutoRunning = false;

      // Reset Camera
      gameState.current.viewQuadrant = 0; // Default North
      gameState.current.camera.angle = -Math.PI / 2; 
      gameState.current.camera.targetAngle = -Math.PI / 2;

      const homeBase = { x: 9 * TILE_SIZE, y: 9 * TILE_SIZE };
      const baseVillains = [
          // Red: Starts at center
          { x: 9 * TILE_SIZE, y: 9 * TILE_SIZE, dir: {x:0, y:-1}, nextDir:{x:0,y:0}, color: 'red', status: 'NORMAL', home: homeBase, lastDecisionTile: {x: -1, y: -1} },
          // Pink: Starts left
          { x: 8 * TILE_SIZE, y: 9 * TILE_SIZE, dir: {x:1, y:0}, nextDir:{x:0,y:0}, color: 'pink', status: 'NORMAL', home: homeBase, lastDecisionTile: {x: -1, y: -1} },
          // Cyan: Starts right
          { x: 10 * TILE_SIZE, y: 9 * TILE_SIZE, dir: {x:-1, y:0}, nextDir:{x:0,y:0}, color: 'cyan', status: 'NORMAL', home: homeBase, lastDecisionTile: {x: -1, y: -1} },
      ];
      
      // Add extra villains for harder levels
      if (safeIdx > 0) baseVillains.push({ x: 10 * TILE_SIZE, y: 8 * TILE_SIZE, dir: {x:0, y:1}, nextDir:{x:0,y:0}, color: 'orange', status: 'NORMAL', home: homeBase, lastDecisionTile: {x: -1, y: -1} } as Villain);
      if (safeIdx > 1) baseVillains.push({ x: 8 * TILE_SIZE, y: 8 * TILE_SIZE, dir: {x:0, y:-1}, nextDir:{x:0,y:0}, color: '#39ff14', status: 'NORMAL', home: homeBase, lastDecisionTile: {x: -1, y: -1} } as Villain);

      gameState.current.villains = baseVillains as Villain[];
      setIsGameOverLocal(false);
      // Ensure focus for keyboard controls
      setTimeout(() => containerRef.current?.focus(), 100);
  }

  useEffect(() => {
      if (appState === 'PLAYING' || appState === 'SETUP') {
          initLevel(currentLevelIndex);
      }
  }, [currentLevelIndex, appState]);

  useEffect(() => {
    if (playerSpriteUrl) {
      assets.current.playerLoaded = false;
      assets.current.player.crossOrigin = "Anonymous";
      assets.current.player.src = playerSpriteUrl;
      assets.current.player.onload = () => { assets.current.playerLoaded = true; };
    }
    if (villainSpriteUrl) {
      assets.current.villainLoaded = false;
      assets.current.villain.crossOrigin = "Anonymous";
      assets.current.villain.src = villainSpriteUrl;
      assets.current.villain.onload = () => { assets.current.villainLoaded = true; };
    }
  }, [playerSpriteUrl, villainSpriteUrl]);

  // Input handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState.current.isPaused || isGameOverLocal || gameState.current.isIntroAnimating || appState !== 'PLAYING' || isPaused) return;
      if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
          e.preventDefault();
      }

      const state = gameState.current;

      if (viewMode === '3D') {
          const getDirFromQuad = (q: number) => {
              if (q === 0) return { x: 0, y: -1 }; // N
              if (q === 1) return { x: 1, y: 0 };  // E
              if (q === 2) return { x: 0, y: 1 };  // S
              if (q === 3) return { x: -1, y: 0 }; // W
              return { x: 0, y: 0 };
          };

          if (e.key === 'ArrowLeft') {
              state.viewQuadrant = (state.viewQuadrant - 1 + 4) % 4;
              if (state.isAutoRunning || (state.player.dir.x !== 0 || state.player.dir.y !== 0)) {
                  state.player.nextDir = getDirFromQuad(state.viewQuadrant);
              }
          } else if (e.key === 'ArrowRight') {
              state.viewQuadrant = (state.viewQuadrant + 1) % 4;
              if (state.isAutoRunning || (state.player.dir.x !== 0 || state.player.dir.y !== 0)) {
                  state.player.nextDir = getDirFromQuad(state.viewQuadrant);
              }
          } else if (e.key === 'ArrowUp') {
              state.isAutoRunning = true;
              state.player.nextDir = getDirFromQuad(state.viewQuadrant);
          }
          
      } else {
          let dx = 0;
          let dy = 0;
          switch(e.key) {
            case 'ArrowUp': dy = -1; break;
            case 'ArrowDown': dy = 1; break;
            case 'ArrowLeft': dx = -1; break;
            case 'ArrowRight': dx = 1; break;
            default: return;
          }
          state.player.nextDir = {x: dx, y: dy};
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
       if (gameState.current.isPaused || isGameOverLocal || appState !== 'PLAYING' || isPaused) return;
       // KeyUp logic removed to allow continuous movement in 3D mode (Toggle/Auto-Run)
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isGameOverLocal, appState, viewMode, isPaused]);

  const calculateStats = (isWin: boolean): LevelStats => {
      const state = gameState.current;
      const timeElapsed = (Date.now() - state.levelStartTime) / 1000;
      let totalTiles = 0;
      for(let r=0; r<state.map.length;r++) for(let c=0;c<state.map[r].length;c++) if(state.map[r][c]!==1) totalTiles++;
      const efficiency = (state.stats.visitedTiles.size / Math.max(1, state.stats.stepsTaken)) * 100;
      const parTime = 45 + (currentLevelIndex * 15);
      let grade: LevelStats['grade'] = 'F';
      if (isWin) {
          let score = 0;
          if (efficiency > 80) score += 3; else if (efficiency > 60) score += 2; else if (efficiency > 40) score += 1;
          if (timeElapsed < parTime) score += 2; else if (timeElapsed < parTime * 1.2) score += 1;
          if (score >= 5) grade = 'S'; else if (score >= 4) grade = 'A'; else if (score >= 3) grade = 'B'; else if (score >= 2) grade = 'C'; else grade = 'D';
      }
      return {
          levelNumber: currentLevelIndex + 1, isWin: isWin, score: state.score, timeElapsed: timeElapsed,
          stepsTaken: state.stats.stepsTaken, totalTiles: totalTiles, uniqueTilesVisited: state.stats.visitedTiles.size,
          dotsCollected: state.totalDotsInLevel - state.dotsRemaining, totalDots: state.totalDotsInLevel, grade: grade
      };
  };

  // Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const getTileAtPx = (x: number, y: number) => {
        const col = Math.floor(x / TILE_SIZE);
        const row = Math.floor(y / TILE_SIZE);
        return gameState.current.map[row]?.[col];
    }

    const isWall = (col: number, row: number) => {
        const tile = gameState.current.map[row]?.[col];
        return tile === 1 || tile === undefined; // Safely handle out-of-bounds
    };

    // --- PROCEDURAL SKELETAL ANIMATION ---
    const drawEntity = (img: HTMLImageElement, x: number, y: number, sizeMult: number = 1.2, flipX: boolean = false, isMoving: boolean = false, opacity: number = 1) => {
        if (!img.complete || img.naturalWidth === 0) return;

        const targetSize = TILE_SIZE * sizeMult;
        const singleFrameWidth = img.naturalWidth;
        const singleFrameHeight = img.naturalHeight;
        const ratio = singleFrameWidth / singleFrameHeight;
        
        let w = targetSize;
        let h = targetSize;
        if (ratio > 1) h = w / ratio;
        else w = h * ratio;

        const speed = Date.now() / 50;
        const bobY = isMoving ? Math.abs(Math.sin(speed)) * -4 : 0;
        const legShear = isMoving ? Math.sin(speed) * 0.5 : 0;
        const srcSplitY = singleFrameHeight * 0.65;
        const destSplitY = h * 0.65;

        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.imageSmoothingEnabled = false;
        
        if (viewMode === '2D') {
             ctx.translate(x + TILE_SIZE / 2, y + TILE_SIZE / 2);
        } else {
             ctx.translate(x, y);
        }

        if (flipX) ctx.scale(-1, 1);

        // 1. UPPER BODY
        ctx.drawImage(img,
            0, 0, singleFrameWidth, srcSplitY,
            -w/2, -h/2 + bobY, w, destSplitY
        );

        // 2. LEGS
        ctx.save();
        ctx.translate(0, -h/2 + destSplitY + bobY);
        ctx.transform(1, 0, legShear, 1, 0, 0);
        ctx.drawImage(img,
            0, srcSplitY, singleFrameWidth, singleFrameHeight - srcSplitY,
            -w/2, 0, w, h - destSplitY
        );
        ctx.restore();

        ctx.restore();
    }

    const render2D = (state: typeof gameState.current) => {
        const colors = getThemeColors();
        
        ctx.fillStyle = colors.bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = false;

        // Map
        for(let r=0; r<state.map.length; r++) {
            for(let c=0; c<state.map[r].length; c++) {
                const t = state.map[r][c];
                const x = c*TILE_SIZE, y = r*TILE_SIZE;
                if (t===1) {
                    ctx.fillStyle = colors.wallFill; 
                    ctx.strokeStyle = colors.wallStroke; 
                    ctx.lineWidth = 3;
                    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE); 
                    ctx.strokeRect(x+2, y+2, TILE_SIZE-4, TILE_SIZE-4);
                } else if (t===3) {
                    ctx.fillStyle = colors.superCharge; ctx.beginPath();
                    ctx.arc(x+TILE_SIZE/2, y+TILE_SIZE/2, 12, 0, Math.PI*2); ctx.fill();
                } else if (t===0) {
                    ctx.fillStyle = colors.dot; ctx.beginPath();
                    ctx.arc(x+TILE_SIZE/2, y+TILE_SIZE/2, 4, 0, Math.PI*2); ctx.fill();
                }
            }
        }

        // Player
        if (assets.current.playerLoaded && playerSpriteUrl) {
             const flip = state.lastVisualDirX === -1;
             const isPlayerMoving = state.player.dir.x !== 0 || state.player.dir.y !== 0;
             drawEntity(assets.current.player, state.player.x, state.player.y, 1.5, flip, isPlayerMoving);
        } else {
            ctx.save();
            ctx.translate(state.player.x + TILE_SIZE/2, state.player.y + TILE_SIZE/2);
            ctx.fillStyle = colors.playerPlaceholder; ctx.beginPath();
            ctx.arc(0, 0, TILE_SIZE/2 - 2, 0, Math.PI*2); ctx.fill();
            ctx.restore();
        }

        // Villains
        state.villains.forEach(g => {
            if (g.status === 'EATEN') {
                 ctx.fillStyle = '#ffffff'; ctx.fillRect(g.x + 10, g.y + 12, 8, 8); ctx.fillRect(g.x + 22, g.y + 12, 8, 8);
            } else if (g.status === 'SCARED') {
                 ctx.fillStyle = '#0000ff'; ctx.fillRect(g.x+4, g.y+4, TILE_SIZE-8, TILE_SIZE-8);
                 if (state.superChargeTimer - Date.now() < 2000 && Math.floor(Date.now() / 200) % 2 === 0) {
                     ctx.fillStyle = '#ffffff'; ctx.fillRect(g.x+4, g.y+4, TILE_SIZE-8, TILE_SIZE-8);
                 }
            } else if (assets.current.villainLoaded && villainSpriteUrl) {
                 drawEntity(assets.current.villain, g.x, g.y, 1.5, false, true);
            } else {
                 ctx.fillStyle = g.color; ctx.fillRect(g.x+2, g.y+2, TILE_SIZE-4, TILE_SIZE-4);
            }
        });
    }

    const render3D = (state: typeof gameState.current) => {
         const colors = getThemeColors();
         const cam = state.camera;
         const fw = canvas.width;
         const fh = canvas.height;
         const fov = 350; 

         let target = -Math.PI / 2;
         if (state.viewQuadrant === 1) target = 0;
         if (state.viewQuadrant === 2) target = Math.PI / 2;
         if (state.viewQuadrant === 3) target = Math.PI;

         let current = cam.angle;
         while(current > Math.PI) current -= Math.PI * 2;
         while(current <= -Math.PI) current += Math.PI * 2;

         let diff = target - current;
         while (diff < -Math.PI) diff += Math.PI * 2;
         while (diff > Math.PI) diff -= Math.PI * 2;
         
         cam.angle = current + diff * 0.1;

         const camX = state.player.x + TILE_SIZE/2 - Math.cos(cam.angle) * cam.distance;
         const camY = state.player.y + TILE_SIZE/2 - Math.sin(cam.angle) * cam.distance;

         const grad = ctx.createLinearGradient(0, 0, 0, fh);
         grad.addColorStop(0, colors.skyTop);
         grad.addColorStop(0.5, colors.skyBottom); 
         grad.addColorStop(1, colors.bg); // fade to ground color
         ctx.fillStyle = grad;
         ctx.fillRect(0, 0, fw, fh);

         // Grid
         ctx.strokeStyle = colors.grid;
         ctx.lineWidth = 1;
         ctx.beginPath();
         for(let i=0; i<fh/2; i+=20) {
             const y = fh/2 + i;
             ctx.moveTo(0, y); ctx.lineTo(fw, y);
         }
         ctx.stroke();

         interface RenderItem {
             type: 'WALL' | 'DOT' | 'POWER' | 'VILLAIN' | 'PLAYER';
             dist: number;
             x: number; y: number;
             obj?: any;
         }

         const items: RenderItem[] = [];
         const renderDist = 1000; 

         for(let r=0; r<state.map.length; r++) {
             for(let c=0; c<state.map[r].length; c++) {
                 const type = state.map[r][c];
                 const wx = c * TILE_SIZE + TILE_SIZE/2;
                 const wy = r * TILE_SIZE + TILE_SIZE/2;
                 
                 const d = Math.hypot(wx - camX, wy - camY);
                 if (d > renderDist) continue;

                 if (type === 1) items.push({ type: 'WALL', dist: d, x: wx, y: wy });
                 else if (type === 0) items.push({ type: 'DOT', dist: d, x: wx, y: wy });
                 else if (type === 3) items.push({ type: 'POWER', dist: d, x: wx, y: wy });
             }
         }

         state.villains.forEach(g => {
             const wx = g.x + TILE_SIZE/2;
             const wy = g.y + TILE_SIZE/2;
             const d = Math.hypot(wx - camX, wy - camY);
             items.push({ type: 'VILLAIN', dist: d, x: wx, y: wy, obj: g });
         });

         const px = state.player.x + TILE_SIZE/2;
         const py = state.player.y + TILE_SIZE/2;
         items.push({ type: 'PLAYER', dist: Math.hypot(px - camX, py - camY), x: px, y: py });

         items.sort((a, b) => b.dist - a.dist);

         items.forEach(item => {
             const dx = item.x - camX;
             const dy = item.y - camY;
             
             const rx = dx * Math.sin(-cam.angle) + dy * Math.cos(-cam.angle);
             const rz = dx * Math.cos(-cam.angle) - dy * Math.sin(-cam.angle);

             if (rz <= 5) return;

             const scale = fov / rz;
             const screenX = fw/2 + rx * scale;
             const screenY = fh/2 + (cam.height) * scale / 4;

             const size = TILE_SIZE * scale;

             if (item.type === 'WALL') {
                 const h = size * 1.5;
                 const w = size + 1;
                 const shade = Math.max(0.2, 1 - (item.dist / renderDist)); 
                 
                 ctx.fillStyle = colors.wall3D.fill(shade);
                 ctx.fillRect(screenX - w/2, screenY - h/2, w, h);
                 
                 ctx.fillStyle = colors.wall3D.top(shade);
                 ctx.fillRect(screenX - w/2, screenY - h/2, w, size/4);
                 
                 ctx.strokeStyle = colors.wall3D.stroke(shade);
                 ctx.strokeRect(screenX - w/2, screenY - h/2, w, h);

             } else if (item.type === 'DOT') {
                 ctx.fillStyle = colors.dot;
                 ctx.beginPath();
                 ctx.arc(screenX, screenY + size/2, size/5, 0, Math.PI*2);
                 ctx.fill();
             } else if (item.type === 'POWER') {
                 ctx.fillStyle = colors.superCharge;
                 ctx.beginPath();
                 ctx.arc(screenX, screenY + size/2, size/2, 0, Math.PI*2);
                 ctx.fill();
                 ctx.strokeStyle = '#ff2a6d';
                 ctx.lineWidth = 2;
                 ctx.stroke();
             } else if (item.type === 'PLAYER') {
                 if (assets.current.playerLoaded && playerSpriteUrl) {
                     const isMoving = state.player.dir.x !== 0 || state.player.dir.y !== 0;
                     drawEntity(assets.current.player, screenX, screenY, scale * 1.5, false, isMoving);
                 }
             } else if (item.type === 'VILLAIN') {
                 const g = item.obj as Villain;
                 const spriteScale = scale * 1.5;
                 
                 if (assets.current.villainLoaded && villainSpriteUrl) {
                     drawEntity(assets.current.villain, screenX, screenY, spriteScale, false, true);
                 } else {
                     ctx.fillStyle = g.status === 'SCARED' ? 'blue' : g.color;
                     ctx.fillRect(screenX - size/2, screenY - size/2, size, size);
                 }

                 if (g.status !== 'EATEN') {
                    const bounce = Math.abs(Math.sin(Date.now() / 200)) * (size * 0.5);
                    const spriteTop = screenY - (size * 1.5) / 2;
                    const indicatorY = spriteTop - (size * 0.4) - bounce;
                    
                    ctx.save();
                    ctx.fillStyle = g.status === 'SCARED' ? '#0000ff' : '#ff2a6d';
                    ctx.shadowColor = g.status === 'SCARED' ? '#0000ff' : '#ff2a6d';
                    ctx.shadowBlur = 15;
                    
                    const arrowSize = size * 0.4;
                    ctx.beginPath();
                    ctx.moveTo(screenX, indicatorY + arrowSize); 
                    ctx.lineTo(screenX - arrowSize, indicatorY - arrowSize); 
                    ctx.lineTo(screenX + arrowSize, indicatorY - arrowSize); 
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                 }
             }
         });
    }

    const gameLoop = () => {
      const state = gameState.current;
      
      // --- ATTRACT MODE AI ---
      if (appState !== 'PLAYING') {
          state.player.y = -1000; 
          state.villains.forEach((g, i) => {
              const speed = 2;
              g.x += g.dir.x * speed;
              if (g.x >= 10 * TILE_SIZE) g.dir.x = -1;
              if (g.x <= 8 * TILE_SIZE) g.dir.x = 1;
              g.y = (9 * TILE_SIZE) + Math.sin(Date.now() / 300 + i) * 5; 
              g.status = 'NORMAL';
          });
          if (viewMode === '2D') render2D(state);
          else render3D(state); 
          animationFrameId = requestAnimationFrame(gameLoop);
          return;
      }
      
      // If paused via Props, we still render the scene but skip logic
      if (isPaused) {
          if (viewMode === '2D') render2D(state);
          else render3D(state);
          animationFrameId = requestAnimationFrame(gameLoop);
          return;
      }

      if (state.isPaused || isGameOverLocal) {
           if (!state.isIntroAnimating) return;
      }

      if (state.isIntroAnimating) {
          state.player.y += DROP_IN_SPEED;
          if (state.player.y >= state.playerStartY) {
              state.player.y = state.playerStartY;
              state.isIntroAnimating = false;
              state.levelStartTime = Date.now();
          }
          if (viewMode === '2D') render2D(state);
          else render3D(state);
          animationFrameId = requestAnimationFrame(gameLoop);
          return;
      }

      const now = Date.now();
      const mapPixelWidth = state.map[0].length * TILE_SIZE;
      let diffMult = 1.0;
      let superChargeMult = 1.0;
      if (difficulty === 'EASY') { diffMult = 0.8; superChargeMult = 1.2; }
      if (difficulty === 'HARD') { diffMult = 1.2; superChargeMult = 0.8; }

      if (now >= state.superChargeTimer) {
         state.villains.forEach(g => { if (g.status === 'SCARED') g.status = 'NORMAL'; });
      }

      const pCenterX = state.player.x + TILE_SIZE / 2;
      const pCenterY = state.player.y + TILE_SIZE / 2;
      const tileCol = Math.floor(pCenterX / TILE_SIZE);
      const tileRow = Math.floor(pCenterY / TILE_SIZE);

      if (tileCol !== state.stats.lastTile.col || tileRow !== state.stats.lastTile.row) {
          state.stats.stepsTaken++;
          state.stats.visitedTiles.add(`${tileCol},${tileRow}`);
          state.stats.lastTile = { col: tileCol, row: tileRow };
      }

      // --- PLAYER MOVEMENT ---

      // 1. Handle "Start from Stop"
      // Allows starting movement if aligned perpendicular to direction (fixes 3D stop-and-go sticking)
      if (state.player.dir.x === 0 && state.player.dir.y === 0) {
           if (state.player.nextDir.x !== 0) {
               // Want to move X? Must be Y aligned.
               if (Math.abs(pCenterY - (tileRow * TILE_SIZE + TILE_SIZE / 2)) <= PLAYER_SPEED) {
                   state.player.y = tileRow * TILE_SIZE; // Align perfectly
                   state.player.dir = state.player.nextDir;
                   state.player.nextDir = {x:0, y:0};
               }
           } else if (state.player.nextDir.y !== 0) {
               // Want to move Y? Must be X aligned.
               if (Math.abs(pCenterX - (tileCol * TILE_SIZE + TILE_SIZE / 2)) <= PLAYER_SPEED) {
                   state.player.x = tileCol * TILE_SIZE; // Align perfectly
                   state.player.dir = state.player.nextDir;
                   state.player.nextDir = {x:0, y:0};
               }
           }
      }
      // 2. Handle "Turning at Intersection" (Standard Pacman logic)
      else if (Math.abs(pCenterX - (tileCol * TILE_SIZE + TILE_SIZE / 2)) <= PLAYER_SPEED &&
          Math.abs(pCenterY - (tileRow * TILE_SIZE + TILE_SIZE / 2)) <= PLAYER_SPEED) {
         if (state.player.nextDir.x !== 0 || state.player.nextDir.y !== 0) {
             if (!isWall(tileCol + state.player.nextDir.x, tileRow + state.player.nextDir.y)) {
                 state.player.x = tileCol * TILE_SIZE; state.player.y = tileRow * TILE_SIZE;
                 state.player.dir = state.player.nextDir; state.player.nextDir = {x:0, y:0};
             }
         }
      }

      // 3. Update Position & Collision
      if (state.player.dir.x !== 0 || state.player.dir.y !== 0) {
          const nextX = state.player.x + state.player.dir.x * PLAYER_SPEED;
          const nextY = state.player.y + state.player.dir.y * PLAYER_SPEED;
          let blocked = false;
          const m = 4;
          if (state.player.dir.x > 0) { if (getTileAtPx(nextX + TILE_SIZE - m, nextY + m) === 1 || getTileAtPx(nextX + TILE_SIZE - m, nextY + TILE_SIZE - m) === 1) blocked = true; }
          else if (state.player.dir.x < 0) { if (getTileAtPx(nextX + m, nextY + m) === 1 || getTileAtPx(nextX + m, nextY + TILE_SIZE - m) === 1) blocked = true; }
          else if (state.player.dir.y > 0) { if (getTileAtPx(nextX + m, nextY + TILE_SIZE - m) === 1 || getTileAtPx(nextX + TILE_SIZE - m, nextY + TILE_SIZE - m) === 1) blocked = true; }
          else if (state.player.dir.y < 0) { if (getTileAtPx(nextX + m, nextY + m) === 1 || getTileAtPx(nextX + TILE_SIZE - m, nextY + m) === 1) blocked = true; }

          if (!blocked) {
              state.player.x = nextX; state.player.y = nextY;
              if (state.player.x <= -TILE_SIZE) state.player.x = mapPixelWidth - PLAYER_SPEED;
              else if (state.player.x >= mapPixelWidth) state.player.x = -TILE_SIZE + PLAYER_SPEED;
          } else {
              // Smart Snapping: Only snap the axis we are NOT moving on.
              // Snapping the moving axis into the wall causes stutter or sticking.
              if (state.player.dir.x !== 0) state.player.y = Math.round(state.player.y / TILE_SIZE) * TILE_SIZE;
              if (state.player.dir.y !== 0) state.player.x = Math.round(state.player.x / TILE_SIZE) * TILE_SIZE;
          }
      }

      // Villain Movement
      state.villains.forEach(villain => {
          if (villain.status === 'EATEN') {
              const dx = villain.home.x - villain.x; const dy = villain.home.y - villain.y; const dist = Math.sqrt(dx*dx + dy*dy);
              if (dist < EATEN_VILLAIN_SPEED) { villain.x = villain.home.x; villain.y = villain.home.y; villain.status = 'NORMAL'; }
              else { villain.x += (dx / dist) * EATEN_VILLAIN_SPEED; villain.y += (dy / dist) * EATEN_VILLAIN_SPEED; }
          } else {
               let currentSpeed = state.baseLevelStats.villainSpeed * diffMult * speedModifier;
               
               // Mobile adjustment: Villains move slower on smaller screens to accommodate touch controls
               if (window.innerWidth < 768) currentSpeed *= 0.5;

               currentSpeed = Math.min(currentSpeed, TILE_SIZE / 2);
               if (villain.status === 'SCARED') currentSpeed *= 0.5;

               villain.x += villain.dir.x * currentSpeed;
               villain.y += villain.dir.y * currentSpeed;

               if (villain.x < -TILE_SIZE / 2) villain.x = mapPixelWidth - TILE_SIZE / 2;
               if (villain.x > mapPixelWidth - TILE_SIZE / 2) villain.x = -TILE_SIZE / 2;

               const col = Math.round(villain.x / TILE_SIZE);
               const row = Math.round(villain.y / TILE_SIZE);
               const tileCenterX = col * TILE_SIZE;
               const tileCenterY = row * TILE_SIZE;

               if (villain.dir.x !== 0) villain.y = tileCenterY;
               if (villain.dir.y !== 0) villain.x = tileCenterX;

               const isInGrid = col >= 0 && col < state.map[0].length && row >= 0 && row < state.map.length;

               if (isInGrid && Math.abs(villain.x - tileCenterX) < currentSpeed * 1.5 && Math.abs(villain.y - tileCenterY) < currentSpeed * 1.5) {
                   if (col !== villain.lastDecisionTile.x || row !== villain.lastDecisionTile.y) {
                       villain.x = tileCenterX;
                       villain.y = tileCenterY;
                       villain.lastDecisionTile = { x: col, y: row };

                        const isCenter = row === 9 && col === 9;
                        const isLeft = row === 9 && col === 8;
                        const isRight = row === 9 && col === 10;
                        const isDoorStep = row === 8 && col === 9;
                        
                        if (villain.status === 'NORMAL' && (isCenter || isLeft || isRight || isDoorStep)) {
                                if (isDoorStep) {
                                    if (!isWall(9, 7)) villain.dir = {x: 0, y: -1}; 
                                    else villain.dir = Math.random() > 0.5 ? {x: 1, y: 0} : {x: -1, y: 0};
                                } else if (isCenter) {
                                    if (!isWall(9, 8)) villain.dir = {x: 0, y: -1};
                                    else {
                                        if (!isWall(9, 10)) villain.dir = {x: 0, y: 1};
                                        else villain.dir = Math.random() > 0.5 ? {x: 1, y: 0} : {x: -1, y: 0};
                                    }
                                } else if (isLeft) {
                                    villain.dir = {x: 1, y: 0}; 
                                } else if (isRight) {
                                    villain.dir = {x: -1, y: 0};
                                }
                        } else {
                            const possibleDirs = [
                                {x:0,y:-1}, {x:0,y:1}, {x:-1,y:0}, {x:1,y:0}
                            ].filter(d => !isWall(col + d.x, row + d.y));
                            
                            if (possibleDirs.length === 0) {
                                villain.dir.x = -villain.dir.x;
                                villain.dir.y = -villain.dir.y;
                                if (villain.dir.x === 0 && villain.dir.y === 0) villain.dir = {x:1, y:0};
                            } else {
                                const forward = possibleDirs.filter(d => d.x !== -villain.dir.x || d.y !== -villain.dir.y);
                                const choices = forward.length > 0 ? forward : possibleDirs;
                                
                                const hitWallAhead = !possibleDirs.some(d => d.x === villain.dir.x && d.y === villain.dir.y);
                                const isJunction = choices.length > 1;
            
                                if (hitWallAhead || (isJunction && Math.random() < 0.4)) {
                                        villain.dir = choices[Math.floor(Math.random() * choices.length)];
                                }
                            }
                        }
                   }
               }
          }

          // Collision with Player
          if (villain.status !== 'EATEN' && Math.hypot((state.player.x + TILE_SIZE/2) - (villain.x + TILE_SIZE/2), (state.player.y + TILE_SIZE/2) - (villain.y + TILE_SIZE/2)) < TILE_SIZE * 0.8) {
              if (villain.status === 'SCARED') {
                  villain.status = 'EATEN';
                  state.score += 200;
                  setScore(state.score);
                  playEatVillain();
              }
              else if (villain.status === 'NORMAL') {
                  setIsGameOverLocal(true);
                  gameState.current.isPaused = true;
                  playGameOver();
                  const finalStats = calculateStats(false);
                  setTimeout(() => onGameOver(finalStats), 1000);
              }
          }
      });

      const pColStr = Math.floor((state.player.x + TILE_SIZE/2) / TILE_SIZE);
      const pRowStr = Math.floor((state.player.y + TILE_SIZE/2) / TILE_SIZE);
      const currentTile = state.map[pRowStr]?.[pColStr];
      if (currentTile === 0 || currentTile === 3) {
          state.map[pRowStr][pColStr] = 2;
          state.score += (currentTile === 3 ? 50 : 10);
          setScore(state.score);
          state.dotsRemaining--;
          
          if (currentTile === 3) {
              playSuperCharge();
              state.superChargeTimer = Date.now() + (state.baseLevelStats.superChargeDuration * superChargeMult);
              state.villains.forEach(g => { if (g.status === 'NORMAL') g.status = 'SCARED'; });
          } else {
              playDot();
          }

          if (state.dotsRemaining <= 0) {
              playLevelWin();
              state.isPaused = true;
              const finalStats = calculateStats(true);
              setTimeout(() => onLevelComplete(finalStats), 1500);
          }
      }

      if (viewMode === '2D') render2D(state);
      else render3D(state);

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    gameLoop();
    return () => cancelAnimationFrame(animationFrameId);
  }, [playerSpriteUrl, villainSpriteUrl, difficulty, speedModifier, currentLevelIndex, viewMode, onLevelComplete, onGameOver, isGameOverLocal, appState, theme, isPaused]);

  const headerColor = theme === 'LIGHT' ? 'text-black' : 'text-white';

  return (
    <div ref={containerRef} tabIndex={0} className="relative w-full h-full flex flex-col items-center justify-center outline-none overflow-hidden">
      {appState === 'PLAYING' && (
        <div className={`w-full flex justify-between px-4 py-2 font-retro text-sm md:text-xl z-10 absolute top-0 backdrop-blur-sm pointer-events-none ${headerColor} ${theme === 'LIGHT' ? 'bg-white/50' : 'bg-black/50'}`}>
            <div>LVL: <span className={theme === 'LIGHT' ? 'text-cyan-700' : 'text-[#05d9e8]'}>{currentLevelIndex + 1}/3</span></div>
            <div>SCORE: <span className={theme === 'LIGHT' ? 'text-orange-600' : 'text-[#f9c80e]'}>{score}</span></div>
        </div>
      )}
      <canvas
          ref={canvasRef}
          width={MAP_L1[0].length * TILE_SIZE}
          height={MAP_L1.length * TILE_SIZE}
          className="max-w-full max-h-full object-contain"
          style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
};

export default React.memo(GameCanvas);
