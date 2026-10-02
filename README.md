# Peaceful Mental Health Services

Static marketing site for Peaceful Mental Health Services, a holistic telehealth
psychiatric practice serving adults in Virginia and Washington State. Hand-written HTML/CSS, no build step,
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
management, psychotherapy, telehealth, holistic
wellness). Per the client (2026-09-10): GeneSight testing and oncology
psychotherapy appear ONLY on the services page, never as homepage cards.
Per the client (2026-10-02): NO substance use disorder, child/adolescent psychiatry, developmental and learning disabilities, or bariatric evaluation anywhere on the site. Adults only, online only, Virginia and Washington State.

## Before launch - client must confirm

- [x] **Phone number** - +1 (804) 465-9225 (updated 2026-10-02 from +1 (240) 344-1402, on `contact/` and every footer)
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

## Google indexing

- Every page except `leave-a-review/` carries a `<link rel="canonical">`; the homepage has LocalBusiness-style JSON-LD (`MedicalBusiness`, areaServed Virginia and Washington State).
- `sitemap.xml` and `robots.txt` live at the repo root. robots.txt is only honored at a domain root, so it takes effect once the custom domain is live.
- When the custom domain goes live: replace the GitHub Pages base URL in every canonical, `sitemap.xml`, `robots.txt`, and the JSON-LD, then add the property in Google Search Console and submit the sitemap.

## Homepage hero carousel (2026-10-02)

- Headline "Here, you find your ___": the word comes from each slide's `data-word` (Peace, Purpose, Strength now; Harmony and Balance reserved).
- Slides 4 and 5 are commented out in `index.html` (search "IMAGE SLOTS 4 and 5"). Add the photos under new filenames, then uncomment. Dots and timing adapt automatically.
- `hero-family-1.jpeg` (slide 3) shows young children; swap it for an adult image when the new photos arrive, since the practice is adults only.
- The header is identical on every page (announcement bar, Get Care mega menu, full-screen hamburger). Behaviour lives in `assets/js/nav.js`.
