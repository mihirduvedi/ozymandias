# Verification

The approved scene and reading behavior are retained in this publishing package.
The only runtime change for publication makes model, texture, font, and sound
paths relative to the hosting directory so a GitHub Pages project URL works.

## Automated checks

Run these from a fresh checkout with Node 24:

```sh
npm ci --ignore-scripts
npm test -- --maxWorkers=2 --testTimeout=30000
npm run lint
node scripts/check-release.mjs
npm run build
```

The mesh tests inspect the bundled models, including sealed fracture surfaces,
foot contact, and support geometry. Tour tests check camera continuity, route
coverage, and timing. Audio tests check optional loading, long crossfades, mute,
retry, and disposal. Other tests cover text, routes, navigation, fractures, and
sand behavior.

`check-release.mjs` checks the canonical poem hashes, required runtime assets,
the recorded asset hashes, and bundled notices. It does not replace a browser
inspection.

## Interface checks

The previous finishing pass checked the world, tour, full poem, About, controls,
view adjustment, and text-only view at desktop and phone widths, including 320
and 390 pixels. All inspected interface elements used EB Garamond, and the actual
custom font was confirmed. The phone tour title and controls do not overlap.
The poem and About headers remain outside their scrolling bodies.

All fourteen poem lines retain their wording, punctuation, and line breaks.
Long lines scroll sideways. The tour advances automatically, can be paused, and
can revisit a selected line. Optional audio loads after a user selects it and
can be muted again.

The source preserves the canonical content hashes:

- Ozymandias: `a0ac72fca670f48b677aa34e81d6ab5d84a700ae41b57ba377247dd37747ee8b`
- The hidden Second Coming: `f47e2412f978454243b22ef2f440d3c547231e227e59930d8e7d398ab8c52761`

## Sound

At runtime gain, the new air bed measured -51.64 dB RMS and -41.12 dB peak.
It is about 10.7 dB quieter on average than the earlier wind asset, with softer
peaks. Camera movement and visual gusts do not raise its volume. These are
file-level measurements and browser playback-state checks, rather than a
listening test on the user's speakers.

## Test boundaries

Phone checks use browser viewport sizes, not physical phones. Keyboard and
semantic-text checks do not establish a full screen-reader or WCAG audit. The
world needs WebGL; the text-only reader is available when 3D cannot be opened.
The existing Vite large-chunk advisory is expected for the lazily loaded 3D
world. No performance score or universal device support is claimed.

The [publication check](submission/PUBLICATION.md) records the public repository,
workflow, fresh-clone build, and hosted browser results.
