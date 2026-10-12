## Inspiration

I wanted to make Ozymandias feel like a place a traveler could enter. Shelley reveals the ruin a piece at a time, then ends with the empty sands. I used that progression to shape the experience, bringing the reader close to the statue before the final view pulls back into the desert.

The sculpture had to hold onto the king's personality. Even in ruin, its face needed to carry the frown, wrinkled lip, and sneer of cold command described in the poem. The standing legs had to suggest the scale of the monument that once existed.

## What it does

Ozymandias is an interactive 3D reading of all fourteen lines. Enter the poem starts an automatic guided tour, with each line appearing as the camera reaches the part of the world it describes. You can pause, step through the lines yourself, or leave the tour to explore freely.

Orbit lets you circle the ruin, and Wander lets you move through the desert with the keyboard or by dragging. Small plus markers connect the legs, face, hand, inscription, and surrounding sands to their lines. Selecting a line in the poem takes you back to that part of the scene.

The original wording and line breaks stay intact. A text-only reader, keyboard controls, and motion-off setting give readers other ways to use the project. Sound is optional and off by default.

## How I built it

The app uses React, TypeScript, Vite, and Three.js. The sculpture, terrain, sunlight, shadows, and moving sand are rendered in the browser. The guided reading follows a continuous camera route, ending with a wide view of the desert.

The head comes from Daniel Pett's scan of Ramesses II. The legs, feet, and hand use MakeHuman's CC0 anatomy, and Poly Haven's photographed materials give the stone and sand their surfaces. I worked through the broken edges, cracks, burial, foot contact, and pedestal joints so the fragments felt like parts of one heavy statue. Python scripts prepared the meshes, and FFmpeg helped finish the audio and demo video.

EB Garamond sets the interface and poem, with Cinzel used for the carved inscription. I built the project with AI assistance, and the [repository lists the source assets and their licenses](https://github.com/mihirduvedi/ozymandias/blob/main/THIRD_PARTY_NOTICES.md).

## Challenges

Early versions felt like text slides over pictures. Building an explorable world made the connection to the poem clearer, but it also exposed small errors. Feet floating above the pedestal, gaps between stone courses, and identical sand patterns around every fragment made the scene feel artificial.

The tour needed repeated adjustments too. Camera movements that rushed forward at the start of a line and then stopped broke the reading's flow. I revised the route so it keeps moving through one place, with the final pullback giving the empty sands more room.

## What I learned

I learned to pay attention to where objects meet. A foot resting flat on stone and a fragment partly buried in sand did more to establish weight than another visual effect. Different fracture shapes and burial depths helped the ruin feel weathered rather than assembled.

I also had to treat the poem's form as part of the work. On narrow screens, long lines scroll horizontally so Shelley's line breaks remain unchanged. The interaction should help someone read the poem without rearranging it.

## What's next

I'd like to watch readers use the tour and exploration controls, and test the project on more physical devices. Another poem would need its own setting and visual language. For this submission, the published experience is focused on Ozymandias.
