// Pick a work from the bibliography, to cite it. Enter cites it, and Tab
// asks for a page first: picking the work is the same move either way, and a
// page is one key more.
import { FuzzySuggestModal, type App, type FuzzyMatch } from 'obsidian';
import { byline, type Entry } from 'obsidian-citation-core';

/** What was picked, and whether Tab asked to add a page to it. */
export interface Picked {
	entry: Entry;
	withPage: boolean;
}

class CitationPicker extends FuzzySuggestModal<Entry> {
	private result: Entry | null = null;
	private withPage = false;
	/** How many works the last search showed, so Tab with none picks nothing. */
	private shown = 0;

	constructor(
		app: App,
		private readonly entries: Entry[],
		private readonly done: (picked: Picked | null) => void,
	) {
		super(app);
		this.setPlaceholder('Search your bibliography by author, year, title or key');
		this.emptyStateText = 'Nothing in your bibliography matches.';
		this.scope.register([], 'Tab', (event) => {
			if (this.shown === 0) return false;
			this.withPage = true;
			this.selectActiveSuggestion(event);
			return false;
		});
		this.setInstructions([
			{ command: '↵', purpose: 'cite' },
			{ command: 'tab', purpose: 'cite with a page' },
		]);
	}

	getItems(): Entry[] {
		return this.entries;
	}

	getItemText(entry: Entry): string {
		return `${byline(entry)} ${entry.title} ${entry.key}`;
	}

	getSuggestions(query: string): FuzzyMatch<Entry>[] {
		const found = super.getSuggestions(query);
		this.shown = found.length;
		return found;
	}

	/** The title, and under it who, when, and the key, which is what the link will say. */
	renderSuggestion(match: FuzzyMatch<Entry>, el: HTMLElement): void {
		const entry = match.item;
		el.createDiv({ text: entry.title || entry.key });
		el.createEl('small', { text: [byline(entry), entry.key].filter(Boolean).join(' · ') });
	}

	// Records only: SuggestModal doesn't promise this runs before close().
	onChooseItem(entry: Entry): void {
		this.result = entry;
	}

	onClose(): void {
		window.setTimeout(() => this.done(this.result ? { entry: this.result, withPage: this.withPage } : null), 0);
	}
}

/** The work picked, or null when the picker was dismissed. */
export function pickWork(app: App, entries: Entry[]): Promise<Picked | null> {
	return new Promise((resolve) => new CitationPicker(app, entries, resolve).open());
}
