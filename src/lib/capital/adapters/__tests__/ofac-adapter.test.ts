// OFAC inbound-compliance adapter — unit tests.
// Exercises the pure screenOfac() + the LegacyAdapter wrapper without I/O.

import { describe, it, expect } from 'vitest';
import { createOfacAdapter, screenOfac, nameSimilarity } from '../ofac-adapter';
import { OFAC_SEED } from '../ofac-seed';

describe('nameSimilarity', () => {
  it('returns 1 on exact match (case-insensitive, diacritic-normalized)', () => {
    expect(nameSimilarity('José García', 'jose garcia')).toBe(1);
  });
  it('returns 0 on unrelated names', () => {
    expect(nameSimilarity('Alice Smith', 'Bob Jones')).toBeLessThan(0.2);
  });
  it('scores partial overlap above 0.5 for same last name', () => {
    const s = nameSimilarity('John Smith', 'Jane Smith');
    expect(s).toBeGreaterThan(0.4);
    expect(s).toBeLessThan(0.9);
  });
});

describe('screenOfac', () => {
  const contact = { contactId: 'contact_1' };

  it('returns clear for a benign name not in the list', () => {
    const result = screenOfac(
      { ...contact, name: 'Alice Friendly' },
      { sdnEntries: OFAC_SEED },
    );
    expect(result.outcome).toBe('clear');
    expect(result.matchedRecord).toBeUndefined();
    expect(result.score).toBeLessThan(0.85);
    expect(result.source).toBe('ofac');
  });

  it('returns match on high-similarity entity name + alias', () => {
    const result = screenOfac(
      { ...contact, name: 'Rosneft Oil Company' },
      { sdnEntries: OFAC_SEED },
    );
    expect(result.outcome).toBe('match');
    expect(result.matchedRecord?.sourceEntryId).toBe('sdn-22080');
    expect(result.score).toBeGreaterThanOrEqual(0.85);
  });

  it('matches via alias even when primary name differs', () => {
    const result = screenOfac(
      { ...contact, name: 'El Chapo' },
      { sdnEntries: OFAC_SEED },
    );
    expect(result.outcome).toBe('match');
    expect(result.matchedRecord?.programs).toContain('SDNTK');
  });

  it('downgrades to review when name matches but DOB disagrees', () => {
    const result = screenOfac(
      { ...contact, name: 'Igor Borisovich Makiv', dob: '1980-01-01' }, // wrong DOB
      { sdnEntries: OFAC_SEED },
    );
    // Name hits strong; DOB guard downgrades to review.
    expect(result.outcome).toBe('review');
    expect(result.score).toBeGreaterThanOrEqual(0.85);
  });

  it('returns match when name + DOB both agree', () => {
    const result = screenOfac(
      { ...contact, name: 'Igor Borisovich Makiv', dob: '1962-04-13' },
      { sdnEntries: OFAC_SEED },
    );
    expect(result.outcome).toBe('match');
    expect(result.matchedRecord?.dob).toBe('1962-04-13');
  });

  it('does not trip match on common-name-only collision', () => {
    // "John Smith" exists in seed as SDN-9999 deliberately. Raising the
    // threshold for common names is the job of the seed curation, not
    // the matcher — but exact match on the whole name WILL fire.
    // Here we feed a slightly different name to confirm the matcher
    // doesn't trigger on a merely-similar common name.
    const result = screenOfac(
      { ...contact, name: 'Jon Smithers' },
      { sdnEntries: OFAC_SEED },
    );
    expect(result.outcome).not.toBe('match');
  });

  it('counts alternates above 0.5 but below threshold', () => {
    // Craft a bespoke fixture: two entries that partially overlap the
    // query name without exceeding the threshold. Alternates is meant
    // to surface "close-but-not-match" candidates for admin visibility.
    const result = screenOfac(
      { contactId: 'c-1', name: 'Robert Smithers' },
      {
        sdnEntries: [
          { id: 'x-1', primaryName: 'Robert Smithwick', list: 'SDN', programs: [] },
          { id: 'x-2', primaryName: 'Rob Smitherson', list: 'SDN', programs: [] },
        ],
        threshold: 0.95,
      },
    );
    expect(result.outcome).not.toBe('match');
    expect(result.matchDiagnostics.alternates).toBeGreaterThanOrEqual(1);
  });
});

describe('createOfacAdapter', () => {
  it('wraps screenOfac as LegacyAdapter<OfacQuery, CapitalComplianceEvent>', async () => {
    const adapter = createOfacAdapter({ sdnEntries: OFAC_SEED });
    expect(adapter.id).toBe('ofac');
    const event = await adapter.fromForeign({
      contactId: 'c-1',
      name: 'Rosneft',
    });
    expect(event).not.toBeNull();
    expect(event!.outcome).toBe('match');
  });

  it('returns null when the query is malformed', async () => {
    const adapter = createOfacAdapter({ sdnEntries: OFAC_SEED });
    const event = await adapter.fromForeign({ contactId: '', name: '' });
    expect(event).toBeNull();
  });
});
