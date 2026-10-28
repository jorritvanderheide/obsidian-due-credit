// Export a note: read it, make it pandoc's markdown, and run pandoc.
import { existsSync, realpathSync } from 'fs';
import { readFile } from 'fs/promises';
import { homedir } from 'os';
import path, { basename, dirname, isAbsolute, join } from 'path';
import { remote, shell } from 'electron';
import { FileSystemAdapter, MarkdownView, Notice, parseYaml, requestUrl, type App, type TFile } from 'obsidian';
import {
	bibKeys,
	BUILT_IN,
	builtInFolder,
	choosePandoc,
	cslPath,
	expandHome,
	ExportError,
	findOnPath,
	FORMATS,
	inputFiles,
	insideVault,
	lineBreaks,
	noteStyle,
	pandocArgs,
	pandocFor,
	prepare,
	refused,
	seen,
	seenArgs,
	settingPath,
	splitArgs,
	styled,
	withExtension,
	withFiles,
	type Format,
	type Missing,
	type Pandoc,
	type Vault,
} from 'obsidian-citation-core';
import { startFolder } from '../core/settings';
import { confirm } from '../ui/confirm';
import type { Context } from '../context';

/** Where pandoc's path is set, for the core's message when pandoc isn't there. */
const SETTINGS = 'the Due Credit settings';

export async function exportNote(context: Context, file: TFile, format: Format): Promise<void> {
	const { app, settings } = context;
	const adapter = app.vault.adapter;
	if (!(adapter instanceof FileSystemAdapter)) throw new ExportError('Exporting needs the desktop app.');
	const vault = adapter.getBasePath();
	const home = homedir();

	const bibliography = settings.bibliography ? settingPath(settings.bibliography, vault, home) : null;
	if (bibliography && !existsSync(bibliography)) {
		throw new ExportError(
			`There's no bibliography at ${bibliography}. Point the Bibliography setting at your Better BibTeX export, or clear it to export without citations.`,
		);
	}
	const referenceDoc = settings.referenceDoc && format === 'docx' ? settingPath(settings.referenceDoc, vault, home) : null;
	if (referenceDoc && !existsSync(referenceDoc)) {
		throw new ExportError(`There's no Word template at ${referenceDoc}. Point the Word template setting at a .docx file, or clear it to use pandoc's own styles.`);
	}
	const csl = settings.csl && styled(format) ? cslPath(expandHome(settings.csl, home), join(home, 'Zotero', 'styles')) : null;
	if (csl && !existsSync(csl)) {
		throw new ExportError(`There's no citation style at ${csl}. Use the name of a style Zotero has installed, such as apa, or the path to a .csl file.`);
	}

	// Arguments of your own, except what Due Credit decides, and no file of
	// yours that pandoc would read in place of the note.
	const extra = splitArgs(settings.extraArgs, home);
	const refusal = refused(extra);
	if (refusal) throw new ExportError(`Your Pandoc arguments include ${refusal.arg}, which Due Credit doesn't pass on: ${refusal.why}.`);
	// The built-in pandoc runs no PDF engine: said before it is downloaded for nothing.
	if (format === 'pdf' && choosePandoc(settings.pandocPath, (name) => findOnPath(name, process.env, path, existsSync)).kind === 'built-in') {
		throw new ExportError("A PDF needs pandoc and xelatex installed, and Due Credit can't find pandoc. Install both, or set pandoc's full path in the Due Credit settings. Word, Markdown and LaTeX work without them.");
	}
	const pandoc = await pandocToRun(app, settings.pandocPath, vault);
	if (pandoc === null) return;
	// Your arguments' paths as pandoc sees them: a file outside the vault is
	// given to the built-in pandoc under a name of its own.
	const args = seenArgs(extra, (host) => pandoc.see(host), (value) => isAbsolute(value) && existsSync(value));
	const inputs = args.length > 0 ? inputFiles(await pandoc.dumpArgs(args)) : [];
	if (inputs.length > 0) {
		throw new ExportError(`Your Pandoc arguments include ${inputs.join(', ')}, which pandoc would export instead of the note. Make it an option's value, or leave it out.`);
	}

	// The editor rather than the file when the note is open, since the file
	// can be a couple of seconds behind what you just typed.
	const view = app.workspace.getActiveViewOfType(MarkdownView);
	const text = view?.file === file ? view.editor.getValue() : await app.vault.read(file);
	const lookup: Vault = {
		resolve: (linkpath) => {
			const dest = app.metadataCache.getFirstLinkpathDest(linkpath, file.path);
			if (!dest) return null;
			return { path: dest.path, file: pandoc.see(adapter.getFullPath(dest.path)), frontmatter: app.metadataCache.getFileCache(dest)?.frontmatter };
		},
		// Not exported without them: the author and date would go missing without a word.
		parseYaml: (yaml) => {
			try {
				return parseYaml(yaml) as unknown;
			} catch {
				throw new ExportError(`The properties of ${file.basename} aren't valid YAML, so it can't be exported. Fix them in source mode, where Obsidian shows what's wrong.`);
			}
		},
	};
	const { markdown, metadata, missing } = prepare(text, lookup, {
		name: file.basename,
		papersFolder: settings.literatureFolder,
		keyProperty: settings.keyProperty,
		keys: bibliography ? bibKeys(await readFile(bibliography, 'utf8')) : null,
		noteStyle: csl !== null && noteStyle(await readFile(csl, 'utf8')),
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
		throw new ExportError(`${output} is inside your vault, and Due Credit never writes there. Save it somewhere else.`);
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
			pandoc.run(
				pandocArgs(
					format,
					seen(
						{
							...files,
							bibliography,
							csl,
							resourcePath: [vault, dirname(adapter.getFullPath(file.path))].map((dir) => pandoc.see(dir)).join(pandoc.delimiter),
							hardLineBreaks: lineBreaks(appConfig),
							referenceDoc,
							extra: args,
							output,
						},
						(host) => pandoc.see(host),
					),
				),
				markdown,
			),
		);
	} finally {
		progress.hide();
	}

	settings.lastFolder = dirname(output);
	await context.saveSettings();
	exported(output, warnings);
}

/**
 * The pandoc the **Pandoc** setting asks for. Without an installed one, the
 * built-in one, which is asked about and downloaded the first time; null when
 * that's declined.
 */
async function pandocToRun(app: App, setting: string, vault: string): Promise<Pandoc | null> {
	let downloading: Notice | null = null;
	try {
		return await pandocFor(
			setting,
			vault,
			SETTINGS,
			async () => {
				const yes = await confirm(
					app,
					'Download pandoc?',
					(el) => {
						el.createEl('p', { text: "Exporting turns a note into a document with pandoc, and Due Credit can't find one installed." });
						el.createEl('p', {
							text: `Due Credit can download pandoc ${BUILT_IN.version} from pandoc's own release on GitHub (${BUILT_IN.megabytes} MB), once. It's kept in ${builtInFolder()}, outside your vault, and runs inside Obsidian, for Word, Markdown and LaTeX. Or install pandoc, or set its full path in the Due Credit settings, and export again.`,
						});
					},
					'Download',
				);
				if (yes) downloading = new Notice(`Downloading pandoc ${BUILT_IN.version}…`, 0);
				return yes;
			},
			async (url) => (await requestUrl({ url })).arrayBuffer,
		);
	} catch (error) {
		if (error instanceof ExportError) throw error;
		throw new ExportError(`Couldn't download pandoc: ${error instanceof Error ? error.message : String(error)}. Try again, or install pandoc.`);
	} finally {
		(downloading as Notice | null)?.hide();
	}
}

function confirmReplace(context: Context, output: string): Promise<boolean> {
	return confirm(
		context.app,
		`Replace ${basename(output)}?`,
		(el) => el.createEl('p', { text: `There's already a file with that name in ${dirname(output)}, and the export would replace it.` }),
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
		count === 1 ? "A link isn't in the bibliography" : `${count} links aren't in the bibliography`,
		(el) => {
			if (missing.papers.length > 0) {
				el.createEl('p', {
					text: `These link to papers that ${bib} doesn't have, so they'll export as plain names instead of citations:`,
				});
				list(el, missing.papers);
				el.createEl('p', {
					text: "Usually Better BibTeX changed the key, or its auto-export hasn't run since you added the paper.",
				});
			}
			if (missing.unresolved.length > 0) {
				el.createEl('p', {
					text: `These don't link to a note, and ${bib} has no key with their name either, so they'll export as plain text:`,
				});
				list(el, missing.unresolved);
				el.createEl('p', {
					text: "A paper you cited before it had a note ends up here if its key isn't in the bibliography yet. So does a note you haven't written yet, which is fine.",
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
