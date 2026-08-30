import fs from "node:fs";
import path from "node:path";

const directory = process.argv[2];
if (!directory) throw new Error("usage: smoke-bundle.mjs BUNDLE_DIRECTORY");

for (const filename of [
  "index.html",
  "cataclysm-tiles.js",
  "cataclysm-tiles.wasm",
  "cataclysm-tiles.data",
  "cataclysm-tiles.data.js",
  "tilesets.json",
]) {
  const stat = fs.statSync(path.join(directory, filename));
  if (!stat.isFile() || stat.size === 0) throw new Error(`${filename} is empty`);
}

const manifest = JSON.parse(fs.readFileSync(path.join(directory, "tilesets.json"), "utf8"));
if (Object.keys(manifest).length === 0) {
  throw new Error("No on-demand tilesets were packaged");
}
for (const [tileset, info] of Object.entries(manifest)) {
  if (!info || typeof info.module !== "string" || !Number.isSafeInteger(info.size)) {
    throw new Error(`Invalid manifest entry for ${tileset}`);
  }
  const modulePath = path.join(directory, info.module);
  const dataPath = modulePath.replace(/\.mjs$/, ".data");
  if (!fs.statSync(modulePath).isFile()) throw new Error(`Missing ${info.module}`);
  const dataStat = fs.statSync(dataPath);
  if (dataStat.size !== info.size) {
    throw new Error(`${path.basename(dataPath)} is ${dataStat.size} bytes; manifest says ${info.size}`);
  }
}

console.log(`Bundle is complete; ${Object.keys(manifest).length} tilesets load on demand.`);
