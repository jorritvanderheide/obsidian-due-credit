// Export a note: read it, make it pandoc's markdown, and run pandoc.
import { existsSync, realpathSync } from 'fs';
import { readFile } from 'fs/promises';
import { homedir } from 'os';
import { basename, delimiter, dirname, join } from 'path';
import { remote, shell } from 'electron';
import { FileSystemAdapter, MarkdownView, Notice, parseYaml, type TFile } from 'obsidian';
import { bibKeys } from '../core/citations';
import { FORMATS, lineBreaks, pandocArgs, styled, type Format } from '../core/document';
import { settingPath, cslPath, expandHome, insideVault, withExtension } from '../core/paths';
import { prepare, type Missing, type Vault } from '../core/prepare';
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

	const bibliography = settings.bibliography ? settingPath(settings.bibliography, vault, home) : null;
	if (bibliography && !existsSync(bibliography)) {
		throw new ExportError(
			`There is no bibliography at ${bibliography}. Point the Due Credit setting at your Better BibTeX export, or clear it to export without citations.`,
		);
	}
	const referenceDoc = settings.referenceDoc && format === 'docx' ? settingPath(settings.referenceDoc, vault, home) : null;
	if (referenceDoc && !existsSync(referenceDoc)) {
		throw new ExportError(`There is no Word template at ${referenceDoc}. Point the Due Credit setting at a .docx, or clear it to use pandoc's own styles.`);
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
		// Not exported without them: the author and date would go missing without a word.
		parseYaml: (yaml) => {
			try {
				return parseYaml(yaml) as unknown;
			} catch {
				throw new ExportError(`The properties of ${file.basename} are not valid YAML, so it cannot be exported. Fix them in source mode, where Obsidian shows what is wrong.`);
			}
		},
	};
	const { markdown, metadata, missing } = prepare(text, lookup, {
		name: file.basename,
		papersFolder: settings.literatureFolder,
		keyProperty: settings.keyProperty,
		keys: bibliography ? bibKeys(await readFile(bibliography, 'utf8')) : null,
	});
	const lost = missing.papers.length + missing.unresolved.length;
	if (bibliography && lost > 0 && !(await confirmMissing(context, missing, lost, basename(bibliography)))) return;

	const { name, extension } = FORMATS[format];
	const answer = await remote.dialog.showSaveDialog({
		defaultPath: join(expandHome(startFolder(settings, existsSync), home), `${file.basename}.${extension}`),
		filters: [{ name, extensions: [extension] }],
		properties: ['showOverwriteConfirmation'],
	});
	if (answer.canceled || !answer.filePath) return;
	const output = withExtension(answer.filePath, extension);
	// The dialog asked about replacing the name as typed, not this one.
	if (output !== answer.filePath && existsSync(output) && !(await confirmReplace(context, output))) return;
	// Nothing is written in the vault: a Markdown export saved next to its
	// source would be the note, and the dialog only asks whether to replace a
	// file.
	if (insideVault(vault, output, realpathSync)) {
		throw new ExportError(`${output} is inside your vault, and an export writes nothing there. Save it somewhere else.`);
	}

	let appConfig: unknown = null;
	try {
		appConfig = JSON.parse(await adapter.read(`${app.vault.configDir}/app.json`));
	} catch {
		// No app.json, or one that does not parse: Obsidian's defaults.
	}

	// A PDF takes seconds, and without this the command looks like it did nothing.
	const progress = new Notice(`Exporting ${basename(output)}…`, 0);
	let warnings: string;
	try {
		warnings = await withFiles(metadata, (files) =>
			run(
				settings.pandocPath,
				pandocArgs(format, {
					...files,
					bibliography,
					csl,
					resourcePath: [vault, dirname(adapter.getFullPath(file.path))].join(delimiter),
					hardLineBreaks: lineBreaks(appConfig),
					referenceDoc,
					output,
				}),
				markdown,
				vault,
			),
		);
	} finally {
		progress.hide();
	}

	settings.lastFolder = dirname(output);
	await context.saveSettings();
	exported(output, warnings);
}

function confirmReplace(context: Context, output: string): Promise<boolean> {
	return confirm(
		context.app,
		`Replace ${basename(output)}?`,
		(el) => el.createEl('p', { text: `${dirname(output)} already has a file by that name, and the export would replace it.` }),
		'Replace',
	);
}

function confirmMissing(context: Context, missing: Missing, count: number, bib: string): Promise<boolean> {
	const list = (el: HTMLElement, keys: string[]) => {
		const ul = el.createEl('ul');
		for (const key of keys) ul.createEl('li').createEl('code', { text: key });
	};
	return confirm(
		context.app,
		count === 1 ? 'A link is not in the bibliography' : `${count} links are not in the bibliography`,
		(el) => {
			if (missing.papers.length > 0) {
				el.createEl('p', {
					text: `These link to papers that ${bib} does not have, so they will export as their plain names instead of as citations:`,
				});
				list(el, missing.papers);
				el.createEl('p', {
					text: 'Usually Better BibTeX changed the key, or its auto-export has not run since the paper was added.',
				});
			}
			if (missing.unresolved.length > 0) {
				el.createEl('p', {
					text: `These link to no note, and ${bib} has no key by their name either, so they will export as their words:`,
				});
				list(el, missing.unresolved);
				el.createEl('p', {
					text: 'A paper cited before it has a note lands here when its key is not in the bibliography yet. So does a note you have not written yet, which is fine.',
				});
			}
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
