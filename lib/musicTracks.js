/**
 * MUSIC SECTION — track catalogue.
 *
 * ─── HOW TO ADD REAL TRACKS ──────────────────────────────────────────
 * 1. Drop the audio file into  public/audio/tracks/   (mp3 or m4a/aac)
 * 2. Optionally drop cover art into  public/images/music/
 * 3. Fill in the entry below:
 *      id       — unique slug (used internally)
 *      title    — the real track title (shown to visitors)
 *      subtitle — optional release info ("Single — 2026", etc.)
 *      audioSrc — "/audio/tracks/your-file.mp3"
 *      artwork  — "/images/music/your-art.jpg"  or null for a monogram tile
 *
 * Track 1 points at the soundtrack file you already supplied
 * ("Let It Go Loud"), so the player works out of the box.
 * Tracks 2–3 are PLACEHOLDERS — replace them with real releases.
 * ─────────────────────────────────────────────────────────────────────
 */
export const TRACKS = [
  {
    id: 'let-it-go-loud',
    title: 'Let It Go Loud',
    subtitle: 'Add release information',
    audioSrc: '/audio/flona-main.mp3', // existing file — replace if you have a clean master
    artwork: null,
  },
  {
    id: 'track-2',
    title: 'Track title', // PLACEHOLDER — replace with the real title
    subtitle: 'Add release information',
    audioSrc: '/audio/tracks/replace-with-real-track-2.mp3', // PLACEHOLDER file path
    artwork: null,
  },
  {
    id: 'track-3',
    title: 'Track title', // PLACEHOLDER — replace with the real title
    subtitle: 'Add release information',
    audioSrc: '/audio/tracks/replace-with-real-track-3.mp3', // PLACEHOLDER file path
    artwork: null,
  },
];
