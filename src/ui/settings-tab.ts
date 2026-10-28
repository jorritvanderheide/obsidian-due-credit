import { existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { FileSystemAdapter, PluginSettingTab, type App, type SettingDefinitionItem } from 'obsidian';
import { cslPath, expandHome, refused, settingPath, splitArgs } from 'obsidian-citation-core';
import { loadSettings, type Settings } from '../core/settings';
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
		return refusal ? ` ⚠ Due Credit can't pass ${refusal.arg} on to pandoc, because ${refusal.why}. Exports stop until you take it out.` : '';
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
						desc: "If you installed pandoc, this can usually stay pandoc. If Due Credit doesn't find it, give its full path. Without pandoc installed, Due Credit offers to download a copy that runs inside Obsidian, for Word, Markdown and LaTeX. A PDF needs pandoc installed, and xelatex, which comes with any TeX distribution.",
						control: { type: 'text', key: 'pandocPath', placeholder: 'pandoc' },
					},
					{
						name: 'Pandoc arguments',
						desc:
							'Added to every export, like --toc, --number-sections, -V geometry:margin=2.5cm or, with pandoc installed, --filter pandoc-crossref. A filter of yours runs after Due Credit’s own and before the citations are formatted. Put quotes around a value with spaces. ~ is your home folder, and a relative path starts from your vault. Due Credit can’t pass on an argument that changes where the file goes, how the note is read or the format, and if you add one, it says so here.' +
							this.argsStatus(),
						control: { type: 'text', key: 'extraArgs', placeholder: '--toc --number-sections' },
					},
					{
						name: 'Output folder',
						desc: 'Where the save dialog opens the first time you export. After that, it opens where your last export went, until you change this. ~ is your home folder. Exports are never saved inside your vault. Outside it, the dialog asks before an export replaces a file.',
						control: { type: 'text', key: 'outputFolder', placeholder: '~/Documents' },
					},
					{
						name: 'Word template',
						desc:
							'A Word file with the fonts, headings and margins your university or journal wants, for Word exports to use. It can be in your vault, or outside it with a path starting with / or ~. Leave it empty for pandoc’s default styles. To make one from those, run pandoc -o reference.docx --print-default-data-file reference.docx and change the styles in Word.' +
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
							'The .bib file that Better BibTeX’s auto-export keeps up to date. A link to one of its keys, like [[marsh2024]], exports as a citation, and any other link as its text. The file can be in your vault, or outside it with a path starting with / or ~. Leave it empty to export without citations.' +
							this.fileStatus(this.plugin.settings.bibliography, 'exports stop'),
						control: { type: 'text', key: 'bibliography', placeholder: 'Literature/library.bib' },
					},
					{
						name: 'Papers folder',
						desc: "The folder with your paper notes. Before an export, Due Credit lists every link to a paper note whose key isn't in your bibliography, because it would come out as plain text.",
						control: { type: 'folder', key: 'literatureFolder', placeholder: 'Literature' },
					},
					{
						name: 'Citation key property',
						desc: 'The property that holds a paper note’s citation key. A link to a note with one cites that key, whatever the note is called. When Better BibTeX changes a key, your links keep working once the property has the new one. Paper Trail writes citekey.',
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
