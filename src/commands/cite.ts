// Insert citation and Add page to citation: a work from the bibliography,
// written where the cursor is, in the forms the core writes. The works come
// from the same `.bib` an export cites from, so whatever can be picked can be
// cited. Nothing here talks to Zotero.
import { readFile, stat } from 'fs/promises';
import { homedir } from 'os';
import { FileSystemAdapter, MarkdownView, Notice, type App } from 'obsidian';
import { bibEntries, citationLink, linkAt, linkName, propertyKey, settingPath, toggleAuthor, withPage, type Entry } from 'obsidian-citation-core';
import { pickWork } from '../ui/citation-picker';
import { prompt } from '../ui/prompt';
import type { Context } from '../context';

/** The bibliography as last read, kept while the file is unchanged: a large one takes a moment to read. */
let read: { path: string; modified: number; entries: Entry[] } | null = null;

/** The works in the bibliography, or null, having said why, when there are none to offer. */
async function works(context: Context): Promise<Entry[] | null> {
	const { app, settings } = context;
	const adapter = app.vault.adapter;
	if (!(adapter instanceof FileSystemAdapter)) return null;
	if (settings.bibliography === '') {
		new Notice('Insert citation lists the works in your bibliography, so it needs one: set its path in the Due Credit settings first.');
		return null;
	}
	const path = settingPath(settings.bibliography, adapter.getBasePath(), homedir());
	let modified: number;
	try {
		modified = (await stat(path)).mtimeMs;
	} catch {
		new Notice(`There's no bibliography at ${path}. Point the Bibliography setting at your Better BibTeX export.`);
		return null;
	}
	if (read?.path !== path || read.modified !== modified) read = { path, modified, entries: bibEntries(await readFile(path, 'utf8')) };
	if (read.entries.length === 0) {
		new Notice(`There are no works in ${path} yet.`);
		return null;
	}
	return read.entries;
}

/**
 * What a citation of the key links to: the paper's note by its name, when a
 * note has the key in the citation key property, so the link resolves in the
 * vault; otherwise the key, which cites just the same.
 */
function targetOf(app: App, key: string, property: string): string {
	const note = app.vault.getMarkdownFiles().find((file) => propertyKey(app.metadataCache.getFileCache(file)?.frontmatter, property) === key);
	return note?.basename ?? key;
}

function askPage(app: App, name: string): Promise<string | null> {
	return prompt(app, `Page in ${name}`, '4, or ch. 3', 'Cite');
}

export async function insertCitation(context: Context): Promise<void> {
	const { app } = context;
	if (!app.workspace.getActiveViewOfType(MarkdownView)) {
		new Notice('Open a note and put the cursor where the citation should go.');
		return;
	}
	const entries = await works(context);
	if (entries === null) return;
	const picked = await pickWork(app, entries);
	if (picked === null) return;

	const target = targetOf(app, picked.entry.key, context.settings.keyProperty);
	// Dismissing the page question cancels the citation, as Escape does
	// anywhere: a citation without the page you meant is a quiet mistake.
	let page = '';
	if (picked.withPage) {
		const typed = await askPage(app, target);
		if (typed === null) return;
		page = typed;
	}

	// The editor after the picker closed, not before: the cursor may have moved.
	const cited = citationLink(target, page);
	const editor = app.workspace.getActiveViewOfType(MarkdownView)?.editor;
	if (!editor) {
		new Notice(`There's no open note to put it in. The citation was: ${cited}`);
		return;
	}
	editor.replaceSelection(cited);
}

/**
 * Put a page on the citation at the cursor, or just before it, where
 * Obsidian's own `[[` leaves the cursor: adding a page there otherwise means
 * typing the key again.
 */
export async function addPage(context: Context): Promise<void> {
	const { app } = context;
	const editor = app.workspace.getActiveViewOfType(MarkdownView)?.editor;
	if (!editor) {
		new Notice('Open a note and put the cursor on a citation.');
		return;
	}
	const cursor = editor.getCursor();
	const link = linkAt(editor.getLine(cursor.line), cursor.ch);
	if (!link) {
		new Notice('Put the cursor on a citation, or just after one, like [[key]].');
		return;
	}
	const before = editor.getLine(cursor.line).slice(link.from, link.to);
	const page = await askPage(app, linkName(link));
	if (page === null) return;

	// The note can change while the question is open, and replacing a range
	// that now holds other words would overwrite them.
	if (editor.getLine(cursor.line).slice(link.from, link.to) !== before) {
		new Notice('The note changed while you were typing the page, so nothing was changed. Try again.');
		return;
	}
	editor.replaceRange(withPage(link, page), { line: cursor.line, ch: link.from }, { line: cursor.line, ch: link.to });
}

/**
 * Leave the author out of the citation at the cursor, for a sentence that
 * names them already, or name them again: "Marsh (2024) argues" rather than
 * "Marsh (Marsh 2024) argues".
 */
export function toggleAuthorAt(context: Context): void {
	const editor = context.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
	if (!editor) {
		new Notice('Open a note and put the cursor on a citation.');
		return;
	}
	const cursor = editor.getCursor();
	const link = linkAt(editor.getLine(cursor.line), cursor.ch);
	if (!link) {
		new Notice('Put the cursor on a citation, or just after one, like [[key]].');
		return;
	}
	editor.replaceRange(toggleAuthor(link), { line: cursor.line, ch: link.from }, { line: cursor.line, ch: link.to });
}
