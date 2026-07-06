import { BOOKING_EMAIL, SOCIALS } from '@/lib/sections';

/** Section 4 — Contact / Booking. Centre card at the fiery climax of the film. */
export default function ContactContent() {
  return (
    <div className="content content--center">
      <p className="eyebrow reveal">04 — Booking</p>
      <h2 className="content__title reveal">
        Bring the <em>light</em> to your stage
      </h2>
      <p className="content__body reveal">
        For bookings, press and collaborations — the door is open.
      </p>
      <a className="cta reveal" href={`mailto:${BOOKING_EMAIL}`}>
        {BOOKING_EMAIL}
      </a>
      <ul className="socials reveal">
        {SOCIALS.map((social) => (
          <li key={social.name}>
            <a href={social.href}>{social.name}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
