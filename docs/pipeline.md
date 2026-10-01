# Pipeline

`prepare` in `src/core/prepare.ts` turns a note into what pandoc is given. A
new step goes there, in its place in the order.

## The steps, in order

1. **Split off the frontmatter** (`splitFrontmatter`). It becomes the
   document's metadata, never pandoc's input.
2. **Strip comments** (`stripComments`). `%%…%%` and `<!-- … -->`, across lines
   and past code, each closed only by its own marker. A comment left open runs
   to the end of the note, the cautious reading.
3. **Strip block IDs** (`stripBlockIds`). `^abc123` at the end of a line, or on
   a line of its own.
4. **Drop plugin blocks** (`dropPluginBlocks`). Fenced `dataview`,
   `dataviewjs`, `tasks`, `query` and `base` blocks, which exported would only
   be their query.
5. **Strip tags** (`stripTags`). A line of tags goes, line and all. A tag in a
   sentence stays as its word: `#project/alpha` is "project/alpha".
6. **Check the citations** (`missingKeys`), on the note as written, before any
   link is rewritten. See [Citations](citations.md#the-check-before-an-export).
7. **Rewrite footnotes** (`footnotes`) the way pandoc reads them, which isn't
   always how Obsidian does: a definition gets a blank line before it, a
   reference gets the spelling of its definition, and a label defined twice
   keeps its first definition.
8. **Point links to paper notes at their keys** (`citeByKey`).
9. **Lift headings** (`liftHeadings`). A leading H1 becomes the title and every
   other heading moves up a level, unless the note uses H1 for its own sections
   further down.
10. **Resolve images** (`imageEmbeds`). `![[figure.png|300]]` becomes a
    markdown image of the file Obsidian would show, 300 pixels wide. Other
    embeds, such as notes, PDFs and canvases, are dropped.

Then `documentMetadata` builds the metadata: the title (the lifted H1, the
`title` property, or the file name), the reference list's heading, and only the
properties in `DOCUMENT_KEYS`.

## Why the order matters

- **What never leaves goes first.** Comments are stripped before anything reads
  the note, so nothing in a comment can become a citation, a heading or an
  image.
- **The check reads the note before links are rewritten**, so it sees what you
  wrote, not what `citeByKey` made of it.
- **Headings are promoted here, not with `--shift-heading-level-by`,** which
  would also demote the References heading citeproc adds afterwards. Markdown
  output is the one place that's wanted: there the title is a heading on top,
  and pandoc's shift moves everything else, References too, under it.

## Code is only characters

Every rewrite in `core/markdown.ts` goes through `segments`, and leaves fenced
code blocks and backtick spans alone. A comment marker, tag or link inside code
is text, and stays exactly as written.

`segments` keeps comments from leaking, so where it disagrees with CommonMark
about what is code, only one direction is a failure: text it takes for code,
where a comment would be kept. The conformance check in
[Development](development.md#the-conformance-check) looks for exactly that.

## What pandoc is told

`pandocArgs` in `core/document.ts` reads the note as pandoc's markdown with
Obsidian's habits switched on (wikilinks with a title after the pipe,
highlights, lists without a blank line before them, hard line breaks unless
strict line breaks are on) and pandoc's own table syntaxes and blank-line rules
switched off, because Obsidian doesn't have them.

Pandoc's own markdown has to be the reader, because its CommonMark reader has
no `[@key]` citations.
