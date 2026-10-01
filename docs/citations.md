# Citations

Everything about how a link becomes a citation, including the cases the README
leaves out. The rules are in `pandoc/wikilink-citations.lua`, and repeated in
`src/core/citations.ts` for the check before an export.

## What becomes a citation

A wikilink becomes a citation when the bibliography has an entry by that key.
Anything else exports as its words: a link to a note of your own reads as the
text Obsidian shows, never as a dead link.

Every form below is read. Due Credit writes none of them: other people's
citation habits land here, not in Paper Trail.

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
  comma: `[[a|Marsh, p. 4]]` cites page 4. This is how Paper Trail's **Add page
  to citation** adds a page to a label someone wrote.
- **Neighbouring citations**, separated by at most a `;`, share brackets.

A leading `@` in a link's name, as the Citations plugin names notes, isn't part
of the key.

### A page after `#`

`[[key#p. 12]]` cites page 12 when what follows `#` starts with a number, `§`,
or a locator word such as `p.`, `pp.`, `ch.`, `sec.` or `fig.`. Otherwise it's
a heading, and `[[marsh2024#Claim]]` is the paper. Paper Trail doesn't write
this form, because Obsidian takes it for a heading the paper's note doesn't
have, and its hover preview says so.

### Paper notes under any name

A link to a note whose **Citation key property** (`citekey` by default) holds a
key cites that key, whatever the note is called. `citeByKey` in
`core/markdown.ts` rewrites such links to the key before pandoc runs, because
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
`core/document.ts`, and by `note_style` in `after-citeproc.lua`. Change one and
the other follows.

## LaTeX

A LaTeX export keeps the `\cite` commands, so the journal's own class formats
them: natbib's by default, or biblatex's `\autocite` with `--biblatex` in
**Pandoc arguments**, which a class with a footnote style makes a footnote. No
citation style is applied, because the class decides.

## The check before an export

Before running pandoc, the export lists every link that's about to come out as
words instead of a citation (`missing` in `core/prepare.ts`):

- **A link to a paper note whose key the bibliography doesn't have.** A paper
  note is one with a citation key property, or one in the papers folder. The
  key is almost always one Better BibTeX changed, or the paper is newer than
  its last auto-export.
- **A link to no note at all, whose name isn't a key either.** Paper Trail
  links a paper that has no note yet by its key, so a paper cited before its
  auto-export ran lands here, and so does a note not written yet.

A link to a note of your own is never listed. The check reads the note before
any link is rewritten.

## One rule, written twice

The filter decides what is a citation, and `core/citations.ts` repeats its
`read_bib`, `key_of` and `spelled`, so the check can list the citations about to
be lost before pandoc loses them. Change one and the other follows. One table of
cases in `tests/pandoc.test.ts` ("one rule, written twice") runs through both.

The filter runs before `--citeproc`, because citeproc can only cite what the
filter has already made.

## The agreement with Paper Trail

[Paper Trail](https://github.com/jorritvanderheide/obsidian-paper-trail) writes
citations; Due Credit reads them. Its side is in Paper Trail's
[`docs/citations.md`](https://github.com/jorritvanderheide/obsidian-paper-trail/blob/main/docs/citations.md).

- **Due Credit reads a form before Paper Trail writes it.** That's the order for
  any new form, so no note is ever written in a spelling the export doesn't
  know.
- **The locator words are kept in two places, by hand.** `LOCATOR_TERMS` in
  Paper Trail's `src/core/zotero.ts` is this filter's list of words that start a
  locator. A change to one is a change to both: a word only one side knows is a
  page the export drops. Make the Paper Trail change as its own change there.

## Using the filter on its own

`pandoc/wikilink-citations.lua` works with pandoc without the plugin, for
citations and nothing else. The order matters:

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
