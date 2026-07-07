/**
 * LIVE SECTION — YouTube live performances.
 *
 * ─── HOW TO ADD REAL PERFORMANCES ────────────────────────────────────
 * Paste the real YouTube URL into `youtubeUrl` (any normal format works:
 * youtube.com/watch?v=…, youtu.be/…, youtube.com/live/…).
 * The thumbnail is pulled automatically from YouTube; supply `thumbnail`
 * only if you want a custom image (put it in public/images/live/).
 * Title / venue / year are optional but strongly recommended.
 *
 * Cards with a placeholder URL show an "add the real link" notice and
 * cannot be played — nothing breaks.
 * ─────────────────────────────────────────────────────────────────────
 */
export const PERFORMANCES = [
  {
    id: 'bahina',
    title: 'Flona Kimia at the Bahina', // real title from the YouTube video
    venue: '', // optional — add if you want it shown
    year: '', // optional
    youtubeUrl: 'https://www.youtube.com/watch?v=gsd3XK56UzE',
    thumbnail: null,
  },
  {
    id: 'only-you',
    title: 'Only You — Tu ne Sauras Jamais', // real title from the YouTube video
    venue: '',
    year: '',
    youtubeUrl: 'https://www.youtube.com/watch?v=P5Wq4Y0vvNc',
    thumbnail: null,
  },
];

/** Extract a YouTube video id from any common URL shape; null if invalid. */
export function getYouTubeId(url) {
  if (!url || typeof url !== 'string') return null;
  const m = url.match(
    /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|live\/|shorts\/)|youtu\.be\/)([\w-]{11})/
  );
  return m ? m[1] : null;
}
