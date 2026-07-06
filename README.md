# Flona Kimia — Cinematic Scroll Film

A one-page, scroll-driven artist site. The hero video is scrubbed by scroll;
at four key moments a square panel from the scene detaches, flies toward the
viewer and expands into a content section (Intro → About → Music → Booking),
then fades back to black while Flona walks on. After Booking, a final chapter
(`public/video/flona-final-turn.mp4`, also all-intra encoded) reveals Flona
back-to-camera on black; scroll turns her around to face the viewer, a warm
bloom swells, and the closing words "Flona Kimia — Her voice. Her universe."
breathe in over her final pose while the soundtrack dissolves to silence.
Visitors with prefers-reduced-motion get a quiet crossfade from her first to
final pose instead of the scrubbed turn.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
```

## Stack

- **Next.js 14** (App Router) + React 18
- **GSAP + ScrollTrigger** — one master timeline, pinned stage, scrub: 1
- **Lenis** — smooth scrolling, driven by GSAP's ticker so scroll, video and
  animation share one clock
- Custom CSS (no framework), black throughout

## How it works

- `components/CinematicExperience.jsx` — the orchestrator. Builds a single
  pinned ScrollTrigger timeline: for each section it scrubs the video to a
  timestamp (**walk**), animates the panel from its on-screen rect inside the
  footage to an expanded card (**emerge**), staggers the copy (**reveal**),
  holds, then fades everything to black (**veil**) before the next walk.
- `lib/sections.js` — all tuning lives here: video timestamps, panel origin
  rects, which side each card settles on, dim/pan amounts, and page copy.
- `components/SectionPanel.jsx` — reusable glass panel; `panel--frame` is the
  hero variant (a luminous frame that closes around Flona).
- `components/SmoothScroll.jsx` — Lenis ↔ GSAP wiring.
- `lib/audio.js` + `components/AudioSystem.jsx` — the soundtrack
  (`public/audio/flona-main.mp3`). One global audio instance routed through a
  Web Audio GainNode; the existing ScrollTrigger timeline reports the active
  chapter and only the **volume** ramps (hero 20% → about 40% → music 85% →
  booking 35% → finale 10%) — playback time is never scrubbed. Includes the
  sound-entry overlay, the corner mute/volume control (prefs in
  sessionStorage), tab-visibility pausing, and automatic ducking under any
  future unmuted performance video.
- `public/flona.mp4` — re-encoded **all-intra** (a keyframe on every frame) so
  `video.currentTime` seeking is frame-accurate and butter-smooth. If you swap
  the footage, re-encode the same way, e.g.
  `ffmpeg -i in.mp4 -c:v libx264 -g 1 -crf 18 -an out.mp4`,
  then update the timestamps in `lib/sections.js`.
