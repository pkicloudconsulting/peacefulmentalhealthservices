# Hero image - generation prompt

The homepage hero currently uses self-drawn SVG art (a lotus in concentric
circles), so the site ships with no photo dependencies. If the client wants a
photographic hero instead, generate one (never source from another site), save
it as `assets/img/hero.jpg`, and swap the `.hero-art` block in `index.html`
for an `<img>`.

## Prompt (paste into your image generator)

> Warm, calming photograph of a therapy conversation over a video call: a
> relaxed adult sitting comfortably on a couch in soft natural light, laptop
> open, gentle smile, plants and warm neutral tones in the background. Sage
> green and warm sand color palette, shallow depth of field, editorial
> healthcare photography style, no text, no logos.

Alternative subject if the client prefers a provider-focused image:

> Portrait of a warm, professional mental health clinician in business casual
> attire, seated in a bright calming office with plants, soft sage and cream
> tones, genuine relaxed smile, editorial healthcare photography style.

Export at 1600x1200 or larger, compress to under 300 KB (webp preferred), and
bump the CSS `?ver=` string if styles change with it.

## Client concept (2026-10-02): a little bed in a tree

The client pictures a small bed resting peacefully in a tree. Use this as the
hero or approach image (generate it, never source it elsewhere).

> Dreamy, serene illustration-style photograph of a small cozy bed with soft
> linens nestled on a sturdy tree branch, gentle morning light filtering
> through leaves, calm and safe mood, sage green and warm sand palette, soft
> depth of field, no people, no text, no logos.

Save as `assets/img/hero-tree-bed-1.jpeg` (new filename busts the cache) and add
a `.hero-slide` for it in `index.html`, or use it in the "approach" image slot.
