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
    id: 'live-1',
    title: 'Live performance title', // PLACEHOLDER — replace
    venue: 'Add venue', // optional
    year: '', // optional
    youtubeUrl: 'PASTE_REAL_YOUTUBE_URL_HERE', // PLACEHOLDER — replace
    thumbnail: null,
  },
  {
    id: 'live-2',
    title: 'Live performance title', // PLACEHOLDER — replace
    venue: '',
    year: '',
    youtubeUrl: 'PASTE_REAL_YOUTUBE_URL_HERE', // PLACEHOLDER — replace
    thumbnail: null,
  },
  {
    id: 'live-3',
    title: 'Live performance title', // PLACEHOLDER — replace
    venue: '',
    year: '',
    youtubeUrl: 'PASTE_REAL_YOUTUBE_URL_HERE', // PLACEHOLDER — replace
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
