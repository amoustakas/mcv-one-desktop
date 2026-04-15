import { describe, it, expect } from 'vitest';
import {
  richTextToPlain,
  slug,
  extractVariables,
  translateBlocksToMarkdown,
  type NotionBlock,
  type FetchChildren,
} from '../blocks-to-markdown';

describe('notion/blocks-to-markdown', () => {
  describe('richTextToPlain', () => {
    it('joins plain_text across segments', () => {
      expect(richTextToPlain([
        { plain_text: 'Hello ' },
        { plain_text: 'World' },
      ])).toBe('Hello World');
    });

    it('falls back to text.content when plain_text missing', () => {
      expect(richTextToPlain([{ text: { content: 'fallback' } }])).toBe('fallback');
    });

    it('returns empty string for undefined or empty input', () => {
      expect(richTextToPlain(undefined)).toBe('');
      expect(richTextToPlain([])).toBe('');
    });
  });

  describe('slug', () => {
    it('lowercases, hyphenates, and strips non-alphanumerics', () => {
      expect(slug('Master Services Agreement')).toBe('master-services-agreement');
      expect(slug('SOC2 / GDPR Prep')).toBe('soc2-gdpr-prep');
      expect(slug('What about MSAs??!')).toBe('what-about-msas');
    });

    it('trims leading and trailing hyphens', () => {
      expect(slug('--oops--')).toBe('oops');
      expect(slug(' leading and trailing ')).toBe('leading-and-trailing');
    });

    it('caps at 50 characters to keep ids compact', () => {
      const long = 'a'.repeat(100);
      expect(slug(long).length).toBe(50);
    });
  });

  describe('extractVariables', () => {
    it('finds {{variable}} placeholders and dedupes them', () => {
      const md = 'Hello {{venture}} — prepared by {{owner}} on {{date}}. Contact {{venture}}.';
      expect(extractVariables(md)).toEqual(['date', 'owner', 'venture']);
    });

    it('handles whitespace inside delimiters', () => {
      expect(extractVariables('{{  spaced  }}')).toEqual(['spaced']);
    });

    it('returns empty array when no variables present', () => {
      expect(extractVariables('plain content')).toEqual([]);
    });

    it('ignores malformed or single-brace patterns', () => {
      expect(extractVariables('{single} or {{bad braces')).toEqual([]);
    });
  });

  describe('translateBlocksToMarkdown', () => {
    const noChildren: FetchChildren = async () => [];

    it('translates heading + paragraph blocks', async () => {
      const blocks: NotionBlock[] = [
        { id: '1', type: 'heading_1', heading_1: { rich_text: [{ plain_text: 'Agreement' }] } } as NotionBlock,
        { id: '2', type: 'paragraph', paragraph: { rich_text: [{ plain_text: 'This is the intro.' }] } } as NotionBlock,
      ];
      const md = await translateBlocksToMarkdown(blocks, noChildren);
      expect(md).toBe('# Agreement\n\nThis is the intro.');
    });

    it('translates list items with proper markdown prefix', async () => {
      const blocks: NotionBlock[] = [
        { id: '1', type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ plain_text: 'one' }] } } as NotionBlock,
        { id: '2', type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ plain_text: 'two' }] } } as NotionBlock,
        { id: '3', type: 'to_do', to_do: { rich_text: [{ plain_text: 'do thing' }] } } as NotionBlock,
      ];
      const md = await translateBlocksToMarkdown(blocks, noChildren);
      expect(md).toContain('- one');
      expect(md).toContain('- two');
      expect(md).toContain('- [ ] do thing');
    });

    it('wraps code blocks with language fences', async () => {
      const blocks: NotionBlock[] = [
        { id: '1', type: 'code', code: { rich_text: [{ plain_text: 'const x = 1;' }], language: 'typescript' } } as NotionBlock,
      ];
      const md = await translateBlocksToMarkdown(blocks, noChildren);
      expect(md).toContain('```typescript');
      expect(md).toContain('const x = 1;');
      expect(md).toContain('```');
    });

    it('recurses into children with indentation', async () => {
      const parent: NotionBlock = {
        id: 'p',
        type: 'bulleted_list_item',
        has_children: true,
        bulleted_list_item: { rich_text: [{ plain_text: 'parent' }] },
      } as NotionBlock;
      const fetcher: FetchChildren = async (id) => {
        if (id === 'p') {
          return [{
            id: 'c',
            type: 'bulleted_list_item',
            bulleted_list_item: { rich_text: [{ plain_text: 'child' }] },
          } as NotionBlock];
        }
        return [];
      };
      const md = await translateBlocksToMarkdown([parent], fetcher);
      expect(md).toContain('- parent');
      expect(md).toContain('  - child');
    });

    it('stops recursion at MAX_DEPTH to prevent runaway fetches', async () => {
      let calls = 0;
      const fetcher: FetchChildren = async () => {
        calls++;
        return [{
          id: `deep-${calls}`,
          type: 'paragraph',
          has_children: true,
          paragraph: { rich_text: [{ plain_text: `level ${calls}` }] },
        } as NotionBlock];
      };
      const seed: NotionBlock = {
        id: 'root',
        type: 'paragraph',
        has_children: true,
        paragraph: { rich_text: [{ plain_text: 'root' }] },
      } as NotionBlock;
      await translateBlocksToMarkdown([seed], fetcher);
      // depth=0 root; children at depth=1,2,3 trigger 3 more fetches; depth 3 stops
      expect(calls).toBeLessThanOrEqual(3);
    });

    it('degrades unknown block types to plain text instead of dropping them', async () => {
      const blocks: NotionBlock[] = [
        { id: '1', type: 'embed', embed: { rich_text: [{ plain_text: 'https://example.com' }] } } as NotionBlock,
      ];
      const md = await translateBlocksToMarkdown(blocks, noChildren);
      expect(md).toContain('https://example.com');
    });

    it('collapses triple newlines to doubles for clean markdown', async () => {
      const blocks: NotionBlock[] = [
        { id: '1', type: 'paragraph', paragraph: { rich_text: [{ plain_text: 'line one' }] } } as NotionBlock,
        { id: '2', type: 'paragraph', paragraph: { rich_text: [{ plain_text: '' }] } } as NotionBlock,
        { id: '3', type: 'paragraph', paragraph: { rich_text: [{ plain_text: '' }] } } as NotionBlock,
        { id: '4', type: 'paragraph', paragraph: { rich_text: [{ plain_text: 'line two' }] } } as NotionBlock,
      ];
      const md = await translateBlocksToMarkdown(blocks, noChildren);
      expect(md).not.toMatch(/\n{3,}/);
    });

    it('handles divider as horizontal rule', async () => {
      const blocks: NotionBlock[] = [
        { id: '1', type: 'divider', divider: {} } as NotionBlock,
      ];
      const md = await translateBlocksToMarkdown(blocks, noChildren);
      expect(md).toBe('---');
    });
  });
});
