// Export a note: read it, make it pandoc's markdown, and run pandoc.
import { existsSync, realpathSync } from 'fs';
import { readFile } from 'fs/promises';
import { homedir } from 'os';
import path, { basename, dirname, isAbsolute, join } from 'path';
import { remote, shell } from 'electron';
import { FileSystemAdapter, MarkdownView, Notice, parseYaml, requestUrl, type App, type TFile } from 'obsidian';
import {
	bibKeys,
	bibliographiesIn,
	BUILT_IN,
	builtInFolder,
	choosePandoc,
	missingBibliography,
	missingStyle,
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
	stylePath,
	withExtension,
	withFiles,
	type Format,
	type Missing,
	type Pandoc,
	type Vault,
} from 'obsidian-citation-core';
import { keysReadable } from '../core/bibliographies';
import { startFolder } from '../core/settings';
import { confirm } from '../ui/confirm';
import type { Context } from '../context';

/** Where pandoc's path is set, for the core's message when pandoc isn't there. */
const SETTINGS = 'Settings → Due Credit';

export async function exportNote(context: Context, file: TFile, format: Format): Promise<void> {
	const { app, settings } = context;
	const adapter = app.vault.adapter;
	if (!(adapter instanceof FileSystemAdapter)) throw new ExportError('Exporting needs the desktop app.');
	const vault = adapter.getBasePath();
	const home = homedir();

	const bibliography = settings.bibliography ? settingPath(settings.bibliography, vault, home) : null;
	if (bibliography && !existsSync(bibliography)) throw new ExportError(missingBibliography(bibliography, 'export'));
	const referenceDoc = settings.referenceDoc && format === 'docx' ? settingPath(settings.referenceDoc, vault, home) : null;
	if (referenceDoc && !existsSync(referenceDoc)) {
		throw new ExportError(`There's no Word template at ${referenceDoc}. Point the Word template setting at a .docx file, or clear it to use pandoc's own styles.`);
	}
	const csl = settings.csl && styled(format) ? stylePath(settings.csl, home) : null;
	if (csl && !existsSync(csl)) throw new ExportError(missingStyle(csl));

	// Arguments of your own, except what Due Credit decides, and no file of
	// yours that pandoc would read in place of the note.
	const extra = splitArgs(settings.extraArgs, home);
	const refusal = refused(extra);
	if (refusal) {
		throw new ExportError(
			`Your Pandoc arguments include ${refusal.arg}, which Due Credit can't pass on to pandoc, because ${refusal.why}. Take it out of Pandoc arguments in Settings → Due Credit.`,
		);
	}
	// The built-in pandoc runs no PDF engine: said before it is downloaded for nothing.
	if (format === 'pdf' && choosePandoc(settings.pandocPath, (name) => findOnPath(name, process.env, path, existsSync)).kind === 'built-in') {
		throw new ExportError("A PDF needs pandoc and xelatex installed, and Due Credit can't find pandoc. Install both, or set pandoc's full path in Settings → Due Credit. Word, Markdown and LaTeX work without them.");
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
				throw new ExportError(`The properties of ${file.basename} have a mistake in them, so Due Credit can't export it. Open the note in source mode, where Obsidian shows what's wrong.`);
			}
		},
	};
	// Every bibliography pandoc reads, the setting's and any in your arguments, so
	// the check knows every key the export can cite.
	const bibliographies = [...(bibliography ? [bibliography] : []), ...bibliographiesIn(extra).map((value) => settingPath(value, vault, home))].filter((path) => existsSync(path));
	const keys = keysReadable(bibliographies) ? new Set((await Promise.all(bibliographies.map((path) => readFile(path, 'utf8')))).flatMap((bib) => [...bibKeys(bib)])) : null;
	const { markdown, metadata, missing } = prepare(text, lookup, {
		name: file.basename,
		papersFolder: settings.literatureFolder,
		keyProperty: settings.keyProperty,
		keys,
		noteStyle: csl !== null && noteStyle(await readFile(csl, 'utf8')),
	});
	const lost = missing.papers.length + missing.unresolved.length;
	if (keys !== null && lost > 0 && !(await confirmMissing(context, missing, lost, bibliographies.map((path) => basename(path)).join(' or ')))) return;

	const { name, extension } = FORMATS[format];
	const answer = await remote.dialog.showSaveDialog({
		defaultPath: join(expandHome(startFolder(settings, existsSync), home), `${file.basename}.${extension}`),
		filters: [{ name, extensions: [extension] }],
		properties: ['showOverwriteConfirmation'],
	});
	if (answer.canceled || !answer.filePath) return;
	const output = withExtension(answer.filePath, extension);
	// Nothing is written in the vault: a Markdown export saved next to its
	// source would be the note, and the dialog only asks whether to replace a
	// file. Before asking about replacing one, which would be a question with
	// no right answer.
	if (insideVault(vault, output, realpathSync)) {
		throw new ExportError(`${output} is inside your vault. Due Credit doesn't save exports there, so an export can never replace a note. Please save it somewhere outside the vault.`);
	}
	// The dialog asked about replacing the name as typed, not this one.
	if (output !== answer.filePath && existsSync(output) && !(await confirmReplace(context, output))) return;

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
						el.createEl('p', { text: "Due Credit uses pandoc to turn a note into a document, and it can't find pandoc on this computer." });
						el.createEl('p', {
							text: `It can download pandoc ${BUILT_IN.version} for you, from pandoc's release on GitHub. It's a ${BUILT_IN.megabytes} MB download, kept in ${builtInFolder()}, outside your vault. This copy runs inside Obsidian, and makes Word, Markdown and LaTeX files.`,
						});
						el.createEl('p', {
							text: "You can also cancel and install pandoc yourself. If it's installed already, set its full path in the Due Credit settings, and export again.",
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
	const one = (keys: string[]) => keys.length === 1;
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
					text: one(missing.papers)
						? `This links to a paper that ${bib} doesn't have, so it'll export as plain text instead of a citation:`
						: `These link to papers that ${bib} doesn't have, so they'll export as plain text instead of citations:`,
				});
				list(el, missing.papers);
				el.createEl('p', {
					text: `Usually Better BibTeX changed the key, or its auto-export hasn't run since you added the paper. A paper note without a ${context.settings.keyProperty} property is looked up by its name, so it only cites when it's named for its key.`,
				});
			}
			if (missing.unresolved.length > 0) {
				el.createEl('p', {
					text: one(missing.unresolved)
						? `This doesn't link to a note, and ${bib} has no key by its name either. It'll export as plain text:`
						: `These don't link to a note, and ${bib} has no keys by their names either. They'll export as plain text:`,
				});
				list(el, missing.unresolved);
				el.createEl('p', {
					text: "A link to a note you haven't written yet ends up here, and that's fine. So does a paper you cited by its key before Better BibTeX's auto-export added it.",
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
