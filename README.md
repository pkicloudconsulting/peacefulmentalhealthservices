# Peaceful Mental Health Services

Static marketing site for Peaceful Mental Health Services, a holistic telehealth
psychiatric practice serving Virginia. Hand-written HTML/CSS, no build step,
deployed by GitHub Pages branch mode (Settings > Pages > Deploy from a branch: main, root) on every push to `main`.

## Structure

- `index.html` - homepage (photo hero, services overview, philosophy, conditions, telehealth steps, testimonials, CTA, leave-a-review QR widget)
- `services/` `conditions/` `about/` `contact/` `faq/` `insurance/` `privacy-policy/` `accessibility/` - one folder per page
- `insurance/` carrier list was copied from radiantmindsva.com/insurance per the client (2026-09-10); confirm it matches the practice's actual contracts before launch
- `leave-a-review/` - star-rating review form (dummy mode: saves to localStorage `pmhs-reviews`; wire to a backend later)
- `assets/css/pmhs.css` - the entire design system (cache-bust with `?ver=pmhs-N` when editing)
- `assets/img/review-page-qr.png` - QR code encoding the GitHub Pages leave-a-review URL;
  REGENERATE it when the custom domain goes live (python3 + qrcode lib)

Content adapted from the client's service model (evaluations, medication
management, psychotherapy, telehealth, child/adolescent care, holistic
wellness). Per the client (2026-09-10): GeneSight testing, oncology
psychotherapy, and bariatric pre-surgical evaluations appear ONLY on the
services page, never as homepage cards.

## Before launch - client must confirm

- [x] **Phone number** - +1 (240) 344-1402 (client-supplied 2026-09-10, on `contact/` and every footer)
- [x] **Email address** - office@peacefulmentalhealthservices.com (placeholder pattern per client; domain itself still unconfirmed)
- [ ] **Business hours** - currently listed Mon-Fri 9-5 on `contact/`
- [ ] **Contact form backend** - form posts nowhere yet (see TODO comment in `contact/index.html`); wire to Formspree/intake system
- [ ] **Insurance list** - "most plans including commercial, Medicare, Medicaid" needs client confirmation
- [ ] **Provider bio** - about page intentionally has no named provider yet; add once client supplies bio and credentials
- [x] **Hero image** - client-supplied telehealth photo at `assets/img/hero-telehealth-1.jpeg` (rename to cache-bust on any swap)
- [ ] **Custom domain** - add CNAME once the client's domain is confirmed

## House rules

- Images must be generated, never taken from other sites.
- No em-dashes in site copy: use commas, colons, or periods.
- Bump the `?ver=pmhs-N` query on `pmhs.css` whenever styles change (cache-busting).
