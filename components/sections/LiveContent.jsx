'use client';

import { useEffect, useRef, useState } from 'react';
import { PERFORMANCES, getYouTubeId } from '@/lib/livePerformances';
import { setYouTubeActive } from '@/lib/audio';
import { pauseForYouTube } from '@/lib/trackPlayer';

/**
 * Section 4 — Live. YouTube performances as cinematic cards (real links go
 * in lib/livePerformances.js). Lightweight thumbnails only; the privacy-
 * enhanced youtube-nocookie iframe is created ONLY after the visitor presses
 * play, and only one can exist at a time. While a performance plays, the
 * music track pauses and the global soundtrack falls silent (audio priority
 * lives in lib/audio.js + lib/trackPlayer.js); closing restores it.
 */
export default function LiveContent() {
  const [activeId, setActiveId] = useState(null);
  const triggerRef = useRef(null); // card that opened the video, for focus restore
  const closeRef = useRef(null);

  const open = (id, e) => {
    triggerRef.current = e.currentTarget;
    pauseForYouTube(); // music track steps aside
    setYouTubeActive(true); // soundtrack falls silent
    setActiveId(id); // only one iframe ever exists
  };

  const close = () => {
    setYouTubeActive(false);
    setActiveId(null);
    triggerRef.current?.focus();
  };

  // Escape closes; focus lands on the close button while a video is open.
  useEffect(() => {
    if (!activeId) return undefined;
    closeRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [activeId]);

  return (
    <div className="content content--ed">
      <p className="ed-label reveal">
        <span className="ed-label__line" aria-hidden="true" />
        <span className="ed-label__mask">
          <span className="ed-label__text eyebrow">04 — Live</span>
        </span>
      </p>
      <h2 className="ed-title reveal" aria-label="On stage, the voice becomes a world.">
        {'On stage, the voice becomes a world.'.split(' ').map((word, i, arr) => (
          <span key={i}>
            <span className="ed-title__mask" aria-hidden="true">
              <span className="ed-title__word">
                {word === 'voice' ? <em>{word}</em> : word}
              </span>
            </span>
            {i < arr.length - 1 ? ' ' : ''}
          </span>
        ))}
      </h2>

      <ul className="ed-item reveal livegrid">
        {PERFORMANCES.map((perf) => {
          const ytId = getYouTubeId(perf.youtubeUrl);
          const isOpen = activeId === perf.id;
          const thumb =
            perf.thumbnail || (ytId ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` : null);
          return (
            <li key={perf.id} className="livecard">
              {isOpen && ytId ? (
                <div className="livecard__player">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0`}
                    title={`${perf.title} — live performance video`}
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                  />
                  <button
                    ref={closeRef}
                    type="button"
                    className="livecard__close"
                    onClick={close}
                    aria-label="Close video"
                  >
                    ×
                  </button>
                </div>
              ) : ytId ? (
                <button
                  type="button"
                  className="livecard__face"
                  onClick={(e) => open(perf.id, e)}
                  aria-label={`Watch live: ${perf.title}`}
                >
                  {/* real YouTube thumbnail — no iframe until pressed */}
                  <img src={thumb} alt="" loading="lazy" />
                  <span className="livecard__badge" aria-hidden="true">
                    ▶ Watch live
                  </span>
                </button>
              ) : (
                /* placeholder URL — clear notice instead of a broken embed */
                <div className="livecard__face livecard__face--todo">
                  <span>
                    Paste the real YouTube link for this performance in
                    lib/livePerformances.js
                  </span>
                </div>
              )}
              <div className="livecard__meta">
                <p className="livecard__title">{perf.title}</p>
                <p className="livecard__sub">
                  {[perf.venue, perf.year].filter(Boolean).join(' — ')}
                </p>
                {ytId && (
                  <a
                    className="livecard__ext"
                    href={perf.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open on YouTube
                  </a>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
