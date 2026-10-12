# Publication check

Checked October 11, 2026.

The [repository](https://github.com/mihirduvedi/ozymandias) is public, and the
[demo](https://mihirduvedi.github.io/ozymandias/) is live on GitHub Pages. The
site does not need a visitor account, API key, or separate server.

## Build and source

The initial published source is commit
`292bd988f4ace3ab5a3716a9516172b6d6f4fb96`.
Its [test and deployment run](https://github.com/mihirduvedi/ozymandias/actions/runs/38176150343)
passed. The workflow checks each publication before deploying it.

- All 94 tests passed across 15 test files.
- ESLint passed, and the TypeScript production build succeeded.
- A fresh clone of the public repository installed and built with Node 24.
- The release check verified 28 recorded content and asset hashes, the required
  notices, and portable runtime paths.
- The locked dependency installation reported zero known vulnerabilities.

The publishing change made world asset URLs relative to the hosting directory.
The approved camera path, sculpture, terrain, materials, and interface were
retained. Later documentation and media commits do not change that runtime.

## Hosted experience

The actual GitHub Pages site was opened and inspected in a browser. Its models,
surface maps, local fonts, and optional sound returned successful responses from
the project's hosting directory. The scene rendered as a 3D world.

The automatic tour reached line 14 and showed Reading complete. Restarting,
pausing, and stepping to the next line worked. Selecting the king's boast in the
full poem returned to the inscription. The controls panel listed movement,
perspective, rise, lower, zoom, and travel limits. Motion off and the text-only
reader worked, and the reader retained all fourteen lines. Sound loaded only
after it was selected and could be muted again.

The submission video uses footage captured from that public site. Screenshot
contexts are listed in [images/README.md](images/README.md). Earlier responsive
checks are described in [the QA notes](../QA.md), with their device and
accessibility testing limits.

The video has a [dedicated player](https://mihirduvedi.github.io/ozymandias/watch.html)
on GitHub Pages. The build bundles its MP4, poster, and font with the site, so
watching it does not depend on GitHub's source-file preview.

The [YouTube demo](https://youtu.be/jFqw_-LH898) was uploaded to the existing
Mihir channel. YouTube Studio confirmed Unlisted visibility and completed its
initial checks without a reported issue. Playback was also checked in a real
iframe on a local page. The link is ready for the Devpost video field, whose
saved preview remains a separate check.

Publishing the repository and demo does not submit the project to Devpost.
The final event form and submission status are separate checks.
