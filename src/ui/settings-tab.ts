import { existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { FileSystemAdapter, PluginSettingTab, type App, type SettingDefinitionItem } from 'obsidian';
import { refused, splitArgs } from '../core/document';
import { loadSettings, type Settings } from '../core/settings';
import { settingPath, cslPath, expandHome } from '../core/paths';
import type DueCredit from '../main';

export class SettingsTab extends PluginSettingTab {
	constructor(
		app: App,
		private readonly plugin: DueCredit,
	) {
		super(app, plugin);
	}

	getControlValue(key: string): unknown {
		return this.plugin.settings[key as keyof Settings];
	}

	/** Write a value back through the loader, so what is stored is what it would read. */
	async setControlValue(key: string, value: unknown): Promise<void> {
		// Choosing an output folder is choosing where the dialog opens next, which
		// the remembered folder would otherwise overrule without a word.
		const forget = key === 'outputFolder' ? { lastFolder: '' } : {};
		this.plugin.settings = loadSettings({ ...this.plugin.settings, ...forget, [key]: value });
		await this.plugin.saveSettings();
		this.update();
	}

	/** A setting that must agree with something outside the plugin says when it does not. */
	private fileStatus(value: string, stops: string): string {
		const adapter = this.app.vault.adapter;
		if (value === '' || !(adapter instanceof FileSystemAdapter)) return '';
		const path = settingPath(value, adapter.getBasePath(), homedir());
		return existsSync(path) ? '' : ` ⚠ There's no file at ${path}, so ${stops} until you fix or clear this.`;
	}

	private argsStatus(): string {
		const refusal = refused(splitArgs(this.plugin.settings.extraArgs, homedir()));
		return refusal ? ` ⚠ ${refusal.arg} isn't passed on, so exports stop until you remove it: ${refusal.why}.` : '';
	}

	private cslStatus(): string {
		const value = this.plugin.settings.csl;
		if (value === '') return '';
		const home = homedir();
		const path = cslPath(expandHome(value, home), join(home, 'Zotero', 'styles'));
		return existsSync(path) ? '' : ` ⚠ There's no style at ${path}.`;
	}

	getSettingDefinitions(): SettingDefinitionItem[] {
		return [
			{
				type: 'group',
				heading: 'Pandoc',
				items: [
					{
						name: 'Pandoc',
						desc: "The pandoc program: its name if it's on your PATH, or its full path. Exporting to PDF also needs xelatex, which comes with any TeX distribution.",
						control: { type: 'text', key: 'pandocPath', placeholder: 'pandoc' },
					},
					{
						name: 'Pandoc arguments',
						desc:
							'Added to every export, such as --toc, --number-sections, -V geometry:margin=2.5cm or --filter pandoc-crossref. A filter of yours runs after Due Credit’s and before citations are rendered. Quotes keep a value with spaces together, ~ is your home folder, and a relative path starts from the vault. Arguments that change where the file goes, what’s read or the format are refused, because those are up to Due Credit.' +
							this.argsStatus(),
						control: { type: 'text', key: 'extraArgs', placeholder: '--toc --number-sections' },
					},
					{
						name: 'Output folder',
						desc: 'Where the save dialog opens until your first export. After that, it opens where your last export went, until you change this. ~ is your home folder. An export can replace a file you pick, but is never saved inside the vault.',
						control: { type: 'text', key: 'outputFolder', placeholder: '~/Documents' },
					},
					{
						name: 'Word template',
						desc:
							'A .docx whose styles a Word export uses: fonts, headings and margins, as your university or journal wants them. A path in the vault, or outside it starting with / or ~. Leave it empty for pandoc’s own styles. To start from those, run: pandoc -o reference.docx --print-default-data-file reference.docx' +
							this.fileStatus(this.plugin.settings.referenceDoc, 'Word exports stop'),
						control: { type: 'text', key: 'referenceDoc', placeholder: 'Pandoc’s own' },
					},
				],
			},
			{
				type: 'group',
				heading: 'Citations',
				items: [
					{
						name: 'Bibliography',
						desc:
							'The .bib file Better BibTeX keeps up to date: a path in the vault, or outside it starting with / or ~. A link whose name is one of its keys exports as a citation, and every other link as its text. Leave it empty to export without citations.' +
							this.fileStatus(this.plugin.settings.bibliography, 'exports stop'),
						control: { type: 'text', key: 'bibliography', placeholder: 'Literature/library.bib' },
					},
					{
						name: 'Papers folder',
						desc: "Where your paper notes are. Before an export, links to papers that aren't in the bibliography are listed, so a changed key can't quietly turn a citation into plain text.",
						control: { type: 'folder', key: 'literatureFolder', placeholder: 'Literature' },
					},
					{
						name: 'Citation key property',
						desc: 'The property that holds a paper note’s citation key. A link to a note with one cites that key, whatever the note is called, and keeps working when Better BibTeX changes the key. Paper Trail writes citekey.',
						control: { type: 'text', key: 'keyProperty', placeholder: 'citekey' },
					},
					{
						name: 'Citation style',
						desc:
							'The name of a style Zotero has installed, such as apa or ieee, or the path to a .csl file. Leave it empty for Chicago author-date. LaTeX exports leave the styling to the journal’s class.' +
							this.cslStatus(),
						control: { type: 'text', key: 'csl', placeholder: 'Chicago author-date' },
					},
				],
			},
		];
	}
}
