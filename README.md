# Play CDDA build publisher

[Play Cataclysm: Dark Days Ahead in a browser](https://nornagon.github.io/play-cdda/).

This repository owns the downstream WebAssembly build and publishes three moving
channels without requiring upstream Cataclysm-DDA CI time:

- `stable`: the newest non-prerelease GitHub release
- `prerelease`: the newest release candidate
- `experimental`: the newest experimental release available at the daily poll

Each channel remains on its last successful build if compilation or smoke tests
fail. Published bundles are immutable under `data:v/<version>/`; `channels.json`
is updated atomically after every successful batch.

Published builds are also listed in
[`versions.json`](https://raw.githubusercontent.com/nornagon/play-cdda/data/versions.json).
Its `build_number` is the upstream CDDA release tag used by CDDA Guide, and its
`version` is the immutable Play CDDA directory name. Consumers should join on
`build_number` and link to `?v=<version>`.

The build uses Emscripten 6.0.8 and ccache. Stable and release candidates share
the SDL2-era `0.I` patch, while current experimental builds use SDL3 plus a
small static SDL3_image build.
