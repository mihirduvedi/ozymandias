# Quiet monument

The interface should help a reader explore Shelley’s ruined statue without
competing with the desert or the poem. This pass changes interface presentation
and sound, while keeping the approved world and continuous camera route intact.

The landscape remains the dominant composition. Navigation sits along its edges,
and verse receives the strongest typographic emphasis. Small bronze marks and
solid dark panels provide enough contrast for controls without framing everything.

EB Garamond is the only interface family, including buttons, key labels, menus,
dialogs, poem text, and reading controls. Monumental capitals distinguish titles;
real lowercase and italic forms keep instructions and verse readable. Cinzel stays
in the existing physical carving, which belongs to the sculpture rather than the
interface. Shortlisted alternatives were Cinzel throughout (less suitable for
paragraphs) and Cormorant Garamond (a display face with fragile small text).

Font source and attribution: https://github.com/google/fonts/tree/main/ofl/ebgaramond
The SIL license is bundled at public/world/fonts/EB-Garamond-OFL.txt.

Control labels use sentence case and practical verbs. Keys appear as separate
fields rather than strings of decorative separators. Authored copy uses American
English. The canonical poem is preserved verbatim, including “traveller.”

The sound should suggest barely moving air. The old resonant cactus recording
is replaced with filtered, compressed gentle air at low gain. No visual gust or
camera movement raises the volume. Provenance and processing are recorded in
public/world/audio/CREDITS.md.

Behavior contracts preserved:
- Deep links and selection still move to the same poem line and landmark.
- Plus markers open the matching line in the complete poem.
- The tour advances automatically and supports pause, resume, and manual steps.
- Orbit, Wander, dragging, keyboard motion, limits, light, and motion settings work.
- Sound remains optional, loads on selection, and supports mute and retry.
- The Second Coming stays unpublished.

Verify fonts, real copy, controls, and poem overflow at the native window size and
phone width. Inspect About, poem text, controls, view adjustment, and guided reading.
Check font and sound requests, console errors, audio levels, and canonical text hashes.
