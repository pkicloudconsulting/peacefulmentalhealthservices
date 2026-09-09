# Peaceful Mental Health Services

Static marketing site for Peaceful Mental Health Services, a holistic telehealth
psychiatric practice serving Virginia. Hand-written HTML/CSS, no build step,
deployed to GitHub Pages by `.github/workflows/pages.yml` on every push to `main`.

## Structure

- `index.html` - homepage (hero, services overview, philosophy, conditions, telehealth steps, CTA)
- `services/` `conditions/` `about/` `contact/` `faq/` `privacy-policy/` `accessibility/` - one folder per page
- `assets/css/pmhs.css` - the entire design system (cache-bust with `?ver=pmhs-N` when editing)

Content adapted from the client's service model (evaluations, medication
management, psychotherapy, telehealth, child/adolescent care, pharmacogenomic
testing, pre-surgical evaluations, oncology support, holistic wellness).

## Before launch - client must confirm

- [ ] **Phone number** - placeholder `(XXX) XXX-XXXX` on `contact/`
- [ ] **Email address / domain** - placeholder on `contact/`
- [ ] **Business hours** - currently listed Mon-Fri 9-5 on `contact/`
- [ ] **Contact form backend** - form posts nowhere yet (see TODO comment in `contact/index.html`); wire to Formspree/intake system
- [ ] **Insurance list** - "most plans including commercial, Medicare, Medicaid" needs client confirmation
- [ ] **Provider bio** - about page intentionally has no named provider yet; add once client supplies bio and credentials
- [ ] **Hero image** - currently CSS/SVG art; optional generated photo per `HERO-IMAGE-PROMPT.md`
- [ ] **Custom domain** - add CNAME once the client's domain is confirmed

## House rules

- Images must be generated, never taken from other sites.
- No em-dashes in site copy: use commas, colons, or periods.
- Bump the `?ver=pmhs-N` query on `pmhs.css` whenever styles change (cache-busting).
