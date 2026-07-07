import { Fragment } from 'react';

/**
 * Shared editorial typography primitives for the fullscreen sections
 * (Music / Live / Contact) — the same masked-reveal structure the About
 * page uses. The master timeline animates `.ed-label__line`,
 * `.ed-label__text`, `.ed-title__word` and `.ed-item`.
 */

export function EdLabel({ children }) {
  return (
    <p className="ed-label reveal">
      <span className="ed-label__line" aria-hidden="true" />
      <span className="ed-label__mask">
        <span className="ed-label__text eyebrow">{children}</span>
      </span>
    </p>
  );
}

/** Word-by-word masked title; the word matching `accent` gets the ember em. */
export function EdTitle({ text, accent }) {
  const words = text.split(' ');
  return (
    <h2 className="ed-title reveal" aria-label={text}>
      {words.map((word, i) => (
        <Fragment key={i}>
          <span className="ed-title__mask" aria-hidden="true">
            <span className="ed-title__word">
              {word === accent ? <em>{word}</em> : word}
            </span>
          </span>
          {i < words.length - 1 ? ' ' : ''}
        </Fragment>
      ))}
    </h2>
  );
}
