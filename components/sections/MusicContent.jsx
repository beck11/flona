import { RELEASES } from '@/lib/sections';

/** Section 3 — Music. Refined release index inside the right glass card. */
export default function MusicContent() {
  return (
    <div className="content">
      <p className="eyebrow reveal">03 — Music</p>
      <h2 className="content__title reveal">
        Selected <em>works</em>
      </h2>
      <ul className="releases">
        {RELEASES.map((release) => (
          <li key={release.index} className="reveal">
            <a className="release" href={release.href}>
              <span className="release__index">{release.index}</span>
              <span className="release__title">{release.title}</span>
              <span className="release__meta">{release.meta}</span>
              <span className="release__arrow" aria-hidden="true">
                →
              </span>
            </a>
          </li>
        ))}
      </ul>
      <p className="content__sign reveal">Listen everywhere records live.</p>
    </div>
  );
}
