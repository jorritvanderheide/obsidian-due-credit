# Compatibility

Due Credit's settings live in other people's vaults, people bind hotkeys to its
commands, and Paper Trail writes the citations it reads. This page says what a
release may and may not change, so all of that keeps working across updates.
Changes are listed in [CHANGELOG.md](../CHANGELOG.md).

Due Credit's version is `MAJOR.MINOR.PATCH`. A minor or patch release breaks
nothing below. A major release may, and the changelog then says what changed
and what to do.

## Settings

They're in the plugin's `data.json`, in the shape in
[Settings](settings.md#shape), and `loadSettings` in `src/core/settings.ts`
reads them. Every save writes every key. The shape hasn't changed since 1.0.0,
so `version` is still 1.

- **Renaming a key, or changing what a value means**, is breaking unless
  `loadSettings` reads the old one and carries it over, with `SETTINGS_VERSION`
  raised. There's no such step yet: `loadSettings` doesn't look at the stored
  `version`, so the first change like this adds one.
- **Adding** a key with a default isn't breaking, and neither is **removing**
  one: the loader drops keys it doesn't know.
- **Changing a default** only reaches people who have never changed a setting
  or exported, because a save writes the defaults out too. To change it for
  everyone, treat it as a change of meaning.
- **A value of the wrong type** reads as its default.
- **Refusing a pandoc argument** that wasn't refused before (`refused` in
  the core's `core/document.ts`) is breaking: exports stop for anyone who has it in
  **Pandoc arguments**. So is moving those arguments to another place among
  Due Credit's own.
- **A test loads each release's `data.json`** (`tests/settings.test.ts`). When
  the stored shape changes, add a fixture named after the last version that
  saved the old one.

Going back to an older release isn't supported. It loads the keys it knows, and
drops the rest the next time it saves.

## Your notes

- **Nothing is written in the vault.** An export reads the note and writes only
  the file you pick, which can't be in the vault. A change to that goes in the
  README's disclosure and `SECURITY.md` in the same release.
- **What's read from a note:** the title (its leading H1, then the `title`
  property), the properties in `DOCUMENT_KEYS` (the core's `core/document.ts`), every
  citation form in [Citations](citations.md#what-becomes-a-citation), and the
  **Citation key property** of the notes it links to. No longer reading one of
  these, or reading it differently, is breaking: a note written for it would
  export differently without a word. Reading something new isn't.
- **Obsidian's own syntax** is read the way Obsidian shows it
  ([Pipeline](https://codeberg.org/BW20/obsidian-citation-core/src/branch/main/docs/pipeline.md)). Reading it more like Obsidian does is a fix, not a
  break.
- **What stays behind:** `%%comments%%`, `<!-- comments -->` and every property
  not in `DOCUMENT_KEYS` never reach pandoc. Letting more of a note out,
  including adding a key to `DOCUMENT_KEYS`, is breaking, because people write
  things there for themselves.

## Files from other tools

These keep being read the way they are now:

- **The bibliography**, a `.bib` file from Better BibTeX: a key is read from a
  line that starts an entry, `@article{key,` (`bibKeys` in the core's `core/citations.ts`
  and `read_bib` in the filter).
- **Citation styles:** a name rather than a path is
  `~/Zotero/styles/<name>.csl`.
- **Obsidian's `app.json`:** `strictLineBreaks`, for line breaks.

## Commands

- **The plugin ID** `due-credit` never changes. It's the plugin's folder, where
  `data.json` lives, and the start of every command ID.
- **Command IDs** are `due-credit:export-docx`, `export-pdf`, `export-md` and
  `export-tex`, made from the keys of `FORMATS` in the core's `core/document.ts`. People
  bind hotkeys to them, so renaming or removing one is breaking. A command's
  name may change.
- There are no views or `obsidian://` URIs to keep.

## Paper Trail

The citation forms are an agreement with Paper Trail, described in
[Citations](citations.md#the-agreement-with-paper-trail).

- **Every form Paper Trail writes is read.** No longer reading one is breaking
  for both plugins.
- **A new form is read here first.** Release Due Credit before Paper Trail
  writes it.
- **The locator words** are in the filter's `LOCATOR_TERMS` and in Paper
  Trail's, kept in step by hand. A word only one side knows is a page the
  export drops, so change both.
- **The Citation key property** defaults to `citekey`, which is what Paper
  Trail writes.

## Obsidian and pandoc

- **`minAppVersion`** is 1.13.0 for every release so far. Raising it isn't
  breaking, because `versions.json` tells an older Obsidian which release it
  can still install. So every release keeps its line there: `npm version` adds
  it, and the release workflow refuses a tag without one.
- **Desktop only** (`isDesktopOnly`), because an export runs pandoc.
- **Pandoc:** the README says which version Due Credit is tested with, the one
  CI pins. Needing a newer pandoc for something that already worked is
  breaking.

## Not covered

These can change in any release:

- How an export looks: its layout, fonts, page size, and what pandoc writes
  into it. 1.2.0 moved PDFs from Letter to A4, and **Pandoc arguments** can set
  it back.
- The wording of commands, notices and the settings tab.
- The code in `src/` and `pandoc/`. The filter keeps reading the forms above
  when you use it on its own, but nothing else about it is promised.
