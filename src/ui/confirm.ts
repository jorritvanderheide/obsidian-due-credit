// A question with two answers. Dismissing it is the cautious one.
import { Modal, Setting, type App } from 'obsidian';

class Confirm extends Modal {
	private answered = false;

	constructor(
		app: App,
		private readonly title: string,
		private readonly body: (el: HTMLElement) => void,
		private readonly cta: string,
		private readonly done: (yes: boolean) => void,
	) {
		super(app);
	}

	onOpen(): void {
		this.setTitle(this.title);
		this.body(this.contentEl);
		new Setting(this.contentEl)
			.addButton((button) => button.setButtonText('Cancel').onClick(() => this.close()))
			.addButton((button) =>
				button
					.setButtonText(this.cta)
					.setCta()
					.onClick(() => {
						this.answered = true;
						this.done(true);
						this.close();
					}),
			);
	}

	onClose(): void {
		if (!this.answered) this.done(false);
	}
}

export function confirm(app: App, title: string, body: (el: HTMLElement) => void, cta: string): Promise<boolean> {
	return new Promise((resolve) => new Confirm(app, title, body, cta, resolve).open());
}
