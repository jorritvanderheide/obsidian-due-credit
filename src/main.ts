import { Notice, Plugin, TFile } from 'obsidian';
import { exportNote } from './commands/export';
import { FORMATS, type Format } from './core/document';
import { loadSettings, type Settings } from './core/settings';
import { ExportError } from './pandoc';
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
		// Every failure becomes a notice. A rejection left unhandled here is
		// swallowed, and an export that failed looks like one that never started.
		exportNote(this, file, format).catch((error: unknown) => {
			if (!(error instanceof ExportError)) console.error(error);
			new Notice(error instanceof Error ? error.message : String(error), 0);
		});
	}
}
