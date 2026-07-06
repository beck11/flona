'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { setLenis } from '@/lib/scroll';

gsap.registerPlugin(ScrollTrigger);

/**
 * Buttery smooth scrolling via Lenis, driven by GSAP's ticker so that Lenis,
 * ScrollTrigger and every scrubbed timeline share one clock — this is what
 * keeps the video scrub and the panel animations perfectly in sync.
 */
export default function SmoothScroll({ children }) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.3, // cinematic glide — a touch slower than default
      smoothWheel: true,
    });
    setLenis(lenis);

    // Let ScrollTrigger re-measure on every smoothed scroll frame.
    lenis.on('scroll', ScrollTrigger.update);

    // Drive Lenis from GSAP's ticker (time is seconds, Lenis wants ms).
    const raf = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      setLenis(null);
    };
  }, []);

  return children;
}
