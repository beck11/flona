/**
 * Timeline configuration for the four scroll-driven sections.
 *
 * The whole site is one pinned "stage": the video is scrubbed by scroll, and at
 * each `videoTime` the walk pauses while a square panel — matching one of the
 * glowing panels Flona looks at in the footage — detaches from the scene,
 * flies toward the viewer and expands into a content card.
 *
 * - videoTime : timestamp (seconds) in flona.mp4 where this section emerges
 * - origin    : approximate on-screen rect of the source panel in the video
 *               frame at that moment (viewport %). The card animates FROM this
 *               rect so it visually originates inside the scene.
 * - side      : where the expanded card settles. Side cards keep Flona
 *               (center frame) visible next to the content.
 * - pan       : xPercent nudge applied to the video while the card is open, so
 *               Flona steps out from behind the card.
 * - dim       : video brightness while the card is open (1 = untouched)
 * - variant   : 'frame' = thin luminous frame around Flona (hero),
 *               'card'  = translucent glass content card
 */

export const VIDEO_SRC = '/flona.mp4';
export const VIDEO_POSTER = '/poster.jpg';
export const VIDEO_END = 7.95; // last safely-seekable moment of the 8.04s clip

// Final reveal: Flona starts back-to-camera on black and turns to face us.
// Also all-intra encoded for frame-accurate scroll scrubbing.
export const TURN_VIDEO_SRC = '/video/flona-final-turn.mp4';
export const TURN_VIDEO_END = 7.95;

export const SECTIONS = [
  {
    id: 'hero',
    label: 'Intro',
    videoTime: 0.55,
    origin: { x: 72, y: 37, w: 22, h: 58 },
    side: 'center',
    pan: 0,
    dim: 0.78,
    variant: 'frame',
  },
  {
    id: 'about',
    label: 'About',
    videoTime: 2.45,
    origin: { x: 26, y: 34, w: 26, h: 58 },
    side: 'left',
    pan: 8,
    dim: 0.42,
    variant: 'card',
  },
  {
    id: 'music',
    label: 'Music',
    videoTime: 4.6,
    origin: { x: 78, y: 36, w: 22, h: 54 },
    side: 'right',
    pan: -8,
    dim: 0.42,
    variant: 'card',
  },
  {
    id: 'live',
    label: 'Live',
    videoTime: 6.1,
    origin: { x: 26, y: 35, w: 24, h: 52 },
    side: 'left',
    pan: 8,
    dim: 0.42,
    variant: 'card',
  },
  {
    id: 'contact',
    label: 'Booking',
    videoTime: 7.25,
    origin: { x: 50, y: 34, w: 22, h: 50 },
    side: 'center',
    pan: 0,
    dim: 0.5,
    variant: 'card',
  },
];

export const SOCIALS = [
  { name: 'Instagram', href: '#' },
  { name: 'Spotify', href: '#' },
  { name: 'YouTube', href: '#' },
  { name: 'TikTok', href: '#' },
];

export const BOOKING_EMAIL = 'booking@flonakimia.com';
