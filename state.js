export const COLOR_MAP = {
  red: '#a32d2d',
  vermilion: '#d66025',
  blue: '#2c7fb8',
  'blue-green': '#1f9e89',
  purple: '#7f77dd',
  gold: '#c4a96a',
  white: '#eceae4',
  yellow: '#dfc221',
  crimson: '#e31a1c',
  'white-gold': '#fff7bc'
};

export const SPINAL_CENTERS = {
  1: 'Coccygeal / Rectal Plexus (Sacral Base)',
  2: 'Sacral / Prostatic Plexus (Generative)',
  3: 'Solar Plexus (Nabhi / Epigastric)',
  4: 'Cardiac Plexus (Hridaya / Heart)',
  5: 'Pharyngeal Plexus (Kantha / Throat)',
  6: 'Cavernous Plexus / Optic Chiasm (3rd Eye)',
  7: 'Pineal Gland / Superior Sagittal (Crown)',
  8: 'Cerebral Cortex / Causal Gateway',
  9: 'Tenth Door / Daswan Dwar (Void Gateway)',
  10: 'Great Void Boundary (Super-Causal)',
  11: 'Causal Peak Vortex (Whirlpool)',
  12: 'Pure Spirit Crown (Sach Khand)',
  13: 'Alakha Lok Abode',
  14: 'Agama Lok Gateway',
  15: 'The Nameless Spiritual Crown',
  16: 'First Secret Spiritual Stage',
  17: 'Second Secret Spiritual Stage',
  18: 'Radhasoami Dham Peak'
};

export const state = {
  floorsDB: {},
  graphData: {},
  activeFloor: 1,
  activeView: 'floor',
  isRouting: false,
  cardFilters: {
    saksena: true,
    sikhism: true,
    sufism: true,
    science: true,
    hindu_tantra: true,
    vedic: true,
    buddhism: true,
    taoism: true,
    kabbalah: true,
    gnosticism: true,
    jainism: true,
    gateway: true
  }
};
