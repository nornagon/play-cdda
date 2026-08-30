// @ts-check
import crypto from "node:crypto";
import fs from "node:fs/promises";
import {
  buildVersion,
  channelNames,
  patchsetForRelease,
  upstream,
} from "./channel-config.js";

/**
 * Select the newest upstream release for each public channel.
 *
 * @param {Array<any>} releases
 */
export function selectChannels(releases) {
  const newest = (predicate) => releases
    .filter((release) => !release.draft && predicate(release))
    .sort((a, b) => releaseTime(b) - releaseTime(a))[0];

  return {
    stable: newest((release) => !release.prerelease),
    prerelease: newest((release) =>
      release.prerelease && !release.tag_name.startsWith("cdda-experimental-")),
    experimental: newest((release) =>
      release.prerelease && release.tag_name.startsWith("cdda-experimental-")),
  };
}

export function selectTilesetAsset(release) {
  return release.assets?.find((asset) =>
    /linux-with-graphics-x64.*\.tar\.gz$/.test(asset.name) &&
    !asset.name.includes("and-sounds"));
}

/** @param {any} release */
function releaseTime(release) {
  return +new Date(release.published_at || release.created_at || 0);
}

/**
 * @param {import('github-script').AsyncFunctionArguments & {
 *   requestedChannel?: string,
 *   force?: boolean,
 * }} args
 */
export default async function discover({ github, context, core, requestedChannel = "all", force = false }) {
  if (requestedChannel !== "all" && !channelNames.includes(requestedChannel)) {
    throw new Error(`Unknown channel: ${requestedChannel}`);
  }

  const [latestStable, recentReleases] = await Promise.all([
    github.rest.repos.getLatestRelease(upstream).then((response) => response.data),
    listTrackableReleases(github),
  ]);
  // Daily experimentals can push a months-old stable tag beyond the first API
  // page, so always inject GitHub's canonical latest stable release.
  const releases = [latestStable, ...recentReleases.filter((release) =>
    release.id !== latestStable.id)];
  const selected = selectChannels(releases);
  const currentManifest = await readManifest(github, context.repo);
  const wantedChannels = requestedChannel === "all" ? channelNames : [requestedChannel];
  const include = [];

  for (const channel of wantedChannels) {
    const release = selected[channel];
    if (!release) {
      throw new Error(`No upstream ${channel} release was found`);
    }

    const sourceSha = await github.rest.repos.getCommit({
      ...upstream,
      ref: release.tag_name,
    }).then((response) => response.data.sha);
    const tilesetAsset = selectTilesetAsset(release);
    if (!tilesetAsset) {
      throw new Error(`No Linux graphics bundle found for ${release.tag_name}`);
    }
    const patchset = patchsetForRelease(channel, release.tag_name);
    const patchsetId = await identifyPatchset(patchset);
    const current = currentManifest.channels?.[channel];
    if (!force && current?.sourceSha === sourceSha &&
        current?.patchset === patchsetId) {
      core.info(`${channel} already points at ${release.tag_name} (${sourceSha})`);
      continue;
    }

    include.push({
      channel,
      tag: release.tag_name,
      sourceSha,
      publishedAt: release.published_at,
      tilesetAssetUrl: tilesetAsset.browser_download_url,
      patchFamily: patchset.family,
      patchVersion: patchset.version,
      patchsetId,
      version: buildVersion(release.tag_name, patchsetId),
    });
  }

  core.setOutput("matrix", JSON.stringify({ include }));
  core.setOutput("has_builds", include.length ? "true" : "false");
  core.info(include.length
    ? `Will build: ${include.map((entry) => `${entry.channel}=${entry.tag}`).join(", ")}`
    : "All requested channels are current");
}

async function listTrackableReleases(github) {
  const releases = [];
  for (let page = 1; page <= 10; page++) {
    const batch = await github.rest.repos.listReleases({
      ...upstream,
      per_page: 100,
      page,
    }).then((response) => response.data);
    releases.push(...batch);
    const selected = selectChannels(releases);
    if ((selected.prerelease && selected.experimental) || batch.length < 100) break;
  }
  return releases;
}

async function identifyPatchset(patchset) {
  const directory = new URL(`./patches/${patchset.family}/`, import.meta.url);
  const filenames = (await fs.readdir(directory))
    .filter((filename) => filename.endsWith(".patch"))
    .sort();
  if (!filenames.length) throw new Error(`Patchset ${patchset.family} is empty`);
  const hash = crypto.createHash("sha256");
  for (const filename of filenames) {
    hash.update(filename);
    hash.update(await fs.readFile(new URL(filename, directory)));
  }
  return `${patchset.family}${patchset.version}-${hash.digest("hex").slice(0, 10)}`;
}

async function readManifest(github, repo) {
  try {
    const response = await github.rest.repos.getContent({
      ...repo,
      path: "channels.json",
      ref: "data",
    });
    if (Array.isArray(response.data) || response.data.type !== "file") return { channels: {} };
    return JSON.parse(Buffer.from(response.data.content, "base64").toString("utf8"));
  } catch (error) {
    if (error.status === 404) return { channels: {} };
    throw error;
  }
}
