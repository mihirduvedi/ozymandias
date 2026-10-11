# Asset provenance

The finished Ozymandias scene uses real 3D geometry and photographed surface
maps. It has no generated image backdrop or face plate. The world is a literary
interpretation, and its English inscription helps readers connect the ruin to
the poem.

[Third-party notices](../THIRD_PARTY_NOTICES.md) list creators, sources, and
licenses. The app's About panel credits the active scene assets.

## The sculpture

Daniel Pett's scan of the Ramesses II colossus at Memphis is the source of the
fallen face. The original scan contained 500,586 triangles. The bundled cropped
portrait contains 141,804 triangles and is 7,090,284 bytes. Its source license is
CC BY 4.0.

The crown and rear slab were removed. The crop was sealed and its fracture
surfaces were refined. Runtime deformation lowers the mouth corners and inner
brows, compresses and wrinkles the lip, and adds an asymmetric sneer. Crack
shading, material, scale, and burial are applied in the scene. The model remains
closed. Source URL, hashes, cut planes, modifications, and topology results are
in `public/world/ramesses/provenance.json`.

The anatomical legs, feet, and hand use MakeHuman Community's CC0 base mesh and
adult male targets, pinned to commit
`a8bc2d54ff0ac92e78ff71431b1023eda42bf482`. They were subdivided, cropped, sealed,
aligned, and weathered. The plantar pads are flat, the toes remain distinct, and
the tops have irregular fracture surfaces. The hand is oriented using its
support hull and center of mass. The bundled anatomy license and source hashes
are in `public/world/anatomy`.

The pedestal and scattered statue remnants are original project geometry.
Pedestal courses overlap, both feet bear into the top course, and cracks avoid
the legible carved words. Sand burial varies with the shape and orientation of
each object. Settling and blowing sand are visual approximations, rather than a
complete rigid-body or granular simulation.

## Surface, type, and sound

Sand 03 by Charlotte Baglioni and Rock Boulder Dry by Dimitrios Savva and Rico
Cilliers come from Poly Haven under CC0. Color, normal, and roughness maps are
bundled locally. Runtime file sizes and SHA-256 hashes are in
`public/world/refinement-manifest.json`.

EB Garamond sets the interface and poem. Cinzel 600 outlines form the recessed
inscription. Both fonts are under the SIL Open Font License, whose full text is
included in `public/world/fonts`. The interface uses locally bundled Fontsource
font files.

The optional air sound is dhallcomposer's CC0 designed recording from Freesound.
Filtering removes rumble and slow compression softens its gusts. Six gently
varied passages produce a roughly three-minute bed, with twelve-second
crossfades and restrained playback gain. Source links and the processing command
are in `public/world/audio/CREDITS.md`.

## Reproducing prepared assets

The app runs with the prepared files in this repository. Python, external source
models, and mesh-authoring tools are not required for installation or deployment.

The scripts record how those files were made. Re-running the mesh scripts needs
the credited upstream source data and the authoring dependencies shown in their
imports. Their original `../../work` paths refer to the local authoring workspace,
which is not part of the submission. Download the sources from the provenance
records and adjust those paths before rebuilding a model. The air script accepts
a source and output path directly. The inscription script uses the font from
the installed npm package.

## Preserved assets

Earlier image studies, the old Roman bust, and the hidden Second Coming experiment
remain in the source package so the design work is recoverable. They are not used
as evidence of the final scene's rendering. Their licenses are listed separately
in [third-party notices](../THIRD_PARTY_NOTICES.md), and their original ledgers
remain beside the assets.
