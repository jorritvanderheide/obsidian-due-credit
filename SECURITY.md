# Security policy

## Supported versions

Security fixes go into the latest release of Due Credit. Older releases don't
get separate fixes, so please update before you report.

## Reporting a problem

Please don't open a public issue for a security problem. Report it privately
through GitHub instead:

https://github.com/jorritvanderheide/obsidian-due-credit/security/advisories/new

Include the Due Credit, Obsidian and pandoc versions, your operating system,
and the steps to reproduce it. Reports are looked at before anything about them
is made public.

## What counts

Due Credit runs the pandoc you installed on the note you export. It reads that
note, your bibliography and your citation style, and writes only the file you
pick in the save dialog, never inside your vault. See the
[Safety section of the README](README.md#safety). Anything that makes it run a
program other than pandoc, write somewhere you didn't choose, or lets the text
of a note change what pandoc reads, writes or runs is a security problem.

What you add yourself under **Pandoc arguments**, such as your own filter, runs
with your permission and isn't covered. Neither are problems in pandoc itself:
please report those to [pandoc](https://github.com/jgm/pandoc).

A bug that exports the wrong text, or leaves something out, is serious too, but
it isn't secret: please report that as a normal issue, so others can see it.
