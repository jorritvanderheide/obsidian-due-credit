# Security policy

## Supported versions

Security fixes go into the latest release of Due Credit. Older releases don't
get separate fixes, so please update before you report.

## Reporting a problem

Please don't open a public issue for a security problem. Report it privately
through GitHub instead:

https://github.com/jorritvanderheide/obsidian-due-credit/security/advisories/new

Include the Due Credit, Obsidian and pandoc versions, your operating system,
and the steps to reproduce it. I'll look into your report before anything about
it is made public.

## What counts

Due Credit does only a few things:

- It runs pandoc on the note you export. That's the pandoc you installed,
  which it first asks for its version, or without one, the built-in pandoc. Due Credit downloads that once, when you
  agree, checks it against a SHA-256 hash it carries, and runs it inside
  Obsidian.
- It reads that note and the citation keys of the notes it links to, your
  bibliographies, your citation style and Word template, whether strict line
  breaks are on in your vault's settings, and the folders on your PATH, to
  find pandoc. Insert citation reads the citation key property of your notes,
  and the settings tab reads the path and properties of every note.
- It writes the file you pick in the save dialog, never inside your vault,
  and a citation at the cursor when you insert or change one. For each
  export, it writes the files pandoc needs to a temporary folder and removes
  them afterwards. When you agree to download the built-in pandoc, it also
  writes that to your cache folder, and deletes it again if it ever stops
  matching its hash.
- It stores its settings in its own `data.json`, including the folder your
  last export went to.

[Section 11 of the README](README.md#11-network-and-file-disclosure) has the
details. Anything that does one of these is a security problem:

- makes Due Credit run a program other than pandoc,
- makes it write somewhere you didn't choose,
- lets the text of a note change what pandoc reads, writes or runs,
- keeps or runs a built-in pandoc that doesn't match its hash,
- lets the built-in pandoc see more of your disk than the vault, the folders
  of the files it's given and its temporary folders,
- or makes Due Credit connect anywhere other than pandoc's release on GitHub.

The plugin directory's health report warns that Due Credit executes programs
and uses the filesystem directly. Those are pandoc and the files above, as
[section 3 of the README](README.md#3-safety-and-quality) explains.

What you add yourself under **Pandoc arguments**, such as your own filter, runs
with your permission and isn't covered. An installed pandoc downloading an image
your note shows from the web isn't either: that's how pandoc works, as section 11
of the README says. Problems in pandoc itself aren't covered: please report
those to [pandoc](https://github.com/jgm/pandoc).

A bug that exports the wrong text, or leaves something out, is serious too, but
it isn't secret. Please report it as a normal issue, so others can see it.
