# Todo

## The return flow: feedback back into the vault

Queued on 2026-09-29, after the export. A reviewed docx or an annotated PDF comes back, and what the reviewer did has to reach the note it was exported from without costing any of your prose.

**The shape.** Importing writes a feedback note: one checkbox item per comment and tracked change, with author, date, the passage it touches and a link to where it sits in the draft. A sidebar panel is drawn from that note and never holds state of its own, so closing Obsidian loses nothing, the round is in git, and the note reads fine without the plugin.

- Clicking an item jumps to the passage in the draft and highlights it.
- **Accept** applies a tracked change through the editor, so it joins the undo history.
- **Reject** and **Done** tick the item off without touching the draft.

**Anchoring is the real work.** The docx is not the note: citations came back as "(Jacobs, 2024)" rather than `[[jacobsAuthenticityCrisis2024]]`, headings were promoted, `%%comments%%` stripped, and the note may have moved on since. A change is found by its text, the passage plus a few words either side, in the note as it is now. Plain prose anchors well; a change touching a citation, a link or formatting does not.

**Accept only applies when the anchored text still matches exactly.** Anything else stays in the panel under "couldn't place", readable, to be applied by hand. The panel never guesses at your prose. The anchoring is pure and belongs in `core/`, with tests.

**Sources.**

- **docx:** pandoc reads insertions, deletions and comments with author and date (`--track-changes=all`).
- **PDF:** comments only, since a PDF has no tracked changes. Obsidian ships pdf.js, which reads annotations; the highlighted text has to be recovered from positions on the page.

**Open questions.**

- Whether pandoc keeps comment reply threads or flattens them into separate comments. Word keeps threads in a separate part of the file. Check with a real reviewed docx before promising threads.
- Inline red and green marks in the editor, as in Word. Later, once the panel has proved itself.
- Merging straight into the draft instead of going through a feedback note. That needs the exact exported version (a snapshot or a git commit) and a three-way merge.

## Export: later

Left out of the first export on purpose, because the vault does not use them yet.

- `![[note]]` embeds, for a chapter or a thesis assembled from notes. Until then an embedded note exports as `!` followed by its name.
- Callouts.
- Per-note settings: style, template, format.
- Templates for paper submission: a `reference.docx` for Word, a LaTeX template or class for PDF.
- Live Zotero citations in docx through Better BibTeX's pandoc filter, so a co-author with the Zotero Word plugin can keep citing.
