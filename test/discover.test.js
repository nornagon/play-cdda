import assert from "node:assert/strict";
import test from "node:test";
import { selectChannels, selectTilesetAsset } from "../discover.js";
import { patchsetForRelease } from "../channel-config.js";

test("selectChannels separates stable, release candidate, and experimental", () => {
  const releases = [
    release("old-stable", false, "2025-01-01"),
    release("0.I", false, "2026-06-06"),
    release("cdda-0.I-older", true, "2026-08-20"),
    release("cdda-0.I-current", true, "2026-08-29"),
    release("cdda-experimental-older", true, "2026-08-28"),
    release("cdda-experimental-current", true, "2026-08-30"),
    { ...release("draft", false, "2027-01-01"), draft: true },
  ];
  const selected = selectChannels(releases);
  assert.equal(selected.stable.tag_name, "0.I");
  assert.equal(selected.prerelease.tag_name, "cdda-0.I-current");
  assert.equal(selected.experimental.tag_name, "cdda-experimental-current");
});

test("0.I releases use the legacy patch while future releases follow experimental", () => {
  assert.equal(patchsetForRelease("stable", "0.I").family, "0-i");
  assert.equal(patchsetForRelease("prerelease", "cdda-0.I-2026-08-29").family, "0-i");
  assert.equal(patchsetForRelease("stable", "0.J").family, "experimental");
});

test("selectTilesetAsset chooses graphics without the sound bundle", () => {
  const asset = selectTilesetAsset({ assets: [
    { name: "cdda-linux-with-graphics-and-sounds-x64-build.tar.gz", browser_download_url: "large" },
    { name: "cdda-linux-with-graphics-x64-build.tar.gz", browser_download_url: "tiles" },
  ] });
  assert.equal(asset.browser_download_url, "tiles");
});

function release(tag_name, prerelease, published_at) {
  return { tag_name, prerelease, published_at, draft: false };
}
