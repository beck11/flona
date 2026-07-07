'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import {
  subscribe,
  getAudioState,
  loadPrefs,
  startWithSound,
  declineSound,
  toggleMute,
  setUserVolume,
  setDucked,
  handleVisibility,
} from '@/lib/audio';

/**
 * The site's audio layer: a cinematic sound-entry overlay (autoplay needs a
 * real gesture) and a persistent corner control (mute / volume / playing
 * indicator). Pure additions — the scroll experience is untouched; section
 * volume changes are driven from the existing ScrollTrigger timeline via
 * lib/audio's setSection().
 */
export default function AudioSystem() {
  const [audio, setAudio] = useState(getAudioState);
  const [entered, setEntered] = useState(false); // choice made?
  const [leaving, setLeaving] = useState(false); // overlay fading out
  const entryRef = useRef(null);

  // Entrance: the note and buttons rise from behind overflow-hidden masks,
  // timed after the opening portrait/wordmark reveal. Reduced motion just
  // shows them. (CSS keeps them hidden pre-hydration to avoid a flash.)
  useEffect(() => {
    if (!entryRef.current) return undefined;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      if (reduce) {
        gsap.set('.audio-entry__note, .audio-entry__cta, .audio-entry__silent', {
          autoAlpha: 1,
        });
        return;
      }
      gsap
        .timeline({ defaults: { ease: 'power4.out' } })
        .fromTo(
          '.audio-entry__note',
          { yPercent: 130, autoAlpha: 0 },
          { yPercent: 0, autoAlpha: 1, duration: 0.9 },
          1.05
        )
        .fromTo(
          '.audio-entry__cta',
          { yPercent: 140, autoAlpha: 0 },
          { yPercent: 0, autoAlpha: 1, duration: 0.9 },
          1.25
        )
        .fromTo(
          '.audio-entry__silent',
          { y: 10, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.7, ease: 'power2.out' },
          1.65
        )
        // release the masks so the button's glow isn't clipped afterwards
        .set('.audio-entry__maskline', { overflow: 'visible' });
    }, entryRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    loadPrefs();
    const unsub = subscribe(() => setAudio(getAudioState()));

    // Tab visibility: pause when hidden, resume only if sound was chosen.
    const onVis = () => handleVisibility(document.hidden);
    document.addEventListener('visibilitychange', onVis);

    // Performance-video ducking ('play'/'pause' don't bubble → capture phase).
    // The cinematic stage video is muted, so it never triggers this.
    const onPlay = (e) => {
      const v = e.target;
      if (v.tagName !== 'VIDEO' || v.muted) return;
      // Only one video may speak at a time.
      document.querySelectorAll('video').forEach((other) => {
        if (other !== v && !other.muted && !other.paused) other.pause();
      });
      setDucked(true);
    };
    const onStop = (e) => {
      if (e.target.tagName === 'VIDEO' && !e.target.muted) setDucked(false);
    };
    document.addEventListener('play', onPlay, true);
    document.addEventListener('pause', onStop, true);
    document.addEventListener('ended', onStop, true);

    return () => {
      unsub();
      document.removeEventListener('visibilitychange', onVis);
      document.removeEventListener('play', onPlay, true);
      document.removeEventListener('pause', onStop, true);
      document.removeEventListener('ended', onStop, true);
    };
  }, []);

  const choose = (withSound, e) => {
    if (withSound) startWithSound();
    else declineSound();
    setLeaving(true); // CSS fades the overlay …
    // … while the content departs with a pulse and a gentle upward drift
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce && entryRef.current) {
      const tl = gsap.timeline();
      if (withSound && e?.currentTarget) {
        tl.to(e.currentTarget, { scale: 1.05, duration: 0.16, ease: 'power2.out' }).to(
          e.currentTarget,
          { scale: 1, duration: 0.22, ease: 'power2.inOut' }
        );
      }
      tl.to(
        entryRef.current.children,
        { y: -26, autoAlpha: 0, stagger: 0.07, duration: 0.5, ease: 'power2.in' },
        withSound ? 0.15 : 0
      );
    }
    setTimeout(() => setEntered(true), 800);
  };

  return (
    <>
      {!entered && (
        <div
          ref={entryRef}
          className={`audio-entry${leaving ? ' audio-entry--leaving' : ''}`}
        >
          <span className="audio-entry__maskline">
            <p className="audio-entry__note">This is a film. It sounds better loud.</p>
          </span>
          <div className="audio-entry__actions">
            <span className="audio-entry__maskline">
              <button
                type="button"
                className="audio-entry__cta"
                onClick={(e) => choose(true, e)}
              >
                Enter with sound
              </button>
            </span>
            <button
              type="button"
              className="audio-entry__silent"
              onClick={() => choose(false)}
            >
              Continue without sound
            </button>
          </div>
        </div>
      )}

      <div className="audio-control">
        <button
          type="button"
          className={`audio-control__toggle${audio.playing ? ' is-playing' : ''}`}
          onClick={toggleMute}
          aria-label={audio.muted || !audio.started ? 'Unmute soundtrack' : 'Mute soundtrack'}
          aria-pressed={!audio.muted && audio.started}
        >
          {/* Equalizer bars — animate only while sound is audible. */}
          <span className="audio-control__bars" aria-hidden="true">
            <i /><i /><i />
          </span>
        </button>
        <input
          className="audio-control__volume"
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={audio.userVolume}
          onChange={(e) => setUserVolume(parseFloat(e.target.value))}
          aria-label="Soundtrack volume"
        />
      </div>
    </>
  );
}
