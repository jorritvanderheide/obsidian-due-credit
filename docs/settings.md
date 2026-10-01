# Settings

The settings shape, defaults and loading are in `src/core/settings.ts`.

## Shape

| Key | Default | Empty means |
| --- | --- | --- |
| `version` | `1` | |
| `pandocPath` | `pandoc` | The default |
| `outputFolder` | `~/Documents` | The default |
| `lastFolder` | `''` | No export yet. Remembered, not shown in the tab. |
| `bibliography` | `Literature/library.bib` | Export without citations |
| `literatureFolder` | `Literature` | The default |
| `keyProperty` | `citekey` | The default |
| `csl` | `''` | Pandoc's built-in Chicago author-date |
| `referenceDoc` | `''` | Pandoc's own Word styles |
| `extraArgs` | `''` | No arguments of your own |

`loadSettings` builds a fresh object from the keys it knows, so a key nothing
reads anymore is dropped. Values are trimmed, because a stray space in a path is
a silent miss. A blanked address falls back to its default, except where empty
is an answer (the right-hand column).

## Paths

A path setting is relative to the vault, or absolute, or starts with `~` for
the home folder (`settingPath`, `expandHome`). A citation style without a slash
is looked up in Zotero's styles folder, `~/Zotero/styles/<name>.csl`
(`cslPath`).

A setting that has to agree with something outside the plugin says when it
doesn't: an export stops with a sentence when the bibliography, Word template or
style isn't there.

## Pandoc arguments

The one setting that isn't an address. `splitArgs` reads it: split at spaces,
quotes keep a value with spaces together, a backslash is only a backslash (so a
Windows path is written as it is), and `~` at the start of a path is the home
folder.

The arguments go after Due Credit's own, so yours win, and before citeproc, so a
filter of yours runs before citations are rendered.

Some are refused (`refused` in `core/document.ts`), because they'd change what
Due Credit decides or break a promise it makes:

| Refused | Why |
| --- | --- |
| `-o`, `--output` | The save dialog decides where the export goes, and that it isn't in the vault. |
| `-f`, `-r`, `--from`, `--read` | The note is read the way Obsidian writes it. |
| `-t`, `-w`, `--to`, `--write` | The export command decides the format. |
| `-d`, `--defaults` | A defaults file can set any of the above. |
| `--extract-media`, `--log` | They write a file of their own, which could be in the vault. |
| `--help`, `--version`, `--print-default-data-file` and the like | They print something and export nothing. |

On top of that, `pandoc --dump-args` is asked what it makes of your arguments,
and a word it would read as an input file is refused too: the export would be
of that file instead of the note.

`--natbib` and `--biblatex` only reach a LaTeX export. The other formats render
citations with citeproc.

## Changing the shape

Settings written by a released version exist in other people's vaults.

- **Adding** a key with a default needs nothing.
- **Removing** a key needs nothing: the loader drops keys it doesn't know.
- **Renaming** a key, or changing what it means, needs the old key read and
  carried over in `loadSettings`, and `SETTINGS_VERSION` bumped. Add a test in
  `tests/settings.test.ts` that loads the old shape.

## What may be a setting

Addresses, not opinions: where pandoc is, where the dialog opens, which Word
template, bibliography, papers folder and style. How a note becomes a document
is the product, and stays in code.
