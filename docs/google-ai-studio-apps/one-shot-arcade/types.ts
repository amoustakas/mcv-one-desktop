/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export interface UploadedImage {
  data: string; // Base64
  mimeType: string;
  url: string; // For display
}

export type ProcessingState = 'IDLE' | 'PROCESSING_SPRITE' | 'COMPLETE' | 'ERROR';

export type SpriteType = 'PLAYER' | 'VILLAIN';

export type Difficulty = 'EASY' | 'NORMAL' | 'HARD';

export interface GameSprite {
  id: string;
  type: SpriteType;
  imageUrl: string;
}

export interface LevelStats {
  levelNumber: number;
  isWin: boolean;
  score: number;
  timeElapsed: number; // seconds
  stepsTaken: number;
  totalTiles: number;
  uniqueTilesVisited: number;
  dotsCollected: number;
  totalDots: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
}

// Augment window for Veo key selection if needed in specific environments
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}