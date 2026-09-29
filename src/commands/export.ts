// Export a note: read it, make it pandoc's markdown, and run pandoc.
import { existsSync, realpathSync } from 'fs';
import { homedir } from 'os';
import { basename, delimiter, dirname, join } from 'path';
import { remote, shell } from 'electron';
import { FileSystemAdapter, MarkdownView, Notice, parseYaml, type TFile } from 'obsidian';
import { bibKeys } from '../core/citations';
import { FORMATS, pandocArgs, styled, type Format } from '../core/document';
import { cslPath, expandHome, insideVault } from '../core/paths';
import { prepare, type Vault } from '../core/prepare';
import { startFolder } from '../core/settings';
import { ExportError, run, withFiles } from '../pandoc';
import { confirm } from '../ui/confirm';
import type { Context } from '../context';

export async function exportNote(context: Context, file: TFile, format: Format): Promise<void> {
	const { app, settings } = context;
	const adapter = app.vault.adapter;
	if (!(adapter instanceof FileSystemAdapter)) throw new ExportError('Exporting needs the desktop app.');
	const vault = adapter.getBasePath();
	const home = homedir();

	const bibliography = settings.bibliography ? app.vault.getFileByPath(settings.bibliography) : null;
	if (settings.bibliography && !bibliography) {
		throw new ExportError(
			`There is no bibliography at ${settings.bibliography}. Point the Due Credit setting at your Better BibTeX export, or clear it to export without citations.`,
		);
	}
	const csl = settings.csl && styled(format) ? cslPath(expandHome(settings.csl, home), join(home, 'Zotero', 'styles')) : null;
	if (csl && !existsSync(csl)) {
		throw new ExportError(`There is no citation style at ${csl}. Use the name of a style Zotero has installed, such as apa, or the path to a .csl file.`);
	}

	// The editor rather than the file when the note is open, since the file
	// can be a couple of seconds behind what you just typed.
	const view = app.workspace.getActiveViewOfType(MarkdownView);
	const text = view?.file === file ? view.editor.getValue() : await app.vault.read(file);
	const lookup: Vault = {
		resolve: (linkpath) => {
			const dest = app.metadataCache.getFirstLinkpathDest(linkpath, file.path);
			if (!dest) return null;
			return { path: dest.path, file: adapter.getFullPath(dest.path), frontmatter: app.metadataCache.getFileCache(dest)?.frontmatter };
		},
		parseYaml,
	};
	const { markdown, metadata, missing } = prepare(text, lookup, {
		name: file.basename,
		papersFolder: settings.literatureFolder,
		keyProperty: settings.keyProperty,
		keys: bibliography ? bibKeys(await app.vault.cachedRead(bibliography)) : null,
	});
	if (bibliography && missing.length > 0 && !(await confirmMissing(context, missing, bibliography.name))) return;

	const { name, extension } = FORMATS[format];
	const answer = await remote.dialog.showSaveDialog({
		defaultPath: join(expandHome(startFolder(settings, existsSync), home), `${file.basename}.${extension}`),
		filters: [{ name, extensions: [extension] }],
		properties: ['showOverwriteConfirmation'],
	});
	if (answer.canceled || !answer.filePath) return;
	const output = answer.filePath;
	// Nothing is written in the vault: a Markdown export saved next to its
	// source would be the note, and the dialog only asks whether to replace a
	// file.
	if (insideVault(vault, output, realpathSync)) {
		throw new ExportError(`${output} is inside your vault, and an export writes nothing there. Save it somewhere else.`);
	}

	const warnings = await withFiles(metadata, (files) =>
		run(
			settings.pandocPath,
			pandocArgs(format, {
				...files,
				bibliography: bibliography ? adapter.getFullPath(bibliography.path) : null,
				csl,
				resourcePath: [vault, dirname(adapter.getFullPath(file.path))].join(delimiter),
				output,
			}),
			markdown,
			vault,
		),
	);

	settings.lastFolder = dirname(output);
	await context.saveSettings();
	exported(output, warnings);
}

function confirmMissing(context: Context, keys: string[], bib: string): Promise<boolean> {
	return confirm(
		context.app,
		keys.length === 1 ? 'A citation is not in the bibliography' : `${keys.length} citations are not in the bibliography`,
		(el) => {
			el.createEl('p', {
				text: `These link to papers that ${bib} does not have, so they will export as their plain names instead of as citations:`,
			});
			const list = el.createEl('ul');
			for (const key of keys) list.createEl('li').createEl('code', { text: key });
			el.createEl('p', {
				text: 'Usually Better BibTeX changed the key, or its auto-export has not run since the paper was added.',
			});
		},
		'Export anyway',
	);
}

/** Say where the file went, with a way to open it. Pandoc's warnings come along. */
function exported(output: string, warnings: string): void {
	const fragment = createFragment((el) => {
		el.createDiv({ text: `Exported ${basename(output)}` });
		const actions = el.createDiv();
		actions.createEl('a', { text: 'Open', href: '#' }).addEventListener('click', () => void shell.openPath(output));
		actions.appendText(' · ');
		actions.createEl('a', { text: 'Show in folder', href: '#' }).addEventListener('click', () => shell.showItemInFolder(output));
		if (warnings) el.createEl('pre', { text: warnings });
	});
	new Notice(fragment, warnings ? 0 : 10000);
}
