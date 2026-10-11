# Ozymandias

## Tagline

Walk through Shelley's ruined kingdom, follow the poem line by line, and discover
its words in the stone and sand.

## Inspiration

I wanted the ruin in Ozymandias to feel like a place I could enter. The poem moves
from a traveler's account to the king's boast, then leaves him surrounded by empty
sand. That change in scale became the structure of the experience.

The statue needed to carry both parts of the poem. Its legs had to feel immense,
and its broken face had to retain the frown and sneer that survived the king.
The final view had to make that same monument feel small.

## What it does

Ozymandias is an interactive 3D reading of all fourteen lines. Enter the poem
starts a continuous guided tour through the desert, with each line on screen as
its part of the world comes into view. You can pause, revisit a line, or leave the
tour to explore.

In Orbit, you circle and zoom around the ruin. In Wander, you move through it
with the keyboard or by dragging. Small plus markers beside the legs, face,
hand, inscription, and sands open their corresponding lines. Selecting a line
in the poem takes you to the scene it describes.

The original text stays intact. There is a text-only reader, a motion control,
keyboard navigation, and optional quiet sound. The world works without an account
or API key.

## How I built it

The app uses React, TypeScript, Vite, and Three.js. The terrain, light, shadows,
sculpture, and moving sand are rendered in the browser. The guided reading uses
a continuous camera path with pauses that follow the poem, and the last line
opens onto a wide desert view.

The head is derived from Daniel Pett's credited Ramesses II scan. The legs, feet,
and hand use MakeHuman's CC0 anatomy. Photographed Poly Haven materials give the
sand and stone their surfaces. I refined the broken edges, cracks, foot contact,
pedestal joints, burial, and expression so the pieces read as one ruined statue.
The repository includes the asset credits and preparation scripts.

The interface uses EB Garamond throughout, with restrained bronze controls and
ivory reading panels. Cinzel is used only for the inscription carved into the
stone. AI-assisted tools helped with research, implementation, and iteration.
The current scene is real 3D geometry, and it does not use an AI-generated image
as its backdrop.

## Challenges

The early versions looked like separate text slides laid over pictures. Moving
to an explorable world made the relationship between the poem and the ruin much
clearer, but it also made small modeling errors obvious. Floating feet, gaps in
the pedestal, clean-cut fractures, and bright sand particles all broke the scene.

The camera needed the same care. A guided reading that rushed at the beginning
of every line and then stopped felt mechanical. I adjusted the route and its
motion so it keeps traveling through one place, then reaches the final panorama
without turning each line into a separate slide.

## What I'm proud of

The inscription can be read in the stone, and it leads into the poem with a single
selection. Going back from a line to the world keeps that connection clear. The
face still carries the king's expression even though much of it is broken, and
the wide final view gives the empty sands room to answer his boast.

The reader also keeps control over the experience. The tour advances on its own,
but it can be paused or explored freely. Turning motion off leaves the poem and
navigation available.

## What I learned

A convincing world depends on ordinary details. A foot resting on stone, a heavy
fragment sinking into sand, and a crack that follows the surface did more for
the scene than adding another effect. Keeping the original poem's line breaks
also changed the interface: on a phone, the reading area scrolls sideways rather
than rearranging Shelley's text to fit.

## What's next

I'd like to test the experience with more readers and on more physical devices.
Another poem would need its own setting and visual language. For this submission,
Ozymandias is the complete published work.

## Built with

React, TypeScript, Three.js, Vite, WebGL, Web Audio, CSS, Vitest

## Try it out

https://mihirduvedi.github.io/ozymandias/

## Source

https://github.com/mihirduvedi/ozymandias
