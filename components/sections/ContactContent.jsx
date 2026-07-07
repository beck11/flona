import { BOOKING_EMAIL, SOCIALS } from '@/lib/sections';
import { EdLabel, EdTitle } from './EdBits';

/**
 * Section 5 — Contact / Booking. Same copy as before, restructured for the
 * fullscreen editorial reveal (masked label/title, staggered items). The CTA
 * and social links stay fully interactive once the panel is open.
 */
export default function ContactContent() {
  return (
    <div className="content content--ed content--center">
      <EdLabel>05 — Booking</EdLabel>
      <EdTitle text="Bring the light to your stage" accent="light" />
      <p className="ed-item reveal content__body">
        For bookings, press and collaborations — the door is open.
      </p>
      <a className="ed-item reveal cta" href={`mailto:${BOOKING_EMAIL}`}>
        {BOOKING_EMAIL}
      </a>
      <ul className="ed-item reveal socials">
        {SOCIALS.map((social) => (
          <li key={social.name}>
            <a href={social.href}>{social.name}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
