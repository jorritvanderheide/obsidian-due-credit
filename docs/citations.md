# Citations

Everything about how a link becomes a citation, including the cases the README
leaves out. The rules are in `pandoc/wikilink-citations.lua`, and repeated in
`src/core/citations.ts` for the check before an export, both in
[obsidian-citation-core](https://codeberg.org/BW20/obsidian-citation-core), the
core Due Credit shares with its sibling plugins.

## What becomes a citation

A wikilink becomes a citation when the bibliography has an entry by that key.
Anything else exports as its words: a link to a note of your own reads as the
text Obsidian shows, never as a dead link.

Every form below is read. Due Credit writes three of them, `[[key]]`, a
page in the label and a `-` against the key, through **Insert citation**,
**Add page to citation** and **Toggle author in citation**; the rest are other
people's habits, and are read just the same.

| Written | Exported |
| --- | --- |
| `[[marsh2024]]` | (Marsh 2024) |
| `[[@marsh2024]]` | (Marsh 2024) |
| `[[marsh2024\|marsh2024, p. 12]]` | (Marsh 2024, 12) |
| `[[marsh2024\|see marsh2024, p. 12, emphasis added]]` | (see Marsh 2024, 12, emphasis added) |
| `[[marsh2024\|-marsh2024, p. 12]]` | (2024, 12) |
| `[[marsh2024\|Marsh, p. 12]]` | (Marsh 2024, 12) |
| `[[marsh2024\|marsh2024, p. 12]]; [[okafor2019]]` | (Marsh 2024, 12; Okafor 2019) |
| `[[marsh2024#p. 12]]` | (Marsh 2024, 12) |
| `[@marsh2024, p. 12]` | (Marsh 2024, 12) |
| `[[My idea\|this idea]]` | this idea |
| `[[My idea#Section]]` | My idea |

### The label

- **A label that repeats the key** is read the way pandoc reads
  `[see @key, p. 12]`: what comes before the key is a prefix, and what comes
  after it is the locator and anything else. An `@` against the key is
  optional.
- **A `-` against the key** leaves the author out, as in `[-@key, p. 12]`, for a
  sentence that names them already.
- **Any other label** is what Obsidian shows, apart from a page after its first
  comma: `[[a|Marsh, p. 4]]` cites page 4. This is how **Add page to
  citation** adds a page to a label someone wrote.
- **Neighbouring citations**, separated by at most a `;`, share brackets.

A leading `@` in a link's name, as the Citations plugin names notes, isn't part
of the key.

### A page after `#`

`[[key#p. 12]]` cites page 12 when what follows `#` starts with a number, `§`,
or a locator word such as `p.`, `pp.`, `ch.`, `sec.` or `fig.`. Otherwise it's
a heading, and `[[marsh2024#Claim]]` is the paper. Due Credit doesn't write
this form, because Obsidian takes it for a heading the paper's note doesn't
have, and its hover preview says so.

### Paper notes under any name

A link to a note whose **Citation key property** (`citekey` by default) holds a
key cites that key, whatever the note is called. `citeByKey` in
the core's `core/markdown.ts` rewrites such links to the key before pandoc runs, because
the filter only knows a link's name, and also works by hand without a vault. A
key that the label repeats changes with it, so the label still spells the
citation out.

## Footnote styles

A style whose CSL `class` is `note`, such as `chicago-notes-bibliography` or
`mhra-notes`, makes each citation a footnote, after the punctuation that
follows it. The reference list is then headed Bibliography rather than
References.

- **A citation in a footnote of your own** is part of its sentence, "see
  Marsh, *The Quiet Archive*, 12", the way Zotero writes it.
  `after-citeproc.lua` takes off the parentheses citeproc puts around it.
- **A citation next to a footnote of yours** shares it, citation first when it
  comes first: `A claim [[marsh2024]].[^1]` has one footnote, not two marks
  side by side.
- **Leaving the author out** leaves them out of the footnote too, since the
  sentence names them: `As Marsh [[marsh2024|-marsh2024, p. 12]] argues` gets a
  footnote that starts at the title, "*The Quiet Archive* (…), 12", and so does
  `As @marsh2024 [p. 12] argues`. That is pandoc's reading, and no one way of
  writing suits both kinds of style. For a footnote that names the author, drop
  the `-`. A draft written for an author-date style keeps its `-` when you
  switch it to a footnote style, so read those citations again.

Whether a style cites in footnotes is read twice: by `noteStyle` in
the core's `core/document.ts`, and by `note_style` in `after-citeproc.lua`. Change one and
the other follows.

## LaTeX

A LaTeX export keeps the `\cite` commands, so the journal's own class formats
them: natbib's by default, or biblatex's `\autocite` with `--biblatex` in
**Pandoc arguments**, which a class with a footnote style makes a footnote. No
citation style is applied, because the class decides.

## The check before an export

Before running pandoc, the export lists every link that's about to come out as
words instead of a citation (`missing` in the core's `core/prepare.ts`):

- **A link to a paper note whose key the bibliography doesn't have.** A paper
  note is one with a citation key property, or one in the papers folder. The
  key is almost always one Better BibTeX changed, or the paper is newer than
  its last auto-export.
- **A link to no note at all, whose name isn't a key either.** Insert citation
  links a paper that has no note by its key, so a paper cited before its
  auto-export ran lands here, and so does a note not written yet.

A link to a note of your own is never listed. The check reads the note before
any link is rewritten.

## One rule, written twice

The filter decides what is a citation, and the core's `core/citations.ts` repeats its
`read_bib`, `key_of` and `spelled`, so the check can list the citations about to
be lost before pandoc loses them. Change one and the other follows. One table of
cases in `tests/pandoc.test.ts` ("one rule, written twice") runs through both. All three are in the core.

The filter runs before `--citeproc`, because citeproc can only cite what the
filter has already made.

## Writing them

**Insert citation** picks a work from the bibliography, the same `.bib` the
export cites from, so whatever it offers can be cited. It writes `[[key]]`,
or the paper's note by its name when a note has the key in its citation key
property, so the link resolves in the vault and lands in the paper's
backlinks. Tab asks for a page, which goes in the label: `[[key|key, p. 4]]`.
**Add page to citation** puts a page in a link already written, the way the
label rules above read it. **Toggle author in citation** puts a `-` against
the key in the label, or takes it off: `[[key]]` becomes `[[key|-key]]`, and
a label of your own becomes the key, with its page, since the export reads
nothing else in it. All three are in the core's `core/writing.ts`, which
reads the locator words from the same list as the filter: `LOCATOR_TERMS`,
held to the filter's by a test.

## The agreement with Paper Trail

[Paper Trail](https://github.com/jorritvanderheide/obsidian-paper-trail) writes
one form: **Insert annotation** quotes a passage with a citation to its page,
`[[key|key, p. 12]]`. Its side is in Paper Trail's
[`docs/citations.md`](https://github.com/jorritvanderheide/obsidian-paper-trail/blob/main/docs/citations.md).
A new form is read here before Paper Trail writes it, so no note is ever
written in a spelling the export doesn't know.

## Using the filter on its own

The core's [`pandoc/wikilink-citations.lua`](https://codeberg.org/BW20/obsidian-citation-core/src/branch/main/pandoc/wikilink-citations.lua)
works with pandoc without the plugin, for citations and nothing else. The order
matters:

```sh
pandoc chapter.md \
  --from=markdown+wikilinks_title_after_pipe \
  --lua-filter=pandoc/wikilink-citations.lua \
  --bibliography=Literature/library.bib \
  --citeproc \
  --output=chapter.docx
```

Everything the plugin does to a note before pandoc runs is the plugin's, so by
hand pandoc keeps your comments, and a Word file carries every property of the
note inside it, tags and all.
