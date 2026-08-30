// @ts-check
import fs from "node:fs/promises";
import path from "node:path";

const dataBranch = "data";

/**
 * @param {import('github-script').AsyncFunctionArguments & { artifactsDir?: string }} args
 */
export default async function publish({ github, context, core, artifactsDir = "artifacts" }) {
  const builds = await readBuilds(artifactsDir);
  if (!builds.length) {
    core.info("No build artifacts to publish");
    return;
  }

  const baseCommit = await github.rest.git.getRef({
    ...context.repo,
    ref: `heads/${dataBranch}`,
  }).then((response) => response.data.object.sha);
  const baseTree = await github.rest.git.getCommit({
    ...context.repo,
    commit_sha: baseCommit,
  }).then((response) => response.data.tree.sha);
  const manifest = await readManifest(github, context.repo);
  const tree = [];

  for (const build of builds) {
    validateName(build.metadata.channel, "channel");
    validateName(build.metadata.version, "version");
    core.startGroup(`Uploading ${build.metadata.channel}: ${build.metadata.version}`);
    for (const filename of await listFiles(build.directory)) {
      if (filename === "build-metadata.json") continue;
      const bytes = await fs.readFile(path.join(build.directory, filename));
      core.info(`${filename} (${formatBytes(bytes.length)})`);
      const blob = await retry(() => github.rest.git.createBlob({
        ...context.repo,
        content: bytes.toString("base64"),
        encoding: "base64",
      }));
      tree.push({
        path: `v/${build.metadata.version}/${filename}`,
        mode: "100644",
        type: "blob",
        sha: blob.data.sha,
      });
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
  }

  manifest.schemaVersion = 1;
  manifest.updatedAt = new Date().toISOString();
  const manifestBlob = await github.rest.git.createBlob({
    ...context.repo,
    content: `${JSON.stringify(manifest, null, 2)}\n`,
    encoding: "utf-8",
  });
  tree.push({ path: "channels.json", mode: "100644", type: "blob", sha: manifestBlob.data.sha });

  const newTree = await github.rest.git.createTree({
    ...context.repo,
    base_tree: baseTree,
    tree,
  }).then((response) => response.data.sha);
  const summary = builds.map((build) =>
    `${build.metadata.channel}=${build.metadata.tag}`).join(", ");
  const newCommit = await github.rest.git.createCommit({
    ...context.repo,
    message: `Publish web builds: ${summary}`,
    tree: newTree,
    parents: [baseCommit],
  }).then((response) => response.data.sha);
  await github.rest.git.updateRef({
    ...context.repo,
    ref: `heads/${dataBranch}`,
    sha: newCommit,
  });
  core.info(`Updated ${dataBranch} to ${newCommit}`);
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

async function readManifest(github, repo) {
  try {
    const response = await github.rest.repos.getContent({
      ...repo,
      path: "channels.json",
      ref: dataBranch,
    });
    if (Array.isArray(response.data) || response.data.type !== "file") return { channels: {} };
    const parsed = JSON.parse(Buffer.from(response.data.content, "base64").toString("utf8"));
    return { ...parsed, channels: parsed.channels || {} };
  } catch (error) {
    if (error.status === 404) return { channels: {} };
    throw error;
  }
}

function validateName(value, label) {
  if (typeof value !== "string" || !/^[A-Za-z0-9._-]+$/.test(value)) {
    throw new Error(`Unsafe ${label}: ${JSON.stringify(value)}`);
  }
}

async function retry(fn, retries = 8) {
  let lastError;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt + 1 < retries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }
  throw lastError;
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
