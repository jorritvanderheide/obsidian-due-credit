# Due Credit

**Export a note to Word, PDF or LaTeX through pandoc, with its links turned into real citations.**

Works well with [Paper Trail](https://community.obsidian.md/plugins/paper-trail),
which turns your Zotero library into a reading queue, with a note for each
paper. See [Works well with](#10-works-well-with).

<br/>

![Obsidian Downloads](https://img.shields.io/badge/dynamic/json?logo=obsidian&color=%23483699&label=Downloads&query=%24%5B%22due-credit%22%5D.downloads&url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json)
![Obsidian Compatibility](https://img.shields.io/badge/Obsidian-v1.13.0+-483699?logo=obsidian&style=flat-square)
![Desktop only](https://img.shields.io/badge/platform-desktop-483699?style=flat-square)
[![Checks](https://github.com/jorritvanderheide/obsidian-due-credit/actions/workflows/ci.yml/badge.svg)](https://github.com/jorritvanderheide/obsidian-due-credit/actions/workflows/ci.yml)
[![License: EUPL-1.2](https://img.shields.io/badge/license-EUPL--1.2-blue?style=flat-square)](LICENSE)

![A chapter in Obsidian with citation links, next to its PDF export opened in Obsidian, with the citations and the full reference list](https://raw.githubusercontent.com/jorritvanderheide/obsidian-due-credit/main/images/hero.png)

In your vault, a citation can simply be a link: `[[marsh2024]]`. It opens the
paper, shows a preview when you hover over it, and the paper's backlinks show
everywhere you cited it. But the moment your chapter has to go to your
supervisor as a Word file, that link means nothing. It's a dead link to a note
on your laptop.

Due Credit gets your writing out of the vault with its citations intact. It
runs [pandoc](https://pandoc.org) on the note you have open, turns your links
into real citations with a reference list, in the citation style you choose,
and leaves out everything that only makes sense in Obsidian, like your comments
and tags.

<br/>

## 1 Installation

1. **Pandoc**, which makes the file. If you have it installed, Due Credit
   uses it; it's tested with pandoc 3.13. If you don't, or can't install it,
   as on a computer your work manages, Due Credit offers to download pandoc's
   own built-in version the first time you export: 17 MB, once. It makes
   Word, Markdown and LaTeX.
2. **For PDF, install pandoc and a TeX distribution** that includes xelatex,
   such as [TeX Live](https://tug.org/texlive/) or
   [MiKTeX](https://miktex.org/). You can skip this if you only need Word,
   Markdown or LaTeX.
3. **For citations, export a `.bib` file from Zotero** with
   [Better BibTeX](https://retorque.re/zotero-better-bibtex/)'s auto-export
   turned on, so it stays up to date as you add papers. Without one, links
   export as plain text.
4. **Install Due Credit** in Obsidian: go to Settings → Community plugins →
   Browse, search for "Due Credit", then install and enable it. You can also
   open [its page in the plugin directory](https://community.obsidian.md/plugins/due-credit).

Due Credit needs Obsidian 1.13 or later, on desktop.

<br/>

## 2 Getting started

1. **Point Due Credit at your bibliography.** In Settings → Due Credit, set
   **Bibliography** to your `.bib` file. The default is
   `Literature/library.bib` in your vault, and a file outside the vault works
   too, starting with `/` or `~`.
2. **Cite something.** In a note, run **Insert citation** and pick a paper
   from your bibliography, or press Tab to add a page. It writes a link to
   the paper by its citation key: `As [[marsh2024]] shows, …`. Typing the link
   yourself works just as well.
3. **Export it.** Run **Export to Word**, or right-click the note and choose it
   from the menu. Pick where to save it, and open the file: the link is now
   "(Marsh 2024)", and there's a reference list at the end.

If a link is about to come out as plain text instead of a citation, Due Credit
tells you before it exports. See [Before the export](#74-before-the-export).

Due Credit cites from your `.bib`, and doesn't make a note for each paper. A
link cites the paper either way, note or not. For a note per paper, use
[Paper Trail](#101-paper-trail), or click the link to make one yourself.

![The menu of a note, with Export to Word, Export to PDF, Export to Markdown and Export to LaTeX](https://raw.githubusercontent.com/jorritvanderheide/obsidian-due-credit/main/images/export.png)

<br/>

## 3 Safety and quality

Due Credit reads your notes, and writes in them only a citation you insert. An
export only writes the file you pick in the save dialog, and refuses any place
inside your vault, so it can never replace a note. What you wrote for yourself never leaves:
comments are stripped, and only a handful of properties, like the author and
date, go into the file. [Section 11](#11-network-and-file-disclosure) lists
exactly what it reads and writes.

It connects to the internet only to download the built-in pandoc, once, when
you have no pandoc installed and agree to. The only program it runs is an
installed pandoc; the built-in one runs inside Obsidian.

The health report in Obsidian's plugin directory warns about two things, and
both are how the export works. *Shell Execution* is pandoc: Due Credit starts
it directly, without a shell in between, and starts nothing else. *Direct
Filesystem Access* is for what the Obsidian API can't reach: reading your
bibliography and citation style wherever you keep them, checking that the
files in your settings exist, putting pandoc's filters, the PDF font, the
note's properties and, for the built-in pandoc, the note itself in a temporary
folder, keeping the built-in pandoc in your cache folder, and making sure an
export doesn't land in your vault.

Every push is tested, and every release is built in the open with a signed
attestation, so you can check that the file you installed is the one that was
built. [Section 11.5](#115-how-releases-are-built) says how.

<br/>

## Table of contents

- [4 Documentation](#4-documentation)
- [5 Features](#5-features)
- [6 How it works](#6-how-it-works)
- [7 Citations](#7-citations)
- [8 Commands](#8-commands)
- [9 Settings](#9-settings)
- [10 Works well with](#10-works-well-with)
- [11 Network and file disclosure](#11-network-and-file-disclosure)
- [12 Questions or issues?](#12-questions-or-issues)
- [13 Support](#13-support)
- [14 License](#14-license)

<br/>

## 4 Documentation

If you want to work on the plugin, or use its pandoc filter on its own:

- [**Architecture**](docs/architecture.md) - How the code is layered, how
  pandoc is run, and the order its filters run in.
- [**Pipeline**](https://codeberg.org/BW20/obsidian-citation-core/src/branch/main/docs/pipeline.md) - Every step from a note to pandoc's input,
  in order.
- [**Citations**](docs/citations.md) - Every link form that becomes a
  citation, how Insert citation writes them, footnote styles, LaTeX, and the
  agreement with Paper Trail.
- [**Settings**](docs/settings.md) - How settings are stored, and which pandoc
  arguments are refused and why.
- [**Development**](docs/development.md) - Setup, tests, the conformance
  check, and releases.
- [**Compatibility**](docs/compatibility.md) - What a release may and may not
  change, so your settings, hotkeys and notes keep working.

<br/>

## 5 Features

### 5.1 Exporting

- **Four formats** - Word, PDF, Markdown and LaTeX, from the command palette or
  a note's right-click menu.
- **Without opening the note** - Export any note from the file explorer or its
  tab.
- **A PDF that looks good** - Typeset with xelatex on A4, left-aligned, in Open
  Sans, which comes with the plugin.
- **LaTeX for a journal** - A body with `\cite` commands, ready for a journal's
  or conference's own class.

### 5.2 Citations

- **Insert citation** - Pick a paper from your bibliography and get
  `[[citekey]]`, linked to the paper's note when it has one. Press Tab in the
  picker to add a page.
- **Page numbers without retyping** - **Add page to citation** adds a page to
  a link you already wrote.
- **The author named in your sentence** - **Toggle author in citation** leaves
  the author out of a citation, so "Marsh [[marsh2024]] argues" comes out
  as "Marsh (2024) argues", and puts them back if you run it again.
- **Links become citations** - `[[marsh2024]]` becomes "(Marsh 2024)", with a
  reference list at the end.
- **Pages, prefixes and more** - Everything pandoc can put in a citation, in
  the link's label.
- **Any citation style** - Any style Zotero has installed, such as `apa`, or a
  `.csl` file, including footnote styles.
- **Paper notes under any name** - A link to a note with a `citekey` property
  cites that key, even after Better BibTeX changed it.
- **A check before you export** - Links that are about to come out as plain
  text are listed first, so nothing goes wrong quietly.

### 5.3 Private stays private

- **Comments stay behind** - `%%…%%` and `<!-- … -->` never leave the vault.
- **Only the properties that matter** - Tags and the rest of your properties
  don't travel inside the file.
- **No Obsidian leftovers** - Block IDs, tags, embedded notes and plugin blocks
  are left out.

### 5.4 Your institution's rules

- **Word template** - Use your university's or journal's styles for fonts,
  headings and margins.
- **Your own pandoc arguments** - Add a table of contents, numbered sections,
  margins, a font, or, with pandoc installed, a filter like pandoc-crossref.

<br/>

## 6 How it works

### 6.1 What happens to your note

Before pandoc runs, Due Credit removes or rewrites everything that only makes
sense inside Obsidian:

| In your note | In the export |
| --- | --- |
| `%%comment%%`, `<!-- comment -->` | Left out. They're for you. |
| `^abc123` block IDs | Left out. |
| An H1 on the first line | The document's title. Without one, the `title` property, then the file name. Every other heading moves up a level, unless the note uses H1 for its own sections. |
| Properties | Only `author`, `date`, `lang`, `abstract`, `keywords`, `subtitle` and `reference-section-title` go along. |
| `![[figure.png\|300]]` | The image, 300 pixels wide. |
| An embedded note, PDF or canvas | Left out. It's for you, not your reader. |
| `dataview`, `dataviewjs`, `tasks`, `query` and `base` blocks | Left out. Exported, they'd only be their query. |
| `> [!note] Title` | A quote with the title in bold. A callout without a title is a plain quote. |
| One newline | A line break, as Obsidian shows it, unless you turned on strict line breaks. |
| `==highlight==` | Highlighted in Word, PDF and Markdown. Plain text in LaTeX. |
| `[^1]` and `^[inline]` footnotes | Footnotes, read the way Obsidian reads them. |
| A line of `#tags` | Left out. A tag in a sentence stays as its word: `#project/alpha` becomes "project/alpha". |

### 6.2 The reference list

The reference list is headed References, or Bibliography under a style that
cites in footnotes. Set `reference-section-title` in the note's properties to
call it something else, for a note in another language.

<br/>

## 7 Citations

### 7.1 Writing a citation

A link becomes a citation when your bibliography has an entry with that key.
Everything pandoc can put in a citation goes in the link's label, around the
key:

| You write | It exports as |
| --- | --- |
| `[[marsh2024]]` | (Marsh 2024) |
| `[[marsh2024\|marsh2024, p. 12]]` | (Marsh 2024, 12) |
| `[[marsh2024\|see marsh2024, p. 12]]` | (see Marsh 2024, 12) |
| `[[marsh2024\|Marsh, p. 12]]` | (Marsh 2024, 12) |
| `[[marsh2024]]; [[okafor2019]]` | (Marsh 2024; Okafor 2019) |
| `[[My idea\|this idea]]` | this idea |

A link to one of your own notes isn't in the bibliography, so it exports as its
words, not as a dead link. Pandoc's own `[@marsh2024, p. 12]` works too.

Don't put your own parentheses around a citation: the export adds them, so
`([[marsh2024]])` would come out as "((Marsh 2024))".

### 7.2 Naming the author in your sentence

When your sentence already names the author, put a `-` against the key to
leave the author out of the citation:

| You write | It exports as |
| --- | --- |
| `Marsh [[marsh2024\|-marsh2024, p. 12]] argues` | Marsh (2024, 12) argues |
| `As @marsh2024 argues` | As Marsh (2024) argues |

Under a style that cites in footnotes, this works a little differently. See
[Footnote styles](docs/citations.md#footnote-styles).

### 7.3 Paper notes

A paper note doesn't have to be named after its key. A link to a note with a
`citekey` property cites that key, so `[[Marsh (2024) The Quiet Archive]]` is
(Marsh 2024). And when Better BibTeX changes a key, links made before still cite
the paper, as soon as the note's property has the new key.
[Paper Trail](https://community.obsidian.md/plugins/paper-trail) writes the
property for you.

### 7.4 Before the export

Before an export runs, Due Credit lists every link that's about to come out as
plain text instead of a citation:

- **A link to a paper note whose key isn't in your bibliography.** Usually
  Better BibTeX changed the key, or its auto-export hasn't run since you added
  the paper.
- **A link to no note at all, whose name isn't a key either.** For example, a
  paper you cited before its auto-export ran, or a note you haven't written yet.

You can export anyway, or go and fix them first. A link to a note of your own
is never listed.

For more, like footnote styles, LaTeX, and using the filter with pandoc on its
own, see [Citations](docs/citations.md) in the docs and the [FAQ](FAQ.md).

<br/>

## 8 Commands

None of the commands has a hotkey, so you can choose your own in Settings →
Hotkeys. Each export is also on a note's right-click menu, in the file explorer
or on its tab, so you can export a note without opening it.

- `Due Credit: Insert citation` - Picks a paper from your bibliography and
  writes a link to it at the cursor. Tab instead of Enter asks for a page.
- `Due Credit: Add page to citation` - Adds a page to the citation at the
  cursor, or just before it, where Obsidian's own `[[` leaves it.
- `Due Credit: Toggle author in citation` - Leaves the author out of the
  citation at the cursor, for a sentence that names them already, or names
  them again.
- `Due Credit: Export to Word` - A `.docx` with citations and a reference list.
- `Due Credit: Export to PDF` - The same, typeset with xelatex.
- `Due Credit: Export to Markdown` - Plain Markdown under its title, with
  citations, for pasting elsewhere.
- `Due Credit: Export to LaTeX` - A body with `\cite` commands, for a journal's
  or conference's class.

<br/>

## 9 Settings

**Pandoc**

| Setting | Default | |
| --- | --- | --- |
| **Pandoc** | `pandoc` | Its name if it's on your PATH, or its full path. Without one, Due Credit offers to download pandoc's built-in version, once, for Word, Markdown and LaTeX. Exporting to PDF needs pandoc installed, and xelatex, which comes with any TeX distribution. |
| **Pandoc arguments** | None | Added to every export, such as `--toc`, `--number-sections`, `-V geometry:margin=2.5cm`, `-V "mainfont=TeX Gyre Pagella"` or, with pandoc installed, `--filter pandoc-crossref`. Quotes keep a value with spaces together. Arguments that would change where the file goes, what's read or the format are refused. |
| **Output folder** | `~/Documents` | Where the save dialog opens the first time. After that, it opens where your last export went. |
| **Word template** | Pandoc's own | A `.docx` whose styles a Word export uses: fonts, headings and margins, as your university or journal wants them. |

**Citations**

| Setting | Default | |
| --- | --- | --- |
| **Bibliography** | `Literature/library.bib` | The `.bib` file that decides which links are citations. A path in your vault, or outside it, starting with `/` or `~`. Leave it empty to export without citations. |
| **Papers folder** | `Literature` | Where your paper notes are, for the check before exporting. |
| **Citation key property** | `citekey` | The property that holds a paper note's citation key. |
| **Citation style** | Chicago author-date | A style Zotero has installed, such as `apa`, or the path to a `.csl` file. |

<br/>

## 10 Works well with

These plugins are by the same author. Each does one thing, and Due Credit
doesn't need the other, but they fit together nicely.

### 10.1 Paper Trail

[Paper Trail](https://community.obsidian.md/plugins/paper-trail) turns your
Zotero library into a reading queue, with a note for each paper, named for its
citation key. **Insert citation** links to those notes, so every place you
cite a paper turns up in its backlinks. Paper Trail also gives every paper
note the `citekey` property that keeps your citations working when Better
BibTeX changes a key, and its **Insert annotation** quotes a passage you
highlighted, with a citation Due Credit reads.

Paper Trail helps you read the papers, and Due Credit helps you cite them and
gets the chapter out of your vault.

<br/>

## 11 Network and file disclosure

Due Credit runs entirely on your computer, and doesn't send anything of yours
anywhere. It connects to the internet once, if you agree: to download the
built-in pandoc from pandoc's own release on GitHub, `pandoc-3.13-wasm.zip`,
when you have no pandoc installed. What comes back is checked against a hash
in Due Credit before it's kept.

### 11.1 What it reads

- **Notes:** The note you export, and the citation keys of the notes it links
  to. For **Insert citation**, the citation key property of your notes, to
  link to a paper's note.
- **Bibliography:** The `.bib` file you set in **Bibliography**, when you
  export and when you insert a citation.
- **Citation style:** From Zotero's styles folder (`~/Zotero/styles`), or the
  `.csl` file you set.
- **Word template:** The `.docx` you set, if any.
- **Obsidian's settings:** Whether strict line breaks are on, from the vault's
  `app.json`.
- **Your PATH:** each folder on it, for a pandoc installed there.
- **The built-in pandoc:** `pandoc-3.13.wasm` in your cache folder, when
  there's no pandoc installed, checked against its hash once a session. A
  file that doesn't match is deleted, and downloaded again if you agree.

### 11.2 What it writes

In your notes, only what you ask for at the cursor, and nothing anywhere else
in your vault.

- **A citation:** at the cursor, when you run **Insert citation**, or a
  change to the citation there, when you run **Add page to citation** or
  **Toggle author in citation**.
- **The export:** Only the file you pick in the save dialog, never inside your
  vault.
- **The built-in pandoc:** when you agree to download it, `pandoc-3.13.wasm`
  (62 MB) in your user cache folder, outside the vault:
  `~/.cache/obsidian-citation-core` on Linux (or in `$XDG_CACHE_HOME`),
  `~/Library/Caches/obsidian-citation-core` on macOS, and
  `obsidian-citation-core\Cache` in `%LOCALAPPDATA%` on Windows. In the Open
  uses the same file. You can delete it; it's downloaded again, if you agree,
  the next time it's needed.
- **Temporary files:** For each export, pandoc's filters, the PDF font and the
  note's properties go in a temporary folder; with the built-in pandoc, the
  note's text goes in a second one. Both are removed afterwards.

### 11.3 What it stores

- **Settings:** Its own `data.json` in the plugin folder, including the folder
  your last export went to.

### 11.4 What it runs

- **Pandoc:** The one you set in **Pandoc**, and for a PDF, xelatex through
  pandoc. Without one, the built-in pandoc, which runs inside Obsidian and
  sees only your vault, the folders of the files in your settings and your
  Pandoc arguments, the folder you export to, and its temporary folders:
  never the rest of your disk. An installed pandoc can read and write
  anything you can. Nothing else runs.

An installed pandoc downloads an image your note links to on the web, like
`![](https://…/figure.png)`, to put it in the file. That's pandoc's own
behaviour, and it only happens for images that are on the web. The built-in
pandoc can't: it puts the image's description in its place, and says so.

### 11.5 How releases are built

Every push is built, linted with [ESLint](https://eslint.org/) and the official
[Obsidian ESLint plugin](https://github.com/obsidianmd/eslint-plugin), tested
with [Vitest](https://vitest.dev/), and built with Nix as well. The citation
tests run through a real, pinned version of pandoc, so its output can't drift
unnoticed. Releases are built by GitHub Actions from the tagged source, after
the same checks and a check that the tag is the version in `manifest.json`,
with every action pinned to an exact version, and come with a signed build
provenance attestation, so you can check that the file you installed is the one
that was built:

```sh
gh attestation verify main.js --repo jorritvanderheide/obsidian-due-credit
```

<br/>

## 12 Questions or issues?

Have a look at the [FAQ](FAQ.md) first: it covers the most common surprises,
like a citation that comes out as plain text. If something still doesn't work,
or you have an idea, please
[open an issue](https://github.com/jorritvanderheide/obsidian-due-credit/issues/new/choose).
Found a security problem? Please report it privately, as described in the
[security policy](SECURITY.md).

The source lives on [Codeberg](https://codeberg.org/BW20/obsidian-due-credit)
and is mirrored to [GitHub](https://github.com/jorritvanderheide/obsidian-due-credit).

<br/>

## 13 Support

Due Credit is free. If you find it useful, you can support its development on
Liberapay:

[![Donate](https://liberapay.com/assets/widgets/donate.svg)](https://liberapay.com/BW20)

<br/>

## 14 License

Copyright © 2026 Jorrit van der Heide. Licensed under the [EUPL-1.2](LICENSE).
Open Sans, from [`fonts/`](https://codeberg.org/BW20/obsidian-citation-core/src/branch/main/fonts) in obsidian-citation-core, is under the
[SIL Open Font License 1.1](https://codeberg.org/BW20/obsidian-citation-core/src/branch/main/fonts/OFL.txt).
