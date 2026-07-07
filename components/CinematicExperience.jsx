'use client';

import { Fragment, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  SECTIONS,
  VIDEO_SRC,
  VIDEO_POSTER,
  TURN_VIDEO_SRC,
  TURN_VIDEO_END,
} from '@/lib/sections';
import { getLenis } from '@/lib/scroll';
import { setSection as setAudioSection } from '@/lib/audio';
import SectionPanel from './SectionPanel';
import HeroContent from './sections/HeroContent';
import AboutContent from './sections/AboutContent';
import MusicContent from './sections/MusicContent';
import LiveContent from './sections/LiveContent';
import ContactContent from './sections/ContactContent';

gsap.registerPlugin(ScrollTrigger);

const CONTENT = {
  hero: HeroContent,
  about: AboutContent,
  music: MusicContent,
  live: LiveContent,
  contact: ContactContent,
};

// Ghost ribbon that drifts across the black transition beats; its speed and
// direction follow the visitor's scroll velocity.
const MARQUEE_UNITS = ['Flona Kimia', 'Her Voice', 'Her Universe'];

/* ------------------------------------------------------------------ */
/* Geometry helpers — function-based so ScrollTrigger re-computes them  */
/* on refresh/resize (invalidateOnRefresh).                             */
/* ------------------------------------------------------------------ */

/**
 * Where the panel STARTS: the rect (in px) of the square panel inside the
 * video frame at that timestamp, so the card feels like it detaches from the
 * scene. On narrow screens the video is cropped by object-fit: cover, so we
 * clamp x toward the center to keep the origin on-screen.
 */
function originRect(section) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const narrow = vw / vh < 1.2;
  const x = narrow ? gsap.utils.clamp(32, 68, section.origin.x) : section.origin.x;
  return {
    left: (vw * x) / 100,
    top: (vh * section.origin.y) / 100,
    width: (vw * section.origin.w) / 100,
    height: (vh * section.origin.h) / 100,
  };
}

/**
 * Where the panel ENDS. Side cards settle left/right of centre so Flona
 * (always mid-frame) stays visible beside the content; on mobile every card
 * centres and she glows through the glass.
 */
function targetRect(section) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const mobile = vw < 840;

  if (section.variant === 'frame') {
    // Hero: a luminous frame that closes around Flona herself.
    return {
      left: vw * 0.5,
      top: vh * 0.47,
      width: Math.min(vw * 0.88, 920),
      height: Math.min(vh * 0.74, 680),
    };
  }

  const width = mobile ? vw * 0.9 : Math.min(vw * 0.42, 600);
  const height = mobile ? Math.min(vh * 0.74, 640) : Math.min(vh * 0.72, 660);
  const left =
    mobile || section.side === 'center'
      ? vw * 0.5
      : section.side === 'left'
        ? vw * 0.29
        : vw * 0.71;
  return { left, top: vh * 0.5, width, height };
}

/* ------------------------------------------------------------------ */

export default function CinematicExperience() {
  const trackRef = useRef(null);
  const stageRef = useRef(null);
  const videoRef = useRef(null);
  const turnVideoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    const turnVideo = turnVideoRef.current;
    let mm;

    /* iOS Safari unlock: React omits the `muted` attribute from rendered
       HTML, and iOS refuses to decode/paint frames of a scrubbed video until
       a muted play() runs inside a real user gesture. Without this the films
       stay invisible on iPhone. Prime both videos on the first touch/click,
       then hand control straight back to the scrub. */
    const primeVideos = () => {
      [video, turnVideo].forEach((v) => {
        v.muted = true;
        v.setAttribute('muted', '');
        v.setAttribute('webkit-playsinline', '');
        const p = v.play();
        if (p) p.then(() => v.pause()).catch(() => {});
      });
    };
    window.addEventListener('touchstart', primeVideos, { once: true, passive: true });
    window.addEventListener('pointerdown', primeVideos, { once: true });

    // The turn film starts as preload="metadata"; we pull the full file once
    // the visitor is past the Music chapter. Lives outside matchMedia so a
    // breakpoint change never re-downloads it.
    let turnLoadKicked = false;

    const build = () => {
      // gsap.matchMedia reverts and rebuilds the timeline when a breakpoint
      // or the reduced-motion preference changes — one clean timeline at a
      // time, never duplicates, and function-based values re-measure via
      // invalidateOnRefresh for plain resizes within a breakpoint.
      mm = gsap.matchMedia(stageRef);
      mm.add(
        {
          isMobile: '(max-width: 767px)',
          isTablet: '(min-width: 768px) and (max-width: 1023px)',
          isDesktop: '(min-width: 1024px)',
          reduceMotion: '(prefers-reduced-motion: reduce)',
        },
        (mmCtx) => {
        const { isMobile, isTablet } = mmCtx.conditions;
        const prefersReducedMotion = mmCtx.conditions.reduceMotion;
        // Device-tuned motion intensity: phones get less blur/3D/parallax so
        // scrolling stays smooth; the storytelling beats are identical.
        const M = {
          panelTilt: isMobile ? 0 : isTablet ? 6 : 10,
          panelZ: isMobile ? -60 : -140,
          panelBlur: isMobile ? 3 : 6,
          dimScale: isMobile ? 1.04 : 1.08,
          pushScale: isMobile ? 1.05 : 1.08,
          pushZ: isMobile ? 50 : 120,
          pushBlur: isMobile ? 4 : isTablet ? 6 : 8,
          exitScale: isMobile ? 1.06 : 1.12,
          stagger: isMobile ? 0.1 : 0.14,
        };
        const q = gsap.utils.selector(stageRef);
        const veil = q('.veil');
        const cue = q('.cue');
        const opening = q('.opening');
        const bloom = q('.turn-bloom');
        const endcard = q('.endcard');
        const mask = q('.mask');
        const curtain = q('.curtain');
        const wipeLine = q('.wipe-line');
        const splitTop = q('.split__top');
        const splitBottom = q('.split__bottom');
        const marquee = q('.marquee');
        let marqueeTick; // ticker callback, removed in cleanup
        const railItems = gsap.utils.toArray(q('.rail button'));

        // Proxy object scrubbed by the timeline; onUpdate pushes it into the
        // <video>. The clip is encoded all-intra (a keyframe on every frame)
        // so seeking is frame-accurate and smooth.
        const playhead = { t: 0 };
        const applyTime = () => {
          if (video.readyState >= 1 && Math.abs(video.currentTime - playhead.t) > 0.001) {
            video.currentTime = playhead.t;
          }
        };
        // Same scrub mechanism for the final turn film; independent proxy so
        // the two videos never fight over one value.
        const turnPlayhead = { t: 0 };
        const applyTurnTime = () => {
          if (
            turnVideo.readyState >= 1 &&
            Math.abs(turnVideo.currentTime - turnPlayhead.t) > 0.001
          ) {
            turnVideo.currentTime = turnPlayhead.t;
          }
        };

        // Hide all panels & content before the journey begins. Centering is
        // handed to GSAP as xPercent/yPercent: the CSS translate(-50%,-50%)
        // would otherwise be baked into PIXELS at first parse and go stale
        // as the panel animates from its small origin rect to full size.
        SECTIONS.forEach((s) => {
          gsap.set(q(`[data-panel="${s.id}"]`), {
            autoAlpha: 0,
            // zero the px offsets GSAP parsed from the CSS translate, then
            // center with true percentages that track the animated size
            x: 0,
            y: 0,
            xPercent: -50,
            yPercent: -50,
          });
          gsap.set(q(`[data-panel="${s.id}"] .reveal`), { autoAlpha: 0, y: 28 });
        });
        gsap.set(veil, { autoAlpha: 0 });
        gsap.set(curtain, { xPercent: 105 }); // waits just off the right edge
        gsap.set(wipeLine, { autoAlpha: 0, scaleX: 0, scaleY: 0.004 });
        gsap.set([splitTop, splitBottom], { scaleY: 0 });
        gsap.set(marquee, { autoAlpha: 0 });

        /* Velocity marquee: an endless two-half track advanced by the GSAP
           ticker. Base drift plus Lenis' scroll velocity — fast scrolling
           whips the ribbon along, scrolling up reverses it. Idles (zero
           work) while invisible; decorative only, so reduced motion skips
           it entirely. */
        if (!prefersReducedMotion) {
          const track = q('.marquee__track')[0];
          const marqueeEl = marquee[0];
          const wrap = gsap.utils.wrap(-50, 0);
          let mx = 0;
          let smoothV = 0;
          marqueeTick = () => {
            if (!track || gsap.getProperty(marqueeEl, 'opacity') < 0.02) return;
            const lenis = getLenis();
            smoothV += ((lenis ? lenis.velocity : 0) - smoothV) * 0.08;
            const dt = gsap.ticker.deltaRatio(60);
            mx = wrap(mx - (0.045 + smoothV * 0.0035) * dt);
            gsap.set(track, { xPercent: mx });
          };
          gsap.ticker.add(marqueeTick);
        }
        gsap.set(turnVideo, { autoAlpha: 0 });
        gsap.set(bloom, { autoAlpha: 0 });
        gsap.set(mask, { autoAlpha: 0 });
        gsap.set(endcard, { autoAlpha: 0 });
        // Title letters wait unseen for their typewriter reveal; subtitle and
        // the face spotlight wait for the final pose.
        gsap.set(q('.endcard__letter'), { autoAlpha: 0 });
        gsap.set(q('.endcard__sub'), { autoAlpha: 0, y: 8 });
        gsap.set(q('.face-light'), { autoAlpha: 0 });
        // Explicit starting filter — GSAP would otherwise interpolate the
        // first dim tween from 'none' (i.e. brightness 0) and fade from black.
        gsap.set(video, { filter: 'brightness(1) saturate(1)', scale: 1, xPercent: 0 });

        /* ---------------- master scroll timeline ---------------- */
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: trackRef.current,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 1.2, // ~1.2s catch-up = cinematic lag on top of Lenis' glide
            pin: stageRef.current,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (st) => {
              // Progress rail active state, derived from section labels.
              const t = st.progress * tl.duration();
              let active = 0;
              SECTIONS.forEach((s, i) => {
                if (t >= tl.labels[`${s.id}-emerge`] - 0.4) active = i;
              });
              railItems.forEach((el, i) =>
                el.classList.toggle('is-active', i === active)
              );
              // Pull the full turn film ahead of time (past the Music chapter).
              if (!turnLoadKicked && st.progress > 0.5) {
                turnLoadKicked = true;
                turnVideo.preload = 'auto';
                turnVideo.load();
              }
              // Tell the soundtrack which chapter we're in — it only adjusts
              // volume (never playback position). 'turn' hushes the music
              // while Flona turns; 'finale' dissolves it to silence.
              let audioId = SECTIONS[active].id;
              if (tl.labels.pose != null && t >= tl.labels.pose - 0.2) {
                audioId = 'finale';
              } else if (tl.labels.turn != null && t >= tl.labels.turn) {
                audioId = 'turn';
              }
              setAudioSection(audioId);
            },
          },
        });

        /* LOAD ENTRANCE — runs once on arrival (time-based, not scroll):
           the portrait breathes in from black with a slow settle while the
           wordmark rises from behind its mask. Reduced motion gets a short
           plain crossfade instead. */
        const introTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        if (!prefersReducedMotion) {
          introTl
            .fromTo(
              q('.opening__bg'),
              { autoAlpha: 0 },
              { autoAlpha: 1, duration: 1.6, ease: 'power2.out' }
            )
            .fromTo(
              q('.opening__bg img'),
              // settles at 1.045, keeping overscan for the parallax drift
              { scale: 1.09 },
              { scale: 1.045, duration: 2.4, ease: 'power2.out' },
              0
            )
            .fromTo(
              q('.opening__mark'),
              { yPercent: 112, filter: 'blur(6px)' },
              { yPercent: 0, filter: 'blur(0px)', duration: 1.0, ease: 'power4.out' },
              0.55
            )
            .fromTo(
              q('.opening__sub'),
              { yPercent: 130, autoAlpha: 0 },
              { yPercent: 0, autoAlpha: 1, duration: 0.9, ease: 'power4.out' },
              0.85
            )
            .fromTo(cue, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8 }, 1.7);
        } else {
          introTl.fromTo(
            q('.opening__bg'),
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: 0.6, ease: 'none' }
          );
        }

        /* MOUSE PARALLAX on the intro portrait (fine pointers only): image,
           shade and wordmark drift at three depths with a faint tilt, so the
           opening reads as a scene rather than a flat photo. quickTo keeps
           it a single eased tween per axis — no per-frame allocations. */
        let parallaxMove;
        if (
          !prefersReducedMotion &&
          window.matchMedia('(hover: hover) and (pointer: fine)').matches
        ) {
          const openingEl = opening[0];
          const bgImg = q('.opening__bg img');
          const shade = q('.opening__shade');
          const lines = q('.opening__lines');
          gsap.set(bgImg, { transformPerspective: 1000 });
          const p = {
            ix: gsap.quickTo(bgImg, 'x', { duration: 0.9, ease: 'power3.out' }),
            iy: gsap.quickTo(bgImg, 'y', { duration: 0.9, ease: 'power3.out' }),
            irx: gsap.quickTo(bgImg, 'rotationX', { duration: 1.1, ease: 'power3.out' }),
            iry: gsap.quickTo(bgImg, 'rotationY', { duration: 1.1, ease: 'power3.out' }),
            sx: gsap.quickTo(shade, 'x', { duration: 1.0, ease: 'power3.out' }),
            sy: gsap.quickTo(shade, 'y', { duration: 1.0, ease: 'power3.out' }),
            lx: gsap.quickTo(lines, 'x', { duration: 1.2, ease: 'power3.out' }),
            ly: gsap.quickTo(lines, 'y', { duration: 1.2, ease: 'power3.out' }),
          };
          parallaxMove = (e) => {
            // idle once the opening has dissolved into the film
            if (gsap.getProperty(openingEl, 'opacity') < 0.4) return;
            const nx = e.clientX / window.innerWidth - 0.5;
            const ny = e.clientY / window.innerHeight - 0.5;
            p.ix(nx * 26);
            p.iy(ny * 18);
            p.iry(nx * 1.6);
            p.irx(ny * -1.4);
            p.sx(nx * 14);
            p.sy(ny * 10);
            p.lx(nx * -11); // wordmark counter-drifts = depth separation
            p.ly(ny * -8);
          };
          window.addEventListener('mousemove', parallaxMove, { passive: true });
        }

        // Fade the scroll cue as soon as the journey starts.
        tl.to(cue, { autoAlpha: 0, duration: 0.4, ease: 'power1.out' }, 0.05);

        /* OPENING — the site greets you with the wordmark on black (mirror of
           the finale). On the first scroll the type lifts away, then the black
           card dissolves and the film fades in underneath. */
        tl.to(q('.opening__mark, .opening__sub'), {
          autoAlpha: 0,
          y: -16,
          duration: 0.6,
          ease: 'power2.in',
        });
        tl.to(opening, { autoAlpha: 0, duration: 0.9, ease: 'power1.inOut' }, '-=0.15');

        /* ---------------- shared fullscreen-panel system ----------------
           Mirrors the approved About behaviour for Music / Live / Contact:
           depth push → expansion from the panel's real position to
           100vw × stage height → hold → masked label/title reveals →
           staggered `.ed-item` content → interaction hold. Each section
           supplies its own content component and its own exit transition;
           the expansion itself stays visually identical everywhere. */
        const edF = isMobile ? 0.62 : isTablet ? 0.8 : 1;
        const edStageH = () => stageRef.current.offsetHeight;
        const buildEditorialSection = (section, panel) => {
          const sq = (sel) => q(`[data-panel="${section.id}"] ${sel}`);
          // masked children carry the choreography; containers stay visible
          gsap.set(sq('.reveal'), { autoAlpha: 1, y: 0 });
          gsap.set(sq('.ed-label__line'), { scaleX: 0 });
          gsap.set(sq('.ed-label__text'), { yPercent: 110 });
          gsap.set(sq('.ed-title__word'), {
            yPercent: 110,
            rotationX: 12,
            transformPerspective: 500,
          });
          gsap.set(sq('.ed-item'), {
            y: 44,
            autoAlpha: 0,
            filter: `blur(${M.pushBlur}px)`,
          });

          /* depth & parallax — the card drifts and presses forward */
          const sideX =
            section.side === 'left' ? 0.32 : section.side === 'right' ? 0.68 : 0.5;
          tl.to(panel, {
            left: () => window.innerWidth * sideX,
            scale: 1.03,
            z: 30,
            duration: 1 * edF,
            ease: 'power1.inOut',
          });
          tl.to(
            video,
            {
              xPercent: section.pan * 0.6,
              filter: 'brightness(0.34) saturate(1.05)',
              scale: M.dimScale + 0.02,
              duration: 1 * edF,
              ease: 'power1.inOut',
            },
            '<'
          );

          /* expansion — the same rectangle becomes the page, no jumps */
          tl.set(panel, { willChange: 'transform, width, height' });
          tl.to(panel, {
            left: () => window.innerWidth / 2,
            top: () => edStageH() / 2,
            width: () => window.innerWidth,
            height: () => edStageH(),
            scale: 1,
            z: 0,
            borderRadius: 0,
            borderColor: 'rgba(255, 255, 255, 0)',
            backgroundColor: 'rgba(6, 6, 9, 0.97)',
            boxShadow: '0 60px 160px rgba(0, 0, 0, 0.8)',
            duration: 1.8 * edF,
            ease: 'power2.inOut',
          });
          tl.to(
            video,
            {
              filter: 'brightness(0.22) saturate(1)',
              scale: M.dimScale + 0.05,
              duration: 1.8 * edF,
              ease: 'power2.inOut',
            },
            '<'
          );
          tl.set(panel, {
            backdropFilter: 'none',
            webkitBackdropFilter: 'none',
            willChange: 'auto',
          });

          /* fullscreen hold — a calm beat before the words */
          tl.to({}, { duration: 0.6 * edF });

          /* masked typography, then the section's content blocks */
          const at = `${section.id}-read`;
          tl.addLabel(at);
          tl.to(sq('.ed-label__line'), { scaleX: 1, duration: 0.5, ease: 'power3.inOut' }, at);
          tl.to(
            sq('.ed-label__text'),
            { yPercent: 0, duration: 0.5, ease: 'power3.out' },
            `${at}+=0.15`
          );
          tl.to(
            sq('.ed-title__word'),
            { yPercent: 0, rotationX: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out' },
            `${at}+=0.3`
          );
          tl.to(
            sq('.ed-item'),
            { y: 0, autoAlpha: 1, filter: 'blur(0px)', duration: 0.9, stagger: 0.4, ease: 'power2.out' },
            `${at}+=0.9`
          );

          /* interaction hold — time to press play / pick a performance */
          tl.to({}, { duration: 1.5 * edF });
        };

        SECTIONS.forEach((section, i) => {
          const panel = q(`[data-panel="${section.id}"]`);
          const reveals = q(`[data-panel="${section.id}"] .reveal`);
          const rotY =
            section.side === 'left' ? M.panelTilt : section.side === 'right' ? -M.panelTilt : 0;

          /* 1 — THE WALK: scroll scrubs the film forward while the previous
             black veil lifts, Flona walking us to the next moment. */
          tl.addLabel(`${section.id}-walk`);
          tl.to(playhead, {
            t: section.videoTime,
            duration: i === 0 ? 2 : 3,
            onUpdate: applyTime,
          });
          tl.to(veil, { autoAlpha: 0, duration: 0.8, ease: 'power2.out' }, '<');
          if (!prefersReducedMotion) {
            // the ribbon leaves with the black
            tl.to(marquee, { autoAlpha: 0, duration: 0.6, ease: 'power1.out' }, '<');
          }

          /* 2 — PANEL EMERGENCE: the square panel detaches from the scene,
             flies toward the viewer and expands into a card/frame, while the
             film dims and drifts sideways so Flona stays in view. */
          tl.addLabel(`${section.id}-emerge`);
          tl.fromTo(
            panel,
            {
              left: () => originRect(section).left,
              top: () => originRect(section).top,
              width: () => originRect(section).width,
              height: () => originRect(section).height,
              rotationY: rotY,
              z: M.panelZ,
              autoAlpha: 0,
              filter: `blur(${M.panelBlur}px)`,
            },
            {
              left: () => targetRect(section).left,
              top: () => targetRect(section).top,
              width: () => targetRect(section).width,
              height: () => targetRect(section).height,
              rotationY: 0,
              z: 0,
              autoAlpha: 1,
              filter: 'blur(0px)',
              duration: 1.6,
              ease: 'power2.inOut',
            }
          );
          tl.to(
            video,
            {
              filter: `brightness(${section.dim}) saturate(1.05)`,
              scale: M.dimScale,
              xPercent: section.pan,
              duration: 1.6,
              ease: 'power2.inOut',
            },
            '<'
          );

          if (section.id === 'about' && !prefersReducedMotion) {
            /* ============ ABOUT — cinematic editorial sequence ============
               The card emerges beside Flona as usual, then instead of the
               generic reveal it: (1) pushes gently forward with parallax,
               (2) expands from its real position into a full-screen page,
               (3) holds, (4) reveals the typography through masks, and
               (5) leaves through a horizontal curtain wipe into Music. */
            const aq = (sel) => q(`[data-panel="about"] ${sel}`);
            const F = isMobile ? 0.62 : isTablet ? 0.8 : 1; // scroll-length scale
            const stageH = () => stageRef.current.offsetHeight;

            // The .reveal wrappers stay visible; the masked children carry
            // the choreography instead (overrides the generic hidden init).
            gsap.set(aq('.reveal'), { autoAlpha: 1, y: 0 });
            gsap.set(aq('.about-label__line'), { scaleX: 0 });
            gsap.set(aq('.about-label__text'), { yPercent: 110 });
            gsap.set(aq('.about-title__word'), {
              yPercent: 110,
              rotationX: 14,
              transformPerspective: 500,
            });
            gsap.set(aq('.about-title__sweep'), { xPercent: -140 });
            gsap.set(aq('.about-para__inner'), {
              y: 56,
              autoAlpha: 0,
              filter: `blur(${M.pushBlur}px)`,
            });
            gsap.set(aq('.about-quote__line'), { scaleX: 0 });
            gsap.set(aq('.about-quote__text'), { x: 24, autoAlpha: 0 });
            // yPercent -50 replaces the CSS translateY(-50%) centering, which
            // GSAP would otherwise bake into stale pixels (see panel note)
            gsap.set(aq('.about-figure'), {
              autoAlpha: 0,
              y: 30,
              yPercent: -50,
              scale: 1.02,
            });

            /* PHASE 1 — depth & parallax: the card drifts toward centre and
               forward while the film recedes at a slower rate behind it. */
            tl.to(panel, {
              left: () => window.innerWidth * 0.32,
              scale: 1.03,
              z: 30,
              duration: 1.2 * F,
              ease: 'power1.inOut',
            });
            tl.to(
              video,
              {
                xPercent: section.pan * 0.6, // slower than the card = depth
                filter: 'brightness(0.34) saturate(1.05)',
                scale: M.dimScale + 0.02,
                duration: 1.2 * F,
                ease: 'power1.inOut',
              },
              '<'
            );

            /* PHASE 2 — expansion: the same rectangle grows from where it
               stands until it IS the page. Border and radius dissolve, the
               glass deepens to near-black. No jumps, no opacity trickery. */
            tl.set(panel, { willChange: 'transform, width, height' });
            tl.to(panel, {
              left: () => window.innerWidth / 2,
              top: () => stageH() / 2,
              width: () => window.innerWidth,
              height: () => stageH(),
              scale: 1,
              z: 0,
              borderRadius: 0,
              borderColor: 'rgba(255, 255, 255, 0)',
              backgroundColor: 'rgba(6, 6, 9, 0.97)',
              boxShadow: '0 60px 160px rgba(0, 0, 0, 0.8)',
              duration: 2 * F,
              ease: 'power2.inOut',
            });
            tl.to(
              video,
              {
                filter: 'brightness(0.22) saturate(1)',
                scale: M.dimScale + 0.05,
                duration: 2 * F,
                ease: 'power2.inOut',
              },
              '<'
            );
            // the glass is now near-opaque; drop the backdrop blur (the most
            // expensive thing on screen) while it can't be noticed
            tl.set(panel, {
              backdropFilter: 'none',
              webkitBackdropFilter: 'none',
              willChange: 'auto',
            });

            /* PHASE 3 — fullscreen hold: a calm, empty beat. */
            tl.to({}, { duration: 0.8 * F });

            /* PHASE 4 — typography: masked reveals, never plain fades. */
            tl.addLabel('about-read');
            tl.to(
              aq('.about-label__line'),
              { scaleX: 1, duration: 0.5, ease: 'power3.inOut' },
              'about-read'
            );
            tl.to(
              aq('.about-label__text'),
              { yPercent: 0, duration: 0.5, ease: 'power3.out' },
              'about-read+=0.15'
            );
            // title, word by word, rising from behind each mask …
            tl.to(
              aq('.about-title__word:not(.about-title__word--fire)'),
              { yPercent: 0, rotationX: 0, duration: 0.7, stagger: 0.12, ease: 'power3.out' },
              'about-read+=0.3'
            );
            // … with "fire" arriving deliberately last, under a light sweep
            tl.to(
              aq('.about-title__word--fire'),
              { yPercent: 0, rotationX: 0, duration: 0.7, ease: 'power3.out' },
              'about-read+=1.0'
            );
            tl.to(
              aq('.about-title__sweep'),
              { xPercent: 140, duration: 0.8, ease: 'power2.inOut' },
              'about-read+=1.3'
            );
            // paragraphs: masked rise + depth blur, first before second
            tl.to(
              aq('.about-para:first-of-type .about-para__inner'),
              { y: 0, autoAlpha: 1, filter: 'blur(0px)', duration: 0.9, ease: 'power2.out' },
              'about-read+=1.25'
            );
            tl.to(
              aq('.about-para + .about-para .about-para__inner'),
              { y: 0, autoAlpha: 1, filter: 'blur(0px)', duration: 0.9, ease: 'power2.out' },
              'about-read+=1.75'
            );
            // the portrait breathes in beside the copy …
            tl.to(
              aq('.about-figure'),
              { autoAlpha: 1, y: 0, scale: 1, duration: 1.1, ease: 'power2.out' },
              'about-read+=1.6'
            );
            // … and the quote closes the page behind a drawing line
            tl.to(
              aq('.about-quote__line'),
              { scaleX: 1, duration: 0.6, ease: 'power3.inOut' },
              'about-read+=2.35'
            );
            tl.to(
              aq('.about-quote__text'),
              { x: 0, autoAlpha: 1, duration: 0.7, ease: 'power2.out' },
              'about-read+=2.5'
            );

            /* Reading hold — the page rests. */
            tl.to({}, { duration: 1.3 * F });

            /* PHASE 5 — horizontal curtain into Music: black sweeps in from
               the right while the page eases left with depth; behind the
               cover the film is staged at 0.97 and settles to 1 as the
               curtain exits — never a fade. */
            tl.to(curtain, { xPercent: 0, duration: 0.9, ease: 'power2.in' });
            tl.to(panel, { x: -60, scale: 0.985, duration: 0.9, ease: 'power2.in' }, '<');
            tl.set(panel, { autoAlpha: 0, x: 0, scale: 1 });
            tl.set(video, {
              filter: 'brightness(1) saturate(1)',
              xPercent: 0,
              scale: 0.97,
            });
            tl.to(curtain, { xPercent: -105, duration: 0.9, ease: 'power2.out' });
            tl.to(video, { scale: 1, duration: 0.9, ease: 'power2.out' }, '<');
            return; // Music's walk continues from here
          }

          if (
            ['music', 'live', 'contact'].includes(section.id) &&
            !prefersReducedMotion
          ) {
            /* ====== MUSIC / LIVE / CONTACT — shared fullscreen system ====== */
            buildEditorialSection(section, panel);

            if (section.id === 'music') {
              /* MUSIC → LIVE: a thin amber progress line draws across the
                 viewport, thickens into a full black cover, then contracts
                 back to a line and slips away — the player's progress bar
                 becoming the transition mask. */
              tl.set(wipeLine, { autoAlpha: 1, scaleX: 0, scaleY: 0.004 });
              tl.to(wipeLine, { scaleX: 1, duration: 0.6, ease: 'power2.inOut' });
              tl.to(wipeLine, { scaleY: 1, duration: 0.7, ease: 'power2.in' });
              tl.set(panel, { autoAlpha: 0 });
              tl.set(video, {
                filter: 'brightness(1) saturate(1)',
                xPercent: 0,
                scale: 0.97,
              });
              tl.to(wipeLine, { scaleY: 0.004, duration: 0.7, ease: 'power2.out' });
              tl.to(video, { scale: 1, duration: 0.7, ease: 'power2.out' }, '<');
              tl.to(wipeLine, { scaleX: 0, autoAlpha: 0, duration: 0.5, ease: 'power2.in' });
            } else if (section.id === 'live') {
              /* LIVE → CONTACT: two black shutters close vertically over the
                 page; behind them the film is restaged, then the split parts
                 from the center. */
              tl.to(splitTop, { scaleY: 1, duration: 0.7, ease: 'power2.in' });
              tl.to(splitBottom, { scaleY: 1, duration: 0.7, ease: 'power2.in' }, '<');
              tl.set(panel, { autoAlpha: 0 });
              tl.set(video, {
                filter: 'brightness(1) saturate(1)',
                xPercent: 0,
                scale: 0.97,
              });
              tl.to({}, { duration: 0.2 }); // a beat of black
              tl.to(splitTop, { scaleY: 0, duration: 0.8, ease: 'power2.out' });
              tl.to(splitBottom, { scaleY: 0, duration: 0.8, ease: 'power2.out' }, '<');
              tl.to(video, { scale: 1, duration: 0.8, ease: 'power2.out' }, '<');
            } else {
              /* CONTACT → FINAL: depth push into black — the booking page
                 presses toward the viewer while the center mask swallows the
                 frame (hands off to the final turn film, unchanged). */
              tl.set(panel, {
                willChange: 'transform, filter',
                filter: 'blur(0px) brightness(1)',
              });
              tl.to(panel, {
                scale: M.pushScale,
                z: M.pushZ,
                filter: `blur(${M.pushBlur}px) brightness(0.35)`,
                duration: 1.3,
                ease: 'power2.inOut',
              });
              tl.to(
                video,
                {
                  filter: 'brightness(0.25) saturate(1)',
                  scale: M.exitScale,
                  xPercent: 0,
                  duration: 1.3,
                  ease: 'power2.inOut',
                },
                '<'
              );
              tl.fromTo(
                mask,
                { autoAlpha: 0, scaleX: 0.18, scaleY: 0.1 },
                { autoAlpha: 1, scaleX: 1, duration: 0.75, ease: 'power3.inOut' },
                '<+=0.4'
              );
              tl.to(mask, { scaleY: 1, duration: 0.65, ease: 'power3.inOut' });
            }
            return;
          }

          /* 3 — CONTENT REVEAL: editorial copy rises inside the panel. */
          tl.to(reveals, {
            autoAlpha: 1,
            y: 0,
            duration: 0.8,
            stagger: M.stagger,
            ease: 'power3.out',
          });

          /* 4 — HOLD: quiet room to read. */
          tl.to({}, { duration: 1.2 });

          const isLast = i === SECTIONS.length - 1;
          if (!isLast || prefersReducedMotion) {
            /* 5 — FADE TO BLACK: content recedes into the scene, the veil
               closes, and the walk resumes on the next iteration. (Under
               reduced motion the last section also uses this — it doubles
               as the required simple black wipe.) */
            tl.to(reveals, { autoAlpha: 0, y: -18, duration: 0.5, ease: 'power2.in' });
            tl.to(
              panel,
              { autoAlpha: 0, scale: 0.96, z: -80, duration: 0.7, ease: 'power2.in' },
              '<+=0.1'
            );
            tl.to(
              video,
              { filter: 'brightness(1) saturate(1)', scale: 1, xPercent: 0, duration: 0.8 },
              '<'
            );
            tl.to(veil, { autoAlpha: 1, duration: 0.7, ease: 'power1.inOut' }, '<+=0.25');
            if (!prefersReducedMotion) {
              // the velocity ribbon drifts through the black beat
              tl.to(marquee, { autoAlpha: 1, duration: 0.7, ease: 'power1.inOut' }, '<');
            }
            tl.set(panel, { scale: 1 }); // reset for refresh correctness
          }
        });

        /* THE TURN — final reveal. The screen is fully black (mask, or veil
           under reduced motion); hold a beat, swap films behind it. */
        tl.addLabel('turn');
        tl.to({}, { duration: 0.3 }); // a beat of pure black — but never a cut

        if (prefersReducedMotion) {
          /* Reduced motion: the veil wipe covered the screen; present her
             final front-facing pose statically — no scrub, no push. */
          tl.set(video, { autoAlpha: 0 });
          tl.set(turnVideo, { autoAlpha: 1 });
          tl.to(turnPlayhead, { t: TURN_VIDEO_END, duration: 0.2, onUpdate: applyTurnTime });
          tl.to(veil, { autoAlpha: 0, duration: 0.8, ease: 'power2.out' });
          tl.to({}, { duration: 4.2 }); // long quiet hold on the final frame
          tl.addLabel('finale', '-=3.4');
          tl.to(bloom, { autoAlpha: 1, duration: 1 }, 'finale');
          tl.to(q('.face-light'), { autoAlpha: 1, duration: 1 }, 'finale');
          tl.set(turnVideo, { filter: 'brightness(0.72)' }, 'finale');
          tl.set(q('.endcard__letter'), { autoAlpha: 1 }, 'finale');
          tl.to(endcard, { autoAlpha: 1, duration: 1 }, 'finale');
          tl.addLabel('pose', '-=1.6');
          tl.to(q('.endcard__sub'), { autoAlpha: 1, y: 0, duration: 0.8 }, 'pose');
        } else {
          /* HAND-OFF under the mask: hide the pushed booking card and the
             main film, stage the turn film at 0.92 and clipped shut, then
             let the video's own clip-path silently take over the mask role. */
          tl.set(q('[data-panel="contact"]'), { autoAlpha: 0, clearProps: 'willChange' });
          tl.set(video, { autoAlpha: 0 });
          tl.set(turnVideo, {
            autoAlpha: 1,
            scale: 0.92,
            clipPath: 'inset(50% 50%)',
            // explicit start so the end-darkening never ramps from black
            filter: 'brightness(1)',
            willChange: 'transform, clip-path',
          });
          tl.set(mask, { autoAlpha: 0 });

          /* CENTER-OUT REVEAL: the black opens from the middle outward while
             the frame settles from 0.92 to full size — depth, not opacity.
             Her back-facing first frame is what the mask opens onto. */
          tl.to(turnVideo, {
            clipPath: 'inset(0% 0%)',
            scale: 1,
            duration: 1.1,
            ease: 'power2.inOut',
          });
          tl.set(turnVideo, { clearProps: 'willChange' });

          /* The slow elegant turn: scroll drives the film forward, scrolling
             up reverses it. ~280vh of runway at the current track height. */
          tl.fromTo(
            turnPlayhead,
            { t: 0 },
            { t: TURN_VIDEO_END, duration: 5.5, onUpdate: applyTurnTime }
          );

          /* FINAL TITLE at ~80% of the turn — typewriter: each letter pops in
             sequentially, driven by scroll. Meanwhile the frame darkens and a
             spotlight closes in so only Flona's face stays lit. */
          tl.addLabel('finale', '-=1.1');
          tl.to(bloom, { autoAlpha: 1, duration: 1.2, ease: 'power1.inOut' }, 'finale');
          tl.to(
            q('.face-light'),
            { autoAlpha: 1, duration: 1.5, ease: 'power1.inOut' },
            'finale'
          );
          tl.to(
            turnVideo,
            { filter: 'brightness(0.72)', duration: 1.5, ease: 'power1.inOut' },
            'finale'
          );
          tl.set(endcard, { autoAlpha: 1 }, 'finale');
          tl.to(
            q('.endcard__letter'),
            { autoAlpha: 1, duration: 0.02, stagger: 0.09, ease: 'none' },
            'finale+=0.15'
          );

          /* FINAL POSE — she faces us; the subtitle breathes in and the
             soundtrack (keyed to 'pose') dissolves to silence. */
          tl.addLabel('pose');
          tl.to(
            q('.endcard__sub'),
            { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' },
            'pose'
          );
          tl.to({}, { duration: 0.9 }); // brief pinned hold on the last frame
        }

        /* Progress rail clicks — glide to each chapter with Lenis. */
        const railHandlers = railItems.map((el, i) => {
          const onClick = () => {
            const y = tl.scrollTrigger.labelToScroll(`${SECTIONS[i].id}-emerge`);
            const lenis = getLenis();
            if (lenis) lenis.scrollTo(y, { duration: 1.8 });
            else window.scrollTo({ top: y, behavior: 'smooth' });
          };
          el.addEventListener('click', onClick);
          return onClick;
        });

        // matchMedia cleanup (breakpoint change / unmount): GSAP reverts all
        // tweens & the ScrollTrigger itself; we only remove our listeners.
        return () => {
          railItems.forEach((el, i) => el.removeEventListener('click', railHandlers[i]));
          if (marqueeTick) gsap.ticker.remove(marqueeTick);
          if (parallaxMove) window.removeEventListener('mousemove', parallaxMove);
        };
        }
      );
    };

    // The timeline needs video metadata (duration/seekability) before it can
    // scrub, so wait for it once.
    if (video.readyState >= 1) build();
    else video.addEventListener('loadedmetadata', build, { once: true });

    // Re-measure pin distances once fonts/poster/late media have all landed,
    // preserving the current scroll position.
    const refreshOnLoad = () => ScrollTrigger.refresh();
    if (document.readyState === 'complete') ScrollTrigger.refresh();
    else window.addEventListener('load', refreshOnLoad, { once: true });

    return () => {
      video.removeEventListener('loadedmetadata', build);
      window.removeEventListener('load', refreshOnLoad);
      window.removeEventListener('touchstart', primeVideos);
      window.removeEventListener('pointerdown', primeVideos);
      mm && mm.revert();
    };
  }, []);

  return (
    <div className="track" ref={trackRef}>
      <section className="stage" ref={stageRef} aria-label="Flona Kimia — a scroll film">
        {/* Scroll-scrubbed film. Muted + playsInline so mobile browsers allow
            programmatic seeking without a user gesture. */}
        <video
          ref={videoRef}
          className="stage__video"
          src={VIDEO_SRC}
          poster={VIDEO_POSTER}
          muted
          playsInline
          preload="auto"
        />
        {/* Final reveal film — Flona turns from back-facing to facing us.
            Muted, scroll-scrubbed, metadata-only until the visitor nears it. */}
        <video
          ref={turnVideoRef}
          className="stage__video stage__video--turn"
          src={TURN_VIDEO_SRC}
          muted
          playsInline
          preload="metadata"
          aria-label="Flona Kimia stands with her back to the camera in darkness, then slowly turns to face the viewer"
        />
        <div className="grain" aria-hidden="true" />
        <div className="vignette" aria-hidden="true" />

        {/* The four panels that emerge from the scene. */}
        {SECTIONS.map((section) => {
          const Content = CONTENT[section.id];
          return (
            <SectionPanel key={section.id} section={section}>
              <Content />
            </SectionPanel>
          );
        })}

        {/* Black veil used for every fade-to-black between chapters. */}
        <div className="veil" aria-hidden="true" />

        {/* Velocity ribbon — ghost-outline wordmark that drifts across the
            black transition beats, speed driven by scroll velocity. Two
            identical halves make the loop seamless. */}
        <div className="marquee" aria-hidden="true">
          <div className="marquee__track">
            {[0, 1].map((half) => (
              <span key={half} className="marquee__half">
                {Array.from({ length: 3 }).flatMap((_, r) =>
                  MARQUEE_UNITS.map((unit, i) => (
                    <Fragment key={`${r}-${i}`}>
                      <span className="marquee__word">{unit}</span>
                      <span className="marquee__dot">·</span>
                    </Fragment>
                  ))
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Center black mask for the Booking → final-turn transition:
            grows wide, then tall, until it swallows the frame. */}
        <div className="mask" aria-hidden="true" />

        {/* Horizontal curtain for the About → Music transition. */}
        <div className="curtain" aria-hidden="true" />

        {/* Progress-line wipe for Music → Live. */}
        <div className="wipe-line" aria-hidden="true" />

        {/* Vertical split shutters for Live → Contact. */}
        <div className="split__top" aria-hidden="true" />
        <div className="split__bottom" aria-hidden="true" />

        {/* Opening screen — Flona's portrait emerging from black beneath the
            wordmark; dissolves as the film begins. Opaque black in CSS so
            nothing flashes before the timeline builds. */}
        <div className="opening">
          <div className="opening__bg" aria-hidden="true">
            <img
              src="/images/flona-intro-2560.jpg"
              srcSet="/images/flona-intro-1280.jpg 1280w, /images/flona-intro-2560.jpg 2560w"
              sizes="100vw"
              alt=""
              fetchPriority="high"
            />
            {/* layered cinematic fade: global dim + subject window + edge
                vignette + deeper black behind the type and buttons */}
            <div className="opening__shade" />
          </div>
          <div className="opening__lines">
            <span className="opening__maskline">
              <p className="opening__mark">Flona Kimia</p>
            </span>
            <span className="opening__maskline">
              <p className="opening__sub">the light walks on</p>
            </span>
          </div>
        </div>

        {/* Warm light bloom for her final pose. */}
        <div className="turn-bloom" aria-hidden="true" />

        {/* End-of-film spotlight: darkens the frame except Flona's face. */}
        <div className="face-light" aria-hidden="true" />

        {/* Closing words — lower third, so her face stays clear. Each letter
            sits in the mark's overflow-hidden line for the masked reveal. */}
        <div className="endcard">
          <p className="endcard__mark" aria-label="Flona Kimia">
            {'FLONA KIMIA'.split('').map((ch, i) => (
              <span
                key={i}
                // two tones like the hero: FLONA white, KIMIA ember italic
                className={`endcard__letter${i > 5 ? ' endcard__letter--accent' : ''}`}
                aria-hidden="true"
              >
                {ch === ' ' ? ' ' : ch}
              </span>
            ))}
          </p>
          <p className="endcard__sub">Her voice. Her universe.</p>
        </div>

        {/* Chapter rail. */}
        <nav className="rail" aria-label="Chapters">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              aria-label={`Go to ${section.label}`}
            >
              <span className="rail__dot" aria-hidden="true" />
              <span className="rail__label" aria-hidden="true">
                {section.label}
              </span>
            </button>
          ))}
        </nav>

        {/* Opening scroll cue. */}
        <div className="cue" aria-hidden="true">
          <span>Scroll</span>
          <i />
        </div>
      </section>
    </div>
  );
}
