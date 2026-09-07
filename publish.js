// @ts-check
import fs from "node:fs/promises";
import path from "node:path";

/**
 * @param {{ core: import('@actions/core'), artifactsDir?: string, siteDir?: string }} args
 */
export default async function publish({ core, artifactsDir = "artifacts", siteDir = "site" }) {
  const builds = await readBuilds(artifactsDir);
  if (!builds.length) {
    core.info("No build artifacts to publish");
    return;
  }

  const manifest = await readManifest(siteDir);
  let versions = await readVersions(siteDir);

  for (const build of builds) {
    validateName(build.metadata.channel, "channel");
    validateName(build.metadata.version, "version");
    validateName(build.metadata.tag, "tag");
    core.startGroup(`Uploading ${build.metadata.channel}: ${build.metadata.version}`);
    for (const filename of await listFiles(build.directory)) {
      if (filename === "build-metadata.json") continue;
      const source = path.join(build.directory, filename);
      const destination = path.join(siteDir, "v", build.metadata.version, filename);
      const stat = await fs.stat(source);
      core.info(`${filename} (${formatBytes(stat.size)})`);
      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.copyFile(source, destination);
    }
    core.endGroup();

    manifest.channels[build.metadata.channel] = {
      version: build.metadata.version,
      tag: build.metadata.tag,
      sourceSha: build.metadata.sourceSha,
      patchset: build.metadata.patchset,
      upstreamPublishedAt: build.metadata.upstreamPublishedAt,
      builtAt: build.metadata.builtAt,
    };
    versions = upsertVersion(versions, build.metadata);
  }

  manifest.schemaVersion = 1;
  manifest.updatedAt = new Date().toISOString();
  await fs.writeFile(
    path.join(siteDir, "channels.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(siteDir, "versions.json"),
    `${JSON.stringify(versions, null, 2)}\n`,
  );
}

/**
 * Add a published browser build to the cdda-data-compatible version index.
 * `build_number` is the upstream release tag used by CDDA Guide, while
 * `version` is the immutable Play CDDA directory name.
 *
 * @param {Array<any>} versions
 * @param {any} metadata
 */
export function upsertVersion(versions, metadata) {
  const entry = {
    build_number: metadata.tag,
    version: metadata.version,
    prerelease: metadata.channel !== "stable",
    created_at: metadata.upstreamPublishedAt,
    built_at: metadata.builtAt,
  };
  return [entry, ...versions.filter((version) => version.version !== entry.version)]
    .sort((a, b) =>
      (b.created_at || "").localeCompare(a.created_at || "") ||
      (b.built_at || "").localeCompare(a.built_at || "") ||
      a.version.localeCompare(b.version));
}

export async function readBuilds(artifactsDir) {
  let entries;
  try {
    entries = await fs.readdir(artifactsDir, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  const builds = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const directory = path.join(artifactsDir, entry.name);
    const metadataPath = path.join(directory, "build-metadata.json");
    try {
      const metadata = JSON.parse(await fs.readFile(metadataPath, "utf8"));
      builds.push({ directory, metadata });
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  return builds.sort((a, b) => a.metadata.channel.localeCompare(b.metadata.channel));
}

async function listFiles(root, directory = root) {
  const result = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      result.push(...await listFiles(root, absolute));
    } else if (entry.isFile()) {
      result.push(path.relative(root, absolute).split(path.sep).join("/"));
    }
  }
  return result.sort();
}

async function readManifest(siteDir) {
  try {
    const parsed = JSON.parse(await fs.readFile(path.join(siteDir, "channels.json"), "utf8"));
    return { ...parsed, channels: parsed.channels || {} };
  } catch (error) {
    if (error.code === "ENOENT") return { channels: {} };
    throw error;
  }
}

async function readVersions(siteDir) {
  try {
    const parsed = JSON.parse(
      await fs.readFile(path.join(siteDir, "versions.json"), "utf8"),
    );
    if (!Array.isArray(parsed)) {
      throw new Error("versions.json must contain an array");
    }
    return parsed;
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

function validateName(value, label) {
  if (typeof value !== "string" || !/^[A-Za-z0-9._-]+$/.test(value)) {
    throw new Error(`Unsafe ${label}: ${JSON.stringify(value)}`);
  }
}

function formatBytes(bytes) {
  const units = ["B", "KiB", "MiB", "GiB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(unit ? 1 : 0)} ${units[unit]}`;
}
