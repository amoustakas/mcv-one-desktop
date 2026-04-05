/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useState } from 'react';
import { LevelStats } from '../types';
import RetroButton from './RetroButton';
import { generateLevelRecap } from '../services/gemini';

interface LevelRecapProps {
  stats: LevelStats;
  onNextLevel: () => void;
  onRetry?: () => void;
  onHome?: () => void;
  isFinalLevel: boolean;
  playerSpriteUrl: string | null;
  villainSpriteUrl: string | null;
  theme?: 'DARK' | 'LIGHT';
  onAuthError?: (error: any) => void;
}

const LevelRecap: React.FC<LevelRecapProps> = ({ stats, onNextLevel, onRetry, onHome, isFinalLevel, playerSpriteUrl, villainSpriteUrl, theme = 'DARK', onAuthError }) => {
  const [recapImageUrl, setRecapImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const generate = async () => {
        setIsLoading(true);
        try {
            const playerB64 = playerSpriteUrl?.startsWith('data:') ? playerSpriteUrl.split(',')[1] : null;
            const villainB64 = villainSpriteUrl?.startsWith('data:') ? villainSpriteUrl.split(',')[1] : null;
            
            const result = await generateLevelRecap(stats, playerB64, villainB64);
            if (isMounted) {
                setRecapImageUrl(`data:${result.mimeType};base64,${result.data}`);
                setIsLoading(false);
            }
        } catch (e: any) {
            console.error("Failed to generate recap image:", e);
            if (onAuthError) onAuthError(e);
            
            if (isMounted) {
                if (e?.message?.includes('429') || e?.status === 429 || e?.toString().includes('429')) {
                    setError(null);
                } else {
                    setError("COMMUNICATION ERROR. UNABLE TO GENERATE VISUAL DEBRIEF.");
                }
                setIsLoading(false);
            }
        }
    };
    generate();
    return () => { isMounted = false; };
  }, [stats, playerSpriteUrl, villainSpriteUrl, onAuthError]);

  const winColor = theme === 'LIGHT' ? 'border-cyan-500' : 'border-[#05d9e8]';
  const loseColor = theme === 'LIGHT' ? 'border-red-500' : 'border-[#ff0000]';
  const borderColor = stats.isWin ? winColor : loseColor;
  
  const glowColor = theme === 'LIGHT' 
      ? (stats.isWin ? 'shadow-xl' : 'shadow-xl')
      : (stats.isWin ? 'shadow-[0_0_30px_rgba(5,217,232,0.3)]' : 'shadow-[0_0_30px_rgba(255,0,0,0.3)]');

  const headerColor = stats.isWin 
      ? (theme === 'LIGHT' ? 'text-yellow-600' : 'text-[#f9c80e]')
      : (theme === 'LIGHT' ? 'text-red-600' : 'text-[#ff0000]');

  const bgClass = theme === 'LIGHT' ? 'bg-gray-100 text-gray-900' : 'bg-[#0a0a12] text-[#d1f7ff]';
  const overlayBg = theme === 'LIGHT' ? 'bg-white/90' : 'bg-black/90';
  const panelBg = theme === 'LIGHT' ? 'bg-white border-gray-300' : 'bg-black border-[#333]';
  const subHeaderColor = theme === 'LIGHT' ? 'text-cyan-700 border-gray-300' : 'text-[#05d9e8] border-[#333]';

  // Calculate derived metrics
  const efficiency = Math.round((stats.uniqueTilesVisited / Math.max(1, stats.stepsTaken)) * 100);
  
  return (
    <div className={`absolute inset-0 h-full w-full flex flex-col items-center justify-center p-2 md:p-8 font-retro overflow-y-auto backdrop-blur-sm z-50 ${overlayBg}`}>
      <div className={`max-w-5xl w-full border-4 ${borderColor} p-4 md:p-6 relative ${bgClass} ${glowColor} flex flex-col my-auto shrink-0`}>
        
        {/* Header */}
        <div className={`text-center border-b-4 pb-2 mb-4 shrink-0 ${stats.isWin ? (theme === 'LIGHT' ? 'border-pink-500' : 'border-[#ff2a6d]') : (theme === 'LIGHT' ? 'border-red-500' : 'border-[#ff0000]')}`}>
          <h2 className={`text-2xl md:text-4xl mb-1 ${headerColor} tracking-widest retro-text-glow`}>
              {stats.isWin ? `MISSION DEBRIEF` : 'MISSION TERMINATED'}
          </h2>
        </div>

        {/* Split Content Area */}
        <div className="flex-1 w-full flex flex-col landscape:flex-row lg:flex-row gap-4 mb-4 min-h-0">
            
            {/* LEFT: AI Graphic */}
            <div className={`flex-[2] flex items-center justify-center relative overflow-hidden border-2 p-2 min-h-[200px] landscape:min-h-0 landscape:h-auto lg:min-h-0 aspect-video landscape:aspect-auto lg:aspect-auto ${theme === 'LIGHT' ? 'bg-gray-200 border-gray-400' : 'bg-black border-[#333]'}`}>
                {isLoading && (
                    <div className={`absolute inset-0 flex flex-col items-center justify-center z-10 p-4 ${theme === 'LIGHT' ? 'bg-white/90' : 'bg-black/90'}`}>
                        <div className="text-center">
                            <p className={`animate-pulse mb-2 text-xs tracking-widest opacity-70 ${theme === 'LIGHT' ? 'text-cyan-700' : 'text-[#05d9e8]'}`}>
                                PROCESSING VISUALS...
                            </p>
                            <div className={`w-32 h-1 mx-auto rounded-full overflow-hidden ${theme === 'LIGHT' ? 'bg-gray-300' : 'bg-[#333]'}`}>
                                <div className={`h-full animate-[scanline_2s_linear_infinite] w-full origin-left scale-x-50 ${theme === 'LIGHT' ? 'bg-pink-500' : 'bg-[#ff2a6d]'}`}></div>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="flex flex-col items-center text-center p-4">
                        <p className="text-[#ff0000] mb-4">{error}</p>
                        <p className="text-gray-500 text-xs">VISUAL DATA CORRUPTED</p>
                    </div>
                )}

                {!isLoading && !recapImageUrl && !error && (
                    <div className="flex flex-col items-center justify-center h-full w-full opacity-50">
                         <div className="text-6xl mb-4 grayscale">👾</div>
                         <p className="text-xs text-gray-500">NO SIGNAL</p>
                    </div>
                )}

                {recapImageUrl && !isLoading && (
                    <img src={recapImageUrl} alt="Mission Recap Infographic" className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]" />
                )}
            </div>

            {/* RIGHT: Data Log */}
            <div className={`flex-1 border-2 p-3 font-vt323 flex flex-col overflow-y-auto max-h-[200px] landscape:max-h-[60vh] lg:max-h-none ${panelBg}`}>
                <h3 className={`border-b-2 mb-2 pb-1 tracking-widest text-lg sticky top-0 ${subHeaderColor} ${theme === 'LIGHT' ? 'bg-white' : 'bg-black/90'}`}>
                    MISSION_LOG.DAT
                </h3>
                <div className="space-y-1 md:space-y-2 text-sm md:text-lg">
                    <div className="flex justify-between">
                        <span className="text-gray-500">STATUS:</span>
                        <span className={stats.isWin ? (theme === 'LIGHT' ? "text-cyan-600" : "text-[#05d9e8]") : "text-[#ff0000]"}>{stats.isWin ? "COMPLETE" : "FAILED"}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">SCORE:</span>
                        <span className={theme === 'LIGHT' ? 'text-yellow-600' : 'text-[#f9c80e]'}>{stats.score}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">TIME:</span>
                        <span>{stats.timeElapsed.toFixed(1)}s</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">STEPS:</span>
                        <span>{stats.stepsTaken}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">EFFICIENCY:</span>
                        <span>{efficiency}%</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">DOTS:</span>
                        <span>{stats.dotsCollected}/{stats.totalDots}</span>
                    </div>
                    <div className={`flex justify-between border-t pt-2 mt-2 ${theme === 'LIGHT' ? 'border-gray-300' : 'border-[#333]'}`}>
                        <span className="text-gray-500">GRADE:</span>
                        <span className={`text-xl md:text-2xl ${stats.grade === 'S' || stats.grade === 'A' ? (theme === 'LIGHT' ? 'text-yellow-600' : 'text-[#f9c80e]') : (theme === 'LIGHT' ? 'text-black' : 'text-white')}`}>{stats.grade}</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Footer Controls */}
        <div className={`shrink-0 flex flex-row gap-2 md:gap-4 justify-center border-t-4 pt-4 flex-wrap ${theme === 'LIGHT' ? 'border-gray-300' : 'border-[#333]'}`}>
            {!stats.isWin && onRetry && (
                 <RetroButton onClick={onRetry} variant="secondary" className="flex-1 md:flex-none min-w-[120px]">RETRY LEVEL</RetroButton>
            )}
            {!stats.isWin && onHome && (
                 <RetroButton onClick={onHome} variant="primary" className="flex-1 md:flex-none min-w-[120px]">HOME SCREEN</RetroButton>
            )}
            
            {stats.isWin && (
                 <RetroButton onClick={onNextLevel} variant="accent" className="w-full md:w-auto px-8 animate-pulse">
                    {isFinalLevel ? 'FINISH GAME' : 'NEXT LEVEL >>'}
                 </RetroButton>
            )}
             {!stats.isWin && !onRetry && !onHome && (
                 <RetroButton onClick={onNextLevel} variant="primary" className="w-full md:w-auto px-8">RETURN TO TITLE</RetroButton>
            )}
        </div>

      </div>
    </div>
  );
};

export default LevelRecap;