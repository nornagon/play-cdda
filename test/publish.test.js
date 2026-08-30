import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { readBuilds } from "../publish.js";

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
