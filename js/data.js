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
  // Set this to the live domain before publishing: it is what the sitemap,
  // the canonical link and the structured data all point at. Until it is
  // right, search engines and answer engines cannot attribute the work.
  url: 'https://sam-photography.vercel.app',
  // One plain sentence. Answer engines quote this kind of line directly, so
  // it should say who, what, where and in what medium, without adjectives.
  summary:
    'Sam is a photographer based in Tunis, Tunisia, working mainly on 35mm film. '
    + 'The work covers portraiture, jewellery and fashion campaigns, experimental '
    + 'colour film, and black and white street photography made in Tunis and London '
    + 'between 2018 and 2022.',
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
  // Questions an answer engine gets asked about a photographer, answered in
  // the plainest form they can be answered in. These are rendered onto the
  // page by tools/build-seo.mjs and marked up as FAQPage in the same pass:
  // the text a machine quotes is the exact text a visitor reads, which is
  // both the honest arrangement and the one Google's guidelines require.
  //
  // Keep answers to one or two sentences and to things that are true. An
  // answer engine will repeat these verbatim.
  faq: [
    {
      q: 'Who is Sam?',
      a: 'Sam is a photographer based in Tunis, Tunisia, working mainly on 35mm '
        + 'film. He has photographed in Tunis and London since 2018.',
    },
    {
      q: 'What kind of photography does Sam shoot?',
      a: 'Portraiture, fashion and jewellery campaigns, experimental colour film, '
        + 'and black and white street photography.',
    },
    {
      q: 'What does Sam shoot on?',
      a: 'Mostly 35mm film, with some digital work. Scans are published as the '
        + 'lab returned them rather than graded back towards a corrected image.',
    },
    {
      q: 'Where is Sam based?',
      a: 'Tunis, Tunisia. Much of the black and white work was made in London '
        + 'between 2021 and 2022.',
    },
    {
      q: 'Is Sam available for commissions?',
      a: 'Yes — editorial, portrait and fashion commissions, and prints. '
        + 'Enquiries by email.',
    },
  ],

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
  { id: 'still',    title: 'Still',        years: '2019 — 2022' },
  { id: 'winter',   title: 'Winter Light', years: '2021 — 2022' },
  { id: 'printed',  title: 'Printed',      years: '2021' },
];

export const PHOTOS = [
  /* --- Latent: light leaks and double exposures on 35mm --------------- */
  {
    src: 'images/latent-01.jpg',
    alt: 'A red light leak cutting across a bare arm on green-cast colour film',
    title: 'Arm, Burned In',
    note: 'Nothing about this was decided by me.',
    series: 'latent',
    year: '2019',
    ratio: 1.5088,
    feature: true,
  },
  {
    src: 'images/latent-03.jpg',
    alt: 'Blue and red streaks crossing a green frame',
    title: 'Two Reds and a Blue',
    series: 'latent',
    year: '2019',
    ratio: 1.5088,
  },
  {
    src: 'images/latent-04.jpg',
    alt: 'A neon tube burning pink against a dark, blue-smeared frame',
    title: 'Tube',
    note: 'Walking home. The whole roll came back like this and I printed six of them.',
    series: 'latent',
    year: '2019',
    ratio: 1.5088,
  },

  {
    src: 'images/latent-05.jpg',
    alt: 'A red bloom and a blue streak crossing green-cast film',
    title: 'Bloom',
    note: 'Heat, probably.',
    series: 'latent',
    year: '2019',
    ratio: 1.5088,
  },

  {
    src: 'images/latent-07.jpg',
    alt: 'A double exposure: a figure in cold blue crossed by a band of orange light',
    title: 'Opal',
    note: 'Two exposures, one frame. I only meant to make one.',
    series: 'latent',
    ratio: 0.6894,
  },

  /* --- Sitters: portraits, studio and on assignment -------------------- */
  {
    src: 'images/sitters-01.jpg',
    alt: 'A woman in a black blazer standing beside an exposed studio light stand',
    title: 'Between Setups',
    note: 'The picture I came for took forty minutes. This one took none.',
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
    note: 'She closed her eyes before I asked her to.',
    series: 'sitters',
    location: 'Tunis, TN',
    year: '2020',
    ratio: 1,
  },
  {
    src: 'images/sitters-03.jpg',
    alt: 'A figure in dark fur under hard stripes of window light',
    title: 'Nine Bars',
    note: 'The blinds did the work.',
    series: 'sitters',
    year: '2020',
    ratio: 0.9798,
  },
  {
    src: 'images/sitters-04.jpg',
    alt: 'A model on a white paper backdrop holding a sheaf of dried stems',
    title: 'Sheaf',
    series: 'sitters',
    year: '2019',
    ratio: 0.6678,
  },
  {
    src: 'images/sitters-05.jpg',
    alt: 'A head tipped back in warm light, gold earrings catching the sun',
    title: 'Gold, Looking Up',
    note: 'Late afternoon, which in Tunis is still the middle of the day.',
    series: 'sitters',
    year: '2019',
    ratio: 1.4975,
    feature: true,
  },

  {
    src: 'images/sitters-06.jpg',
    alt: 'A young man in a cap and graphic tee standing beside a wrecked car in a scrapyard',
    title: 'He Chose the Spot',
    note: 'And he was right about the spot.',
    series: 'sitters',
    year: '2019',
    ratio: 0.6306,
  },
  {
    src: 'images/sitters-07.jpg',
    alt: 'A woman in a white tee in a workshop, benches and working figures behind her',
    title: 'On the Floor',
    note: 'Made between two orders going out. Nobody stopped.',
    series: 'sitters',
    year: '2020',
    ratio: 1.509,
  },
  {
    src: 'images/sitters-08.jpg',
    alt: 'A figure in black against a bright wall, caught mid-turn',
    title: 'Sfayaa',
    note: 'Mid-turn, last frame on the roll.',
    series: 'sitters',
    ratio: 0.6628,
  },

  {
    src: 'images/sitters-09.jpg',
    alt: 'Two frames side by side: a figure in a KEPT shirt, arms crossed over the face against a blue sky',
    title: 'KEPT — Diptych',
    note: 'Two frames, one second apart. The shirt supplied the title.',
    series: 'sitters',
    ratio: 1,
  },

  {
    src: 'images/sitters-10.jpg',
    alt: 'A face in silver makeup wearing a head chain and ear chain, in black and white',
    title: 'Silver, Chained',
    series: 'sitters',
    year: '2020',
    ratio: 0.75,
  },
  {
    src: 'images/sitters-11.jpg',
    alt: 'Gold necklaces on a bare throat, framed by pampas grass and carnations',
    title: 'Pampas',
    note: 'Campaign work. The flowers were not my idea and they were the right idea.',
    series: 'sitters',
    year: '2019',
    ratio: 0.6678,
  },
  {
    src: 'images/sitters-12.jpg',
    alt: 'Two legs in dark tights raised over the back of a wire chair, in grainy black and white',
    title: 'Study: Two Legs, One Chair',
    note: 'Pushed film, and still not enough of it.',
    series: 'sitters',
    ratio: 1.087,
  },


  /* --- Concrete: buildings, streets, signage --------------------------- */
  {
    src: 'images/concrete-01.jpg',
    alt: 'A grid of apartment balconies in cold cyan light',
    title: 'Cyan Grid',
    series: 'concrete',
    year: '2018',
    ratio: 1.5369,
  },
  {
    src: 'images/concrete-02.jpg',
    alt: 'A tower block cutting a hard diagonal across a white sky',
    title: 'Rake',
    note: 'White sky is the only weather this block reads in.',
    series: 'concrete',
    year: '2021',
    ratio: 0.6706,
  },
  {
    src: 'images/concrete-03.jpg',
    alt: 'The words NO ENTRY painted across wet tarmac',
    title: 'NO ENTRY',
    note: 'Rain first. Then the sign.',
    series: 'concrete',
    location: 'London, UK',
    year: '2021',
    ratio: 0.7256,
  },
  {
    src: 'images/concrete-04.jpg',
    alt: 'A streetlight and two small birds against a flat blue sky',
    title: 'Lamp and Two Birds',
    series: 'concrete',
    year: '2018',
    ratio: 0.9273,
  },

  {
    src: 'images/concrete-05.jpg',
    alt: 'Hard-edged shadows thrown across a bare wall',
    title: 'Shadow Fall',
    note: 'One wall, one hour, nothing else happening anywhere.',
    series: 'concrete',
    location: 'Tunis, TN',
    year: '2020',
    ratio: 0.75,
  },
  {
    src: 'images/concrete-06.jpg',
    alt: 'Glass towers rising behind a bus shelter in the City',
    title: 'The City, From a Bus Shelter',
    series: 'concrete',
    location: 'London, UK',
    year: '2021',
    ratio: 0.7633,
  },
  {
    src: 'images/concrete-07.jpg',
    alt: 'A repeating grid of balconies on a tall block, seen from below against a cyan sky',
    title: 'Eighty Balconies',
    note: 'The sky came back this colour. I left it.',
    series: 'concrete',
    ratio: 0.6239,
  },
  {
    src: 'images/concrete-08.jpg',
    alt: 'A flock of birds over a corner building, with two larger shapes among them',
    title: 'Not All of These Are Birds',
    note: 'Look again at the middle of the frame.',
    series: 'concrete',
    ratio: 1.509,
  },

  /* --- Still: things put down, picked up, and left alone ---------------- */
  {
    src: 'images/still-01.jpg',
    alt: 'A single slice of lemon on a pale concrete floor in hard sunlight',
    title: 'Lemon, Noon',
    note: 'Cut in the morning. By the time the light was right it had gone to glass.',
    series: 'still',
    ratio: 0.8012,
    feature: true,
  },
  {
    src: 'images/still-02.jpg',
    alt: 'A pencil lying on concrete, crossed by the soft shadow of something outside the frame',
    title: 'Pencil and the Shadow of Something Else',
    series: 'still',
    ratio: 1,
  },
  {
    src: 'images/still-03.jpg',
    alt: 'A tipped-over cup on stone, its long shadow thrown across the frame',
    title: 'Cup, Face Down',
    note: 'The shadow is the better object.',
    series: 'still',
    ratio: 1.6319,
  },
  {
    src: 'images/still-04.jpg',
    alt: 'Cannabis leaves leaning out from the left of the frame against a flat white wall',
    title: 'Leaning Out',
    note: 'Somebody else’s balcony, and a lot of white wall behind it.',
    series: 'still',
    ratio: 0.5133,
  },
  {
    src: 'images/still-05.jpg',
    alt: 'A goldfish in a clear plastic bottle, held up in two hands against warm window light',
    title: 'Fish, Held Up to the Window',
    note: 'So the water would do something.',
    series: 'still',
    ratio: 0.5761,
  },

  /* --- Winter Light: the quiet frames ---------------------------------- */
  {
    src: 'images/winter-01.jpg',
    alt: 'Bare branches against a white winter sky',
    title: 'Bare',
    series: 'winter',
    location: 'Bournemouth, UK',
    year: '2021',
    ratio: 0.75,
  },
  {
    src: 'images/winter-02.jpg',
    alt: 'A snow-covered path running between trees, one figure far off',
    title: 'Path, With One Figure',
    note: 'A long way off, and getting further.',
    series: 'winter',
    location: 'London, UK',
    year: '2021',
    ratio: 0.75,
  },
  {
    src: 'images/winter-03.jpg',
    alt: 'A figure blurred by a long exposure in a dim corridor',
    title: 'Corridor',
    note: 'Half a second, hand-held.',
    series: 'winter',
    year: '2021',
    ratio: 0.5437,
  },
  {
    src: 'images/winter-04.jpg',
    alt: 'Daylight pooling through a drawn curtain',
    title: 'Curtain',
    note: 'January in Tunis is not winter. The light disagrees.',
    series: 'winter',
    location: 'Tunis, TN',
    year: '2022',
    ratio: 0.75,
  },
  {
    src: 'images/winter-06.jpg',
    alt: 'A snowed-over park seen from above, benches and paths picked out in white',
    title: 'Park, From the Sixth Floor',
    series: 'winter',
    location: 'London, UK',
    year: '2021',
    ratio: 0.75,
  },
  {
    src: 'images/winter-07.jpg',
    alt: 'A figure crossing in front of a bright window, smeared by a long exposure',
    title: 'She Was Faster Than the Shutter',
    note: 'One attempt. There is never a second one of these.',
    series: 'winter',
    ratio: 0.8761,
  },
  /* --- Printed: the work as it was laid out on a page ------------------ */
  {
    src: 'images/printed-01.jpg',
    alt: 'A zine page: a framed text reading "The physical go home but the connection still stay strong", above a small dark photograph',
    title: 'The Physical Go Home',
    note: 'From the zine. The line is not mine.',
    series: 'printed',
    year: '2021',
    ratio: 0.8315,
  },
  {
    src: 'images/printed-02.jpg',
    alt: 'A layout sheet of five black and white London street frames, numbered 009 and 010',
    title: 'Plates 009 — 010',
    series: 'printed',
    location: 'London, UK',
    year: '2021',
    ratio: 1.4138,
  },
];
