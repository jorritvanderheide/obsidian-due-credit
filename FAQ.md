# Frequently asked questions

Can't find your answer here? Please
[open an issue](https://github.com/jorritvanderheide/obsidian-due-credit/issues/new/choose).

- [Getting it to run](#getting-it-to-run)
- [Citations](#citations)
- [Footnote styles and LaTeX](#footnote-styles-and-latex)
- [The exported file](#the-exported-file)
- [Other](#other)

## Getting it to run

### "Download pandoc?"

Due Credit can't find pandoc on your computer, so it offers to download the
built-in pandoc, a version that runs inside Obsidian. It's a 17 MB download
from pandoc's release on GitHub, kept outside your vault. It makes Word,
Markdown and LaTeX, but not a PDF.

If pandoc is installed and Due Credit still asks, Obsidian may not see the same
PATH as your terminal. Run `which pandoc` (macOS, Linux) or `where pandoc`
(Windows) in a terminal, and set **Pandoc** in Settings → Due Credit to the
path it shows.

### "Couldn't find pandoc at "…". Check the path in Settings → Due Credit, or set it back to "pandoc"."

The path in **Pandoc** doesn't lead to a pandoc. Fix the path, or set it back
to `pandoc`. Due Credit then uses the pandoc on your PATH, or offers the
built-in one if there isn't one.

### "Couldn't download pandoc: …"

Either the download from GitHub failed, or the built-in pandoc couldn't be
saved in your cache folder. The rest of the message says which. Try again
later, or install pandoc from [pandoc.org](https://pandoc.org/installing.html).

### "The pandoc download didn't match the version this plugin was tested with, so it wasn't used. Try again later, or install pandoc yourself."

The file that came back from GitHub isn't exactly the one Due Credit was tested
with, so Due Credit didn't keep it or run it. Try again later. If it keeps
happening, install pandoc from [pandoc.org](https://pandoc.org/installing.html).

### A PDF export fails, but Word works

A PDF needs xelatex, which comes with a TeX distribution such as
[TeX Live](https://tug.org/texlive/) or [MiKTeX](https://miktex.org/). Install
one, and restart Obsidian so it sees the new PATH.

### "A PDF needs pandoc and xelatex installed, and Due Credit can't find pandoc. …"

The built-in pandoc runs inside Obsidian, and can't run xelatex. Install
pandoc and a TeX distribution, or set pandoc's full path in the settings if
it's installed already.

### "Could not fetch resource …: pandoc was compiled without HTTP support"

The built-in pandoc can't download an image your note links to on the web,
so the file has the image's description in its place. Save the image in your
vault and embed that, or install pandoc, which downloads it.

### "There's no bibliography at …"

**Bibliography** points at a file that isn't there. Point it at the `.bib` file
Better BibTeX exports, or clear it to export without citations.

### "There's no citation style at …"

A style name like `apa` is looked up in Zotero's styles folder,
`~/Zotero/styles`. Install the style in Zotero (Settings → Cite), or give the
full path to a `.csl` file. If you moved Zotero's data folder, its styles are
there instead, so use the full path.

### "Your Pandoc arguments include …, which Due Credit can't pass on to pandoc"

Due Credit takes care of where the file goes, how the note is read and the
format. An argument that changes one of those, like `-o`, `-f`, `-t` or a
defaults file, can't be passed on. The message says why, and
[Settings](docs/settings.md#pandoc-arguments) in the docs has the full list.

### "… which pandoc would export instead of the note"

Pandoc reads a word that isn't an option's value as a file to export. Usually
it's a value whose option is missing, or a value with spaces that needs quotes:
`-V "mainfont=TeX Gyre Pagella"`.

### "The properties of … have a mistake in them"

Something in the note's properties can't be read, like a quote that isn't
closed. Open the note in source mode, where Obsidian shows what's wrong, and
fix it. Due Credit won't export the note without its properties, because the
author and date would go missing without a word.

## Citations

### A link came out as plain text instead of a citation

The key isn't in your bibliography. Usually Better BibTeX changed the key, or its
auto-export hasn't run since you added the paper. Due Credit lists these links
before it exports, so you can fix them first. A link to one of your own notes
always exports as its words. That's on purpose, because your reader can't open
your vault.

### My citation came out as "((Marsh 2024))"

Don't put your own parentheses around a citation, because the export adds
them. Write `as shown [[marsh2024]]` instead of `as shown ([[marsh2024]])`.

### Better BibTeX changed a key, and my old links broke

If the paper has a note with a `citekey` property, links to that note keep
working once the property has the new key. Due Credit cites whatever key the
property holds, whatever the note is called. Links that use the old key
directly need updating.

### How do I name the author in my sentence?

Run **Toggle author in citation** with the cursor on the citation. It puts a
`-` against the key: `Marsh [[marsh2024|-marsh2024, p. 12]] argues` becomes
"Marsh (2024, 12) argues". Or write `As @marsh2024 argues`, the way pandoc
does it.

### Can I write `[[marsh2024#p. 12]]`?

Yes, a page after `#` works when it starts with a number, `§`, or a locator
like `p.` or `ch.`. But Obsidian takes it for a heading the paper's note doesn't
have. `[[marsh2024|marsh2024, p. 12]]` works better, and it's what
**Insert citation** writes when you press Tab for a page.

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

That's the `-` against the key. It says your sentence names the author, and
that leaves them out of the footnote too. Under a footnote style, you usually
want the author in the footnote, so drop the `-`. If you switch a draft from an
author-date style to a footnote style, read those citations again.

### What does a LaTeX export give me?

A body to paste into a journal's or conference's own class, with `\cite`
commands intact so the class formats them. Natbib's by default, or biblatex's
`\autocite` with `--biblatex` in **Pandoc arguments**. No citation style is
applied, because the class decides.

## The exported file

### Why aren't my tags and properties in the Word file?

That's on purpose. Word keeps every property pandoc gives it inside the file,
where anyone you send it to can find them. Your tags, and anything else you
use to organise your vault, would go along with it. Only `author`, `date`,
`lang`, `abstract`, `keywords`, `subtitle` and `reference-section-title` make
it into the file.

### How do I set the author and date?

Add `author` and `date` to the note's properties.

### Can I call the reference list something else?

Set `reference-section-title` in the note's properties, for example
`Literatuur` for a Dutch text.

### How do I use my university's Word styles?

Set **Word template** to a `.docx` with the styles you want. To start from
pandoc's default styles, run
`pandoc -o reference.docx --print-default-data-file reference.docx`, open it in
Word, change the styles, and save it.

### How do I change the PDF's font, paper size or margins?

With **Pandoc arguments**: `-V "mainfont=TeX Gyre Pagella"` for a font you
have installed, `-V papersize=letter` for US letter, and
`-V geometry:margin=2.5cm` for the margins.

### Why can't I save the export inside my vault?

That way an export can never replace a note. A Markdown export saved next to
its note, under the same name, would overwrite it. Save it anywhere outside the
vault.

### My `\newpage` shows up as text in the export

Since 1.8.0, a backslash exports as it shows in Obsidian, so a Windows path or
code in a quote comes out whole. A LaTeX command you meant for a PDF now needs
to say so: write `` `\newpage`{=latex} `` instead of `\newpage`, and pandoc
passes it on to LaTeX as before.

## Other

### Can I use the citation filter without Obsidian?

Yes. The filter, [`pandoc/wikilink-citations.lua`](https://codeberg.org/BW20/obsidian-citation-core/src/branch/main/pandoc/wikilink-citations.lua), works with pandoc on its own, for
citations. [Citations](docs/citations.md#using-the-filter-on-its-own) in the
docs shows the command.

### Does it work on mobile?

No. Due Credit runs pandoc, installed or built-in, and both need parts of
Obsidian that only the desktop app has.

### Why don't the commands have hotkeys?

You already have hotkeys Due Credit knows nothing about, and a default that
collides with one of yours is worse than no default. Pick your own in Settings
→ Hotkeys.
