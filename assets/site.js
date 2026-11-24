// Renders the download pages from the manifests in /manifests (format: README.md, schema 1).
// All text goes in through textContent: nothing from a manifest is ever parsed as HTML.
"use strict";

const SCHEMA = 1;

// "windows" | "macos" | "linux" | null. Phones, tablets and ChromeOS are null: no button is emphasized.
function detectOs() {
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod|Android|CrOS/i.test(ua)) return null;
  const platform = (navigator.userAgentData && navigator.userAgentData.platform) || "";
  const text = (platform + " " + ua).toLowerCase();
  if (text.includes("windows")) return "windows";
  if (text.includes("mac")) return "macos";
  if (text.includes("linux")) return "linux";
  return null;
}

// A same-origin path in ?manifest= replaces the default (for checking the page against a sample).
function manifestUrl(defaultUrl) {
  const override = new URLSearchParams(location.search).get("manifest");
  return override && override.startsWith("/") && !override.startsWith("//") ? override : defaultUrl;
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: "no-cache" });
  if (!response.ok) return null;
  try { return await response.json(); } catch { return null; }
}

function isManifest(m) {
  return m && m.schema === SCHEMA && typeof m.version === "string" && Array.isArray(m.files);
}

function el(tag, attrs, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (key === "class") node.className = value; else node.setAttribute(key, value);
  }
  for (const child of children) node.append(child);
  return node;
}

const megabytes = size => Math.max(1, Math.round(size / 1048576)) + " MB";

// The buttons, in the order they appear when the visitor's OS is unknown.
const BUTTONS = [
  { os: "windows", arch: "x64", kind: "installer", label: "Download for Windows" },
  { os: "macos", arch: "arm64", kind: "app-zip", label: "Download for Mac (Apple silicon)" },
  { os: "macos", arch: "x64", kind: "app-zip", label: "Download for Mac (Intel)" },
  { os: "linux", arch: "x86_64", kind: "appimage", label: "Download for Linux" },
];

function findFile(m, os, arch, kind) {
  return m.files.find(f => f.os === os && f.arch === arch && f.kind === kind);
}

function downloadRow(m, button, primary) {
  const file = findFile(m, button.os, button.arch, button.kind);
  if (!file) return null;
  const row = el("div", { class: "download" + (primary ? " primary" : "") },
    el("a", { class: "button", href: file.url }, button.label),
    el("span", { class: "file" }, file.name + " · " + megabytes(file.size)),
    el("span", { class: "sha" }, "sha256 " + file.sha256));
  if (button.os === "macos" && button.arch === "x64") {
    row.append(el("span", { class: "extra muted" },
      "Which Mac do I have? Apple menu → About This Mac: \"Chip\" (Apple M…) means Apple silicon; \"Processor\" (Intel) means Intel."));
  }
  if (button.os === "linux") {
    const rules = findFile(m, "linux", null, "udev-rules");
    if (rules) {
      row.append(el("span", { class: "extra" }, "For USB access to the device: ",
        el("a", { href: rules.url }, rules.name), " (see Installing → Linux below)."));
    }
  }
  return row;
}

async function renderProduct(defaultManifestUrl, root) {
  const m = await fetchJson(manifestUrl(defaultManifestUrl));
  root.replaceChildren();
  if (!isManifest(m)) {
    root.append(el("p", { class: "notice" }, "The first release is on its way."));
    return;
  }
  document.title = m.name + " " + m.version + " · AmpRepo Downloads";
  root.append(el("h1", {}, m.name + " " + m.version));
  root.append(el("p", { class: "muted" }, "Released " + m.date + " · ",
    el("a", { href: m.release }, "Release page")));

  const os = detectOs();
  const ordered = BUTTONS.filter(b => b.os === os).concat(BUTTONS.filter(b => b.os !== os));
  const list = el("div", { class: "downloads" });
  for (const button of ordered) {
    // Both Mac buttons lead on a Mac: which chip it has cannot be read from the browser.
    const row = downloadRow(m, button, os !== null && button.os === os);
    if (row) list.append(row);
  }
  root.append(list);

  if (Array.isArray(m.notes) && m.notes.length) {
    root.append(el("h2", {}, "What's new in " + m.version));
    root.append(el("ul", {}, ...m.notes.map(note => el("li", {}, String(note)))));
  }
  root.append(el("p", { class: "small" },
    el("a", { href: "https://github.com/AmpRepo/AmpRepo.Downloads/releases?q=" + encodeURIComponent(m.product) }, "All versions"),
    " · checksums for every file are in SHA256SUMS.txt on the release page."));
}

async function renderLanding(productsUrl, root) {
  const products = await fetchJson(productsUrl);
  root.replaceChildren();
  if (!Array.isArray(products)) return;
  for (const p of products) {
    const m = await fetchJson(p.manifest);
    const card = el("div", { class: "card" },
      el("h2", {}, el("a", { href: p.page }, p.name)),
      el("p", {}, p.summary),
      el("p", { class: "muted small" }, isManifest(m) ? "Current version " + m.version + " · released " + m.date : "Coming soon."));
    root.append(card);
  }
}
