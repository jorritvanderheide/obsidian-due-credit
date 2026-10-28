import { Notice, Plugin, TFile } from 'obsidian';
import { ExportError, FORMATS, type Format } from 'obsidian-citation-core';
import { addPage, insertCitation } from './commands/cite';
import { exportNote } from './commands/export';
import { loadSettings, type Settings } from './core/settings';
import { SettingsTab } from './ui/settings-tab';

export default class DueCredit extends Plugin {
	settings!: Settings;

	async onload() {
		this.settings = loadSettings(await this.loadData());
		this.addSettingTab(new SettingsTab(this.app, this));

		for (const format of Object.keys(FORMATS) as Format[]) {
			this.addCommand({
				id: `export-${format}`,
				name: `Export to ${FORMATS[format].name}`,
				checkCallback: (checking) => {
					const file = this.app.workspace.getActiveFile();
					if (file?.extension !== 'md') return false;
					if (!checking) this.export(file, format);
					return true;
				},
			});
		}

		// Only where there's a note to write in.
		this.addCommand({ id: 'insert-citation', name: 'Insert citation', editorCallback: () => this.attempt(insertCitation(this)) });
		this.addCommand({ id: 'add-page', name: 'Add page to citation', editorCallback: () => this.attempt(addPage(this)) });

		this.registerEvent(
			this.app.workspace.on('file-menu', (menu, file) => {
				if (!(file instanceof TFile) || file.extension !== 'md') return;
				for (const format of Object.keys(FORMATS) as Format[]) {
					menu.addItem((item) =>
						item
							.setTitle(`Export to ${FORMATS[format].name}`)
							.setIcon('file-output')
							.setSection('action')
							.onClick(() => this.export(file, format)),
					);
				}
			}),
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private export(file: TFile, format: Format) {
		this.attempt(exportNote(this, file, format));
	}

	/** Every failure becomes a notice. A rejection left unhandled is swallowed, and a command that failed looks like one that never started. */
	private attempt(done: Promise<void>) {
		done.catch((error: unknown) => {
			if (!(error instanceof ExportError)) console.error(error);
			new Notice(error instanceof Error ? error.message : String(error), 0);
		});
	}
}
