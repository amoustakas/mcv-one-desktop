import { create } from 'zustand';

interface VentureTheme {
  primary: string;
  accent: string;
  name: string;
}

const VENTURE_THEMES: Record<string, VentureTheme> = {
  mcv: { primary: '#00F5FF', accent: '#8B5CF6', name: 'MCV One' },
  betedge: { primary: '#F59E0B', accent: '#FBBF24', name: 'BetEdge AI' },
  futurestate: { primary: '#8B5CF6', accent: '#A78BFA', name: 'FutureState' },
  warforge: { primary: '#EF4444', accent: '#F87171', name: 'WarForge' },
  mcvgg: { primary: '#EC4899', accent: '#F472B6', name: 'MCV Studios' },
  edgeiq: { primary: '#3B82F6', accent: '#60A5FA', name: 'EdgeIQ Markets' },
  arqlabs: { primary: '#6366F1', accent: '#818CF8', name: 'ARQ Labs' },
  mcvdev: { primary: '#3B82F6', accent: '#60A5FA', name: 'MCV Dev' },
  mcvtech: { primary: '#6B7280', accent: '#9CA3AF', name: 'MCV Tech' },
};

const GLOBAL_THEME: VentureTheme = { primary: '#00F5FF', accent: '#8B5CF6', name: 'Global' };

interface ThemeState {
  currentTheme: VentureTheme;
  applyGlobalTheme: () => void;
  applyVentureTheme: (slug: string) => void;
}

function injectCSSVars(theme: VentureTheme) {
  const root = document.documentElement;
  root.style.setProperty('--venture-primary', theme.primary);
  root.style.setProperty('--venture-accent', theme.accent);
  root.style.setProperty('--venture-glow', `${theme.primary}25`);
}

export const useTheme = create<ThemeState>()((set) => ({
  currentTheme: GLOBAL_THEME,

  applyGlobalTheme: () => {
    injectCSSVars(GLOBAL_THEME);
    set({ currentTheme: GLOBAL_THEME });
  },

  applyVentureTheme: (slug) => {
    const theme = VENTURE_THEMES[slug] || GLOBAL_THEME;
    injectCSSVars(theme);
    set({ currentTheme: theme });
  },
}));

export { VENTURE_THEMES, GLOBAL_THEME };
