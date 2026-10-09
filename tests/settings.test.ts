import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, SETTINGS_VERSION, loadSettings, startFolder } from '../src/core/settings';

describe('loadSettings', () => {
	it('fills in defaults', () => {
		expect(loadSettings(null)).toEqual(DEFAULT_SETTINGS);
	});

	it('trims, because a stray space in a path is a silent miss', () => {
		expect(loadSettings({ outputFolder: ' ~/Exports ' }).outputFolder).toBe('~/Exports');
	});

	it('falls back when an address is blanked, rather than pointing at nothing', () => {
		expect(loadSettings({ pandocPath: ' ', outputFolder: '', literatureFolder: '  ', keyProperty: '' })).toMatchObject({
			pandocPath: 'pandoc',
			outputFolder: '~/Documents',
			literatureFolder: 'Literature',
			keyProperty: 'citekey',
		});
	});

	it('keeps an empty bibliography, style and last folder, where empty is an answer', () => {
		expect(loadSettings({ bibliography: '', csl: '', lastFolder: '', referenceDoc: '' })).toMatchObject({ bibliography: '', csl: '', lastFolder: '', referenceDoc: '' });
		expect(loadSettings(null).referenceDoc).toBe('');
		expect(loadSettings(null).extraArgs).toBe('');
		expect(loadSettings({ extraArgs: ' --toc ' }).extraArgs).toBe('--toc');
	});

	it('drops what is not a string, and keys it does not know', () => {
		const settings = loadSettings({ csl: 3, retired: true });
		expect(settings.csl).toBe('');
		expect(settings).not.toHaveProperty('retired');
	});

	it('stamps the current version', () => {
		expect(loadSettings({ version: 0 }).version).toBe(SETTINGS_VERSION);
	});
});

// `data.json` as each released version saved it: every key, written whole by
// `saveData(this.settings)` after a change in the tab or an export. Whenever
// the stored shape changes, add a fixture named after the last version that
// wrote the old one, and keep the older fixtures.
const SAVED = {
	'1.0.0': {
		version: 1,
		pandocPath: '/usr/local/bin/pandoc',
		outputFolder: '~/Thesis',
		lastFolder: '/home/a/Supervisor',
		bibliography: '~/Zotero/library.bib',
		literatureFolder: 'Papers',
		keyProperty: 'citationKey',
		csl: 'apa',
		referenceDoc: 'Templates/university.docx',
		extraArgs: '--toc --number-sections',
	},
	'1.3.1': {
		version: 1,
		pandocPath: 'pandoc',
		outputFolder: '~/Documents',
		lastFolder: '',
		bibliography: '',
		literatureFolder: 'Literature',
		keyProperty: 'citekey',
		csl: '',
		referenceDoc: '',
		extraArgs: '-V papersize=letter',
	},
};

describe('settings saved by a released version', () => {
	it('1.0.0 loads with every choice kept', () => {
		expect(loadSettings(SAVED['1.0.0'])).toEqual({
			version: SETTINGS_VERSION,
			pandocPath: '/usr/local/bin/pandoc',
			outputFolder: '~/Thesis',
			lastFolder: '/home/a/Supervisor',
			bibliography: '~/Zotero/library.bib',
			literatureFolder: 'Papers',
			keyProperty: 'citationKey',
			csl: 'apa',
			referenceDoc: 'Templates/university.docx',
			extraArgs: '--toc --number-sections',
		});
	});

	it('1.3.1 loads with every choice kept, empty ones too', () => {
		expect(loadSettings(SAVED['1.3.1'])).toEqual({
			...DEFAULT_SETTINGS,
			bibliography: '',
			extraArgs: '-V papersize=letter',
		});
	});

	it('saves again as it loaded', () => {
		for (const saved of Object.values(SAVED)) {
			const loaded = loadSettings(saved);
			expect(loadSettings(JSON.parse(JSON.stringify(loaded)))).toEqual(loaded);
		}
	});
});

describe('startFolder', () => {
	const settings = loadSettings({ lastFolder: '/home/a/Supervisor' });

	it('opens where the last export went', () => {
		expect(startFolder(settings, () => true)).toBe('/home/a/Supervisor');
	});

	it('falls back to the output folder once that folder is gone', () => {
		expect(startFolder(settings, () => false)).toBe('~/Documents');
	});

	it('uses the output folder before the first export', () => {
		expect(startFolder(loadSettings(null), () => true)).toBe('~/Documents');
	});
});
