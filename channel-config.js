export const upstream = {
  owner: "CleverRaven",
  repo: "Cataclysm-DDA",
};

export const channelNames = ["stable", "prerelease", "experimental"];

export function patchsetForRelease(channel, tag) {
  if (channel !== "experimental" && (tag === "0.I" || tag.startsWith("cdda-0.I-"))) {
    return { family: "0-i", version: "1" };
  }
  return { family: "experimental", version: "1" };
}

export function buildVersion(tag, patchsetId) {
  return `${tag}-web-${patchsetId}`;
}
