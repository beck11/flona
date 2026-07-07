'use client';

import { useEffect, useState } from 'react';
import { TRACKS } from '@/lib/musicTracks';
import {
  subscribe,
  getTrackState,
  playTrack,
  togglePlay,
  next,
  prev,
  seek,
  setTrackVolume,
  toggleTrackMute,
} from '@/lib/trackPlayer';
import { EdLabel, EdTitle } from './EdBits';

/**
 * Section 3 — Music. Expands to a fullscreen editorial page containing a
 * real audio player (see lib/trackPlayer.js for the singleton engine and
 * lib/musicTracks.js for where to add real tracks). Playback is entirely
 * user-driven — never tied to scroll. The global soundtrack ducks itself
 * while a track plays.
 */
const fmt = (t) =>
  Number.isFinite(t) && t > 0
    ? `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`
    : '0:00';

export default function MusicContent() {
  const [s, setS] = useState(getTrackState);
  useEffect(() => subscribe(() => setS(getTrackState())), []);

  const active = TRACKS.find((t) => t.id === s.trackId) ?? TRACKS[0];

  return (
    <div className="content content--ed">
      <EdLabel>03 — Music</EdLabel>
      <EdTitle text="Selected works" accent="works" />

      {/* ——— player ——— */}
      <div className="ed-item reveal player" aria-label="Music player">
        {/* artwork (monogram tile until real art is added in lib/musicTracks.js) */}
        {active.artwork ? (
          <img className="player__art" src={active.artwork} alt="" loading="lazy" />
        ) : (
          <div className="player__art player__art--mono" aria-hidden="true">
            FK
          </div>
        )}

        <div className="player__main">
          <p className="player__title">{active.title}</p>
          <p className="player__subtitle">{active.subtitle}</p>

          <div className="player__transport">
            <button type="button" onClick={prev} aria-label="Previous track">
              ‹‹
            </button>
            <button
              type="button"
              className="player__play"
              onClick={togglePlay}
              aria-label={s.playing ? 'Pause' : 'Play'}
            >
              {s.loading ? (
                <span className="player__spinner" aria-hidden="true" />
              ) : s.playing ? (
                <span className="player__icon-pause" aria-hidden="true" />
              ) : (
                <span className="player__icon-play" aria-hidden="true" />
              )}
            </button>
            <button type="button" onClick={next} aria-label="Next track">
              ››
            </button>
          </div>

          <div className="player__progress">
            <span className="player__time">{fmt(s.time)}</span>
            <input
              type="range"
              min="0"
              max={s.duration || 0}
              step="0.1"
              value={Math.min(s.time, s.duration || 0)}
              onChange={(e) => seek(parseFloat(e.target.value))}
              aria-label="Seek"
              disabled={!s.duration}
            />
            <span className="player__time">{fmt(s.duration)}</span>
          </div>

          <div className="player__volume">
            <button
              type="button"
              onClick={toggleTrackMute}
              aria-label={s.muted ? 'Unmute track' : 'Mute track'}
              aria-pressed={s.muted}
            >
              {s.muted ? '×' : '♪'}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={s.volume}
              onChange={(e) => setTrackVolume(parseFloat(e.target.value))}
              aria-label="Track volume"
            />
          </div>

          {s.error && <p className="player__error">{s.error}</p>}
        </div>
      </div>

      {/* ——— track list ——— */}
      <ul className="ed-item reveal tracklist">
        {TRACKS.map((track, i) => {
          const isActive = track.id === s.trackId;
          return (
            <li key={track.id}>
              <button
                type="button"
                className={`trackrow${isActive ? ' is-active' : ''}`}
                onClick={() => playTrack(track.id)}
                aria-current={isActive ? 'true' : undefined}
              >
                <span className="trackrow__index">
                  {isActive && s.playing ? '▶' : String(i + 1).padStart(2, '0')}
                </span>
                <span className="trackrow__title">{track.title}</span>
                <span className="trackrow__meta">{track.subtitle}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
