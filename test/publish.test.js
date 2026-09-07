import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import publish, { readBuilds, upsertVersion } from "../publish.js";

test("readBuilds finds and sorts downloaded channel artifacts", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "play-cdda-test-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  for (const channel of ["stable", "experimental"]) {
    const directory = path.join(root, `bundle-${channel}`);
    await fs.mkdir(directory);
    await fs.writeFile(path.join(directory, "build-metadata.json"), JSON.stringify({ channel }));
  }
  await fs.mkdir(path.join(root, "unrelated"));

  const builds = await readBuilds(root);
  assert.deepEqual(builds.map((build) => build.metadata.channel), ["experimental", "stable"]);
});

test("readBuilds treats a missing artifact directory as no successful builds", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "play-cdda-test-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const builds = await readBuilds(path.join(root, "missing"));
  assert.deepEqual(builds, []);
});

test("publish copies a browser bundle into a local data-branch checkout", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "play-cdda-test-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const artifactsDir = path.join(root, "artifacts");
  const buildDir = path.join(artifactsDir, "bundle-experimental");
  const siteDir = path.join(root, "site");
  await fs.mkdir(path.join(buildDir, "nested"), { recursive: true });
  await fs.mkdir(siteDir);
  await fs.writeFile(path.join(siteDir, "channels.json"), JSON.stringify({
    channels: { stable: { version: "stable-old" } },
  }));
  await fs.writeFile(path.join(siteDir, "versions.json"), JSON.stringify([
    {
      build_number: "0.I",
      version: "stable-old",
      prerelease: false,
      created_at: "2026-06-06T00:00:00Z",
      built_at: "2026-08-29T00:00:00Z",
    },
  ]));
  await fs.writeFile(path.join(buildDir, "game.wasm"), "wasm");
  await fs.writeFile(path.join(buildDir, "nested", "asset.txt"), "asset");
  await fs.writeFile(path.join(buildDir, "build-metadata.json"), JSON.stringify({
    channel: "experimental",
    version: "experimental-new",
    tag: "cdda-experimental-new",
    sourceSha: "abc123",
    patchset: "experimental1-test",
    upstreamPublishedAt: "2026-08-30T00:00:00Z",
    builtAt: "2026-08-30T01:00:00Z",
  }));

  const core = { info() {}, startGroup() {}, endGroup() {} };
  await publish({ core, artifactsDir, siteDir });

  assert.equal(await fs.readFile(
    path.join(siteDir, "v", "experimental-new", "game.wasm"), "utf8"), "wasm");
  assert.equal(await fs.readFile(
    path.join(siteDir, "v", "experimental-new", "nested", "asset.txt"), "utf8"), "asset");
  await assert.rejects(fs.access(
    path.join(siteDir, "v", "experimental-new", "build-metadata.json")));
  const manifest = JSON.parse(await fs.readFile(path.join(siteDir, "channels.json"), "utf8"));
  assert.equal(manifest.channels.stable.version, "stable-old");
  assert.equal(manifest.channels.experimental.version, "experimental-new");
  const versions = JSON.parse(await fs.readFile(path.join(siteDir, "versions.json"), "utf8"));
  assert.deepEqual(versions.map(({ build_number, version }) => ({ build_number, version })), [
    { build_number: "cdda-experimental-new", version: "experimental-new" },
    { build_number: "0.I", version: "stable-old" },
  ]);
});

test("upsertVersion replaces a rebuild without losing other versions", () => {
  const versions = upsertVersion([
    {
      build_number: "cdda-experimental-one",
      version: "one-web-patch",
      prerelease: true,
      created_at: "2026-08-30T00:00:00Z",
      built_at: "2026-08-30T01:00:00Z",
    },
    {
      build_number: "0.I",
      version: "0.I-web-patch",
      prerelease: false,
      created_at: "2026-06-06T00:00:00Z",
      built_at: "2026-08-29T00:00:00Z",
    },
  ], {
    channel: "experimental",
    tag: "cdda-experimental-one",
    version: "one-web-patch",
    upstreamPublishedAt: "2026-08-30T00:00:00Z",
    builtAt: "2026-09-01T01:00:00Z",
  });

  assert.equal(versions.length, 2);
  assert.deepEqual(versions[0], {
    build_number: "cdda-experimental-one",
    version: "one-web-patch",
    prerelease: true,
    created_at: "2026-08-30T00:00:00Z",
    built_at: "2026-09-01T01:00:00Z",
  });
});
