// src/views/agentic/use-inbox-hotkeys.ts
//
// Document-scoped keyboard handler for the Draft Inbox. Attached on mount,
// detached on unmount, so nav-away stops the hotkeys automatically.
// Input / textarea focus always wins — never intercept typing.

import { useEffect } from 'react';
import type { AgentDraft } from '../../stores/agentic-inbox';
import { useAgenticInboxStore } from '../../stores/agentic-inbox';

interface HotkeysCtx {
  selected: AgentDraft | null;
  approveDraft: (id: string, notes?: string) => Promise<void>;
  rejectDraft: (id: string, reason?: string) => Promise<void>;
  setEditMode: (v: boolean) => void;
  setHelpOpen: (v: boolean) => void;
  focusFilter: () => void;
}

export function useInboxHotkeys(ctx: HotkeysCtx) {
  const moveSelection = useAgenticInboxStore((s) => s.moveSelection);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) {
        return;
      }
      switch (e.key) {
        case 'j':
        case 'J':
          moveSelection(1);
          break;
        case 'k':
        case 'K':
          moveSelection(-1);
          break;
        case 'a':
        case 'A':
          if (ctx.selected) void ctx.approveDraft(ctx.selected.id);
          break;
        case 'r':
        case 'R':
          if (ctx.selected) {
            const reason = window.prompt('Reject reason (optional):') ?? undefined;
            void ctx.rejectDraft(ctx.selected.id, reason);
          }
          break;
        case 'e':
        case 'E':
          ctx.setEditMode(true);
          break;
        case '/':
          e.preventDefault();
          ctx.focusFilter();
          break;
        case '?':
          ctx.setHelpOpen(true);
          break;
        case 'Escape':
          ctx.setEditMode(false);
          ctx.setHelpOpen(false);
          break;
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [ctx, moveSelection]);
}
