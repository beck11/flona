/**
 * Music-section track player — a module-level singleton (one <audio> element
 * ever, surviving re-renders; only one track can play at a time).
 *
 * Audio priority is coordinated with lib/audio.js:
 *   - when a track plays, the global soundtrack ducks to ~10%;
 *   - when it pauses/ends/errors, the soundtrack is restored;
 *   - when a YouTube performance starts (see LiveContent), the Live section
 *     calls pauseForYouTube() and the soundtrack drops to silence — YouTube
 *     always wins.
 * Playback is never tied to scroll; the visitor presses Play.
 */
import { setDucked } from './audio';
import { TRACKS } from './musicTracks';

const state = {
  el: null,
  trackId: null,
  playing: false,
  loading: false,
  error: null, // human-readable message when a file is missing/broken
  time: 0,
  duration: 0,
  volume: 0.9,
  muted: false,
};

// Introspection handle (used by tests / debugging; not part of the API).
if (typeof window !== 'undefined') window.__FLONA_TRACKS__ = state;

const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn());

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getTrackState() {
  return { ...state, el: undefined };
}

function ensureElement() {
  if (state.el) return state.el;
  const el = new Audio();
  el.preload = 'none'; // tracks load on demand, never up-front
  el.volume = state.volume;

  el.addEventListener('timeupdate', () => {
    state.time = el.currentTime;
    emit();
  });
  el.addEventListener('loadedmetadata', () => {
    state.duration = el.duration || 0;
    emit();
  });
  el.addEventListener('waiting', () => {
    state.loading = true;
    emit();
  });
  el.addEventListener('playing', () => {
    state.loading = false;
    state.playing = true;
    state.error = null;
    setDucked(true); // soundtrack steps back while her music plays
    emit();
  });
  el.addEventListener('pause', () => {
    state.playing = false;
    setDucked(false); // soundtrack breathes back in
    emit();
  });
  el.addEventListener('ended', () => {
    state.playing = false;
    state.time = 0;
    setDucked(false);
    emit();
  });
  el.addEventListener('error', () => {
    const track = TRACKS.find((t) => t.id === state.trackId);
    state.loading = false;
    state.playing = false;
    state.error = `This track's audio file isn't available yet — add it at public${track?.audioSrc ?? ''}`;
    setDucked(false);
    emit();
  });

  state.el = el;
  return el;
}

/** Play a track by id; selecting the playing track toggles pause. */
export function playTrack(id) {
  const el = ensureElement();
  const track = TRACKS.find((t) => t.id === id);
  if (!track) return;

  if (state.trackId === id) {
    if (state.playing) el.pause();
    else el.play().catch(() => {});
    return;
  }

  // switching: the single element just changes source — no overlap possible
  state.trackId = id;
  state.error = null;
  state.time = 0;
  state.duration = 0;
  state.loading = true;
  el.src = track.audioSrc;
  el.load();
  el.play().catch(() => {
    /* the 'error' listener reports missing files */
  });
  emit();
}

export function togglePlay() {
  if (state.trackId) playTrack(state.trackId);
  else playTrack(TRACKS[0].id);
}

export function next() {
  const i = TRACKS.findIndex((t) => t.id === state.trackId);
  playTrack(TRACKS[(i + 1) % TRACKS.length].id);
}

export function prev() {
  const i = TRACKS.findIndex((t) => t.id === state.trackId);
  playTrack(TRACKS[(i - 1 + TRACKS.length) % TRACKS.length].id);
}

export function seek(t) {
  if (state.el && Number.isFinite(t)) {
    state.el.currentTime = Math.min(Math.max(0, t), state.duration || 0);
    state.time = state.el.currentTime;
    emit();
  }
}

export function setTrackVolume(v) {
  state.volume = Math.min(1, Math.max(0, v));
  if (state.el) state.el.volume = state.volume;
  emit();
}

export function toggleTrackMute() {
  state.muted = !state.muted;
  if (state.el) state.el.muted = state.muted;
  emit();
}

/** YouTube takes priority: the Live section calls this before embedding. */
export function pauseForYouTube() {
  if (state.el && state.playing) state.el.pause();
}
