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

- **Comments.** `%%…%%` and `<!-- … -->` are what you wrote for yourself, and
  never leave.
- **Block IDs.** `^abc123` names a paragraph for a link inside the vault, and
  means nothing in the file.
- **The title.** An H1 on the first line is the document's title. Without one,
  the `title` property is, and then the file name. Under it, every heading
  moves up a level, so `## Section` is a top-level section; not when the note
  uses H1 for its own sections further down.
- **Frontmatter.** Only what pandoc makes something of goes along: `author`,
  `date`, `lang`, `abstract`, `keywords`, `subtitle`, and
  `reference-section-title` to head the references in another language. They
  are headed References, or Bibliography under a style that cites in
  footnotes. Word would keep every other property inside the file, tags and
  all.
- **Images.** `![[figure.png|300]]` is the file Obsidian shows, 300 pixels wide.
- **Other embeds.** An embedded note, PDF or canvas is left out: it is for
  you, not your reader.
- **Plugin blocks.** A `dataview`, `dataviewjs`, `tasks`, `query` or `base`
  code block is left out. Exported, it would only be its query.
- **Callouts.** `> [!note] Title` is a quote with its title in bold on the
  first line; a callout without a title is a plain quote.
- **Line breaks.** One newline is a line break, as Obsidian shows it, unless
  its strict line breaks are on.
- **Highlights.** `==text==` is highlighted in Word, PDF and Markdown. A LaTeX
  body has it as plain text, since a journal's class does not load what `\hl`
  needs.
- **Footnotes.** `[^1]` and `^[inline]` are footnotes, read as Obsidian reads
  them: a definition right after a line of text, a label with spaces, and
  `[^X]` for the note `[^x]` defines. A label defined twice is its first
  definition, and the export's warnings name the second.
- **Tags.** A line of `#tags` is left out, and a tag in a sentence stays as its
  word: `#project/alpha` is "project/alpha".

## Citations

A wikilink becomes a citation when the bibliography has an entry by that name,
so a link to a note of your own becomes its words rather than a dead link. A
leading `@`, as in notes named the way the Citations plugin names them, is not
part of the name. Pandoc's own `[@marsh2024, p. 12]` works as well.

| Written | Exported |
| --- | --- |
| `[[marsh2024]]` | (Marsh 2024) |
| `[[marsh2024\|marsh2024, p. 12]]` | (Marsh 2024, 12) |
| `[[marsh2024\|see marsh2024, p. 12, emphasis added]]` | (see Marsh 2024, 12, emphasis added) |
| `[[marsh2024\|-marsh2024, p. 12]]` | (2024, 12) |
| `[[marsh2024\|Marsh, p. 12]]` | (Marsh 2024, 12) |
| `[[marsh2024\|marsh2024, p. 12]]; [[okafor2019]]` | (Marsh 2024, 12; Okafor 2019) |
| `[[@marsh2024]]` | (Marsh 2024) |
| `[[marsh2024#p. 12]]` | (Marsh 2024, 12) |
| `[[My idea\|this idea]]` | this idea |
| `[[My idea#Section]]` | My idea |

An alias that repeats the key is read the way pandoc reads `[see @key, p. 12]`:
what comes before the key is a prefix, and what comes after it is the page and
anything else, with an `@` against the key or without. A `-` against the key
leaves the author out, as in `[-@key, p. 12]`, for a sentence that names them
already. That is how Paper Trail writes a citation from Better BibTeX's dialog.
Any other alias is what Obsidian shows, apart from a page after its first
comma, which is how Paper Trail adds a page to a label you wrote. Citations next
to each other, separated by at most a `;`, share brackets.

Don't put your own parentheses around a citation: the export adds them, and
`([[marsh2024]])` comes out as "((Marsh 2024))". For a sentence that names the
author, leave the author out, `Marsh [[marsh2024|-marsh2024]] argues`, or write
pandoc's own `As @marsh2024 argues`, which is "As Marsh (2024) argues".

A page after `#` is read too, when it starts with a number, `§`, or a locator
such as `p.`, `pp.`, `ch.`, `sec.` or `fig.`; `[[marsh2024#Claim]]` is the
paper. Paper Trail does not write it that way, because Obsidian takes it for a
heading the paper's note does not have.

A paper note does not have to be named for its key. A link to a note whose
`citekey` property holds one cites that key, so
`[[Marsh (2024) The Quiet Archive]]` is (Marsh 2024), and a link made
before Better BibTeX changed a key still cites the paper once the note's
property has the new one.

A style that cites in footnotes, such as `chicago-notes-bibliography` or
`mhra-notes`, makes each citation a footnote, after the punctuation that
follows it. A citation in a footnote of your own is part of its sentence, "see
Marsh, *The Quiet Archive*, 12", as Zotero writes it. A citation next to a
footnote of yours shares it, citation first when it comes first:
`A claim [[marsh2024]].[^1]` has one note, not two marks side by side.

Before the export runs, it lists every link that is about to come out as a
name instead of a citation, because otherwise that would happen quietly:

- A link to a paper note whose key the bibliography does not have. A paper
  note is one with a citation key property, or one in the papers folder. The
  key is almost always one Better BibTeX changed, or the paper is newer than
  its last auto-export.
- A link to no note at all whose name is not a key either. Paper Trail links a
  paper that has no note yet by its key, so a paper cited before its
  auto-export ran lands here, and so does a note you have not written yet.

A link to a note of your own is never listed.

LaTeX keeps `\cite` commands for the journal's own class to format: natbib's,
or biblatex's `\autocite` with `--biblatex` in **Pandoc arguments**, which a
class with a footnote style makes a footnote.

The filter that makes links citations,
[`pandoc/wikilink-citations.lua`](pandoc/wikilink-citations.lua), works with
pandoc on its own, for citations and nothing else. Everything under How it
works is the plugin's: run by hand, pandoc prints your comments, and a Word file
carries every property of the note inside it, tags and all.

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
| **Export to PDF** | The same, typeset with xelatex, left-aligned in Open Sans, which comes with the plugin. |
| **Export to Markdown** | Plain Markdown under its title, with rendered citations, for pasting elsewhere. |
| **Export to LaTeX** | A body with natbib's `\cite` commands, or biblatex's with `--biblatex` in **Pandoc arguments**, for a journal's or conference's class. |

## Settings

| Setting | Default | |
| --- | --- | --- |
| **Pandoc** | `pandoc` | Its name if it is on your PATH, or its full path. |
| **Pandoc arguments** | None | Added to every export, such as `--toc`, `--number-sections`, `-V geometry:margin=2.5cm`, `-V "mainfont=TeX Gyre Pagella"` for a PDF in a font of yours, or `--filter pandoc-crossref`. `--biblatex` only changes a LaTeX export. A filter runs after Due Credit's and before citations are rendered. Quotes keep a value with spaces together, and a relative path is from the vault. Where the file goes, what is read and the format stay Due Credit's: `-o`, `-f`, `-t` and a defaults file are refused. |
| **Output folder** | `~/Documents` | Where the save dialog opens the first time. After that it opens where the last export went, until you change this. |
| **Word template** | Pandoc's own | A `.docx` whose styles a Word export takes: fonts, headings and margins, as your university or journal wants them. A path in your vault, or outside it, starting with `/` or `~`. `pandoc -o reference.docx --print-default-data-file reference.docx` writes pandoc's own to start from. |
| **Bibliography** | `Literature/library.bib` | The `.bib` file that decides which links are citations: a path in your vault, or one outside it, starting with `/` or `~`. Empty exports without citations. |
| **Papers folder** | `Literature` | Where your paper notes are, for the check before exporting. |
| **Citation key property** | `citekey` | The frontmatter property holding a paper note's citation key. |
| **Citation style** | Chicago author-date | A style Zotero has installed, such as `apa`, or the path to a `.csl` file. |

## Safety

Due Credit reads your notes and writes nothing in the vault. It writes the file
you choose in the save dialog, and refuses any place inside your vault, so a
Markdown export cannot replace its own note. It runs pandoc and nothing else.

What you add in **Pandoc arguments** is yours: a filter of your own can do
anything with the note, and `-M` puts a value of your own in the file. Due
Credit refuses only an argument that would change where the file goes, what is
read, or the format.

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

Pandoc reads its own markdown, which is not Obsidian's, and has to: its
CommonMark reader, closer to Obsidian, has no `[@key]` citations. To find where
the two read your notes differently, run the conformance check on a vault, or
any folder of markdown:

```sh
VAULT=~/path/to/vault npx vitest run tests/conformance.test.ts
```

It lists every note whose blocks pandoc reads unlike CommonMark, and any text
the plugin would take for code, where a comment would be kept.

## License

[EUPL-1.2](LICENSE). Open Sans, in [`fonts/`](fonts), is under the
[SIL Open Font License 1.1](fonts/OFL.txt).
