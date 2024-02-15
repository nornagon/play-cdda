// @ts-check
import AdmZip from "adm-zip";

/** @param {import('github-script').AsyncFunctionArguments} AsyncFunctionArguments */
export default async function run({ github, context }) {
  const dataBranch = "data";
  // Get all the files from the main branch on the current repo
  const { data: files } = await github.rest.repos
    .getContent({
      ...context.repo,
      path: "v",
      ref: dataBranch,
    })
    .catch(() => ({ data: [] }));
  if (!Array.isArray(files)) throw new Error("files was not an array");

  const { data: releases } = await github.rest.repos.listReleases({
    owner: "CleverRaven",
    repo: "Cataclysm-DDA",
  });
  // Oldest to newest
  releases.sort(
    (a, b) => +new Date(a.published_at ?? "") - +new Date(b.published_at ?? ""),
  );

  let baseCommit = await github.rest.git
    .getRef({
      ...context.repo,
      ref: `heads/${dataBranch}`,
    })
    .then((r) => r.data.object.sha);
  const initialCommit = baseCommit;
  try {
    for (const rel of releases) {
      const exists = files.find((f) => f.name === rel.tag_name);
      if (!exists) {
        baseCommit = await addRelease(rel, baseCommit);
      }
    }
  } finally {
    if (baseCommit === initialCommit) {
      console.log("No releases added, skipping ref update");
    } else {
      console.log(`Updating ${dataBranch} to ${baseCommit}...`);
      // Update the reference
      await github.rest.git.updateRef({
        ...context.repo,
        ref: `heads/${dataBranch}`,
        sha: baseCommit,
      });
    }
  }

  /**
   * @param {typeof releases[0]} rel
   * @param {string} baseCommit
   */
  async function addRelease(rel, baseCommit) {
    // Download and unzip
    const as = rel.assets.find((a) => a.name.includes("wasm"));
    if (!as) {
      console.log(`No wasm asset found for ${rel.tag_name}`);
      return baseCommit;
    }
    console.group(`Adding ${rel.tag_name}`);
    console.log("Downloading", as.browser_download_url);
    const { data: zip } = await github.request(as.browser_download_url, {
      headers: {
        Accept: "application/zip",
      },
      responseType: "arraybuffer",
    });

    const pathBase = "v/" + rel.tag_name + "/";

    console.group(`Creating blobs at ${pathBase}...`);
    const baseTree = await github.rest.git
      .getCommit({
        ...context.repo,
        commit_sha: baseCommit,
      })
      .then((r) => r.data.tree.sha);

    // Use adm-zip to unzip the file in-memory
    const z = new AdmZip(Buffer.from(zip));
    const blobs = [];
    /** @type {'100644'} */
    const mode = "100644";
    /** @type {'blob'} */
    const type = "blob";
    for (const f of z.getEntries()) {
      if (f.isDirectory) continue;
      console.log(`${f.entryName} (${formatBytes(f.header.size)})`);
      // Create a blob
      const blob = await retry(() => github.rest.git.createBlob({
        ...context.repo,
        content: f.getData().toString("base64"),
        encoding: "base64",
      }));
      blobs.push({
        path: pathBase + f.entryName,
        mode,
        type,
        sha: blob.data.sha,
      });
    }
    console.groupEnd();

    console.log("Creating tree and commit...");
    const tree = await github.rest.git
      .createTree({
        ...context.repo,
        tree: blobs,
        base_tree: baseTree,
      })
      .then((r) => r.data.sha);
    const commit = await github.rest.git
      .createCommit({
        ...context.repo,
        message: `Add ${rel.tag_name} release`,
        tree,
        parents: [baseCommit],
      })
      .then((r) => r.data.sha);
    console.groupEnd();

    return commit;
  }
}

async function retry(fn, retries = 10) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e) {
      console.error("Error", e.message, "- retrying...");
      // Wait an increasing amount of time between retries
      await new Promise((r) => setTimeout(r, 1000 * i));
    }
  }
  throw new Error("Max retries reached");
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
