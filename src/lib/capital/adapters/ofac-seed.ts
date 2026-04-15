// Curated OFAC SDN seed list for development + tests.
//
// This is NOT the full Treasury SDN list (~15k entries). It is a small,
// deterministic subset used to:
//   1. Exercise the OFAC adapter's matching logic in unit tests
//   2. Give `screen-contact-ofac` in dev a non-trivial result surface
//      before the nightly ofac_sdn_entries cron lands
//
// Entries were selected from the public Treasury SDN CSV
// (https://www.treasury.gov/ofac/downloads/sdn.csv) to cover:
//   - Individual w/ DOB (tests DOB guard path)
//   - Entity with aliases (tests alias matching)
//   - Individual w/ no DOB (tests graceful DOB-absent path)
//   - Common-first-name entry (tests false-positive floor)
//
// When the full cron ships, this file becomes the fallback seed only —
// real screening queries the Supabase-backed cache.

import type { SdnEntry } from './ofac-adapter';

export const OFAC_SEED: SdnEntry[] = [
  {
    id: 'sdn-32440',
    primaryName: 'MAKIV, Igor Borisovich',
    dob: '1962-04-13',
    country: 'RU',
    list: 'SDN',
    programs: ['UKRAINE-EO13661'],
  },
  {
    id: 'sdn-22080',
    primaryName: 'ROSNEFT OIL COMPANY OJSC',
    aliases: [
      'NK ROSNEFT OAO',
      'OAO NK ROSNEFT',
      'OJSC ROSNEFT OIL COMPANY',
      'ROSNEFT',
      'ROSNEFT OAO',
    ],
    country: 'RU',
    list: 'SDN',
    programs: ['UKRAINE-EO13662'],
  },
  {
    id: 'sdn-7365',
    primaryName: 'GUZMAN LOERA, Joaquin Archivaldo',
    aliases: ['EL CHAPO', 'GUZMAN, Joaquin', 'CHAPO GUZMAN'],
    dob: '1957-04-04',
    country: 'MX',
    list: 'SDN',
    programs: ['SDNTK'],
  },
  {
    id: 'sdn-12800',
    primaryName: 'AL-QAIDA',
    aliases: ['AL QAEDA', 'THE BASE', 'AL-QAEDA'],
    list: 'SDN',
    programs: ['SDGT', 'EO13224'],
  },
  {
    id: 'sdn-9999',
    primaryName: 'SMITH, John',  // Deliberately common — tests that bare first-
    // or last-name collisions don't trigger above threshold.
    list: 'SDN',
    programs: ['SDGT'],
  },
];
