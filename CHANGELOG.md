# Changelog

What changed in each release of Due Credit, newest first. What counts as
breaking is in [Compatibility](docs/compatibility.md).

## Unreleased

- **Insert citation** picks a paper from your bibliography and writes a link to
  it at the cursor, to the paper's note when it has one. Press Tab in the
  picker to add a page. It moved here from Paper Trail, and reads your `.bib`
  rather than Zotero, so whatever you can pick, Due Credit can cite.
- **Add page to citation** adds a page to the citation at the cursor, or just
  before it, where Obsidian's own `[[` leaves it.
- **Toggle author in citation** leaves the author out of the citation at the
  cursor, for a sentence that names them already: "Marsh [[marsh2024]] argues"
  comes out as "Marsh (2024) argues". Run it again to name them again.

## 1.3.1

- The README and the security policy explain the two warnings in the plugin directory's health report: Due Credit runs pandoc, and reads your bibliography and citation style outside the vault.
- The description now says the export goes through pandoc: "Export a note to Word, PDF or LaTeX through pandoc, with its links turned into real citations."
- How releases are built, and how to check the file you installed, is now under "Network and file disclosure" in the README.

## 1.3.0

- Friendlier wording in the export commands, notices and the settings tab.
- A clearer plugin description: "Export a note to Word, PDF or LaTeX, with its links turned into real citations."
- Removed the funding link from the manifest.
- The README has been restructured and now has screenshots, including one of the export next to its note, and there's a new FAQ.
- Added issue forms and a security policy.

## 1.2.0

- **PDFs on A4.** A PDF export is now set on A4 paper instead of US Letter,
  pandoc's default. For Letter, add `-V papersize=letter` to
  **Pandoc arguments**. Word exports are unchanged: they take their page size
  from Word or from your Word template.
- **Export from a note's menu.** Each Export command is also in a note's menu,
  in the file explorer or on its tab, so you can export a note without opening
  it.

## 1.1.0

### Added

- Note styles cite in footnotes. Under a style that cites in footnotes, such as chicago-notes-bibliography or mhra-notes, each citation becomes a footnote placed after the punctuation that follows it.
- A citation inside one of your own footnotes reads as part of its sentence (“see Marsh, The Quiet Archive, 12”) instead of getting a footnote of its own.
- A citation right next to one of your footnotes shares that footnote. For example, A claim [[marsh2024]].[^1] gives one note, not two marks side by side.
- “Bibliography” heading under note styles. The reference list is headed Bibliography under those styles and References otherwise. reference-section-title in frontmatter still overrides it.
- biblatex for LaTeX. Adding --biblatex to Pandoc arguments makes the LaTeX export use biblatex commands (\autocite) instead of natbib’s. The other formats ignore the flag, since they render citations with citeproc.
- PDFs are set in Open Sans, which is bundled with the plugin. Any mainfont you set in Pandoc arguments (-V or -M) replaces it.
- PDF typesetting: text is left-aligned (no justification or hyphenation) and uses a single space after full stops and colons.

### Fixed

- Footnotes are read the way Obsidian reads them. These all used to come out differently from what Obsidian shows:
  - a definition right after a line of text
  - labels with spaces
  - labels that differ only in case ([^X] and [^x])
  - a label defined twice, where the first definition now wins
- PDF footnotes are left-aligned like the body text. LaTeX used to reset them to justified.

### Docs

- The README explains how footnote citations work, and what leaving the author out ([[key|-key, p. 12]]) does under a note style: the author is also dropped from the footnote. If you switch a draft from an author-date style to a note style, check those citations again.
- The README gives Open Sans’s license (SIL OFL 1.1, in fonts/OFL.txt).

### Other

- main.js is now about 600 KB larger because the four Open Sans files are bundled into it.

## 1.0.0

# Due Credit 1.0.0

The first release. Due Credit exports the note you have open to Word, PDF, Markdown or LaTeX through pandoc, and turns your `[[citekey]]` links into real citations with a reference list, in the style you choose.

In the vault a citation is a link: it opens the paper, previews on hover and puts every use of a source in its backlinks. Outside the vault it is a dead link to a file on your laptop. Due Credit makes it a citation again.

### Citations

- `[[marsh2024]]` becomes (Marsh 2024), and a link to a note of your own becomes its words rather than a dead link.
- Pages, prefixes and suffixes in the label: `[[marsh2024|see marsh2024, p. 12]]` is (see Marsh 2024, 12), and `[[marsh2024|-marsh2024, p. 12]]` leaves the author out.
- Citations next to each other share brackets: (Marsh 2024, 12; Okafor 2019).
- A paper note named for its title cites the key in its `citekey` property, and keeps citing the paper after Better BibTeX changes the key.
- `[[@key]]`, a page after `#`, and pandoc's own `[@key]` and `@key` work too.
- Before exporting, it lists every link about to come out as a name instead of a citation: usually a key Better BibTeX changed, or a paper newer than its last auto-export.
- LaTeX keeps `\cite` commands for a journal's own class.

It reads every citation form [Paper Trail](https://github.com/jorritvanderheide/obsidian-paper-trail) writes, and any other `[[key]]`.

### What stays in the vault

- `%%comments%%` and `<!-- comments -->` never leave.
- Only the properties pandoc makes something of go along (`author`, `date`, `lang`, `abstract`, `keywords`, `subtitle`). Word would otherwise keep every property inside the file, tags and all.
- The bibliography's path on your disk stays out of the Word file.
- Nothing is written in the vault: an export can't be saved there, so a Markdown export can't replace its own note.

### Obsidian's syntax, as Obsidian shows it

The title from the first H1, headings, images at their width, callouts, highlights, line breaks, tags, block IDs, tables and lists right under a line of text. Embedded notes, PDFs and canvases, and Dataview, Tasks, search and Bases blocks, are left out.

### Settings

Where pandoc is, a Word template for your university's or journal's styles, the bibliography (inside the vault or out), the papers folder, the citation key property, the citation style (any style Zotero has installed, or a `.csl` file), and **Pandoc arguments** of your own, such as `--toc`, `--number-sections` or `--filter pandoc-crossref`.

### Requirements

- Obsidian 1.13 or later, on desktop.
- [Pandoc](https://pandoc.org), tested with 3.7.
- For PDF, xelatex, which comes with any TeX distribution.
- For citations, a `.bib` file kept current by [Better BibTeX](https://retorque.re/zotero-better-bibtex/)'s auto-export.

### Installation

Download `main.js` and `manifest.json` below into `.obsidian/plugins/due-credit/` in your vault, then enable **Due Credit** under Settings → Community plugins. The commands have no hotkeys, so pick your own.

### Known limits

- Tested on Linux. Windows and macOS are supported but not yet tried; reports are welcome.
- An indented code block (four spaces) is read as text, so a tag or comment inside one is treated as it would be in text.
