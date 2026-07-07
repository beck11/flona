/**
 * Global soundtrack controller — a module-level singleton so exactly ONE
 * audio instance exists, surviving React re-renders and never restarting
 * between sections.
 *
 * Volume model (all multiplied together):
 *   sectionVolume — set by the existing ScrollTrigger timeline as the visitor
 *                   moves through the story (see SECTION_VOLUMES below)
 *   userVolume    — the persistent corner control's slider
 *   duck          — dropped to ~0.1 while a performance video plays audio
 *   mute          — element.muted (keeps playback position intact)
 *
 * Audio is routed through a Web Audio GainNode because iOS Safari ignores
 * HTMLMediaElement.volume; the gain ramps (1.5–3s) give the smooth,
 * never-abrupt transitions. If Web Audio is unavailable we fall back to
 * tweening element.volume directly.
 */

const SRC = '/audio/flona-main.mp3';
const STORAGE_KEY = 'flona-audio-prefs';
const FADE_S = 2; // default section crossfade duration (seconds)
const DUCK_LEVEL = 0.1; // soundtrack level while a performance video speaks

// The musical arc of the scroll story: distant in the hero, present in About,
// climax in Music, intimate in Booking, hushed while Flona turns to face us,
// then a slow dissolve to silence on her final pose.
const SECTION_VOLUMES = {
  hero: 0.2,
  about: 0.4,
  music: 0.85,
  live: 0.3, // quiet under the performance cards
  contact: 0.35,
  turn: 0.2,
  finale: 0,
};

const state = {
  el: null, // the single HTMLAudioElement
  ctx: null, // AudioContext (created on user gesture)
  gain: null,
  started: false, // visitor pressed "enter with sound" (or unmuted later)
  muted: false,
  userVolume: 1,
  section: 'hero',
  ducked: false,
  ytActive: false, // a YouTube performance is playing — highest priority
  pausedByTab: false,
  fallbackTween: null, // rAF fade when Web Audio is unavailable
};

// Introspection handle (used by tests / debugging; not part of the API).
if (typeof window !== 'undefined') window.__FLONA_AUDIO__ = state;

const listeners = new Set();

function emit() {
  listeners.forEach((fn) => fn());
}

/** Subscribe UI components to controller changes. Returns an unsubscribe. */
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getAudioState() {
  return {
    started: state.started,
    muted: state.muted,
    userVolume: state.userVolume,
    playing: !!state.el && !state.el.paused && state.started && !state.muted,
  };
}

/* ------------------------- persistence (session) ------------------------- */

function savePrefs() {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ muted: state.muted, userVolume: state.userVolume })
    );
  } catch {
    /* storage unavailable — preferences just won't persist */
  }
}

export function loadPrefs() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (typeof p.userVolume === 'number') state.userVolume = p.userVolume;
      if (typeof p.muted === 'boolean') state.muted = p.muted;
    }
  } catch {
    /* ignore malformed prefs */
  }
  emit();
}

/* ----------------------------- audio plumbing ---------------------------- */

function ensureElement() {
  if (state.el) return state.el;
  const el = new Audio(SRC);
  el.loop = true; // reaching the end loops smoothly
  el.preload = 'auto';
  el.crossOrigin = 'anonymous';
  state.el = el;
  return el;
}

/** Build the WebAudio graph. Must be called from a user gesture. */
function ensureGraph() {
  const el = ensureElement();
  if (state.ctx || typeof window === 'undefined') return;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return; // fallback path will tween el.volume instead
  try {
    state.ctx = new Ctx();
    const source = state.ctx.createMediaElementSource(el);
    state.gain = state.ctx.createGain();
    state.gain.gain.value = 0;
    source.connect(state.gain);
    state.gain.connect(state.ctx.destination);
  } catch {
    state.ctx = null;
    state.gain = null;
  }
}

/* Audio priority: YouTube performance (silence the soundtrack entirely)
   → user-selected music track / performance video (duck to ~10%)
   → the global soundtrack at its section level. */
function targetVolume() {
  if (state.ytActive) return 0;
  const section = SECTION_VOLUMES[state.section] ?? 0.3;
  const base = state.ducked ? Math.min(DUCK_LEVEL, section) : section;
  return base * state.userVolume;
}

/** Smoothly ramp toward the current target. Never jumps. */
function fadeToTarget(seconds = FADE_S) {
  const target = targetVolume();
  if (state.gain && state.ctx) {
    const g = state.gain.gain;
    const now = state.ctx.currentTime;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(target, now + seconds);
  } else if (state.el) {
    // Fallback: rAF lerp of element.volume (no Web Audio available).
    cancelAnimationFrame(state.fallbackTween);
    const el = state.el;
    const from = el.volume;
    const t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / (seconds * 1000));
      el.volume = from + (target - from) * p;
      if (p < 1) state.fallbackTween = requestAnimationFrame(step);
    };
    state.fallbackTween = requestAnimationFrame(step);
  }
}

/* ------------------------------- public API ------------------------------ */

/** "Enter with sound" — must run inside a click/tap handler (autoplay rules). */
export function startWithSound() {
  ensureGraph();
  const el = ensureElement();
  state.started = true;
  state.muted = false;
  el.muted = false;
  if (state.ctx?.state === 'suspended') state.ctx.resume();
  if (!state.gain) el.volume = 0; // fallback: begin at low volume
  el.play().catch(() => {
    /* if playback is still blocked, the corner control can retry */
  });
  fadeToTarget(2.5); // rise gently into the current section's level
  savePrefs();
  emit();
}

/** "Continue without sound" — nothing plays until the visitor unmutes. */
export function declineSound() {
  state.muted = true;
  savePrefs();
  emit();
}

/** Corner control: toggle mute. Unmuting also serves as the first gesture. */
export function toggleMute() {
  if (!state.started) {
    startWithSound();
    return;
  }
  state.muted = !state.muted;
  // Muting via element.muted preserves the playback position exactly.
  state.el.muted = state.muted;
  if (!state.muted && state.el.paused) state.el.play().catch(() => {});
  savePrefs();
  emit();
}

/** Corner control: master volume slider (0..1). */
export function setUserVolume(v) {
  state.userVolume = Math.min(1, Math.max(0, v));
  fadeToTarget(0.4); // slider feels responsive but still glides
  savePrefs();
  emit();
}

/**
 * Called by the existing ScrollTrigger timeline's onUpdate with the id of the
 * section currently on screen ('hero' | 'about' | 'music' | 'contact' |
 * 'finale'). Only the volume changes — playback time is never touched.
 */
export function setSection(id) {
  if (id === state.section) return;
  state.section = id;
  if (state.started) fadeToTarget(FADE_S);
}

/** Duck under a performance video's / music track's own audio. */
export function setDucked(on) {
  if (on === state.ducked) return;
  state.ducked = on;
  if (state.started) fadeToTarget(1.5);
}

/** A YouTube performance opened/closed — it outranks everything. */
export function setYouTubeActive(on) {
  if (on === state.ytActive) return;
  state.ytActive = on;
  if (state.started) fadeToTarget(on ? 1 : 2);
  emit();
}

/** Tab hidden → pause; tab visible → resume only if the visitor chose sound. */
export function handleVisibility(hidden) {
  if (!state.el || !state.started) return;
  if (hidden) {
    state.pausedByTab = !state.el.paused;
    state.el.pause();
  } else if (state.pausedByTab) {
    state.pausedByTab = false;
    state.el.play().catch(() => {});
  }
  emit();
}
