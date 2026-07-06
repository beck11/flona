import { Fragment } from 'react';

/**
 * Section 2 — About. Emerges as a glass card beside Flona, then expands into
 * a full-screen editorial page whose typography reveals through masks:
 * label line + rising letters, word-by-word masked title (with "fire" arriving
 * late under a warm light sweep), masked/blurred paragraphs, then the quote
 * behind a drawing line. The copy is unchanged; the structural wrappers exist
 * only for the scroll choreography — inner classes reuse the site typography.
 * Under prefers-reduced-motion the plain `.reveal` containers are animated by
 * the generic (calm) path instead.
 */
const TITLE_WORDS = ['A', 'voice', 'between', 'fire', 'and', 'silk'];

export default function AboutContent() {
  return (
    <div className="content content--about">
      <p className="about-label reveal">
        <span className="about-label__line" aria-hidden="true" />
        <span className="about-label__mask">
          <span className="about-label__text eyebrow">02 — About</span>
        </span>
      </p>

      <h2 className="about-title reveal" aria-label="A voice between fire and silk">
        {TITLE_WORDS.map((word, i) => (
          <Fragment key={i}>
            <span className="about-title__mask" aria-hidden="true">
              <span
                className={`about-title__word${
                  word === 'fire' ? ' about-title__word--fire' : ''
                }`}
              >
                {word === 'fire' ? (
                  <>
                    <em>fire</em>
                    <i className="about-title__sweep" />
                  </>
                ) : (
                  word
                )}
              </span>
            </span>
            {i < TITLE_WORDS.length - 1 ? ' ' : ''}
          </Fragment>
        ))}
      </h2>

      <div className="about-para reveal">
        <p className="about-para__inner content__body">
          Flona Kimia writes songs the way light moves through a dark room —
          slowly, deliberately, and impossible to ignore. Raised between two
          continents and two musical languages, she folds soul, alté and
          cinematic pop into something unmistakably her own.
        </p>
      </div>

      <div className="about-para reveal">
        <p className="about-para__inner content__body">
          On stage she is quiet gravity: a still figure at the centre of moving
          light, letting every note arrive exactly when it must. Her work is
          less performance than invitation — step closer, stay a while.
        </p>
      </div>

      <div className="about-quote reveal">
        <span className="about-quote__line" aria-hidden="true" />
        <p className="about-quote__text content__sign">
          — every song, a room she walks through
        </p>
      </div>

      {/* Editorial portrait — occupies the page's right column once the
          panel is fullscreen; fades in with the copy. */}
      <figure className="about-figure reveal">
        <img
          src="/images/flona-about.jpg"
          alt="Flona Kimia smiling with her guitar"
          width="2752"
          height="1536"
          loading="lazy"
        />
      </figure>
    </div>
  );
}
