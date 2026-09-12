/**
 * The whole portfolio lives here.
 *
 * To change what the site shows you only need to edit this file:
 *   1. drop your photographs into images/
 *   2. point `src` at them and fill in the caption fields
 *   3. optionally add or rename series in SERIES
 *
 * `ratio` is width / height, taken from the actual file. It reserves the right
 * amount of space before the image loads, so the grid never jumps as you scroll.
 *
 * `location` is optional — it is set only on frames whose EXIF carried GPS.
 * Captions fall back to the year alone rather than inventing a place.
 */

export const SITE = {
  name: 'Sam',
  role: 'Photographer',
  tagline: 'What the film kept.',
  location: 'Tunis, TN',
  email: 'hello@example.com',
  social: [
    { label: 'Instagram', href: 'https://instagram.com/' },
    { label: 'Behance', href: 'https://behance.net/' },
    { label: 'Email', href: '#contact' },
  ],
  intro:
    'I shoot mostly 35mm — portraits, bodies under coloured light, and whatever ' +
    'the city gives up in black and white. Some of these frames are accidents the ' +
    'film made on its own, and I kept them. Available for editorial, portrait and ' +
    'fashion commissions.',
  services: ['Editorial', 'Portraiture', 'Fashion', 'Prints'],
  since: '2018',
  formats: '35mm film · Digital',
  // The About frame carries its own ratio so the layout never crops it.
  about: {
    src: 'images/about.jpg',
    alt: 'A contact sheet of four black and white frames, numbered 001',
    ratio: 1,
  },
};

export const SERIES = [
  { id: 'latent',   title: 'Latent',       years: '2019' },
  { id: 'sitters',  title: 'Sitters',      years: '2019 — 2020' },
  { id: 'concrete', title: 'Concrete',     years: '2018 — 2021' },
  { id: 'winter',   title: 'Winter Light', years: '2021 — 2022' },
];

export const PHOTOS = [
  /* --- Latent: light leaks and double exposures on 35mm --------------- */
  {
    src: 'images/latent-01.jpg',
    alt: 'A red light leak cutting across a bare arm on green-cast colour film',
    title: 'Red Arm',
    series: 'latent',
    year: '2019',
    ratio: 1.5088,
    feature: true,
  },
  {
    src: 'images/latent-02.jpg',
    alt: 'A torso dissolving into a vertical wash of red on exposed film',
    title: 'Torso, Red',
    series: 'latent',
    year: '2019',
    ratio: 1.5088,
  },
  {
    src: 'images/latent-03.jpg',
    alt: 'Blue and red streaks crossing a green frame',
    title: 'Cross Light',
    series: 'latent',
    year: '2019',
    ratio: 1.5088,
  },
  {
    src: 'images/latent-04.jpg',
    alt: 'A neon tube burning pink against a dark, blue-smeared frame',
    title: 'Tube',
    series: 'latent',
    year: '2019',
    ratio: 1.5088,
  },

  {
    src: 'images/latent-05.jpg',
    alt: 'A red bloom and a blue streak crossing green-cast film',
    title: 'Bloom',
    series: 'latent',
    year: '2019',
    ratio: 1.5088,
  },
  {
    src: 'images/latent-06.jpg',
    alt: 'A second exposure from the same roll, the red mass drifting left',
    title: 'Drift',
    series: 'latent',
    year: '2019',
    ratio: 1.5088,
  },

  {
    src: 'images/latent-07.jpg',
    alt: 'A double exposure: a figure in cold blue crossed by a band of orange light',
    title: 'Opal',
    series: 'latent',
    ratio: 0.6894,
  },

  /* --- Sitters: portraits, studio and on assignment -------------------- */
  {
    src: 'images/sitters-01.jpg',
    alt: 'A woman in a black blazer standing beside an exposed studio light stand',
    title: 'Between Setups',
    series: 'sitters',
    // Same session as 'Veil' — same sitter, backdrop and date — so it carries
    // that frame's location even though only 'Veil' recorded GPS.
    location: 'Tunis, TN',
    year: '2020',
    ratio: 1.509,
  },
  {
    src: 'images/sitters-02.jpg',
    alt: 'A face behind a beaded veil, eyes closed',
    title: 'Veil',
    series: 'sitters',
    location: 'Tunis, TN',
    year: '2020',
    ratio: 1,
  },
  {
    src: 'images/sitters-03.jpg',
    alt: 'A figure in dark fur under hard stripes of window light',
    title: 'Blinds',
    series: 'sitters',
    year: '2020',
    ratio: 0.9798,
  },
  {
    src: 'images/sitters-04.jpg',
    alt: 'A model on a white paper backdrop holding a sheaf of dried stems',
    title: 'Backstage',
    series: 'sitters',
    year: '2019',
    ratio: 0.6678,
  },
  {
    src: 'images/sitters-05.jpg',
    alt: 'A head tipped back in warm light, gold earrings catching the sun',
    title: 'Gold',
    series: 'sitters',
    year: '2019',
    ratio: 1.4975,
    feature: true,
  },

  /* --- Concrete: buildings, streets, signage --------------------------- */
  {
    src: 'images/concrete-01.jpg',
    alt: 'A grid of apartment balconies in cold cyan light',
    title: 'Balconies',
    series: 'concrete',
    year: '2018',
    ratio: 1.5369,
  },
  {
    src: 'images/concrete-02.jpg',
    alt: 'A tower block cutting a hard diagonal across a white sky',
    title: 'Rake',
    series: 'concrete',
    year: '2021',
    ratio: 0.6706,
  },
  {
    src: 'images/concrete-03.jpg',
    alt: 'The words NO ENTRY painted across wet tarmac',
    title: 'No Entry',
    series: 'concrete',
    location: 'London, UK',
    year: '2021',
    ratio: 0.7256,
  },
  {
    src: 'images/concrete-04.jpg',
    alt: 'A streetlight and two small birds against a flat blue sky',
    title: 'Streetlight',
    series: 'concrete',
    year: '2018',
    ratio: 0.9273,
  },

  {
    src: 'images/concrete-05.jpg',
    alt: 'Hard-edged shadows thrown across a bare wall',
    title: 'Shadow Fall',
    series: 'concrete',
    location: 'Tunis, TN',
    year: '2020',
    ratio: 0.75,
  },
  {
    src: 'images/concrete-06.jpg',
    alt: 'Glass towers rising behind a bus shelter in the City',
    title: 'Glass',
    series: 'concrete',
    location: 'London, UK',
    year: '2021',
    ratio: 0.7633,
  },

  /* --- Winter Light: the quiet frames ---------------------------------- */
  {
    src: 'images/winter-01.jpg',
    alt: 'Bare branches filling the frame against a bright winter sky',
    title: 'Bare',
    series: 'winter',
    location: 'Bournemouth, UK',
    year: '2021',
    ratio: 0.75,
  },
  {
    src: 'images/winter-02.jpg',
    alt: 'A snow-covered path running between trees, one figure far off',
    title: 'Path',
    series: 'winter',
    location: 'London, UK',
    year: '2021',
    ratio: 0.75,
  },
  {
    src: 'images/winter-03.jpg',
    alt: 'A figure blurred by a long exposure in a dim corridor',
    title: 'Corridor',
    series: 'winter',
    year: '2021',
    ratio: 0.5437,
  },
  {
    src: 'images/winter-04.jpg',
    alt: 'Daylight pooling through a drawn curtain',
    title: 'Curtain',
    series: 'winter',
    location: 'Tunis, TN',
    year: '2022',
    ratio: 0.75,
  },
  {
    src: 'images/winter-05.jpg',
    alt: 'Bare branches against a white sky, scanned as a bordered print',
    title: 'Branches',
    series: 'winter',
    location: 'Tunis, TN',
    ratio: 1,
  },
  {
    src: 'images/winter-06.jpg',
    alt: 'A snowed-over park seen from above, benches and paths picked out in white',
    title: 'Park',
    series: 'winter',
    location: 'London, UK',
    year: '2021',
    ratio: 0.75,
  },
];
