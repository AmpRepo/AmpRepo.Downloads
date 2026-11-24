# AmpRepo Downloads

The public download site for AmpRepo software, served by GitHub Pages at
**https://downloads.amprepo.com**. Today it carries the AmpRepo Pilot desktop app
(`/pilot/app/`); firmware and effects will join it the same way.

This repo holds only what the public may see: the pages, one manifest per product, and
releases whose files are the downloads. Nothing from a private AmpRepo repo goes here:
no source, no commit history, no internal issue numbers or names.

## Layout

| Path | What |
|---|---|
| `index.html` | Landing page: one card per entry in `manifests/products.json` |
| `pilot/app/index.html` | The AmpRepo Pilot app page |
| `manifests/products.json` | The products the landing page lists (edited by hand) |
| `manifests/<product>.json` | The product's current release (written by its release job) |
| `assets/` | `site.css`, `site.js`, the logo |
| `samples/pilot-app.json` | A complete example manifest |
| `CNAME`, `.nojekyll` | Pages: the custom domain; serve files as they are |

Pages deploys `main` from the repo root; there is no build step.

## How a product publishes

Each product's own (private) repo publishes here from its release workflow, through the
**AmpRepo Publisher** GitHub App, which is installed on this repo only (Contents: read and
write). In order:

1. Create release `<product>-v<version>` (e.g. `pilot-app-v0.5.0`) with **"set as latest"
   off**: several products share this repo, so nothing uses `/releases/latest`. Its body is
   the product's user-facing notes, written by hand, never GitHub's generated notes.
2. Upload every file as a release asset, plus `SHA256SUMS.txt`. Binaries are never
   committed to git.
3. Check every uploaded file's size against the local file.
4. Only then commit `manifests/<product>.json` (message `<product> <version>`). Until that
   commit lands the page shows the previous version, whose files are all present. A version
   older than the one in the manifest never replaces it.

A new product also gets a page folder and an entry in `manifests/products.json`.

## Manifest format (schema 1)

`manifests/<product>.json` describes the product's current release only; older versions
are the releases. Apps read it to check for updates
(`https://downloads.amprepo.com/manifests/pilot-app.json`), so a field is never renamed or
removed without bumping `schema`.

| Field | Meaning |
|---|---|
| `schema` | `1`. Readers ignore a manifest with any other value. |
| `product` | Id, also the tag prefix: `pilot-app` |
| `name` | Display name: `AmpRepo Pilot` |
| `version` | `x.y.z` |
| `date` | Release date, `yyyy-mm-dd` |
| `release` | URL of the release page |
| `notes` | What's new in this version: plain-text lines, shown as a list |
| `files[]` | One entry per download, below |

| `files[]` field | Meaning |
|---|---|
| `os` | `windows`, `macos`, `linux` |
| `arch` | `x64`, `arm64`, `x86_64`, or `null` for a file that is not per-architecture |
| `kind` | `installer` (.msi), `app-zip` (macOS .app in a .zip), `appimage`, `udev-rules` |
| `name` | File name |
| `url` | Download URL (the release asset) |
| `size` | Bytes |
| `sha256` | Lowercase hex |

See `samples/pilot-app.json` for a complete example. To check a page against it locally,
run `python -m http.server 8000` here and open
`http://localhost:8000/pilot/app/?manifest=/samples/pilot-app.json`.
