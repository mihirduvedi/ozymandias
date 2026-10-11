# Third-party notices

The MIT license covers original project code and documentation. The assets below
retain their own terms. Their attribution is also available in the app's About
panel and in the files shipped with each asset.

| Material | Creator and source | License |
| --- | --- | --- |
| Ozymandias | Percy Bysshe Shelley, 1818, [Academy of American Poets edition](https://poets.org/poem/ozymandias) | Public domain |
| Ramesses II scan | Daniel Pett (Dejp3), [Colossal sculpture of Ramesses II at Memphis](https://commons.wikimedia.org/wiki/File:Colossal_sculpture_of_Ramesses_II.stl) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| Anatomical mesh data | [MakeHuman Community](https://github.com/makehumancommunity/makehuman/blob/a8bc2d54ff0ac92e78ff71431b1023eda42bf482/LICENSE.ASSETS.md) | CC0 1.0 Universal |
| Sand 03 textures | Charlotte Baglioni, [Poly Haven](https://polyhaven.com/a/sand_03) | CC0 |
| Rock Boulder Dry textures | Dimitrios Savva, photography, and Rico Cilliers, processing, [Poly Haven](https://polyhaven.com/a/rock_boulder_dry) | CC0 |
| Gentle air | dhallcomposer, [Looping Gentle Wind Ambience on an Open Desert Plain.wav](https://freesound.org/people/dhallcomposer/sounds/697217/) | CC0 |
| EB Garamond | Georg Duffner and Octavio Pardo, [font source](https://github.com/google/fonts/tree/main/ofl/ebgaramond) | SIL Open Font License 1.1 |
| Cinzel | Natanael Gama, [font source](https://github.com/google/fonts/tree/main/ofl/cinzel) | SIL Open Font License 1.1 |

The Ramesses model was cropped, sealed, rematerialed, and reshaped. Its crown and
rear slab were removed, broken surfaces were roughened, and its brows and mouth
were altered to reflect the poem's frown, wrinkled lip, and sneer. It is partly
buried at runtime. These changes are an interpretation of Shelley, and they do
not imply endorsement by Daniel Pett. Exact source and modification records are
in `public/world/ramesses/provenance.json`.

The MakeHuman derivatives use mesh and target data under CC0. They do not include
MakeHuman's AGPL application code. The legs and hand were subdivided, cropped,
sealed, weathered, and positioned for this world. Their license and modification
records are in `public/world/anatomy`.

The air source is a designed recording made by blowing gently past a microphone.
It is filtered and assembled with long crossfades. It is not a recording made
on location in a desert. See `public/world/audio/CREDITS.md`.

## Preserved experiments

The repository also contains inactive assets and source from earlier design
experiments. They are not presented as part of the finished Ozymandias world.

- Poly Haven's `marble_bust_01`, by Rico Cilliers, is CC0. Its file ledger is
  `public/world/manifest.json`.
- The unused Atacama wind recording by Félix Blume is CC0. Its credit is in
  `public/world/audio/CREDITS.md`.
- MakeHuman-derived portraits, skin data, and falconer assets in `public/world/vision`
  retain the accompanying CC0 notices and provenance. The procedural lion body,
  birds, and interpretive props are original project geometry.
- The Second Coming text follows Project Gutenberg's 1920 edition of Michael
  Robartes and the Dancer. Its U.S. public-domain notice is recorded in the text
  manifest. The poem is hidden from the published experience.
- Earlier generated artwork in `public/art` was made with AI image tools during
  the design process. The current world does not use it as a backdrop or sculpture.
- Barlow and Barlow Condensed by Jeremy Tribby remain npm dependencies under the
  SIL Open Font License. Other historical font notices in `public/fonts/licenses`
  cover Cormorant Garamond, Newsreader, and DM Sans. These are not the active UI font.

Runtime libraries are installed from the committed npm lockfile. React, Three.js,
and their addons retain their MIT licenses. Other packages retain the license
files included in their published distributions. No dependency is relicensed by
this project's MIT notice.
