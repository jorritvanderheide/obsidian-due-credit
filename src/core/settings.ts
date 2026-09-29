// Settings are addresses, not opinions: where pandoc is, where exports go,
// which bibliography and which style. How a note becomes a document is the
// product and stays in code.

/**
 * Stamped on every save, and bumped when a saved key is renamed or its meaning
 * changes. Here from the start because it is the one thing that cannot be added
 * afterwards: by then the data is already on disk unlabelled.
 */
export const SETTINGS_VERSION = 1;

export interface Settings {
	version: number;
	/** The pandoc executable: a name found on the PATH, or a full path. */
	pandocPath: string;
	/**
	 * Where the save dialog opens until you have exported something, outside the
	 * vault by default. `~` is your home folder.
	 */
	outputFolder: string;
	/**
	 * The folder the last export was saved in, empty until there is one.
	 * Remembered rather than set: the tab does not show it.
	 */
	lastFolder: string;
	/**
	 * The `.bib` file that decides which wikilinks are citations, kept current
	 * by Better BibTeX's auto-export: a path relative to the vault, or an
	 * absolute one or one starting with `~` outside it. Empty exports without
	 * citations: every wikilink becomes its words.
	 */
	bibliography: string;
	/**
	 * The folder in the vault that holds one note per paper. A link into it
	 * whose key the bibliography lacks is a citation about to be lost, and the
	 * export says so before it runs.
	 */
	literatureFolder: string;
	/**
	 * The frontmatter property holding a paper note's citation key. A link to a
	 * note with one cites that key, whatever the note is called. Paper Trail
	 * writes `citekey`.
	 */
	keyProperty: string;
	/**
	 * Citation style: the name of one Zotero has installed (`apa`), or a path to
	 * a `.csl` file. Empty is pandoc's built-in Chicago author-date.
	 */
	csl: string;
}

export const DEFAULT_SETTINGS: Settings = {
	version: SETTINGS_VERSION,
	pandocPath: 'pandoc',
	outputFolder: '~/Documents',
	lastFolder: '',
	bibliography: 'Literature/library.bib',
	literatureFolder: 'Literature',
	keyProperty: 'citekey',
	csl: '',
};

function text(value: unknown): string | undefined {
	return typeof value === 'string' ? value.trim() : undefined;
}

/**
 * Settings from whatever was saved, built fresh from the names known here so a
 * key nothing reads any more is dropped.
 *
 * Trimmed, because a stray space in a path is a silent miss. A blanked address
 * falls back to its default rather than pointing at nothing, except where
 * empty is an answer: no bibliography, the built-in style, and no export yet.
 */
export function loadSettings(data: unknown): Settings {
	const saved = (data ?? {}) as Record<string, unknown>;
	const address = (key: 'pandocPath' | 'outputFolder' | 'literatureFolder' | 'keyProperty') => text(saved[key]) || DEFAULT_SETTINGS[key];
	const optional = (key: 'lastFolder' | 'bibliography' | 'csl') => text(saved[key]) ?? DEFAULT_SETTINGS[key];

	return {
		version: SETTINGS_VERSION,
		pandocPath: address('pandocPath'),
		outputFolder: address('outputFolder'),
		lastFolder: optional('lastFolder'),
		bibliography: optional('bibliography'),
		literatureFolder: address('literatureFolder'),
		keyProperty: address('keyProperty'),
		csl: optional('csl'),
	};
}

/**
 * Where the save dialog opens: where the last export went, while that folder
 * is still there, and otherwise the output folder.
 */
export function startFolder(settings: Settings, exists: (folder: string) => boolean): string {
	return settings.lastFolder !== '' && exists(settings.lastFolder) ? settings.lastFolder : settings.outputFolder;
}
