# Due Credit

[![Donate](https://liberapay.com/assets/widgets/donate.svg)](https://liberapay.com/BW20)

**Your writing out of the vault as Word, PDF or LaTeX, with its citations intact.**

In the vault a citation is a link, `[[citekey]]`: it opens the paper, previews
on hover and puts every use of a source in its backlinks. Outside the vault it
is a dead link to a file on your laptop. Due Credit runs pandoc on the note you
have open and turns those links into real citations with a reference list, in
the style you choose, in a file you can send.

## How it works

Pick **Export to Word** (or PDF, Markdown, LaTeX), choose where to save, and the
file is written. Before pandoc runs, the note loses what only makes sense in
Obsidian:

- **Comments.** `%%…%%` is what you wrote for yourself, and never leaves.
- **Block IDs.** `^abc123` names a paragraph for a link inside the vault, and
  means nothing in the file.
- **The title.** An H1 on the first line is the document's title. Without one,
  the `title` property is, and then the file name. Under it, every heading
  moves up a level, so `## Section` is a top-level section; not when the note
  uses H1 for its own sections further down.
- **Frontmatter.** Only what pandoc makes something of goes along: `author`,
  `date`, `lang`, `abstract`, `keywords`, `subtitle`, and
  `reference-section-title` to head the references in another language. Word
  would keep every other property inside the file, tags and all.
- **Images.** `![[figure.png|300]]` is the file Obsidian shows, 300 pixels wide.

## Citations

A wikilink becomes a citation when the bibliography has an entry by that name,
so a link to a note of your own becomes its words rather than a dead link. A
leading `@`, as in notes named the way the Citations plugin names them, is not
part of the name. Pandoc's own `[@marsh2024, p. 12]` works as well.

| Written | Exported |
| --- | --- |
| `[[marsh2024]]` | (Marsh 2024) |
| `[[@marsh2024]]` | (Marsh 2024) |
| `[[marsh2024#p. 12]]` | (Marsh 2024, 12) |
| `[[marsh2024\|marsh2024, p. 12]]` | (Marsh 2024, 12) |
| `[[marsh2024\|see marsh2024, p. 12, emphasis added]]` | (see Marsh 2024, 12, emphasis added) |
| `[[marsh2024\|-marsh2024, p. 12]]` | (2024, 12) |
| `[[marsh2024\|Marsh, p. 12]]` | (Marsh 2024, 12) |
| `[[marsh2024#p. 12]]; [[okafor2019]]` | (Marsh 2024, 12; Okafor 2019) |
| `[[My idea\|this idea]]` | this idea |
| `[[My idea#Section]]` | My idea |

A page is anything after `#` that starts with a number, `§`, or a locator such
as `p.`, `pp.`, `ch.`, `sec.` or `fig.`; `[[marsh2024#Claim]]` is the paper.
An alias that repeats the key is read the way pandoc reads `[see @key, p. 12]`:
what comes before the key is a prefix, and what comes after it is the page and
anything else, with an `@` against the key or without. A `-` against the key
leaves the author out, as in `[-@key, p. 12]`, for a sentence that names them
already. That is how Paper
Trail writes a citation from Better BibTeX's dialog. Any other alias is what
Obsidian shows, apart from a page after its first comma, which is how Paper
Trail adds a page to a label you wrote.
Citations next to each other, separated by at most a `;`, share brackets.

A paper note does not have to be named for its key. A link to a note whose
`citekey` property holds one cites that key, so
`[[Marsh (2024) The Quiet Archive]]` is (Marsh 2024), and a link made
before Better BibTeX changed a key still cites the paper once the note's
property has the new one.

A link to a paper the bibliography does not have is listed before the export
runs, because otherwise it would quietly come out as a name. That is almost
always a key Better BibTeX changed, or an auto-export that has not run yet.

LaTeX keeps `\cite` commands for the journal's own class to format. The filter
that does the converting is
[`pandoc/wikilink-citations.lua`](pandoc/wikilink-citations.lua), and works
without the plugin too.

## Requirements

- Obsidian 1.13 or later, on desktop.
- [Pandoc](https://pandoc.org). Tested with 3.7.
- For PDF, xelatex, which comes with any TeX distribution.
- For citations, a `.bib` file kept current by
  [Better BibTeX](https://retorque.re/zotero-better-bibtex/)'s auto-export.
  [Paper Trail](https://github.com/jorritvanderheide/obsidian-paper-trail)
  writes the `[[citekey]]` links, but any `[[key]]` works.

## Installation

Download `main.js` and `manifest.json` from the latest release into
`.obsidian/plugins/due-credit/` in your vault, then enable **Due Credit** under
Settings → Community plugins.

## Commands

None has a hotkey, so pick your own.

| Command | |
| --- | --- |
| **Export to Word** | A `.docx` with rendered citations and a reference list. |
| **Export to PDF** | The same, typeset with xelatex. |
| **Export to Markdown** | Plain Markdown under its title, with rendered citations, for pasting elsewhere. |
| **Export to LaTeX** | A body with `\cite` commands, for a journal's or conference's class. |

## Settings

| Setting | Default | |
| --- | --- | --- |
| **Pandoc** | `pandoc` | Its name if it is on your PATH, or its full path. |
| **Output folder** | `~/Documents` | Where the save dialog opens the first time. After that it opens where the last export went, until you change this. |
| **Bibliography** | `Literature/library.bib` | The `.bib` file that decides which links are citations. Empty exports without citations. |
| **Papers folder** | `Literature` | Where your paper notes are, for the check before exporting. |
| **Citation key property** | `citekey` | The frontmatter property holding a paper note's citation key. |
| **Citation style** | Chicago author-date | A style Zotero has installed, such as `apa`, or the path to a `.csl` file. |

## Safety

Due Credit reads your notes and writes nothing in the vault. It writes the file
you choose in the save dialog, and refuses any place inside your vault, so a
Markdown export cannot replace its own note. It runs pandoc and nothing else.

## Development

```sh
nix develop     # or any Node.js 20+
npm install
npm run dev
npm test        # the filter tests need pandoc on the PATH
npm run lint
```

`src/core/` is pure and holds every decision, with a test named after each file.
`src/commands/` and `src/ui/` wire that to Obsidian, and `src/pandoc.ts` runs
pandoc.

## License

[EUPL-1.2](LICENSE)
