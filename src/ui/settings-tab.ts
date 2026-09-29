import { existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { PluginSettingTab, type App, type SettingDefinitionItem } from 'obsidian';
import { loadSettings, type Settings } from '../core/settings';
import { cslPath, expandHome } from '../core/paths';
import type Exporter from '../main';

export class SettingsTab extends PluginSettingTab {
	constructor(
		app: App,
		private readonly plugin: Exporter,
	) {
		super(app, plugin);
	}

	getControlValue(key: string): unknown {
		return this.plugin.settings[key as keyof Settings];
	}

	/** Write a value back through the loader, so what is stored is what it would read. */
	async setControlValue(key: string, value: unknown): Promise<void> {
		this.plugin.settings = loadSettings({ ...this.plugin.settings, [key]: value });
		await this.plugin.saveSettings();
		this.update();
	}

	/** A setting that must agree with something outside the plugin says when it does not. */
	private bibliographyStatus(): string {
		const path = this.plugin.settings.bibliography;
		if (path === '' || this.app.vault.getFileByPath(path)) return '';
		return ' ⚠ There is no file at this path, so exports stop until it is fixed or cleared.';
	}

	private cslStatus(): string {
		const value = this.plugin.settings.csl;
		if (value === '') return '';
		const home = homedir();
		const path = cslPath(expandHome(value, home), join(home, 'Zotero', 'styles'));
		return existsSync(path) ? '' : ` ⚠ There is no style at ${path}.`;
	}

	getSettingDefinitions(): SettingDefinitionItem[] {
		return [
			{
				type: 'group',
				heading: 'Pandoc',
				items: [
					{
						name: 'Pandoc',
						desc: 'The pandoc program: its name if it is on your PATH, or its full path. PDF export also needs xelatex, which comes with any TeX distribution.',
						control: { type: 'text', key: 'pandocPath', placeholder: 'pandoc' },
					},
					{
						name: 'Output folder',
						desc: 'Where exports are written; ~ is your home folder. An export replaces the last export of the same note, but never a file inside the vault.',
						control: { type: 'text', key: 'outputFolder', placeholder: '~/Documents' },
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
							'The .bib file Better BibTeX keeps current. A wikilink whose name is one of its keys exports as a citation, and every other wikilink as its words. Empty exports without citations.' +
							this.bibliographyStatus(),
						control: { type: 'file', key: 'bibliography', placeholder: 'Literature/library.bib', filter: (file) => file.extension === 'bib' },
					},
					{
						name: 'Papers folder',
						desc: 'Where your paper notes are. Before exporting, a link to a paper the bibliography does not have is listed, so a changed key does not quietly turn a citation into a name.',
						control: { type: 'folder', key: 'literatureFolder', placeholder: 'Literature' },
					},
					{
						name: 'Citation style',
						desc:
							'The name of a style Zotero has installed, such as apa or ieee, or the path to a .csl file. Empty uses Chicago author-date. LaTeX exports leave styling to the journal’s class.' +
							this.cslStatus(),
						control: { type: 'text', key: 'csl', placeholder: 'Chicago author-date' },
					},
				],
			},
		];
	}
}
