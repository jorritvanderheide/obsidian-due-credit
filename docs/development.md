# Development

## Setup

```sh
nix develop     # or any Node.js 20+
npm install
npm run dev     # rebuild on change
```

To try it in a vault, copy or link `main.js` and `manifest.json` into
`<vault>/.obsidian/plugins/due-credit/` and reload Obsidian, or turn the plugin
off and on again.

## Checks

```sh
npm test        # vitest; the filter tests need pandoc on the PATH
npm run lint    # eslint, with the Obsidian plugin's rules
npm run build   # type check and production build
```

CI runs all three on Node 20, 22 and 24 for every push
(`.github/workflows/lint.yml`).

## Tests

Tests are in `tests/`, one per file in `src/core/`, named after it.

`tests/pandoc.test.ts` runs the filters and the pipeline through a real pandoc,
and skips what it can't run: everything without pandoc, and the PDF tests
without xelatex. CI installs a pinned pandoc, so citeproc's output can't drift
under the expected results.

### Moving to a newer pandoc

The pandoc version and the checksum of its `.deb` are pinned in
`.github/workflows/lint.yml`. To move to a newer one:

1. Change the version in the download URL.
2. Download the new `.deb`, and replace the checksum with its
   `sha256sum`. Pandoc's older releases have no published checksum on GitHub,
   so this pins the file as it is when you download it.
3. Run the tests locally with the same pandoc, and update the expected output
   where citeproc changed it.
4. Update "Tested with" in the README.

## The conformance check

Pandoc reads its own markdown, which isn't Obsidian's, and has to: its
CommonMark reader has no `[@key]` citations. To find where the two read your
notes differently, run the conformance check on a vault, or any folder of
markdown:

```sh
VAULT=~/path/to/vault npx vitest run tests/conformance.test.ts
```

It lists every note whose blocks pandoc reads unlike CommonMark, and any text
the plugin would take for code, where a comment would be kept. It isn't part of
the normal test run, because it needs notes.

## Releasing

1. Bump the version: `npm version <x.y.z>` updates `manifest.json` and
   `versions.json`.
2. Push the commit and a tag named for the version, without a `v`, to Codeberg.
   That is the only remote: GitHub mirrors it.
3. When the tag reaches GitHub, `.github/workflows/release.yml` builds it,
   attests `main.js`, and creates a **draft** GitHub release with it attached.
4. Publish the draft. Obsidian's community directory installs from GitHub
   releases, and a tag alone is not one.

Before releasing anything that renames a setting, see
[Settings](settings.md#changing-the-shape). Before changing a citation form or
a locator word, see [Citations](citations.md#the-agreement-with-paper-trail).

## Updating an action

The workflows pin every action to a commit, with the version in a comment, so a
tag that is moved later can't change what builds a release. Nothing updates
them automatically, so look at them before a release. To move one to a newer
version, look up the commit the tag points to and replace both the hash and the
comment:

```sh
gh api repos/actions/checkout/commits/v6.1.0 --jq .sha
```

Both workflows also default to read-only. Only the release job asks for more:
writing the release, and signing the attestation.
