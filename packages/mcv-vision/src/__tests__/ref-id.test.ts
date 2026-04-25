// ref-id.test.ts — locks the v0.1 hashing contract.
//
// Ref.id is the load-bearing invariant of every persisted action audit.
// These tests guard against silent algorithm drift — if a change here
// breaks them, you MUST bump @mcv/vision major and ship a v2 minter
// alongside (see comment at top of src/ref-id.ts).

import { describe, it, expect } from 'vitest';
import { makeRefId } from '../ref-id';

describe('@mcv/vision · ref-id (v0.1 contract)', () => {
  it('is deterministic for identical inputs', () => {
    const inputs = {
      role: 'button',
      name: 'Submit',
      ancestorRoles: ['form', 'main'],
      originOrdinal: 0,
    };
    const a = makeRefId(inputs);
    const b = makeRefId(inputs);
    expect(a).toEqual(b);
  });

  it('produces a 16-char lowercase-hex id', () => {
    const id = makeRefId({
      role: 'link',
      name: 'Home',
      ancestorRoles: [],
      originOrdinal: 0,
    });
    expect(id).toMatch(/^[0-9a-f]{16}$/);
  });

  it('discriminates on role', () => {
    const a = makeRefId({ role: 'button', name: 'X', ancestorRoles: [], originOrdinal: 0 });
    const b = makeRefId({ role: 'link', name: 'X', ancestorRoles: [], originOrdinal: 0 });
    expect(a).not.toEqual(b);
  });

  it('discriminates on accessibleName', () => {
    const a = makeRefId({ role: 'button', name: 'Save', ancestorRoles: [], originOrdinal: 0 });
    const b = makeRefId({ role: 'button', name: 'Cancel', ancestorRoles: [], originOrdinal: 0 });
    expect(a).not.toEqual(b);
  });

  it('discriminates on ancestorRoles', () => {
    const a = makeRefId({ role: 'button', name: 'X', ancestorRoles: ['form'], originOrdinal: 0 });
    const b = makeRefId({ role: 'button', name: 'X', ancestorRoles: ['nav'], originOrdinal: 0 });
    expect(a).not.toEqual(b);
  });

  it('discriminates on ancestorRoles ORDER (form>main vs main>form)', () => {
    const a = makeRefId({
      role: 'button', name: 'X',
      ancestorRoles: ['form', 'main'], originOrdinal: 0,
    });
    const b = makeRefId({
      role: 'button', name: 'X',
      ancestorRoles: ['main', 'form'], originOrdinal: 0,
    });
    expect(a).not.toEqual(b);
  });

  it('discriminates on originOrdinal', () => {
    const a = makeRefId({ role: 'button', name: 'X', ancestorRoles: [], originOrdinal: 0 });
    const b = makeRefId({ role: 'button', name: 'X', ancestorRoles: [], originOrdinal: 1 });
    expect(a).not.toEqual(b);
  });

  it('handles unicode + control chars in accessibleName without collision', () => {
    // The JSON canonicalization escapes these unambiguously; collisions here
    // would indicate the algorithm is doing string concatenation instead.
    const a = makeRefId({ role: 'button', name: 'a"b', ancestorRoles: [], originOrdinal: 0 });
    const b = makeRefId({ role: 'button', name: 'a\\"b', ancestorRoles: [], originOrdinal: 0 });
    expect(a).not.toEqual(b);

    const emoji = makeRefId({ role: 'button', name: 'Save 💾', ancestorRoles: [], originOrdinal: 0 });
    expect(emoji).toMatch(/^[0-9a-f]{16}$/);
  });

  it('locks the wire-format hash for the canonical example (regression guard)', () => {
    // If you find yourself updating this string: STOP.
    // Read the top of ref-id.ts. Any algorithm change requires a v2 minter,
    // not an in-place edit of the v1 expected value.
    const id = makeRefId({
      role: 'button',
      name: 'Submit',
      ancestorRoles: ['form', 'main'],
      originOrdinal: 0,
    });
    expect(id).toEqual('388f8a4dffb7f443');
  });
});
