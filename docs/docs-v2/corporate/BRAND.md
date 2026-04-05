# MCV.ONE Brand Identity & Design System

> **"Bold, Direct, and Futuristic."**

This document defines the brand DNA, voice, and visual system for the MCV.ONE ecosystem.

---

## 1. Brand DNA

### Core Identity
*   **Tone:** Bold, Direct, Futuristic.
*   **Audience:** Early Adopters, Tech-Savvy Executives, Web3 Natives.
*   **Keywords:** `Future`, `Sustainable`, `Vibes`, `Awakening`, `System`, `Scale`.

### Voice Guidelines
*   **Do:** Use active voice. Use punchy short sentences. Focus on lifestyle/executive benefits.
*   **Don't:** Use jargon without purpose. Apologize (system messages should be neutral/informative). Be verbose.

---

## 2. Visual System (The "Zinc & Red" Aesthetic)

Our design system is built on `@mcv/ui`, extending `HeroUI` (NextUI) and `Tailwind CSS`.

### Color Palette

| Name | Token | Hex | Usage |
|------|-------|-----|-------|
| **Primary** | `primary` | `#DC2626` (Red-600) | Action buttons, key highlights, "The Pulse". |
| **Background** | `background` | `#09090B` (Zinc-950) | App background. Deep, dark, infinite. |
| **Surface** | `card` | `#18181B` (Zinc-900) | Cards, panels, modals. |
| **Border** | `border` | `#27272A` (Zinc-800) | Subtle separation. |
| **Muted** | `muted` | `#71717A` (Zinc-500) | Secondary text, meta-data. |

### Typography

*   **Font Family:** `Geist` (Sans & Mono).
*   **Headings:** Tracking tight (`-0.02em`), Weight `600/700`.
*   **Body:** Tracking normal, Weight `400`.
*   **Mono:** Used for IDs, code blocks, and financial data.

---

## 3. UI/UX Philosophy

1.  **Density:** "Comfortable" by default, "Compact" for power users (Data Grids).
2.  **Motion:** Instant feedback. < 100ms transitions. No bouncy animations; sleek, ease-out curves.
3.  **Glassmorphism:** Used sparingly on sticky headers and floating command palettes (`backdrop-blur-md`).
4.  **Dark Mode:** The default and primary mode. Light mode is secondary.

---

## 4. Logo Usage

*   **Wordmark:** `MCV.ONE` (Geist Bold, Tracking Tight).
*   **Symbol:** The "Nexus" node icon (Grid of dots or connected nodes).
*   **Placement:** Top-left in Admin, Center in Auth screens.

---

## 5. System Prompts (AI Personality)

When configuring AI Agents (Jules, Cursor, etc.) to speak as MCV:

> "You are an expert system interface. Output raw JSON where possible. Be concise. Never apologize. Focus on the solution."
