# Due Credit

**Export a note to Word, PDF or LaTeX through pandoc, with its links turned into real citations.**

Works well with [Paper Trail](https://community.obsidian.md/plugins/paper-trail),
which turns your Zotero library into a reading queue, with a note for each
paper, and [In the Open](https://community.obsidian.md/plugins/in-the-open),
which publishes a note to your website. See
[Works well with](#10-works-well-with).

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
runs [pandoc](https://pandoc.org) on your note to turn your links into real
citations, with a reference list in the citation style you choose. Anything
that only makes sense in Obsidian, like your comments and tags, stays behind.

<br/>

## 1 Installation

1. **Pandoc** makes the file. If you have it installed, Due Credit uses it,
   and it's tested with pandoc 3.13. If you don't, or can't install it, as on
   a computer your work manages, Due Credit offers to download pandoc for you
   the first time you export. This built-in pandoc is a 17 MB download that
   runs inside Obsidian, and it makes Word, Markdown and LaTeX files.
2. **For PDF, install pandoc and a TeX distribution** that includes xelatex,
   such as [TeX Live](https://tug.org/texlive/) or
   [MiKTeX](https://miktex.org/). You can skip this if you only need Word,
   Markdown or LaTeX.
3. **For citations, export a `.bib` file from Zotero** with
   [Better BibTeX](https://retorque.re/zotero-better-bibtex/)'s auto-export
   turned on, so it stays up to date as you add papers. Without one, links
   export as plain text.
4. **Install Due Credit.** In Obsidian, go to Settings → Community plugins →
   Browse, search for "Due Credit", and install and enable it. You can also
   find it on
   [its page in the plugin directory](https://community.obsidian.md/plugins/due-credit).

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
   from the menu. Pick where to save it, and open the file. The link is now
   "(Marsh 2024)", and there's a reference list at the end.

If a link is about to come out as plain text instead of a citation, Due Credit
tells you before it exports. See [Before the export](#74-before-the-export).

Due Credit cites from your `.bib`, and doesn't make a note for each paper. A
link cites the paper either way, note or not. For a note per paper, use
[Paper Trail](#101-paper-trail), or click the link to make one yourself.

![The menu of a note, with Export to Word, Export to PDF, Export to Markdown and Export to LaTeX](https://raw.githubusercontent.com/jorritvanderheide/obsidian-due-credit/main/images/export.png)

<br/>

## 3 Safety and quality

Due Credit reads your notes, and the only thing it writes in them is a citation
you ask for. An export only writes the file you pick in the save dialog. It
refuses any place inside your vault, so an export can never replace a note.
What you wrote for yourself never leaves. Comments are stripped, and only a
handful of properties, like the author and date, go into the file.
[Section 11](#11-network-and-file-disclosure) lists exactly what it reads and
writes.

It only connects to the internet to download the built-in pandoc, when you
have no pandoc installed and say yes. The only program it starts is an
installed pandoc. The built-in one runs inside Obsidian.

The health report in Obsidian's plugin directory warns about two things. Both
are part of how the export works:

- *Shell Execution* is pandoc. Due Credit starts it directly, without a shell
  in between, and starts nothing else.
- *Direct Filesystem Access* is for what Obsidian can't do for a plugin. Due
  Credit reads your bibliography and citation style wherever you keep them,
  and checks that the files in your settings exist. For each export, it puts
  the files pandoc needs from Due Credit in a temporary folder, like its
  filters, the PDF font and the note's properties, and for the built-in pandoc
  the note itself. It also keeps the built-in pandoc in your cache folder, and
  makes sure an export doesn't land in your vault.

Every change is tested. Every release is built in public on GitHub, and you
can check that the file you installed is the one GitHub built.
[Section 11.5](#115-how-releases-are-built) shows how.

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
- **Pages, prefixes and more** - Put a page, a word like "see", or anything
  else pandoc allows in a citation in the link's label.
- **Any citation style** - Any style Zotero has installed, such as `apa`, or a
  `.csl` file, including footnote styles.
- **Paper notes under any name** - A link to a note with a `citekey` property
  cites that key, even after Better BibTeX changed it.
- **A warning before you export** - If a link would come out as plain text
  instead of a citation, Due Credit tells you first.

### 5.3 Private stays private

- **Comments stay behind** - `%%…%%` and `<!-- … -->` never leave the vault.
- **Only the properties that matter** - Tags and the rest of your properties
  stay out of the file.
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
| `![A chart](figure.png)` | The image, wherever it is in your vault, as Obsidian finds it. |
| An embedded note, PDF or canvas | Left out. It only works inside your vault. |
| `dataview`, `dataviewjs`, `tasks`, `query` and `base` blocks | Left out. Outside Obsidian, they'd only show their query. |
| `> [!note] Title` | A quote with the title in bold. A callout without a title is a plain quote. |
| One newline | A line break, as Obsidian shows it, unless you turned on strict line breaks. |
| `==highlight==` | Highlighted in Word, PDF and Markdown. Plain text in LaTeX. |
| `[^1]` and `^[inline]` footnotes | Footnotes, read the way Obsidian reads them. |
| A line of `#tags` | Left out. A tag in a sentence stays as its word: `#project/alpha` becomes "project/alpha". |

### 6.2 The reference list

The reference list is headed References, or Bibliography under a style that
cites in footnotes. To call it something else, like Literatuur in a Dutch text,
set `reference-section-title` in the note's properties.

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

A link to one of your own notes isn't in your bibliography, so it exports as
its words, like the last row. Your reader gets the text, without a link that
leads nowhere. Pandoc's way of writing a citation, `[@marsh2024, p. 12]`, works
too.

Don't put your own parentheses around a citation. The export adds them, and
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

A paper note doesn't have to be named after its key. If the note
`Marsh (2024) The Quiet Archive` has `citekey: marsh2024` in its properties, a
link to it comes out as (Marsh 2024). And when Better BibTeX changes a key,
links made before still cite the paper, as soon as the note's property has the
new key.
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

None of the commands come with a hotkey, so they won't clash with the ones
you already use. You can set your own in Settings → Hotkeys.

- `Due Credit: Insert citation` - Picks a paper from your bibliography and
  writes a link to it at the cursor. Tab instead of Enter asks for a page.
- `Due Credit: Add page to citation` - Adds a page to the citation at the
  cursor, or the one just before it. That's where the cursor ends up after you
  pick a note from Obsidian's `[[` suggestions.
- `Due Credit: Toggle author in citation` - Leaves the author out of the
  citation at the cursor, for when your sentence already names them. Run it
  again to put them back.
- `Due Credit: Export to Word` - A `.docx` with citations and a reference list.
- `Due Credit: Export to PDF` - The same, typeset with xelatex.
- `Due Credit: Export to Markdown` - Plain Markdown under its title, with
  citations, for pasting elsewhere.
- `Due Credit: Export to LaTeX` - A body with `\cite` commands, for a journal's
  or conference's class.

Each export is also on a note's right-click menu, in the file explorer or on
its tab, so you can export a note without opening it.

<br/>

## 9 Settings

**Pandoc**

| Setting | Default | |
| --- | --- | --- |
| **Pandoc** | `pandoc` | If you installed pandoc, this can usually stay `pandoc`. If Due Credit doesn't find it, give its full path. Without pandoc installed, Due Credit offers to download a copy that runs inside Obsidian, for Word, Markdown and LaTeX. A PDF needs pandoc installed, and xelatex, which comes with any TeX distribution. |
| **Pandoc arguments** | None | Added to every export, like `--toc`, `--number-sections`, `-V geometry:margin=2.5cm`, `-V "mainfont=TeX Gyre Pagella"` or, with pandoc installed, `--filter pandoc-crossref`. Put quotes around a value with spaces. Due Credit can't pass on an argument that changes where the file goes, how the note is read or the format. |
| **Output folder** | `~/Documents` | Where the save dialog opens the first time you export. After that, it opens where your last export went, until you change this. |
| **Word template** | Pandoc's own | A `.docx` with the fonts, headings and margins your university or journal wants, for Word exports to use. Leave it empty for pandoc's default styles. |

**Citations**

| Setting | Default | |
| --- | --- | --- |
| **Bibliography** | `Literature/library.bib` | The `.bib` file that Better BibTeX's auto-export keeps up to date. A link to one of its keys exports as a citation, and any other link as its text. The file can be in your vault, or outside it with a path starting with `/` or `~`. Leave it empty to export without citations. |
| **Papers folder** | `Literature` | The folder with your paper notes. Before an export, Due Credit lists every link to a paper note whose key isn't in your bibliography. |
| **Citation key property** | `citekey` | The property that holds a paper note's citation key. A link to a note with one cites that key, whatever the note is called. |
| **Citation style** | Chicago author-date | A style Zotero has installed, such as `apa`, or the path to a `.csl` file. |

<br/>

## 10 Works well with

I made these too. Each one does one thing and works on its own, but they fit
together nicely.

### 10.1 Paper Trail

[Paper Trail](https://community.obsidian.md/plugins/paper-trail) turns your
Zotero library into a reading queue, with a note for each paper, named after
its citation key. **Insert citation** links to those notes, so every place you
cite a paper turns up in its backlinks.

Paper Trail also gives every paper note the `citekey` property, which keeps
your citations working when Better BibTeX changes a key. And its **Insert
annotation** quotes a passage you highlighted, with a citation Due Credit
reads.

Paper Trail helps you read the papers, and Due Credit helps you cite them and
get the chapter out of your vault.

### 10.2 In the Open

[In the Open](https://community.obsidian.md/plugins/in-the-open) publishes a
note as a post on your own website, if your site takes
[Micropub](https://www.w3.org/TR/micropub/), an open standard for posting to a
website. It reads a note the same way Due Credit does, with the same code, and
turns your links into citations with a reference list.

Give both plugins the same **Bibliography** and **Citation style**. A chapter
you export and a blog post you publish from it then cite the same way, and
your comments stay behind in both.

<br/>

## 11 Network and file disclosure

Due Credit runs entirely on your computer, and doesn't send anything of yours
anywhere. It connects to the internet for one thing only. When you have no
pandoc installed and agree to download the built-in one, it gets
`pandoc-3.13-wasm.zip` from pandoc's release on GitHub. Before keeping it, Due
Credit checks that the download is exactly the file it was tested with, by
comparing its SHA-256 hash, a fingerprint of the file's contents.

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
  there's no pandoc installed. Once a session, Due Credit checks its hash to
  make sure the file hasn't changed. A file that doesn't match is deleted, and
  downloaded again if you agree.

### 11.2 What it writes

Due Credit only writes in a note when you ask it to add or change a citation
at the cursor. It never writes anywhere else in your vault.

- **A citation:** at the cursor, when you run **Insert citation**, or a
  change to the citation there, when you run **Add page to citation** or
  **Toggle author in citation**.
- **The export:** Only the file you pick in the save dialog, never inside your
  vault.
- **The built-in pandoc:** when you agree to download it, `pandoc-3.13.wasm`
  in your user cache folder, outside the vault. The 17 MB download unpacks to
  this 62 MB file. It goes in `~/.cache/obsidian-citation-core` on Linux (or
  in `$XDG_CACHE_HOME`), `~/Library/Caches/obsidian-citation-core` on macOS,
  and `obsidian-citation-core\Cache` in `%LOCALAPPDATA%` on Windows. If you
  also use [In the Open](#102-in-the-open), it uses the same file. You can
  delete it. It's downloaded again, if you agree, the next time it's needed.
- **Temporary files:** For each export, the files pandoc needs from Due
  Credit (its filters, a Markdown template and the PDF font) and the note's
  properties go in a temporary folder. With the built-in pandoc, the note's
  text goes in a second one. Both are removed afterwards.

### 11.3 What it stores

- **Settings:** Its own `data.json` in the plugin folder, including the folder
  your last export went to.

### 11.4 What it runs

- **Pandoc:** The one you set in **Pandoc**, and for a PDF, xelatex through
  pandoc. An installed pandoc can read and write anything you can.
- **The built-in pandoc,** when there's no pandoc installed. It runs inside
  Obsidian, and only sees your vault, the folders of the files in your
  settings and your Pandoc arguments, the folder you export to, and its
  temporary folders. It can't see anything else on your disk.

Nothing else runs.

When your note shows an image from the web, like `![](https://…/figure.png)`,
an installed pandoc downloads it to put it in the file. That's how pandoc
works, and it only happens for images on the web. The built-in pandoc can't
download anything. It puts the image's description in its place, and says so.

### 11.5 How releases are built

Every change I push is built, checked with [ESLint](https://eslint.org/) and
the official [Obsidian ESLint plugin](https://github.com/obsidianmd/eslint-plugin),
and tested with [Vitest](https://vitest.dev/). Nix builds it a second time,
on its own.

Releases are built by GitHub Actions from the tagged code, after the same
checks. A release only goes out when its tag matches the version in
`manifest.json`, and every action it uses is pinned to an exact version. Each
release comes with a signed attestation from GitHub, which records what it
was built from. To check that the `main.js` you installed is the one GitHub
built:

```sh
gh attestation verify main.js --repo jorritvanderheide/obsidian-due-credit
```

The citation tests also run through a real pandoc, always the same version.
A change in pandoc's output shows up as a failing test.

<br/>

## 12 Questions or issues?

Have a look at the [FAQ](FAQ.md) first. It covers the things people run into
most, like a citation that comes out as plain text. If something still doesn't
work, or you have an idea, please
[open an issue](https://github.com/jorritvanderheide/obsidian-due-credit/issues/new/choose).
Found a security problem? Please report it privately, the way the
[security policy](SECURITY.md) explains.

The code lives on [Codeberg](https://codeberg.org/BW20/obsidian-due-credit),
with a copy on [GitHub](https://github.com/jorritvanderheide/obsidian-due-credit).

<br/>

## 13 Support

Due Credit is free. If it's useful to you and you'd like to give something
back, you can do that on Liberapay:

[![Donate](https://liberapay.com/assets/widgets/donate.svg)](https://liberapay.com/BW20)

<br/>

## 14 License

Copyright © 2026 Jorrit van der Heide. Licensed under the [EUPL-1.2](LICENSE).
Open Sans, from [`fonts/`](https://codeberg.org/BW20/obsidian-citation-core/src/branch/main/fonts) in obsidian-citation-core, is under the
[SIL Open Font License 1.1](https://codeberg.org/BW20/obsidian-citation-core/src/branch/main/fonts/OFL.txt).
