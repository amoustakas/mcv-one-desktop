/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { generateArcadeSprite, generateBattleScene } from './services/gemini';
import { UploadedImage, ProcessingState, SpriteType, Difficulty, LevelStats, GameSprite } from './types';
import CRTScreen from './components/CRTScreen';
import RetroButton from './components/RetroButton';
import GameCanvas from './components/GameCanvas';
import LevelRecap from './components/LevelRecap';
import { initAudio, playCountdownBeep, playGoSignal } from './services/sound';

// --- REUSABLE COMPONENTS ---

// API KEY GATE (INSERT COIN SCREEN)
const ApiKeyGate: React.FC<{ onComplete: () => void; theme: 'DARK' | 'LIGHT'; onToggleTheme: () => void }> = ({ onComplete, theme, onToggleTheme }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleInsertKey = async () => {
        if (window.aistudio) {
            setIsLoading(true);
            try {
                await window.aistudio.openSelectKey();
                // Assume success if dialog closes without error, or relies on app re-render/state lift
                onComplete();
            } catch (e) {
                console.error("Key selection cancelled or failed", e);
            } finally {
                setIsLoading(false);
            }
        } else {
            // Dev mode bypass
            onComplete();
        }
    };

    const bgClass = theme === 'LIGHT' ? 'bg-[#e0e0e0] text-[#1a1a1a]' : 'bg-[#120a1a] text-[#d1f7ff]';
    const borderColor = theme === 'LIGHT' ? 'border-cyan-600' : 'border-[#05d9e8]';
    const glowText = theme === 'LIGHT' ? 'text-cyan-800' : 'text-[#05d9e8] retro-text-glow';
    const subText = theme === 'LIGHT' ? 'text-gray-600' : 'text-gray-400';

    return (
        <div className={`relative h-dvh w-full flex flex-col items-center justify-center font-vt323 p-4 ${bgClass}`}>
            {/* Theme Toggle */}
            <button 
                onClick={onToggleTheme}
                className={`absolute top-4 right-4 p-2 border-2 font-retro text-xs transition-all ${theme === 'LIGHT' ? 'bg-white border-gray-400 text-black' : 'bg-black border-[#05d9e8] text-[#05d9e8]'}`}
            >
                {theme === 'DARK' ? '☼ LIGHT' : '☾ DARK'}
            </button>

            <div className={`max-w-lg w-full border-4 p-8 flex flex-col items-center text-center gap-8 relative overflow-hidden ${borderColor} ${theme === 'LIGHT' ? 'bg-white shadow-xl' : 'bg-black shadow-[0_0_50px_rgba(5,217,232,0.2)]'}`}>
                 <div className="crt-overlay z-10 pointer-events-none absolute inset-0"></div>
                 
                 <div className="relative z-20 flex flex-col items-center gap-2 w-full">
                     <h1 className={`text-5xl md:text-6xl font-retro tracking-tighter mb-2 ${glowText}`}>INSERT COIN</h1>
                     <div className={`text-xl tracking-widest uppercase border-b-2 pb-1 mb-4 ${theme === 'LIGHT' ? 'border-gray-300 text-gray-500' : 'border-[#333] text-gray-500'}`}>PAID API KEY REQUIRED</div>
                     
                     <div className={`p-4 border-2 mb-2 w-full flex flex-col gap-2 animate-[pulse_3s_ease-in-out_infinite] ${theme === 'LIGHT' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-red-900/20 border-red-500 text-red-400'}`}>
                        <p className="font-bold text-center text-lg font-retro">WARNING: PAID BILLING REQUIRED</p>
                        <p className="text-sm text-center leading-tight">
                            This application requires a <strong>PAID</strong> Google Cloud Project.
                            <br/><br/>
                            <strong>FREE TIER KEYS WILL NOT WORK.</strong>
                        </p>
                     </div>
                 </div>

                 <div className="relative z-20 w-full flex flex-col gap-2">
                     <RetroButton 
                        onClick={handleInsertKey} 
                        isLoading={isLoading} 
                        className={`w-full text-lg py-4 animate-pulse ${theme === 'LIGHT' ? '!border-cyan-600 !text-cyan-800 hover:!bg-cyan-50' : ''}`}
                     >
                         {isLoading ? "WAITING..." : "INSERT KEY (PAID PROJECT)"}
                     </RetroButton>
                     <div className={`text-xs text-center uppercase tracking-widest ${theme === 'LIGHT' ? 'text-red-600' : 'text-red-400'} font-bold`}>
                        * MUST BE A PAID PROJECT *
                     </div>
                 </div>

                 <div className="relative z-20 text-xs mt-4">
                     <a 
                        href="https://ai.google.dev/gemini-api/docs/billing" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={`underline decoration-dotted hover:text-white transition-colors ${theme === 'LIGHT' ? 'text-cyan-600 hover:text-cyan-800' : 'text-[#ff2a6d]'}`}
                     >
                         VIEW BILLING DOCUMENTATION
                     </a>
                 </div>
            </div>
        </div>
    );
};

// Extracted Sprite Lab Controls for reuse in Desktop Sidebar and Mobile Accordion
const SpriteLabControls: React.FC<{
    targetSpriteType: SpriteType;
    workState: WorkState;
    activeSprite: string | null;
    library: GameSprite[];
    onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onLibrarySelect: (s: GameSprite) => void;
    onDiscard: () => void;
    isDragging: boolean;
    dragHandlers: {
        onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
        onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
        onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
    };
    fileInputRef: React.RefObject<HTMLInputElement | null>; // Changed to allow null
    appState: AppState;
    isSetupComplete: boolean;
    compact?: boolean; // For mobile view
    theme: 'DARK' | 'LIGHT';
}> = ({
    targetSpriteType, workState, activeSprite, library,
    onFileSelect, onLibrarySelect, onDiscard,
    isDragging, dragHandlers, fileInputRef, appState, isSetupComplete, compact = false, theme
}) => {
    const borderColor = theme === 'LIGHT' ? 'border-gray-400' : 'border-[#05d9e8]/50';
    const activeDragColor = theme === 'LIGHT' ? 'bg-yellow-100 border-yellow-500' : 'border-[#f9c80e] bg-[#f9c80e]/20';
    const hoverColor = theme === 'LIGHT' ? 'hover:bg-gray-200' : 'hover:bg-[#05d9e8]/10';
    const textColor = theme === 'LIGHT' ? (targetSpriteType === 'PLAYER' ? 'text-cyan-700' : 'text-pink-700') : (targetSpriteType === 'PLAYER' ? 'text-[#05d9e8]' : 'text-[#ff2a6d]');

    return (
        <div className={`flex flex-col ${compact ? 'h-auto gap-2' : 'h-full gap-2 md:gap-4'} overflow-y-auto`}>
            {/* UPLOAD AREA */}
            {!workState.source && !workState.generated && (
                <div
                    className={`flex-shrink-0 flex flex-col items-center justify-center border-2 border-dashed transition-all text-center cursor-pointer relative group ${compact ? 'p-3 min-h-[100px]' : 'p-4 min-h-[120px] mb-4'} ${isDragging ? activeDragColor : `${borderColor} ${hoverColor}`} ${appState !== 'SETUP' ? 'pointer-events-none opacity-50' : ''}`}
                    onClick={() => appState === 'SETUP' && fileInputRef.current?.click()}
                    {...dragHandlers}
                >
                    <p className={`font-retro ${compact ? 'text-sm mb-1' : 'text-sm md:text-xl mb-1 md:mb-2'} ${!isSetupComplete && !compact ? 'animate-bounce' : ''} ${textColor}`}>
                        {targetSpriteType === 'PLAYER' ? 'DROP HERO PHOTO' : 'DROP VILLAIN PHOTO'}
                    </p>
                    <p className={`text-[10px] md:text-xs mb-2 ${theme === 'LIGHT' ? 'text-gray-600' : 'text-gray-500'}`}>CLICK OR DRAG FILE</p>
                    
                    <p className={`text-[9px] mt-3 max-w-xs leading-tight font-sans ${theme === 'LIGHT' ? 'text-gray-500' : 'text-white/90'}`}>
                         The Prohibited Use Policy applies. Do not generate content that infringes on others' privacy rights.
                    </p>
                </div>
            )}

            {/* PROCESSING / SOURCE PREVIEW */}
            {(workState.source || workState.generated) && (
                <div className={`flex flex-col ${compact ? 'gap-2 mb-2' : 'gap-2 md:gap-4 mb-4'} flex-shrink-0`}>
                    {workState.source && !workState.generated && (
                        <div className={`relative flex-1 border-2 bg-black p-2 ${compact ? 'h-32' : 'h-56'} ${theme === 'LIGHT' ? 'border-gray-800' : 'border-[#333]'}`}>
                            <div className="absolute top-0 left-0 bg-[#ff2a6d] text-black text-[10px] px-1 font-retro">SOURCE</div>
                            <img src={workState.source.url} alt="Source" className={`object-contain w-full h-full ${workState.status === 'PROCESSING_SPRITE' ? 'animate-pulse opacity-90' : 'opacity-100'}`} />
                        </div>
                    )}
                </div>
            )}

             {/* CONTROLS (Retry/Cancel) */}
             {!workState.generated && (
                 <div className="shrink-0">
                    {workState.status === 'PROCESSING_SPRITE' && (
                        <div className={`w-full border-2 p-2 text-center font-retro text-xs animate-pulse ${theme === 'LIGHT' ? 'border-cyan-600 bg-cyan-100 text-cyan-800' : 'border-[#05d9e8] bg-[#05d9e8]/10 text-[#05d9e8]'}`}>DIGITIZING...</div>
                    )}
                    {workState.status === 'ERROR' && (
                        <RetroButton variant="secondary" className="w-full !border-red-500 !text-red-500 hover:!bg-red-500/10" onClick={() => appState === 'SETUP' && fileInputRef.current?.click()}>RETRY</RetroButton>
                    )}
                    {workState.source && (
                        <button onClick={onDiscard} className={`text-xs underline font-retro mt-2 w-full text-center ${theme === 'LIGHT' ? 'text-gray-600 hover:text-black' : 'text-gray-500 hover:text-white'}`}>CANCEL / EJECT</button>
                    )}
                 </div>
             )}

            {/* LIBRARY */}
            {library.length > 0 && !workState.generated && (
                <div className={`flex-1 min-h-0 flex flex-col border-t ${theme === 'LIGHT' ? 'border-gray-300' : 'border-[#333]'} ${compact ? 'pt-2 mt-2' : 'pt-2 md:pt-4'} ${appState !== 'SETUP' ? 'pointer-events-none opacity-50' : ''}`}>
                    <h3 className={`font-retro text-[10px] mb-2 tracking-widest ${textColor}`}>DATABANK // {targetSpriteType}S</h3>
                    <div className={`grid grid-cols-4 gap-2 overflow-y-auto p-1 ${compact ? 'max-h-[100px]' : ''}`}>
                        {library.map((sprite) => {
                            const isActive = activeSprite === sprite.imageUrl;
                            const activeClass = theme === 'LIGHT' 
                                ? (isActive ? 'border-yellow-500 shadow-[0_0_10px_rgba(200,150,0,0.5)]' : 'border-gray-300 hover:border-gray-500')
                                : (isActive ? 'border-[#f9c80e] shadow-[0_0_10px_rgba(249,200,14,0.5)]' : (sprite.type === 'PLAYER' ? 'border-[#05d9e8]/50 hover:border-[#05d9e8]' : 'border-[#ff2a6d]/50 hover:border-[#ff2a6d]'));

                            return (
                                <button
                                    key={sprite.id}
                                    onClick={() => onLibrarySelect(sprite)}
                                    className={`aspect-square bg-black border-2 p-1 transition-all hover:scale-105 ${activeClass}`}
                                >
                                    <SpritePreview src={sprite.imageUrl} className="w-full h-full" alt="Saved Sprite" />
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
             {/* Hidden File Input */}
             <input type="file" ref={fileInputRef as any} onChange={onFileSelect} accept="image/*" className="hidden" />
        </div>
    );
};


// --- TOUCH CONTROLS COMPONENT ---
const TouchControls: React.FC<{ viewMode: '2D' | '3D', onToggleView: () => void, theme: 'DARK' | 'LIGHT' }> = ({ viewMode, onToggleView, theme }) => {
    const handlePress = (key: string) => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: key, bubbles: true }));
        if (navigator.vibrate) navigator.vibrate(10);
    };
    
    // Helper for key up to stop movement in 3D mode
    const handleRelease = (key: string) => {
        window.dispatchEvent(new KeyboardEvent('keyup', { key: key, bubbles: true }));
    }

    const btnClass = theme === 'LIGHT' 
        ? "bg-white/80 border-cyan-600 text-cyan-700 active:bg-cyan-100 shadow-[0_0_10px_rgba(0,0,0,0.1)]"
        : "bg-white/10 border-[#05d9e8] text-[#05d9e8] active:bg-[#05d9e8]/50 shadow-[0_0_15px_rgba(5,217,232,0.2)]";
    
    const actionBtnClass = theme === 'LIGHT'
        ? "border-yellow-500 bg-yellow-100 text-yellow-800 active:bg-yellow-300 shadow-[0_0_10px_rgba(0,0,0,0.1)]"
        : "border-[#f9c80e] bg-[#f9c80e]/20 text-[#f9c80e] active:bg-[#f9c80e] active:text-black shadow-[0_0_25px_rgba(249,200,14,0.5)]";

    return (
      <div className="absolute bottom-4 left-0 w-full px-6 pb-4 z-[100] flex justify-between items-end pointer-events-none lg:hidden">
          {/* D-PAD LEFT */}
          <div className="pointer-events-auto select-none touch-none">
              <div className="grid grid-cols-3 gap-2">
                  <div></div>
                  <button 
                    onPointerDown={(e) => { e.preventDefault(); handlePress('ArrowUp'); }} 
                    onPointerUp={(e) => { e.preventDefault(); handleRelease('ArrowUp'); }}
                    onPointerLeave={(e) => { e.preventDefault(); handleRelease('ArrowUp'); }}
                    className={`w-16 h-16 border-2 rounded-t-lg flex items-center justify-center backdrop-blur-sm ${btnClass}`}
                  >▲</button>
                  <div></div>
                  
                  <button onPointerDown={(e) => { e.preventDefault(); handlePress('ArrowLeft'); }} className={`w-16 h-16 border-2 rounded-l-lg flex items-center justify-center backdrop-blur-sm ${btnClass}`}>◀</button>
                  <div className="w-16 h-16 bg-black/20 rounded-full"></div>
                  <button onPointerDown={(e) => { e.preventDefault(); handlePress('ArrowRight'); }} className={`w-16 h-16 border-2 rounded-r-lg flex items-center justify-center backdrop-blur-sm ${btnClass}`}>▶</button>
                  
                  <div></div>
                  {viewMode === '2D' ? (
                      <button onPointerDown={(e) => { e.preventDefault(); handlePress('ArrowDown'); }} className={`w-16 h-16 border-2 rounded-b-lg flex items-center justify-center backdrop-blur-sm ${btnClass}`}>▼</button>
                  ) : (
                      <div className="w-16 h-16"></div>
                  )}
                  <div></div>
              </div>
          </div>

          {/* ACTION RIGHT */}
           <div className="pointer-events-auto flex flex-col gap-4 select-none touch-none">
              <button onPointerDown={(e) => { e.preventDefault(); onToggleView(); }} className={`w-20 h-20 rounded-full border-4 flex items-center justify-center backdrop-blur-sm transition-colors ${actionBtnClass}`}>
                  <span className="font-retro text-xs font-bold">{viewMode}</span>
              </button>
           </div>
      </div>
    );
};

// --- INTRO ANIMATION COMPONENT ---
const IntroAnimation: React.FC<{ onComplete: () => void; onImpact: () => void }> = ({ onComplete, onImpact }) => {
  const [phase, setPhase] = useState<'BIOS' | 'VOID' | 'DROP' | 'IMPACT' | 'SHATTER'>('BIOS');
  
  const particles = React.useMemo(() => {
    return Array.from({ length: 200 }).map((_, i) => {
      const angle = Math.random() * 360;
      const velocity = 150 + Math.pow(Math.random(), 3) * 1000; 
      const size = 3 + Math.random() * 8; 
      
      const colors = [
          '#ff2a6d', '#05d9e8', '#f9c80e', '#120a1a', '#d1f7ff',
      ];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      const duration = 0.8 + Math.random() * 1.5; 
      const delay = Math.random() * 0.15;

      return { id: i, angle, velocity, size, color, duration, delay };
    });
  }, []);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('VOID'), 2500);
    const t2 = setTimeout(() => setPhase('DROP'), 6000);
    const t3 = setTimeout(() => setPhase('IMPACT'), 6800);
    const t4 = setTimeout(() => {
        setPhase('SHATTER');
        onImpact();
    }, 7000);
    const t5 = setTimeout(onComplete, 9500);

    return () => {
      [t1, t2, t3, t4, t5].forEach(clearTimeout);
    };
  }, []);

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-700 ${phase === 'BIOS' ? 'bg-[#e0e0e0]' : (phase === 'SHATTER' ? 'bg-transparent pointer-events-none' : 'bg-[#050011]')}`}>
       <style>{`
         @keyframes dropPixel {
           0% { transform: translateY(-60vh) scale(1); opacity: 0; }
           20% { opacity: 1; }
           100% { transform: translateY(0) scale(1); }
         }
         @keyframes particleFly {
           0% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 1; }
           100% { transform: translate(var(--tx), var(--ty)) rotate(var(--rot)) scale(0); opacity: 0; }
         }
         @keyframes diamondSpin {
           0% { transform: rotate(45deg) scale(0.8); opacity: 0; }
           50% { transform: rotate(225deg) scale(1.2); opacity: 0.8; }
           100% { transform: rotate(405deg) scale(0.8); opacity: 0; }
         }
         @keyframes biosText {
            0% { opacity: 0; transform: scale(0.95); }
            10% { opacity: 1; transform: scale(1); }
            90% { opacity: 1; transform: scale(1); }
            100% { opacity: 0; transform: scale(1.1); }
         }
         @keyframes mistFlow {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
         }
       `}</style>

       {/* PHASE 1: BIOS SCREEN */}
       {phase === 'BIOS' && (
           <div className="flex flex-col items-center justify-center w-full h-full animate-[biosText_2.4s_ease-in-out_forwards]">
               <div className="text-[#f9c80e] font-retro text-2xl md:text-5xl tracking-[0.2em] font-bold drop-shadow-md mb-4 text-center px-4 leading-relaxed">
                   ONE SHOT <span className="text-black">STUDIOS</span>
               </div>
           </div>
       )}

       {/* PHASE 2: THE VOID */}
       {(phase === 'VOID' || phase === 'DROP') && (
           <div className="absolute inset-0 overflow-hidden flex items-center justify-center">
               <div className="absolute inset-0 opacity-20" style={{
                   background: 'linear-gradient(45deg, #000000, #1a0b2e, #2a0033, #000000)',
                   backgroundSize: '400% 400%',
                   animation: 'mistFlow 10s ease infinite'
               }}></div>
               
               <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-[#05d9e8]/10 to-transparent opacity-50 blur-xl"></div>

               <div className="w-64 h-64 border border-[#ff2a6d] blur-[1px] animate-[diamondSpin_6s_linear_infinite]"></div>
               <div className="absolute w-48 h-48 border border-[#05d9e8] blur-[2px] animate-[diamondSpin_8s_linear_infinite_reverse] opacity-60"></div>
               
               <div className="absolute bottom-10 font-retro text-[#05d9e8] tracking-[1em] text-xs opacity-50 animate-pulse">
                   LOADING ENGINE...
               </div>
           </div>
       )}

       {/* PHASE 3: THE DROP */}
       {(phase === 'DROP' || phase === 'IMPACT') && (
         <div 
           className="absolute z-20 w-4 h-4 md:w-6 md:h-6 bg-[#05d9e8] shadow-[0_0_50px_#05d9e8,0_0_20px_white]"
           style={{ 
               animation: phase === 'DROP' 
                ? 'dropPixel 0.8s cubic-bezier(0.5, 0, 1, 1) forwards' 
                : 'none',
               top: phase === 'IMPACT' ? '50%' : undefined,
               transform: phase === 'IMPACT' ? 'translateY(-50%)' : undefined
           }}
         ></div>
       )}

       {/* PHASE 4: IMPACT & SHATTER */}
       {(phase === 'IMPACT' || phase === 'SHATTER') && (
         <div className="relative w-full h-full flex items-center justify-center">
             <div className={`absolute inset-0 bg-white z-50 transition-opacity duration-1000 ease-out ${phase === 'SHATTER' ? 'opacity-0' : 'opacity-100'}`}></div>
             
             {phase === 'SHATTER' && particles.map(p => {
                const rad = p.angle * (Math.PI / 180);
                const tx = Math.cos(rad) * p.velocity + 'px';
                const ty = Math.sin(rad) * p.velocity + 'px';
                const rot = (Math.random() * 720 - 360) + 'deg';
                
                return (
                  <div
                    key={p.id}
                    className="absolute"
                    style={{
                      width: p.size,
                      height: p.size,
                      backgroundColor: p.color,
                      '--tx': tx,
                      '--ty': ty,
                      '--rot': rot,
                      animation: `particleFly ${p.duration}s cubic-bezier(0.1, 1, 0.2, 1) forwards`,
                      animationDelay: `${p.delay}s`,
                      boxShadow: `0 0 10px ${p.color}`
                    } as React.CSSProperties}
                  ></div>
                );
             })}
         </div>
       )}
    </div>
  );
};

type AppState = 'SETUP' | 'BATTLE_PREVIEW' | 'PLAYING' | 'RECAP' | 'VICTORY';

interface WorkState {
    source: UploadedImage | null;
    generated: UploadedImage | null;
    status: ProcessingState;
    progressTick: number;
}

const initialWorkState: WorkState = {
    source: null,
    generated: null,
    status: 'IDLE',
    progressTick: 0
};

const TIPS = [
    "DON'T GET CAUGHT!",
    "THINGS ARE CLOSER THAN THEY APPEAR.",
    "YOU CAN SWITCH FROM 3D TO 2D AT ANYTIME.",
    "USE SUPER CHARGES TO TURN THE TABLES.",
    "THE MAZE CHANGES PATTERNS EVERY LEVEL."
];

// "The Digitizer" v2.0
const processSpriteImage = async (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return resolve(dataUrl);
            
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            const width = canvas.width;
            const height = canvas.height;
            
            const visited = new Uint8Array(width * height); 
            const queue: number[] = []; 

            const bgR = data[0];
            const bgG = data[1];
            const bgB = data[2];
            
            const isBackgroundLike = (r: number, g: number, b: number) => {
                const diffCorner = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
                const diffWhite = Math.abs(r - 255) + Math.abs(g - 255) + Math.abs(b - 255);
                return diffCorner < 150 || diffWhite < 120; 
            };

            const entryPoints = [
                [0,0], [width-1, 0], [0, height-1], [width-1, height-1], 
                [Math.floor(width/2), 0], [Math.floor(width/2), height-1], 
                [0, Math.floor(height/2)], [width-1, Math.floor(height/2)] 
            ];

            entryPoints.forEach(([x, y]) => {
                const idx = y * width + x;
                if (visited[idx] === 0) {
                    visited[idx] = 1;
                    queue.push(x, y);
                }
            });

            let head = 0;
            while(head < queue.length) {
                const x = queue[head++];
                const y = queue[head++];
                const idx = (y * width + x) * 4;

                if (isBackgroundLike(data[idx], data[idx+1], data[idx+2])) {
                    data[idx+3] = 0; 

                    const neighbors = [[x+1, y], [x-1, y], [x, y+1], [x, y-1]];
                    
                    for (const [nx, ny] of neighbors) {
                        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                            const nIdx = ny * width + nx;
                            if (visited[nIdx] === 0) {
                                visited[nIdx] = 1;
                                queue.push(nx, ny);
                            }
                        }
                    }
                }
            }
            
            ctx.putImageData(imageData, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
    });
};

const SpritePreview: React.FC<{ src: string; className?: string; alt?: string }> = ({ src, className = '', alt }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.src = src;
        
        img.onload = () => {
            const animate = () => {
                if (!canvas) return;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.imageSmoothingEnabled = false; 

                const singleFrameWidth = img.naturalWidth;
                const singleFrameHeight = img.naturalHeight;
                const ratio = singleFrameWidth / singleFrameHeight;

                let w = canvas.width;
                let h = canvas.height;
                if (ratio > canvas.width/canvas.height) h = w / ratio;
                else w = h * ratio;

                const speed = Date.now() / 50; 
                const bobY = Math.abs(Math.sin(speed)) * -4;
                const legShear = Math.sin(speed) * 0.5;
                
                const cx = canvas.width / 2;
                const cy = canvas.height / 2;
                const srcSplitY = singleFrameHeight * 0.65;
                const destSplitY = h * 0.65;

                ctx.save();
                ctx.translate(cx, cy);

                ctx.drawImage(img, 0, 0, singleFrameWidth, srcSplitY, -w/2, -h/2 + bobY, w, destSplitY);

                ctx.save();
                ctx.translate(0, -h/2 + destSplitY + bobY);
                ctx.transform(1, 0, legShear, 1, 0, 0); 
                ctx.drawImage(img, 0, srcSplitY, singleFrameWidth, singleFrameHeight - srcSplitY, -w/2, 0, w, h - destSplitY);
                ctx.restore();

                ctx.restore();
                requestRef.current = requestAnimationFrame(animate);
            };
            requestRef.current = requestAnimationFrame(animate);
        };
        return () => cancelAnimationFrame(requestRef.current);
    }, [src]);

    return (
        <div className={`relative overflow-hidden ${className}`} role="img" aria-label={alt}>
            <canvas ref={canvasRef} width={100} height={100} className="w-full h-full object-contain" />
        </div>
    );
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('SETUP');
  const [showIntro, setShowIntro] = useState(true);
  const [uiVisible, setUiVisible] = useState(false);
  const [theme, setTheme] = useState<'DARK' | 'LIGHT'>('DARK');
  const [isPaused, setIsPaused] = useState(false);
  
  const [hasCheckedKey, setHasCheckedKey] = useState(false);
  const [hasValidKey, setHasValidKey] = useState(false);
  
  const [heroWork, setHeroWork] = useState<WorkState>(initialWorkState);
  const [villainWork, setVillainWork] = useState<WorkState>(initialWorkState);

  const [targetSpriteType, setTargetSpriteType] = useState<SpriteType>('PLAYER');
  const [isDragging, setIsDragging] = useState(false);
  const [globalStatus, setGlobalStatus] = useState<string>("AWAITING INPUT...");

  const [difficulty, setDifficulty] = useState<Difficulty>('NORMAL');
  const [villainSpeedMod, setVillainSpeedMod] = useState<number>(1.0);
  const [viewMode, setViewMode] = useState<'2D' | '3D'>('2D');

  const [activePlayerSprite, setActivePlayerSprite] = useState<string | null>(null);
  const [activeVillainSprite, setActiveVillainSprite] = useState<string | null>(null);
  const [insertFlash, setInsertFlash] = useState(false);
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [lastLevelStats, setLastLevelStats] = useState<LevelStats | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const [battleImageUrl, setBattleImageUrl] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);
  const [isGeneratingBattle, setIsGeneratingBattle] = useState(false);
  const [isGameLaunchRequested, setIsGameLaunchRequested] = useState(false);

  const [currentTip, setCurrentTip] = useState(0);
  const [spriteLibrary, setSpriteLibrary] = useState<GameSprite[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isSetupComplete = activePlayerSprite !== null && activeVillainSprite !== null;
  const currentWork = targetSpriteType === 'PLAYER' ? heroWork : villainWork;
  
  // API Key Check on Mount
  useEffect(() => {
    const checkKey = async () => {
        if (window.aistudio) {
            const has = await window.aistudio.hasSelectedApiKey();
            setHasValidKey(has);
        } else {
            setHasValidKey(true); // Dev/Standalone fallback
        }
        setHasCheckedKey(true);
    };
    checkKey();
  }, []);

  const checkApiKeyError = useCallback(async (e: any) => {
    const msg = e?.toString() || e?.message || "";
    // Check for 404 or "Requested entity was not found" which indicates invalid project/key for Veo/Paid models
    if (msg.includes("Requested entity was not found") || msg.includes("404")) {
        setHasValidKey(false);
    }
  }, []);

  const setSpriteWork = (type: SpriteType, update: React.SetStateAction<WorkState>) => {
      if (type === 'PLAYER') setHeroWork(update);
      else setVillainWork(update);
  };

  const handleInteraction = () => {
      initAudio();
  };

  // Toggle theme class on body
  useEffect(() => {
      if (theme === 'LIGHT') {
          document.body.classList.add('light-mode');
      } else {
          document.body.classList.remove('light-mode');
      }
  }, [theme]);

  useEffect(() => {
      if (isGeneratingBattle) {
          const t = setInterval(() => setCurrentTip(c => (c + 1) % TIPS.length), 3000);
          return () => clearInterval(t);
      }
  }, [isGeneratingBattle]);


  const handleGenerateSprite = async (file: File, typeToGen: SpriteType) => {
    handleInteraction();
    if (!file.type.startsWith('image/')) {
       setGlobalStatus("ERROR: INVALID FILE TYPE.");
       return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        const base64DataStr = e.target?.result as string;
        const base64Data = base64DataStr.split(',')[1];
        const sourceImg: UploadedImage = {
            data: base64Data,
            mimeType: file.type,
            url: URL.createObjectURL(file),
        };

        setSpriteWork(typeToGen, prev => ({ ...prev, source: sourceImg, generated: null, status: 'PROCESSING_SPRITE', progressTick: 0 }));
        if (typeToGen === targetSpriteType) setGlobalStatus("INITIALIZING PROTOCOL...");

        const start = Date.now();
        const timer = setInterval(() => {
            setSpriteWork(typeToGen, prev => ({ ...prev, progressTick: Math.floor((Date.now() - start) / 1000) }));
        }, 1000);

        try {
            const result = await generateArcadeSprite(sourceImg.data, sourceImg.mimeType, typeToGen);
            setGlobalStatus("EXECUTING FLOOD-FILL BACKGROUND REMOVAL...");
            const rawUrl = `data:${result.mimeType};base64,${result.data}`;
            const processedUrl = await processSpriteImage(rawUrl);
            
            clearInterval(timer);
            
            setInsertFlash(true);
            setTimeout(() => setInsertFlash(false), 200);
            
            setBattleImageUrl(null);

            const newUrl = processedUrl;
            setSpriteLibrary(prev => [ ...prev, { id: Date.now().toString(), type: typeToGen, imageUrl: newUrl } ]);

            if (typeToGen === 'PLAYER') {
                setActivePlayerSprite(newUrl);
                setHeroWork(initialWorkState); 
                if (!activeVillainSprite) {
                    setTargetSpriteType('VILLAIN');
                    setGlobalStatus("HERO LOGGED TO DATABANK. NOW DIGITIZE VILLAIN.");
                } else {
                    setGlobalStatus("HERO UPDATED IN DATABANK.");
                }
            } else {
                setActiveVillainSprite(newUrl);
                setVillainWork(initialWorkState); 
                if (!activePlayerSprite) {
                    setTargetSpriteType('PLAYER');
                    setGlobalStatus("VILLAIN LOGGED TO DATABANK. NOW DIGITIZE HERO.");
                } else {
                    setGlobalStatus("VILLAIN UPDATED IN DATABANK.");
                }
            }
            
        } catch (error) {
            clearInterval(timer);
            console.error(error);
            checkApiKeyError(error);
            setSpriteWork(typeToGen, prev => ({ ...prev, status: 'ERROR' }));
            if (targetSpriteType === typeToGen) setGlobalStatus("ERROR: GENERATION FAILED. PLEASE RETRY.");
        }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleGenerateSprite(file, targetSpriteType);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleGenerateSprite(file, targetSpriteType);
  };

  const handleDiscard = () => {
      if (targetSpriteType === 'PLAYER' && heroWork.source?.url) URL.revokeObjectURL(heroWork.source.url);
      if (targetSpriteType === 'VILLAIN' && villainWork.source?.url) URL.revokeObjectURL(villainWork.source.url);
      
      setSpriteWork(targetSpriteType, initialWorkState);
      setGlobalStatus("AWAITING INPUT...");
  }

  const handleSelectFromLibrary = (sprite: GameSprite) => {
      handleInteraction();
      setInsertFlash(true);
      setTimeout(() => setInsertFlash(false), 200);
      setBattleImageUrl(null);

      if (sprite.type === 'PLAYER') {
          setActivePlayerSprite(sprite.imageUrl);
          setGlobalStatus("HERO LOADED FROM DATABANK.");
      } else {
          setActiveVillainSprite(sprite.imageUrl);
          setGlobalStatus("VILLAIN LOADED FROM DATABANK.");
      }
  };

  const extractBase64FromDataUrl = (url: string | null): string | null => {
      if (!url || !url.startsWith('data:')) return null;
      return url.split(',')[1];
  };

  const startGame = async (mode: '2D' | '3D') => {
      handleInteraction();
      if (!isSetupComplete) return;

      setIsGameLaunchRequested(true);
      setViewMode(mode);
      setIsPaused(false);
      
      if (mode === '2D') {
          setDifficulty('EASY');
          setVillainSpeedMod(0.9);
      } else {
          setDifficulty('HARD');
          setVillainSpeedMod(1.1);
      }

      if (battleImageUrl) return;

      if (isGeneratingBattle) {
          setGlobalStatus("FINISHING BATTLE SCENE...");
          return;
      }

      setIsGeneratingBattle(true);
      setGlobalStatus("GENERATING BATTLE SCENE...");
      
      try {
          const playerB64 = extractBase64FromDataUrl(activePlayerSprite);
          const villainB64 = extractBase64FromDataUrl(activeVillainSprite);
          
          if (playerB64 && villainB64) {
              const result = await generateBattleScene(playerB64, villainB64);
              setBattleImageUrl(`data:${result.mimeType};base64,${result.data}`);
          } else {
               throw new Error("Missing sprites for generation");
          }
      } catch (e) {
          console.error("Battle generation failed, falling back.", e);
          checkApiKeyError(e);
          setCountdown(5);
          setAppState('BATTLE_PREVIEW');
          setGlobalStatus("GET READY!");
      } finally {
          setIsGeneratingBattle(false);
      }
  };

  useEffect(() => {
      if (appState === 'SETUP' && isGameLaunchRequested && battleImageUrl) {
          setCountdown(5);
          setAppState('BATTLE_PREVIEW');
          setGlobalStatus("GET READY!");
      }
  }, [appState, isGameLaunchRequested, battleImageUrl]);


  useEffect(() => {
    const generateBackgroundBattle = async () => {
        if (isSetupComplete && !battleImageUrl && !isGeneratingBattle) {
             const playerB64 = extractBase64FromDataUrl(activePlayerSprite);
             const villainB64 = extractBase64FromDataUrl(activeVillainSprite);
             if (playerB64 && villainB64) {
                 setIsGeneratingBattle(true);
                 setGlobalStatus("BACKGROUND TASK: GENERATING BATTLE ASSETS...");
                 try {
                     const result = await generateBattleScene(playerB64, villainB64);
                     setBattleImageUrl(`data:${result.mimeType};base64,${result.data}`);
                     setGlobalStatus("BATTLE ASSETS READY. PRESS START.");
                 } catch (e) {
                     console.error("Background battle generation failed", e);
                     checkApiKeyError(e);
                 } finally {
                     setIsGeneratingBattle(false);
                 }
             }
        }
    };
    
    const t = setTimeout(generateBackgroundBattle, 500);
    return () => clearTimeout(t);
  }, [isSetupComplete, battleImageUrl, isGeneratingBattle, activePlayerSprite, activeVillainSprite, checkApiKeyError]);


  const handleStartMatch = useCallback(() => {
      handleInteraction();
      playGoSignal();
      setCurrentLevelIdx(0);
      setAppState('PLAYING');
      setIsPaused(false);
  }, []);

  useEffect(() => {
      if (appState === 'BATTLE_PREVIEW') {
          if (countdown > 0) {
              playCountdownBeep();
              const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
              return () => clearTimeout(timer);
          } else {
              handleStartMatch();
          }
      }
  }, [appState, countdown, handleStartMatch]);

  const handleLevelComplete = useCallback((stats: LevelStats) => {
      setLastLevelStats(stats);
      setAppState('RECAP');
  }, []);

  const handleGameOver = useCallback((stats: LevelStats) => {
      setLastLevelStats(stats);
      setAppState('RECAP');
  }, []);

  const handleNextLevel = useCallback(() => {
      handleInteraction();
      setCurrentLevelIdx(prev => {
          if (prev >= 2) {
               setAppState('VICTORY');
               return prev;
          }
          setAppState('PLAYING');
          setIsPaused(false);
          return prev + 1;
      });
  }, []);

  const handleRetryLevel = useCallback(() => {
      handleInteraction();
      setRetryKey(k => k + 1);
      setAppState('PLAYING');
      setIsPaused(false);
  }, []);

  const resetToTitle = useCallback(() => {
      handleInteraction();
      setAppState('SETUP');
      setCurrentLevelIdx(0);
      setBattleImageUrl(null);
      setIsGameLaunchRequested(false);
      setIsPaused(false);
  }, []);

  useEffect(() => {
    return () => {
      if (heroWork.source?.url) URL.revokeObjectURL(heroWork.source.url);
      if (villainWork.source?.url) URL.revokeObjectURL(villainWork.source.url);
    };
  }, [heroWork.source, villainWork.source]);

  const handleIntroImpact = useCallback(() => setUiVisible(true), []);
  const handleIntroComplete = useCallback(() => setShowIntro(false), []);

  let activeStatusMessage = globalStatus;
  if (currentWork.status === 'PROCESSING_SPRITE') {
      activeStatusMessage = `DIGITIZING ${targetSpriteType}... ${currentWork.progressTick}s`;
  } else if (isGeneratingBattle && appState === 'SETUP' && isSetupComplete) {
      activeStatusMessage = "FINALIZING BATTLE SCENE...";
  }

  const filteredLibrary = spriteLibrary.filter(s => s.type === targetSpriteType);

  // Theme specific classes
  const bgClass = theme === 'LIGHT' ? 'bg-[#e0e0e0] text-[#1a1a1a]' : 'bg-[#120a1a] text-[#d1f7ff]';
  const marqueeBorder = theme === 'LIGHT' ? 'border-gray-400 bg-gray-200 shadow-sm' : 'border-[#ff2a6d] bg-black shadow-[0_0_30px_rgba(255,42,109,0.4)]';
  const marqueeText = theme === 'LIGHT' ? 'text-gray-800' : 'text-[#f9c80e] retro-text-glow';
  const marqueeSpan = theme === 'LIGHT' ? 'text-cyan-600' : 'text-[#05d9e8]';
  
  const selectionBorder = (isSelected: boolean, color: string) => {
      if (theme === 'LIGHT') {
          return isSelected ? `border-${color}-500 shadow-lg bg-${color}-50` : 'border-gray-300 hover:bg-gray-100';
      }
      return isSelected ? `border-[#f9c80e] shadow-[0_0_15px_rgba(249,200,14,0.3)]` : 'border-[#333] hover:bg-[#333]/50';
  };

  // Initial Loading State for Key Check
  if (!hasCheckedKey) {
      return <div className={`h-full w-full ${bgClass}`}></div>;
  }

  // Gate: Insert Coin / Select Key
  if (!hasValidKey) {
      return (
          <ApiKeyGate 
              theme={theme} 
              onComplete={() => setHasValidKey(true)} 
              onToggleTheme={() => setTheme(t => t === 'DARK' ? 'LIGHT' : 'DARK')}
          />
      );
  }

  return (
    <div className={`relative h-dvh overflow-hidden font-vt323 transition-colors duration-300 ${bgClass}`} onClick={handleInteraction}>
      
      {/* Intro Overlay */}
      {showIntro && <IntroAnimation onImpact={handleIntroImpact} onComplete={handleIntroComplete} />}

      {/* MAIN APP CONTENT */}
      <div className={`relative z-0 flex flex-col h-full p-2 landscape:p-1 md:p-4 lg:landscape:p-4 transition-all duration-[2000ms] ease-[cubic-bezier(0.16,1,0.3,1)] origin-center ${uiVisible ? 'scale-100 opacity-100' : 'scale-0 opacity-0 blur-3xl'}`}>
        
        {/* Arcade Marquee */}
        <header className={`shrink-0 mb-2 md:mb-4 text-center border-b-4 md:border-b-8 border-double py-2 md:py-4 relative z-30 flex justify-between md:justify-center items-center px-4 gap-4 landscape:hidden lg:landscape:flex ${marqueeBorder}`}>
            <h1 className={`text-lg md:text-6xl tracking-tighter ${marqueeText}`}>
            ONE SHOT <span className={marqueeSpan}>ARCADE</span>
            </h1>
            
            {/* Theme Toggle */}
            <button 
                onClick={(e) => { e.stopPropagation(); setTheme(t => t === 'DARK' ? 'LIGHT' : 'DARK'); }}
                className={`md:absolute md:right-4 md:top-1/2 md:-translate-y-1/2 p-2 border-2 font-retro text-xs transition-all ${theme === 'LIGHT' ? 'bg-white border-gray-400 text-black hover:bg-gray-100' : 'bg-black border-[#05d9e8] text-[#05d9e8] hover:bg-[#05d9e8] hover:text-black'}`}
            >
                {theme === 'DARK' ? '☼ LIGHT' : '☾ DARK'}
            </button>
        </header>

        <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-2 md:gap-4 lg:gap-8 min-h-0">
            {/* LEFT: The Game Cabinet */}
            <div className={`flex flex-col order-2 lg:order-1 h-full min-h-0 relative col-span-1 lg:col-span-8`}>
            {insertFlash && (
                <div className="absolute inset-0 bg-white z-50 mix-blend-difference animate-ping opacity-50 pointer-events-none"></div>
            )}
            <CRTScreen title="GAME_CABINET_01" isActive={appState === 'PLAYING' || appState === 'BATTLE_PREVIEW'} className="h-full flex-1" theme={theme}>
                
                {/* MOBILE TOUCH CONTROLS */}
                {appState === 'PLAYING' && (
                    <TouchControls viewMode={viewMode} onToggleView={() => setViewMode(prev => prev === '2D' ? '3D' : '2D')} theme={theme} />
                )}

                {/* PAUSE BUTTON */}
                {appState === 'PLAYING' && (
                     <div className="absolute top-20 right-4 md:right-auto md:left-6 z-50 pointer-events-auto">
                        <button 
                            onClick={() => setIsPaused(true)}
                            className={`border-2 font-retro text-xs px-3 py-1 transition-all ${theme === 'LIGHT' ? 'bg-white border-red-500 text-red-600 hover:bg-red-100' : 'bg-black border-red-500 text-red-500 hover:bg-red-500 hover:text-black shadow-[0_0_10px_rgba(255,0,0,0.5)]'}`}
                        >
                            PAUSE
                        </button>
                    </div>
                )}

                {/* 3D TOGGLE OVERLAY (Desktop) */}
                {appState === 'PLAYING' && (
                    <div className="absolute top-4 right-4 z-50 pointer-events-auto hidden lg:block">
                        <button 
                            onClick={() => setViewMode(prev => prev === '2D' ? '3D' : '2D')}
                            className={`border-2 font-retro text-xs px-3 py-1 transition-all ${theme === 'LIGHT' ? 'bg-white border-yellow-500 text-yellow-600 hover:bg-yellow-100' : 'bg-black border-[#f9c80e] text-[#f9c80e] hover:bg-[#f9c80e] hover:text-black shadow-[0_0_10px_rgba(249,200,14,0.5)]'}`}
                        >
                            VIEW: {viewMode}
                        </button>
                    </div>
                )}

                <div className={`absolute top-4 left-4 right-4 z-0 transition-all duration-300 ${appState === 'PLAYING' ? 'bottom-64 lg:bottom-4' : 'bottom-4'}`}>
                    <GameCanvas
                        key={retryKey}
                        appState={appState}
                        playerSpriteUrl={activePlayerSprite}
                        villainSpriteUrl={activeVillainSprite}
                        difficulty={difficulty}
                        speedModifier={villainSpeedMod}
                        currentLevelIndex={currentLevelIdx}
                        viewMode={viewMode}
                        onLevelComplete={handleLevelComplete}
                        onGameOver={handleGameOver}
                        theme={theme}
                        isPaused={isPaused}
                    />
                </div>

                {/* --- OVERLAYS --- */}
                
                {/* PAUSE MENU OVERLAY */}
                {isPaused && appState === 'PLAYING' && (
                    <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-sm ${theme === 'LIGHT' ? 'bg-white/80' : 'bg-black/80'}`}>
                        <div className={`border-4 p-8 flex flex-col items-center gap-4 max-w-md w-full ${theme === 'LIGHT' ? 'bg-white border-gray-400 shadow-xl' : 'bg-black border-[#05d9e8] shadow-[0_0_30px_rgba(5,217,232,0.3)]'}`}>
                            <h2 className={`text-4xl font-retro mb-4 ${theme === 'LIGHT' ? 'text-gray-800' : 'text-[#f9c80e] retro-text-glow'}`}>GAME PAUSED</h2>
                            <RetroButton onClick={() => setIsPaused(false)} className="w-full">RESUME</RetroButton>
                            <RetroButton onClick={handleRetryLevel} variant="secondary" className="w-full">RESTART LEVEL</RetroButton>
                            <RetroButton onClick={resetToTitle} variant="secondary" className="w-full !border-red-500 !text-red-500 hover:!bg-red-500 hover:!text-black">QUIT TO TITLE</RetroButton>
                        </div>
                    </div>
                )}

                {appState === 'SETUP' && (
                    <div className={`absolute inset-0 z-10 h-full flex flex-col items-center justify-center font-retro p-4 md:p-8 overflow-y-auto backdrop-blur-[2px] ${theme === 'LIGHT' ? 'bg-white/80' : 'bg-black/90'}`}>
                        
                        {/* PRE-GAME TIPS & TRICKS */}
                        {isGameLaunchRequested && appState === 'SETUP' && (
                             <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center p-8 backdrop-blur-md ${theme === 'LIGHT' ? 'bg-white/95' : 'bg-black/95'}`}>
                                <div className="mb-8 text-center">
                                    <p className={`animate-pulse mb-2 text-xs tracking-widest opacity-70 ${theme === 'LIGHT' ? 'text-cyan-700' : 'text-[#05d9e8]'}`}>
                                        INITIALIZING GAME CARTRIDGE...
                                    </p>
                                    <div className={`w-32 h-1 mx-auto rounded-full overflow-hidden ${theme === 'LIGHT' ? 'bg-gray-300' : 'bg-[#333]'}`}>
                                        <div className={`h-full animate-[scanline_2s_linear_infinite] w-full origin-left scale-x-50 ${theme === 'LIGHT' ? 'bg-pink-500' : 'bg-[#ff2a6d]'}`}></div>
                                    </div>
                                </div>

                                <div className={`relative border-2 p-6 max-w-md w-full transform -rotate-1 ${theme === 'LIGHT' ? 'border-yellow-500 bg-gray-50 shadow-lg' : 'border-[#f9c80e] bg-[#120a1a] shadow-[0_0_20px_rgba(249,200,14,0.2)]'}`}>
                                    <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold px-2 py-1 border ${theme === 'LIGHT' ? 'bg-yellow-400 text-black border-white' : 'bg-[#f9c80e] text-black border-white'}`}>
                                        TIPS & TRICKS
                                    </div>
                                    <div className="min-h-[3rem] flex items-center justify-center text-center">
                                        <p className={`text-lg md:text-2xl leading-none animate-[pulse_0.5s_ease-in-out_1] ${theme === 'LIGHT' ? 'text-black' : 'text-white'}`}>
                                            "{TIPS[currentTip]}"
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <h2 className={`text-xl md:text-4xl mb-6 md:mb-8 tracking-widest text-center ${theme === 'LIGHT' ? 'text-cyan-700' : 'text-[#05d9e8] retro-text-glow'}`}>INITIALIZE CARTRIDGE</h2>

                        <div className="w-full max-w-md space-y-4 mb-6 md:mb-12">
                            {/* STEP 1: PLAYER */}
                            <div
                                className={`border-4 p-2 flex flex-col cursor-pointer transition-all ${selectionBorder(targetSpriteType === 'PLAYER', 'cyan')}`}
                                onClick={() => setTargetSpriteType('PLAYER')}
                            >
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-4">
                                        <span className={`text-2xl ${theme === 'LIGHT' ? 'text-yellow-600' : 'text-[#f9c80e]'}`}>01.</span>
                                        <div>
                                            <h3 className={`text-lg md:text-xl ${theme === 'LIGHT' ? 'text-cyan-800' : 'text-[#05d9e8]'}`}>CREATE HERO</h3>
                                            <p className={`text-xs ${theme === 'LIGHT' ? 'text-gray-500' : 'text-gray-500'}`}>
                                                    {heroWork.status === 'PROCESSING_SPRITE' ? 'DIGITIZING...' : (activePlayerSprite ? 'HERO READY' : 'UPLOAD PHOTO')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`w-16 h-16 md:w-20 md:h-20 border-2 flex items-center justify-center overflow-hidden relative shrink-0 ${theme === 'LIGHT' ? 'bg-white border-gray-300' : 'bg-black border-[#333]'}`}>
                                        {(activePlayerSprite || heroWork.source?.url) ? (
                                            <>
                                                {activePlayerSprite ? (
                                                    <SpritePreview src={activePlayerSprite} className="w-full h-full" alt="Hero Preview" />
                                                ) : (
                                                    <img src={heroWork.source?.url} className="w-full h-full object-cover opacity-90" alt="Processing..." />
                                                )}
                                                
                                                {/* DELETE BUTTON */}
                                                {activePlayerSprite && (
                                                    <button 
                                                        onClick={(e) => { 
                                                            e.stopPropagation(); 
                                                            setActivePlayerSprite(null); 
                                                            setHeroWork(initialWorkState); 
                                                            setBattleImageUrl(null);
                                                        }}
                                                        className="absolute top-0 right-0 bg-red-500 text-white w-5 h-5 flex items-center justify-center hover:bg-red-600 z-10"
                                                        title="Reset Hero"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>
                                                )}
                                            </>
                                        ) : (
                                            <span className={`text-[10px] text-center ${theme === 'LIGHT' ? 'text-gray-300' : 'text-[#333]'}`}>NO DATA</span>
                                        )}
                                        {heroWork.status === 'PROCESSING_SPRITE' && (
                                            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                                <div className="w-4 h-4 border-2 border-[#05d9e8] border-t-transparent animate-spin rounded-full"></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* MOBILE ACCORDION */}
                                <div className="lg:hidden">
                                    {targetSpriteType === 'PLAYER' && (
                                        <div className={`mt-4 pt-4 border-t animate-[dropPixel_0.3s_ease-out] ${theme === 'LIGHT' ? 'border-gray-300' : 'border-[#333]'}`}>
                                            <SpriteLabControls
                                                targetSpriteType='PLAYER'
                                                workState={heroWork}
                                                activeSprite={activePlayerSprite}
                                                library={filteredLibrary}
                                                onFileSelect={handleFileChange}
                                                onLibrarySelect={handleSelectFromLibrary}
                                                onDiscard={handleDiscard}
                                                isDragging={isDragging}
                                                dragHandlers={{ onDragOver: handleDragOver, onDragLeave: handleDragLeave, onDrop: handleDrop }}
                                                fileInputRef={fileInputRef}
                                                appState={appState}
                                                isSetupComplete={isSetupComplete}
                                                compact={true}
                                                theme={theme}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* STEP 2: VILLAIN */}
                            <div
                                className={`border-4 p-2 flex flex-col cursor-pointer transition-all ${selectionBorder(targetSpriteType === 'VILLAIN', 'pink')}`}
                                onClick={() => setTargetSpriteType('VILLAIN')}
                            >
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-4">
                                        <span className={`text-2xl ${theme === 'LIGHT' ? 'text-pink-600' : 'text-[#ff2a6d]'}`}>02.</span>
                                        <div>
                                            <h3 className={`text-lg md:text-xl ${theme === 'LIGHT' ? 'text-pink-800' : 'text-[#ff2a6d]'}`}>CREATE VILLAIN</h3>
                                                <p className={`text-xs ${theme === 'LIGHT' ? 'text-gray-500' : 'text-gray-500'}`}>
                                                    {villainWork.status === 'PROCESSING_SPRITE' ? 'DIGITIZING...' : (activeVillainSprite ? 'VILLAIN READY' : 'UPLOAD PHOTO')}
                                                </p>
                                        </div>
                                    </div>
                                    <div className={`w-16 h-16 md:w-20 md:h-20 border-2 flex items-center justify-center overflow-hidden relative shrink-0 ${theme === 'LIGHT' ? 'bg-white border-gray-300' : 'bg-black border-[#333]'}`}>
                                        {(activeVillainSprite || villainWork.source?.url) ? (
                                            <>
                                                {activeVillainSprite ? (
                                                    <SpritePreview src={activeVillainSprite} className="w-full h-full" alt="Villain Preview" />
                                                ) : (
                                                    <img src={villainWork.source?.url} className="w-full h-full object-cover opacity-90" alt="Processing..." />
                                                )}

                                                {/* DELETE BUTTON */}
                                                {activeVillainSprite && (
                                                    <button 
                                                        onClick={(e) => { 
                                                            e.stopPropagation(); 
                                                            setActiveVillainSprite(null); 
                                                            setVillainWork(initialWorkState); 
                                                            setBattleImageUrl(null);
                                                        }}
                                                        className="absolute top-0 right-0 bg-red-500 text-white w-5 h-5 flex items-center justify-center hover:bg-red-600 z-10"
                                                        title="Reset Villain"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>
                                                )}
                                            </>
                                        ) : (
                                            <span className={`text-[10px] text-center ${theme === 'LIGHT' ? 'text-gray-300' : 'text-[#333]'}`}>NO DATA</span>
                                        )}
                                        {villainWork.status === 'PROCESSING_SPRITE' && (
                                            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                                <div className="w-4 h-4 border-2 border-[#ff2a6d] border-t-transparent animate-spin rounded-full"></div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* MOBILE ACCORDION */}
                                <div className="lg:hidden">
                                    {targetSpriteType === 'VILLAIN' && (
                                        <div className={`mt-4 pt-4 border-t animate-[dropPixel_0.3s_ease-out] ${theme === 'LIGHT' ? 'border-gray-300' : 'border-[#333]'}`}>
                                            <SpriteLabControls
                                                targetSpriteType='VILLAIN'
                                                workState={villainWork}
                                                activeSprite={activeVillainSprite}
                                                library={filteredLibrary}
                                                onFileSelect={handleFileChange}
                                                onLibrarySelect={handleSelectFromLibrary}
                                                onDiscard={handleDiscard}
                                                isDragging={isDragging}
                                                dragHandlers={{ onDragOver: handleDragOver, onDragLeave: handleDragLeave, onDrop: handleDrop }}
                                                fileInputRef={fileInputRef}
                                                appState={appState}
                                                isSetupComplete={isSetupComplete}
                                                compact={true}
                                                theme={theme}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                            
                        <div className="flex flex-row gap-2 md:gap-4 w-full justify-center shrink-0">
                            <RetroButton onClick={() => startGame('2D')} disabled={!isSetupComplete} className={`flex-1 text-lg md:text-xl py-4 md:py-6 ${isSetupComplete ? 'animate-pulse' : 'opacity-50 grayscale'}`} variant={isSetupComplete ? 'primary' : 'secondary'} isLoading={isGeneratingBattle && !battleImageUrl && isGameLaunchRequested}>START 2D</RetroButton>
                            <RetroButton onClick={() => startGame('3D')} disabled={!isSetupComplete} className={`flex-1 text-lg md:text-xl py-4 md:py-6 ${isSetupComplete ? 'animate-pulse' : 'opacity-50 grayscale'}`} variant={isSetupComplete ? 'accent' : 'secondary'} isLoading={isGeneratingBattle && !battleImageUrl && isGameLaunchRequested}>START 3D</RetroButton>
                        </div>
                        {!isSetupComplete && (
                                <p className={`text-xs mt-4 animate-pulse text-center ${theme === 'LIGHT' ? 'text-yellow-600' : 'text-[#f9c80e]'}`}>CREATE BOTH HERO & VILLAIN TO START</p>
                        )}
                    </div>
                )}

                {appState === 'BATTLE_PREVIEW' && (
                    <div className="absolute inset-0 z-20 bg-black flex flex-col items-center justify-center overflow-hidden">
                        {battleImageUrl ? (
                            <>
                                <div className="absolute inset-0 opacity-50 blur-2xl scale-125">
                                    <img src={battleImageUrl} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div className="absolute inset-0 z-10 flex items-center justify-center p-1 md:p-4">
                                    <img src={battleImageUrl} alt="Battle Scene" className="w-auto h-auto max-w-full max-h-full object-contain drop-shadow-[0_0_30px_rgba(0,0,0,0.9)]" />
                                </div>
                            </>
                        ) : (
                           /* FALLBACK VS SCREEN IF AI GENERATION FAILS */
                           <div className="absolute inset-0 flex">
                                {/* HERO SIDE */}
                                <div className="flex-1 bg-gradient-to-br from-[#05d9e8]/20 to-transparent flex items-center justify-center relative overflow-hidden border-r-4 border-[#f9c80e]">
                                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(5,217,232,0.1)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px]"></div>
                                    {activePlayerSprite && (
                                        <div className="relative w-3/4 h-3/4 flex items-center justify-center">
                                            <div className="absolute inset-0 bg-[#05d9e8] blur-3xl opacity-20"></div>
                                            <img src={activePlayerSprite} className="w-full h-full object-contain drop-shadow-[0_0_10px_#05d9e8] scale-x-[-1]" alt="Hero" />
                                        </div>
                                    )}
                                </div>
                                {/* VILLAIN SIDE */}
                                <div className="flex-1 bg-gradient-to-bl from-[#ff2a6d]/20 to-transparent flex items-center justify-center relative overflow-hidden border-l-4 border-[#f9c80e]">
                                    <div className="absolute inset-0 bg-[linear-gradient(-45deg,transparent_25%,rgba(255,42,109,0.1)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px]"></div>
                                     {activeVillainSprite && (
                                        <div className="relative w-3/4 h-3/4 flex items-center justify-center">
                                            <div className="absolute inset-0 bg-[#ff2a6d] blur-3xl opacity-20"></div>
                                            <img src={activeVillainSprite} className="w-full h-full object-contain drop-shadow-[0_0_10px_#ff2a6d]" alt="Villain" />
                                        </div>
                                     )}
                                </div>
                           </div>
                        )}

                        {/* OVERLAY TEXT AND COUNTDOWN (ALWAYS VISIBLE) */}
                        <div className="absolute inset-0 z-20 bg-gradient-to-b from-black/80 via-transparent to-black/80 pointer-events-none"></div>
                        <div className="relative z-30 flex flex-col items-center justify-between h-full w-full py-6 md:py-10 font-retro pointer-events-none">
                            <h2 className="text-5xl md:text-8xl text-[#ff2a6d] retro-text-glow italic tracking-tighter skew-x-[-10deg] drop-shadow-[0_4px_0_#000] z-40">VERSUS</h2>
                            <div className="pointer-events-auto z-40">
                                {countdown > 0 ? (
                                    <div className="text-7xl md:text-9xl text-[#f9c80e] drop-shadow-[0_0_50px_rgba(249,200,14,0.8)] animate-bounce">{countdown}</div>
                                ) : (
                                    <div className="text-7xl md:text-9xl text-[#f9c80e] drop-shadow-[0_0_50px_rgba(5,217,232,0.6)] animate-pulse">GO!</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {appState === 'RECAP' && lastLevelStats && (
                    <LevelRecap
                        stats={lastLevelStats}
                        onNextLevel={lastLevelStats.isWin && currentLevelIdx < 2 ? handleNextLevel : resetToTitle}
                        onRetry={handleRetryLevel}
                        onHome={resetToTitle}
                        isFinalLevel={currentLevelIdx >= 2}
                        playerSpriteUrl={activePlayerSprite}
                        villainSpriteUrl={activeVillainSprite}
                        theme={theme}
                        onAuthError={checkApiKeyError}
                    />
                )}

                {appState === 'VICTORY' && (
                    <div className={`absolute inset-0 z-10 h-full flex flex-col items-center justify-center font-retro text-center ${theme === 'LIGHT' ? 'bg-white/95 text-black' : 'bg-black/90 text-white'}`}>
                        <h2 className={`text-4xl md:text-6xl mb-8 animate-bounce ${theme === 'LIGHT' ? 'text-yellow-600' : 'text-[#f9c80e]'}`}>ALL LEVELS CLEARED!</h2>
                        <p className={`text-xl mb-4 ${theme === 'LIGHT' ? 'text-cyan-700' : 'text-[#05d9e8]'}`}>YOU ARE THE ARCADE MASTER</p>
                        <p className="text-gray-500 mb-12">THANKS FOR PLAYING</p>
                        <RetroButton onClick={resetToTitle} variant="accent">PLAY AGAIN</RetroButton>
                    </div>
                )}
            </CRTScreen>
            </div>

            {/* RIGHT: Sprite Lab & Config (DESKTOP SIDEBAR ONLY) */}
            <div className={`flex-col gap-2 md:gap-4 order-1 lg:order-2 h-[40vh] lg:h-full min-h-0 lg:col-span-4 hidden lg:flex`}>
            {appState === 'SETUP' ? (
                <CRTScreen
                    title={`SPRITE_LAB // ${targetSpriteType === 'PLAYER' ? 'HERO_MODE' : 'VILLAIN_MODE'}`}
                    isActive={(heroWork.status === 'PROCESSING_SPRITE' || villainWork.status === 'PROCESSING_SPRITE') || isGeneratingBattle}
                    className="h-full flex flex-col"
                    theme={theme}
                >
                    {/* Status ticker */}
                    <div className={`border p-2 mb-2 md:mb-4 font-mono text-xs h-8 md:h-12 overflow-hidden leading-tight shrink-0 flex items-center ${theme === 'LIGHT' ? 'bg-gray-100 border-gray-400 text-cyan-800' : 'bg-black border-[#333] text-[#05d9e8]'}`}>
                    <span className={`mr-2 ${theme === 'LIGHT' ? 'text-pink-600' : 'text-[#ff2a6d]'}`}>{">"}</span> <span className={`truncate ${currentWork.status === 'PROCESSING_SPRITE' || isGeneratingBattle ? 'animate-pulse text-[#f9c80e]' : ''}`}>{activeStatusMessage}</span>
                    </div>

                    {/* Reused Controls Component */}
                    <div className="flex-1 min-h-0">
                        <SpriteLabControls
                            targetSpriteType={targetSpriteType}
                            workState={currentWork}
                            activeSprite={targetSpriteType === 'PLAYER' ? activePlayerSprite : activeVillainSprite}
                            library={filteredLibrary}
                            onFileSelect={handleFileChange}
                            onLibrarySelect={handleSelectFromLibrary}
                            onDiscard={handleDiscard}
                            isDragging={isDragging}
                            dragHandlers={{ onDragOver: handleDragOver, onDragLeave: handleDragLeave, onDrop: handleDrop }}
                            fileInputRef={fileInputRef}
                            appState={appState}
                            isSetupComplete={isSetupComplete}
                            theme={theme}
                        />
                    </div>

                    {/* SPRITE TYPE TOGGLE */}
                    <div className={`mt-auto flex flex-col gap-2 md:gap-3 shrink-0 pt-2 border-t ${theme === 'LIGHT' ? 'border-gray-300' : 'border-[#333]'} ${appState !== 'SETUP' ? 'pointer-events-none opacity-50' : ''}`}>
                        <div className="flex gap-2" aria-label="Sprite Mode Selection">
                            <button onClick={() => setTargetSpriteType('PLAYER')} className={`flex-1 py-2 font-retro text-[10px] md:text-xs border-2 relative overflow-hidden ${targetSpriteType === 'PLAYER' ? (theme === 'LIGHT' ? 'bg-cyan-100 text-cyan-900 border-cyan-600' : 'bg-[#05d9e8] text-black border-[#05d9e8]') : (theme === 'LIGHT' ? 'text-cyan-600 border-gray-300 hover:border-cyan-300' : 'text-[#05d9e8] border-[#333] hover:border-[#05d9e8]/50')}`}>
                                HERO MODE
                                {heroWork.status === 'PROCESSING_SPRITE' && targetSpriteType !== 'PLAYER' && (
                                    <div className="absolute top-1 right-1 w-2 h-2 bg-[#f9c80e] rounded-full animate-ping"></div>
                                )}
                            </button>
                            <button onClick={() => setTargetSpriteType('VILLAIN')} className={`flex-1 py-2 font-retro text-[10px] md:text-xs border-2 relative overflow-hidden ${targetSpriteType === 'VILLAIN' ? (theme === 'LIGHT' ? 'bg-pink-100 text-pink-900 border-pink-600' : 'bg-[#ff2a6d] text-black border-[#ff2a6d]') : (theme === 'LIGHT' ? 'text-pink-600 border-gray-300 hover:border-pink-300' : 'text-[#ff2a6d] border-[#333] hover:border-[#ff2a6d]/50')}`}>
                                VILLAIN MODE
                                {villainWork.status === 'PROCESSING_SPRITE' && targetSpriteType !== 'VILLAIN' && (
                                    <div className="absolute top-1 right-1 w-2 h-2 bg-[#f9c80e] rounded-full animate-ping"></div>
                                )}
                            </button>
                        </div>
                    </div>
                </CRTScreen>
            ) : (
                <CRTScreen title="MANUAL_OVERRIDE" isActive={true} className="h-full hidden lg:flex" theme={theme}>
                    <div className="flex flex-col items-center justify-center h-full p-6 gap-8">
                        <div className="flex flex-col items-center gap-2">
                            <div className={`w-14 h-14 border-4 flex items-center justify-center rounded font-bold text-2xl ${theme === 'LIGHT' ? 'border-cyan-600 text-cyan-700 bg-white' : 'border-[#05d9e8] text-[#05d9e8] shadow-[0_0_10px_rgba(5,217,232,0.2)]'}`}>▲</div>
                            <div className="flex gap-2">
                                <div className={`w-14 h-14 border-4 flex items-center justify-center rounded font-bold text-2xl ${theme === 'LIGHT' ? 'border-cyan-600 text-cyan-700 bg-white' : 'border-[#05d9e8] text-[#05d9e8] shadow-[0_0_10px_rgba(5,217,232,0.2)]'}`}>◀</div>
                                {viewMode === '2D' && (
                                    <div className={`w-14 h-14 border-4 flex items-center justify-center rounded font-bold text-2xl opacity-50 border-dashed ${theme === 'LIGHT' ? 'border-gray-400 text-gray-400' : 'border-gray-600 text-gray-600'}`}>▼</div>
                                )}
                                <div className={`w-14 h-14 border-4 flex items-center justify-center rounded font-bold text-2xl ${theme === 'LIGHT' ? 'border-cyan-600 text-cyan-700 bg-white' : 'border-[#05d9e8] text-[#05d9e8] shadow-[0_0_10px_rgba(5,217,232,0.2)]'}`}>▶</div>
                            </div>
                        </div>
                        
                        <div className="text-center space-y-2 font-retro">
                            <h3 className={`text-xl tracking-widest border-b-2 pb-1 mb-3 inline-block ${theme === 'LIGHT' ? 'text-yellow-700 border-yellow-500' : 'text-[#f9c80e] border-[#f9c80e]'}`}>
                                {viewMode === '2D' ? 'STANDARD CONTROL' : '3D CONTROL'}
                            </h3>
                            <div className={`text-sm space-y-1 ${theme === 'LIGHT' ? 'text-gray-800' : 'text-[#d1f7ff]'}`}>
                                {viewMode === '2D' ? (
                                    <>
                                        <p>MOVE UP / DOWN / LEFT / RIGHT</p>
                                        <p className="text-gray-500 text-xs mt-2">OBJECTIVE: CLEAR ALL DOTS</p>
                                    </>
                                ) : (
                                    <>
                                         <p>UP: MOVE FORWARD</p>
                                         <p>LEFT/RIGHT: ROTATE CAMERA</p>
                                         <p className="text-gray-500 text-xs mt-2">PERSPECTIVE: FIRST PERSON</p>
                                    </>
                                )}
                            </div>
                        </div>
                        
                        <div className={`mt-4 p-4 border-2 text-xs text-center animate-pulse ${theme === 'LIGHT' ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-[#ff2a6d] bg-[#ff2a6d]/10 text-[#ff2a6d]'}`}>
                            AVOID THE VILLAINS
                        </div>
                    </div>
                </CRTScreen>
            )}
            </div>
        </main>
      </div>
    </div>
  );
};

export default App;
