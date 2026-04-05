/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI, Modality } from "@google/genai";

// Ensure API key is present
if (!process.env.API_KEY) {
  console.error("Missing API_KEY environment variable.");
}

const createAIClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a retro arcade sprite from a source image.
 */
export async function generateArcadeSprite(
  imageBase64: string,
  mimeType: string,
  spriteType: 'PLAYER' | 'VILLAIN'
): Promise<{ data: string; mimeType: string }> {
  const ai = createAIClient();

  // RIFTRUNNER UPDATE: 
  // Switched to SOLID WHITE background. 
  // This allows the BFS Flood-Fill digitizer to detect the "sheet" of the background 
  // and remove it perfectly up to the black outline.
  // Added "NO BORDERS, NO FRAMES" to prevent card-like generations.
  const promptStr = spriteType === 'PLAYER'
    ? "Generate a single 8-bit pixel art sprite of this character in a neutral ready stance (side view). Full body visible. Legs must be clearly defined. Centered on a solid WHITE (#FFFFFF) background. High contrast. Thick black pixel-art outlines. No shadows. No borders. No frames. No vignette. Do not generate a run pose. Do not generate multiple frames."
    : "Generate a single 8-bit pixel art sprite of this villain in a floating, menacing pose (front/side view). The character should look like a retro arcade villain. Full body visible. Centered on a solid WHITE (#FFFFFF) background. High contrast. Thick black pixel-art outlines. No borders. No frames. Do not generate multiple frames.";

  let lastError;
  // Retry loop to handle potential model refusals or "empty" responses
  for (let i = 0; i < 3; i++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: [
            {
              inlineData: {
                data: imageBase64,
                mimeType: mimeType,
              },
            },
            {
              text: promptStr,
            },
          ],
        },
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });

      const part = response.candidates?.[0]?.content?.parts?.[0];
      if (part && part.inlineData && part.inlineData.data) {
        return {
          data: part.inlineData.data,
          mimeType: part.inlineData.mimeType || 'image/png',
        };
      }
    } catch (e) {
      console.warn(`Sprite generation attempt ${i + 1} failed:`, e);
      lastError = e;
      // Short delay before retry
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  throw lastError || new Error("Failed to generate sprite after multiple attempts.");
}

/**
 * Generates a comic-style battle scene featuring both sprites.
 */
export async function generateBattleScene(
    heroImageB64: string,
    villainImageB64: string
  ): Promise<{ data: string; mimeType: string }> {
    const ai = createAIClient();
  
    const promptStr = `Create a dramatic, vibrant, 80s retro comic book cover style illustration titled 'VERSUS'. 
    Image 1 is the HERO (draw on left). Image 2 is the VILLAIN (draw on right). 
    
    CRITICAL INSTRUCTIONS: 
    1. IDENTITY TRANSFER: You MUST use Image 1 and Image 2 as strict visual references. Transfer the character design, colors, and key features of the 8-bit sprites into this high-fidelity comic book style.
    2. COMPOSITION: Combine these two distinct character inputs into a single, cohesive battle composition.
    3. LOCATION: Analyze the clothing and 'vibe' of both characters to determine the BATTLE LOCATION (e.g., suits -> office, sporty -> stadium). Draw a detailed background based on this.
    4. BANTER: The HERO (left) MUST have a comic speech bubble. The text inside MUST be a SHORT, WITTY, COCKY TAUNT.
    
    Use heavy black ink outlines, halftones, and bold vintage colors.`;
  
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: [
            { inlineData: { data: heroImageB64, mimeType: 'image/png' } },
            { inlineData: { data: villainImageB64, mimeType: 'image/png' } },
            { text: promptStr },
          ],
        },
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });
    
      const part = response.candidates?.[0]?.content?.parts?.[0];
      if (part && part.inlineData && part.inlineData.data) {
        return {
          data: part.inlineData.data,
          mimeType: part.inlineData.mimeType || 'image/png',
        };
      }
    } catch (e) {
       console.error("Battle scene generation failed", e);
       throw e;
    }
}

/**
 * Generates a level recap infographic.
 */
export async function generateLevelRecap(
    stats: any, // Using any to avoid circular dependency with types.ts if strictly imported
    heroImageB64: string | null,
    villainImageB64: string | null
  ): Promise<{ data: string; mimeType: string }> {
    const ai = createAIClient();
  
    const parts: any[] = [];
    if (heroImageB64) parts.push({ inlineData: { data: heroImageB64, mimeType: 'image/png' } });
    if (villainImageB64) parts.push({ inlineData: { data: villainImageB64, mimeType: 'image/png' } });

    const status = stats.isWin ? "VICTORY" : "GAME OVER";
    const promptStr = `Create a retro pixel-art 'End of Level' screen or poster.
    Title: "${status}"
    Score: ${stats.score} Points.
    Grade: ${stats.grade}.
    
    Visual Style: 8-bit Arcade Interface. Dark background with neon grid lines.
    
    REFERENCE HANDLING:
    - Use the provided images as strict references for the characters in the poster.
    - If VICTORY: Show the Hero (Image 1) looking triumphant/cool.
    - If GAME OVER: Show the Hero (Image 1) looking defeated or glitching out, and the Villain (Image 2) laughing.
    
    Include the text "${status}" in big arcade font at the top.`;

    parts.push({ text: promptStr });
  
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: parts,
        },
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });
    
      const part = response.candidates?.[0]?.content?.parts?.[0];
      if (part && part.inlineData && part.inlineData.data) {
        return {
          data: part.inlineData.data,
          mimeType: part.inlineData.mimeType || 'image/png',
        };
      }
    } catch (e) {
       console.error("Recap generation failed", e);
       throw e;
    }
}