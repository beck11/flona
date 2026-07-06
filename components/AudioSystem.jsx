'use client';

import { useEffect, useState } from 'react';
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

  const choose = (withSound) => {
    if (withSound) startWithSound();
    else declineSound();
    setLeaving(true); // CSS fades the overlay, then it unmounts
    setTimeout(() => setEntered(true), 700);
  };

  return (
    <>
      {!entered && (
        <div className={`audio-entry${leaving ? ' audio-entry--leaving' : ''}`}>
          <p className="audio-entry__note">This is a film. It sounds better loud.</p>
          <div className="audio-entry__actions">
            <button type="button" className="cta" onClick={() => choose(true)}>
              Enter with sound
            </button>
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
