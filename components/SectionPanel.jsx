/**
 * Reusable expanding panel.
 *
 * Rendered invisible at first; the master timeline in <CinematicExperience>
 * animates it from the rect of a square panel inside the video frame to its
 * expanded card/frame position. Everything inside marked with `.reveal` is
 * staggered in once the panel has settled.
 */
export default function SectionPanel({ section, children }) {
  return (
    <article
      className={`panel panel--${section.variant} panel--${section.side}`}
      data-panel={section.id}
      aria-label={section.label}
    >
      <div className="panel__glow" aria-hidden="true" />
      <div className="panel__inner">{children}</div>
    </article>
  );
}
