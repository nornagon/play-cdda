# Emscripten asynchronous link investigation

Measured 2026-08-30 with Emscripten 6.0.8.  Times are link-only, with the
translation units already compiled, and were captured with macOS
`/usr/bin/time -lp`.  Sizes below are the generated wasm only.

## Result

Use `-sJSPI` and `-fwasm-exceptions` together once Safari 27 is the minimum
supported Safari release.  Patch:

`patches/experimental/0005-Use-JSPI-and-native-WebAssembly-exceptions.patch`

| Variant | Wall | Peak RSS | wasm | gzip -9 | Browser result |
| --- | ---: | ---: | ---: | ---: | --- |
| Current `-Os -sASYNCIFY -fexceptions` | about 61+ min | about 10 GB | 61,689,394 | 15,801,795 | Existing behavior |
| `-Os -sJSPI -fexceptions` | 117.25 s | not recorded | 38,462,287 | 10,504,264 | Fails in static constructors: suspension occurs without `WebAssembly.promising` |
| `-Os -sJSPI -fwasm-exceptions` | **54.84 s** | **1,682,718,720** | **28,839,106** | **8,814,839** | Pass |
| `-O1 -sASYNCIFY -fexceptions` | 17.56 s | 5,407,440,896 | 139,455,579 | 55,404,940 | Rejected: transfer is 3.5x baseline gzip |
| `-O2 -sASYNCIFY -sASYNCIFY_IGNORE_INDIRECT=1` | 23.47 s | 2,475,917,312 | 40,175,632 | 10,577,689 | Fails at dynamic tileset load with `invalid state: 1` |
| `-O2 -sASYNCIFY` with full indirect propagation | >28m 07s (stopped) | 4,002,217,984 | incomplete | incomplete | Stopped after Safari 26 was removed from scope |

The cold native-Wasm-exception compile of all 486 translation units took
97.41 seconds with 14 jobs before the link measurement.  Normal incremental
compiles remain ccache-backed.

## Actual suspension boundaries

There are three application-level boundary families:

1. `src/main.cpp:579`: `mount_idbfs()` awaits the initial `FS.syncfs(true)`.
   The later dirty-save flush uses a callback and does not suspend C++.
2. `src/tileset_loader.cpp:56`: `ensure_web_tileset_is_loaded()` awaits the
   manifest fetch, dynamic package-module import, and package installation.
3. `src/ui_manager.cpp:517` and `src/sdltiles.cpp:6277,6289`: browser yielding
   through `emscripten_sleep(1)` or SDL delay.  SDL3's Emscripten timer,
   framebuffer, and GLES swap implementations can themselves call
   `emscripten_sleep(0)`.

The top-level turn loop is at `src/main.cpp:877`, but changing only that loop to
`emscripten_set_main_loop` is insufficient.  Blocking input is implemented in
`input_context::handle_input()` and `input_manager::get_input_event()`, with 98
`handle_input()` call sites spread over 69 C++ files.  Modal UI loops, initial
IDBFS hydration, and the synchronous tileset loader would all need conversion
to continuations/state machines.

## Why manual Asyncify narrowing was rejected

The real async imports are `emscripten_sleep`, `__asyncjs__mount_idbfs`, and
`__asyncjs__ensure_web_tileset_is_loaded`.  Emscripten already discovers those.
Legacy `-fexceptions`, however, adds hundreds of `invoke_*` imports and
Emscripten treats them as possible indirect suspension paths.

`ASYNCIFY_IGNORE_INDIRECT=1` linked quickly, but Chrome reached the tileset
boundary through `invoke_iiiiiijjii` and aborted.  Adding that exact thunk to
`ASYNCIFY_IMPORTS` merely moved the failure to `invoke_viiiiii`/`invoke_v` and
caused an invalid rewind.  `ASYNCIFY_ONLY` or `ASYNCIFY_REMOVE` would require a
large optimization-sensitive list covering nested UI stacks, so neither is a
maintainable downstream patch.

## Import/export minification

Emscripten 6.0.8 automatically skips import/export minification for JSPI
because JSPI requires a stable `main` export.  This is the safe opt-out.

`-sDECLARE_ASM_MODULE_EXPORTS=0` is not a safe Asyncify opt-out: the resulting
build failed at the first suspension because `_asyncify_start_unwind` was not
bound.  There is no supported public Asyncify switch for
`MINIFY_WASM_IMPORTS_AND_EXPORTS` in 6.0.8.

The isolated Binaryen name-minification transform on the winning wasm took
1.70 seconds and 665,108,480 bytes RSS.  It changed raw size from 28,839,106 to
28,850,586 and gzip size from 8,814,839 to 8,828,402 (both slightly worse).
The old 15-minute final stage is expensive because Emscripten also repeats
full optimization after meta-DCE, not because shortening a few names saves
meaningful transfer bytes.

## Browser validation

Tested in Chrome 152.0.7977.64 with a real HTTP-served bundle:

- booted through IDBFS mounting to the main menu;
- created a real world and character, rendered the dynamically downloaded
  UltimateCataclysm tileset, then used **Save and quit**;
- observed successful requests for `tilesets.json`,
  `tileset-UltimateCataclysm.mjs`, and
  `tileset-UltimateCataclysm.data`;
- reloaded the page and verified the compressed `Punxsutawney` world/save tree
  was restored from IDBFS.

Evidence and generated artifacts are under `/tmp/cdda-bench/wasmeh-jspi/`,
including `in-game.png`, `reloaded-save.png`, `linked.js`, and `linked.wasm`.

Chrome has shipped JSPI since 137.  Firefox enables it in 153.  Safari 27 beta
adds JSPI; Safari 26 is intentionally outside this patch's compatibility floor.

## Reproduce the winning link measurement

After applying the experimental patch series, compile once so all objects use
native Wasm exceptions.  Move the existing generated JS/wasm aside, then run:

```sh
source /path/to/emsdk/emsdk_env.sh
/usr/bin/time -lp -o /tmp/cdda-jspi-link.time \
  make -j14 NATIVE=emscripten BACKTRACE=0 TILES=1 TESTS=0 RUNTESTS=0 \
  RELEASE=1 CCACHE=1 LINTJSON=0 \
  EMSCRIPTEN_SDL3_IMAGE_PREFIX=/path/to/sdl3-image \
  cataclysm-tiles.js
```
