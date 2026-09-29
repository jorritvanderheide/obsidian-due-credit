// Export a note: read it, make it pandoc's markdown, and run pandoc.
import { existsSync } from 'fs';
import { homedir } from 'os';
import { basename, delimiter, dirname, join } from 'path';
import { remote, shell } from 'electron';
import { FileSystemAdapter, MarkdownView, Notice, parseYaml, stringifyYaml, type TFile } from 'obsidian';
import { bibKeys, keyOf, linkpathOf, missingKeys, propertyKey } from '../core/citations';
import { documentMetadata, FORMATS, pandocArgs, type Format } from '../core/document';
import { citeByKey, imageEmbeds, liftHeadings, splitFrontmatter, stripComments, wikilinkTargets } from '../core/markdown';
import { cslPath, expandHome, inFolder, within } from '../core/paths';
import { ExportError, run, withFilter } from '../pandoc';
import { confirm } from '../ui/confirm';
import type { Context } from '../context';

export async function exportNote(context: Context, file: TFile, format: Format): Promise<void> {
	const { app, settings } = context;
	const adapter = app.vault.adapter;
	if (!(adapter instanceof FileSystemAdapter)) throw new ExportError('Exporting needs the desktop app.');
	const vault = adapter.getBasePath();
	const home = homedir();
	const resolve = (linkpath: string) => app.metadataCache.getFirstLinkpathDest(linkpath, file.path);

	const bibliography = settings.bibliography ? app.vault.getFileByPath(settings.bibliography) : null;
	if (settings.bibliography && !bibliography) {
		throw new ExportError(
			`There is no bibliography at ${settings.bibliography}. Point the Exporter setting at your Better BibTeX export, or clear it to export without citations.`,
		);
	}
	const csl = settings.csl ? cslPath(expandHome(settings.csl, home), join(home, 'Zotero', 'styles')) : null;
	if (csl && !existsSync(csl)) {
		throw new ExportError(`There is no citation style at ${csl}. Use the name of a style Zotero has installed, such as apa, or the path to a .csl file.`);
	}

	// The editor rather than the file when the note is open, since the file
	// can be a couple of seconds behind what you just typed.
	const view = app.workspace.getActiveViewOfType(MarkdownView);
	const text = view?.file === file ? view.editor.getValue() : await app.vault.read(file);
	const { yaml, body } = splitFrontmatter(text);
	const prose = stripComments(body);

	// A note's own key first, whatever it is called; then, for a note in the
	// papers folder without one, its name.
	const propertyOf = (linkpath: string) => {
		const dest = resolve(linkpath);
		return dest ? propertyKey(app.metadataCache.getFileCache(dest)?.frontmatter, settings.keyProperty) : null;
	};
	if (bibliography) {
		const keys = bibKeys(await app.vault.cachedRead(bibliography));
		const keyFor = (target: string) => {
			const linkpath = linkpathOf(target).trim();
			const dest = resolve(linkpath);
			if (dest === null) return null;
			return propertyOf(linkpath) ?? (inFolder(dest.path, settings.literatureFolder) ? keyOf(target) : null);
		};
		const missing = missingKeys(wikilinkTargets(prose), keyFor, keys);
		if (missing.length > 0 && !(await confirmMissing(context, missing, bibliography.name))) return;
	}

	const { title, body: lifted } = liftHeadings(citeByKey(prose, propertyOf));
	const markdown = imageEmbeds(lifted, (linkpath) => {
		const dest = resolve(linkpath);
		// Forward slashes, which pandoc reads on every platform.
		return dest ? adapter.getFullPath(dest.path).replace(/\\/g, '/') : null;
	});
	const metadata = documentMetadata(yaml === null ? null : parseYaml(yaml), title, file.basename);
	const input = `---\n${stringifyYaml(metadata)}---\n\n${markdown}`;

	const { name, extension } = FORMATS[format];
	const answer = await remote.dialog.showSaveDialog({
		defaultPath: join(expandHome(settings.outputFolder, home), `${file.basename}.${extension}`),
		filters: [{ name, extensions: [extension] }],
		properties: ['showOverwriteConfirmation'],
	});
	if (answer.canceled || !answer.filePath) return;
	const output = answer.filePath;
	// The dialog asks before replacing a file, but not whether that file is a
	// note, and for a Markdown export saved next to its source it is the note.
	if (within(vault, output) && existsSync(output)) {
		throw new ExportError(`${output} is already a file in your vault, and an export never replaces one. Save it somewhere else.`);
	}

	const warnings = await withFilter((filter) =>
		run(
			settings.pandocPath,
			pandocArgs(format, {
				filter,
				bibliography: bibliography ? adapter.getFullPath(bibliography.path) : null,
				csl,
				resourcePath: [vault, dirname(adapter.getFullPath(file.path))].join(delimiter),
				output,
			}),
			input,
			vault,
		),
	);
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
