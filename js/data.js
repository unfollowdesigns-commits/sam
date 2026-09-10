/**
 * The whole portfolio lives here.
 *
 * To publish your own work you only need to edit this file:
 *   1. drop your photographs into images/
 *   2. point `src` at them and fill in the caption fields
 *   3. optionally add or rename series in SERIES
 *
 * `ratio` is width / height. It reserves the right amount of space before the
 * image loads, so the grid never jumps around — set it to your file's real
 * aspect ratio.
 */

export const SITE = {
  name: 'Sam',
  role: 'Photographer',
  tagline: 'Quiet light, held still.',
  location: 'Lisbon, Portugal',
  email: 'hello@example.com',
  social: [
    { label: 'Instagram', href: 'https://instagram.com/' },
    { label: 'Behance', href: 'https://behance.net/' },
    { label: 'Newsletter', href: '#contact' },
  ],
  intro:
    'I photograph the hour before something happens — a coastline emptying out, ' +
    'light crossing a wall, a room still holding the shape of whoever just left. ' +
    'Available for editorial, brand and print commissions worldwide.',
  services: ['Editorial', 'Brand campaigns', 'Fine art prints', 'Exhibition work'],
};

export const SERIES = [
  { id: 'coast',    title: 'Silent Coast',  years: '2021 — 2024' },
  { id: 'concrete', title: 'Concrete Light', years: '2022 — 2025' },
  { id: 'north',    title: 'Northbound',    years: '2019 — 2023' },
  { id: 'interior', title: 'Interiors',     years: '2023 — 2025' },
];

export const PHOTOS = [
  {
    src: 'images/coast-01.svg',
    alt: 'A pale shoreline dissolving into fog at low tide',
    title: 'Low Water',
    series: 'coast',
    location: 'Comporta, PT',
    year: '2023',
    ratio: 3 / 2,
    feature: true,
  },
  {
    src: 'images/coast-02.svg',
    alt: 'Sea spray blurred against a colourless sky',
    title: 'Spray',
    series: 'coast',
    location: 'Nazaré, PT',
    year: '2022',
    ratio: 4 / 5,
  },
  {
    src: 'images/coast-03.svg',
    alt: 'A flat horizon line dividing the frame in two',
    title: 'Divide',
    series: 'coast',
    location: 'Ericeira, PT',
    year: '2024',
    ratio: 1,
  },
  {
    src: 'images/coast-04.svg',
    alt: 'Dark water under an overcast evening sky',
    title: 'After the Squall',
    series: 'coast',
    location: 'Sagres, PT',
    year: '2021',
    ratio: 3 / 2,
  },

  {
    src: 'images/concrete-01.svg',
    alt: 'Sunlight cutting a hard diagonal across a concrete wall',
    title: 'Diagonal',
    series: 'concrete',
    location: 'Porto, PT',
    year: '2024',
    ratio: 4 / 5,
  },
  {
    src: 'images/concrete-02.svg',
    alt: 'A stairwell reduced to overlapping grey planes',
    title: 'Stairwell',
    series: 'concrete',
    location: 'Marseille, FR',
    year: '2025',
    ratio: 3 / 2,
    feature: true,
  },
  {
    src: 'images/concrete-03.svg',
    alt: 'A narrow column of shadow between two buildings',
    title: 'Gap',
    series: 'concrete',
    location: 'Milan, IT',
    year: '2023',
    ratio: 2 / 3,
  },
  {
    src: 'images/concrete-04.svg',
    alt: 'Warm late light on a rendered facade',
    title: 'Six O’Clock',
    series: 'concrete',
    location: 'Seville, ES',
    year: '2022',
    ratio: 1,
  },

  {
    src: 'images/north-01.svg',
    alt: 'A cold blue landscape under heavy cloud',
    title: 'Weather Coming',
    series: 'north',
    location: 'Lofoten, NO',
    year: '2019',
    ratio: 3 / 2,
  },
  {
    src: 'images/north-02.svg',
    alt: 'Moss and stone softened by mist',
    title: 'Moss',
    series: 'north',
    location: 'Snæfellsnes, IS',
    year: '2021',
    ratio: 4 / 5,
  },
  {
    src: 'images/north-03.svg',
    alt: 'A wide empty valley at dusk',
    title: 'The Long Valley',
    series: 'north',
    location: 'Highlands, UK',
    year: '2023',
    ratio: 16 / 9,
    feature: true,
  },
  {
    src: 'images/north-04.svg',
    alt: 'A single track disappearing into low cloud',
    title: 'Track',
    series: 'north',
    location: 'Jotunheimen, NO',
    year: '2020',
    ratio: 2 / 3,
  },

  {
    src: 'images/interior-01.svg',
    alt: 'Warm light falling across an empty room',
    title: 'Ten Past Four',
    series: 'interior',
    location: 'Lisbon, PT',
    year: '2024',
    ratio: 4 / 5,
  },
  {
    src: 'images/interior-02.svg',
    alt: 'A doorway framing a second, brighter room',
    title: 'Threshold',
    series: 'interior',
    location: 'Tangier, MA',
    year: '2025',
    ratio: 3 / 2,
  },
  {
    src: 'images/interior-03.svg',
    alt: 'A curtain holding the shape of the wind',
    title: 'Curtain',
    series: 'interior',
    location: 'Lisbon, PT',
    year: '2023',
    ratio: 1,
  },
  {
    src: 'images/interior-04.svg',
    alt: 'A tall window with light pooling on the floor below',
    title: 'Pool',
    series: 'interior',
    location: 'Palermo, IT',
    year: '2025',
    ratio: 2 / 3,
  },
];
