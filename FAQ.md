# Frequently asked questions

Can't find your answer here? Please
[open an issue](https://github.com/jorritvanderheide/obsidian-due-credit/issues/new/choose).

- [Getting it to run](#getting-it-to-run)
- [Citations](#citations)
- [Footnote styles and LaTeX](#footnote-styles-and-latex)
- [The exported file](#the-exported-file)
- [Other](#other)

## Getting it to run

### "Pandoc was not found at …"

Due Credit runs pandoc, which you install separately from
[pandoc.org](https://pandoc.org/installing.html). If it's installed but not
found, Obsidian may not see the same PATH as your terminal. Set **Pandoc** in
the settings to its full path: run `which pandoc` (macOS, Linux) or
`where pandoc` (Windows) in a terminal to find it.

### A PDF export fails, but Word works

A PDF needs xelatex, which comes with a TeX distribution such as
[TeX Live](https://tug.org/texlive/) or [MiKTeX](https://miktex.org/). Install
one, and restart Obsidian so it sees the new PATH.

### "There is no bibliography at …"

**Bibliography** points at a file that isn't there. Point it at the `.bib` file
Better BibTeX exports, or clear it to export without citations.

### "There is no citation style at …"

A style name like `apa` is looked up in Zotero's styles folder,
`~/Zotero/styles`. Install the style in Zotero (Settings → Cite), or give the
full path to a `.csl` file.

### "The Pandoc arguments setting has …, which Due Credit does not pass on"

Some arguments would change what Due Credit decides: where the file goes, how
the note is read, or the format. `-o`, `-f`, `-t` and a defaults file are among
them. The message says why. [Settings](docs/settings.md#pandoc-arguments) in the
docs has the full list.

### "… which pandoc would export in place of the note"

Pandoc reads a word that isn't an option's value as a file to export. Usually
it's a value whose option is missing, or a value with spaces that needs quotes:
`-V "mainfont=TeX Gyre Pagella"`.

### "The properties of … are not valid YAML"

The note's properties have a mistake in them. Open the note in source mode,
where Obsidian shows what's wrong, and fix it. Due Credit doesn't export without
them, because the author and date would go missing without a word.

## Citations

### A link came out as plain text instead of a citation

The key isn't in your bibliography. Usually Better BibTeX changed the key, or its
auto-export hasn't run since you added the paper. Due Credit lists these links
before it exports, so you can fix them first. A link to one of your own notes
always exports as its words, on purpose.

### My citation came out as "((Marsh 2024))"

Don't put your own parentheses around a citation: the export adds them. Write
`as shown [[marsh2024]]`, not `as shown ([[marsh2024]])`.

### Better BibTeX changed a key, and my old links broke

If the paper has a note with a `citekey` property, links to that note keep
working: Due Credit cites whatever key the property holds, whatever the note is
called. Links that use the old key directly need updating.

### How do I name the author in my sentence?

Put a `-` against the key: `Marsh [[marsh2024|-marsh2024, p. 12]] argues`
becomes "Marsh (2024, 12) argues". Or write pandoc's own `As @marsh2024 argues`.

### Can I write `[[marsh2024#p. 12]]`?

Yes, a page after `#` works when it starts with a number, `§`, or a locator
like `p.` or `ch.`. But Obsidian takes it for a heading the paper's note doesn't
have, so `[[marsh2024|marsh2024, p. 12]]` is the better form, and it's what
Paper Trail writes.

### Which link forms are there?

The README covers the common ones. [Citations](docs/citations.md) in the docs
lists every form Due Credit reads.

## Footnote styles and LaTeX

### How do citations work with a footnote style?

With a style like `chicago-notes-bibliography` or `mhra-notes`, each citation
becomes a footnote, after the punctuation that follows it, and the reference
list is headed Bibliography. A citation inside a footnote of your own becomes
part of its sentence, and a citation next to one of your footnotes shares it.

### Under a footnote style, the author is missing from the footnote

That's the `-` against the key: it leaves the author out of the footnote too,
because it says your sentence names them. Under a footnote style, you usually
want the author in the footnote, so drop the `-`. If you switch a draft from an
author-date style to a footnote style, read those citations again.

### What does a LaTeX export give me?

A body to paste into a journal's or conference's own class, with `\cite`
commands intact so the class formats them. Natbib's by default, or biblatex's
`\autocite` with `--biblatex` in **Pandoc arguments**. No citation style is
applied, because the class decides.

## The exported file

### Why aren't my tags and properties in the Word file?

On purpose: Word keeps every property pandoc is given inside the file, so your
tags and anything else that organises your vault would travel with the file
you send. Only `author`, `date`, `lang`, `abstract`, `keywords`, `subtitle` and
`reference-section-title` go along.

### How do I set the author and date?

Add `author` and `date` to the note's properties.

### Can I call the reference list something else?

Set `reference-section-title` in the note's properties, for example
`Literatuur` for a Dutch text.

### How do I use my university's Word styles?

Set **Word template** to a `.docx` with the styles you want. To start from
pandoc's own, run
`pandoc -o reference.docx --print-default-data-file reference.docx`, open it in
Word, change the styles, and save it.

### How do I change the PDF's font, paper size or margins?

With **Pandoc arguments**: `-V "mainfont=TeX Gyre Pagella"` for a font you
have installed, `-V papersize=letter` for US letter, and
`-V geometry:margin=2.5cm` for the margins.

### Why can't I save the export inside my vault?

So an export can never replace a note: a Markdown export saved next to its note
would be the note. Save it anywhere outside the vault.

## Other

### Can I use the citation filter without Obsidian?

Yes. `pandoc/wikilink-citations.lua` works with pandoc on its own, for
citations. [Citations](docs/citations.md#using-the-filter-on-its-own) in the
docs shows the command.

### Does it work on mobile?

No. Due Credit runs pandoc, which a phone or tablet can't.

### Why don't the commands have hotkeys?

You already have hotkeys Due Credit knows nothing about, and a default that
collides with one of yours is worse than no default. Pick your own in Settings
→ Hotkeys.
