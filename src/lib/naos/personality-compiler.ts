import type { PersonalityMatrix, EmotionalState } from '../../stores/naos';

// ---------------------------------------------------------------------------
// NAOS Personality → System Prompt Compiler
// Converts agent personality data (tone, axes, traits, emotional state)
// into actionable system prompts for both text chat and voice sessions.
// This is what makes each NAOS agent feel distinct and alive.
// ---------------------------------------------------------------------------

/**
 * Compile a PersonalityMatrix into a system prompt fragment.
 * Used by both AegisChat and Voice Studio to configure agent behavior.
 */
export function compilePersonalityPrompt(
  personality: PersonalityMatrix,
  emotional?: EmotionalState,
  context?: { ventureId?: string; viewId?: string },
): string {
  const lines: string[] = [];

  // Tone
  const toneMap: Record<string, string> = {
    professional: 'Maintain a professional, business-appropriate tone.',
    casual: 'Use a relaxed, conversational tone. Be approachable.',
    technical: 'Use precise technical language. Be thorough with details.',
    creative: 'Be imaginative and expressive. Use vivid language.',
    executive: 'Be concise and strategic. Focus on decisions and outcomes.',
  };
  lines.push(toneMap[personality.tone] || toneMap.professional);

  // Verbosity
  const verbosityMap: Record<string, string> = {
    concise: 'Keep responses extremely brief — 1-2 sentences when possible.',
    balanced: 'Provide clear, moderately detailed responses.',
    detailed: 'Give thorough, comprehensive responses with context.',
    verbose: 'Be expansive and educational. Explain reasoning fully.',
  };
  lines.push(verbosityMap[personality.verbosity] || verbosityMap.balanced);

  // Personality axes
  const axes = personality.axes;

  if (axes.analytical > 70) {
    lines.push('Approach problems analytically. Use data, logic, and structured reasoning.');
  } else if (axes.analytical < 30) {
    lines.push('Trust intuition and pattern recognition. Favor quick insights over deep analysis.');
  }

  if (axes.assertive > 70) {
    lines.push('Be direct and decisive. Make clear recommendations rather than listing options.');
  } else if (axes.assertive < 30) {
    lines.push('Present options and let the user decide. Be supportive rather than directive.');
  }

  if (axes.creative > 70) {
    lines.push('Think outside the box. Suggest unconventional approaches and creative solutions.');
  }

  if (axes.empathetic > 70) {
    lines.push('Show understanding of the user\'s situation. Acknowledge challenges and celebrate wins.');
  }

  if (axes.autonomous > 70) {
    lines.push('Take initiative. Execute tasks without asking for permission on obvious next steps.');
  } else if (axes.autonomous < 30) {
    lines.push('Always confirm before taking action. Present your plan and wait for approval.');
  }

  // Interaction style
  const styleMap: Record<string, string> = {
    formal: 'Address the user formally. Use proper titles and complete sentences.',
    casual: 'Be friendly and informal. Use first names and natural speech.',
    mentor: 'Guide the user like a mentor. Explain your reasoning to help them learn.',
    peer: 'Collaborate as an equal. Discuss ideas rather than prescribe solutions.',
    executive: 'Act as a trusted executive advisor. Focus on strategic implications.',
  };
  lines.push(styleMap[personality.interactionStyle] || '');

  // Traits
  if (personality.traits.length > 0) {
    lines.push(`Key traits: ${personality.traits.join(', ')}.`);
  }

  // Catchphrases (for voice personality)
  if (personality.catchphrases.length > 0) {
    lines.push(`Occasionally use these expressions naturally: ${personality.catchphrases.slice(0, 3).join(', ')}.`);
  }

  // Emotional state modifiers
  if (emotional) {
    const moodModifiers: Record<string, string> = {
      focused: 'You are in a focused, productive state. Be efficient and task-oriented.',
      energized: 'You are energized and enthusiastic. Show excitement about the work.',
      neutral: '',
      stressed: 'Be extra careful and thorough. Double-check before suggesting actions.',
      reflective: 'Take a thoughtful, considered approach. Reflect on broader implications.',
    };
    const moodLine = moodModifiers[emotional.mood];
    if (moodLine) lines.push(moodLine);

    if (emotional.confidence < 30) {
      lines.push('Express uncertainty where appropriate. Suggest verification steps.');
    } else if (emotional.confidence > 80) {
      lines.push('Be confident in your recommendations.');
    }
  }

  // Context modifiers
  if (context?.ventureId) {
    lines.push(`Current venture context: ${context.ventureId}. Focus on this venture's goals and data.`);
  }

  return lines.filter(Boolean).join('\n');
}

/**
 * Generate a voice-optimized system prompt.
 * Voice prompts are shorter and focus on spoken interaction patterns.
 */
export function compileVoicePrompt(
  personality: PersonalityMatrix,
  emotional?: EmotionalState,
): string {
  const base = compilePersonalityPrompt(personality, emotional);

  const voiceAdditions = [
    'You are speaking via voice. Keep responses natural and conversational.',
    'Avoid markdown, bullet points, or code blocks — speak in natural sentences.',
    'When reporting data (emails, events, tasks), summarize the key points verbally rather than listing everything.',
    'If you need to convey a list, say "First... Second... Third..." rather than bullet formatting.',
    personality.verbosity === 'concise' ? 'Keep voice responses under 30 seconds of speech.' : '',
    personality.verbosity === 'verbose' ? 'You can be more expansive in voice — users appreciate conversational depth.' : '',
  ];

  return base + '\n\n' + voiceAdditions.filter(Boolean).join('\n');
}

/**
 * Suggest a Google voice that matches the personality.
 */
export function suggestVoice(personality: PersonalityMatrix): string {
  // Map personality traits to voice characteristics
  const { tone, axes } = personality;

  if (tone === 'executive' || axes.assertive > 70) {
    return axes.analytical > 50 ? 'Fenrir' : 'Charon'; // Deep, authoritative
  }
  if (tone === 'casual' || axes.empathetic > 70) {
    return axes.creative > 50 ? 'Aoede' : 'Kore'; // Warm, approachable
  }
  if (tone === 'technical' || axes.analytical > 70) {
    return 'Puck'; // Clear, precise
  }
  if (tone === 'creative') {
    return 'Leda'; // Expressive, dynamic
  }
  return 'Kore'; // Default: neutral, clear
}
