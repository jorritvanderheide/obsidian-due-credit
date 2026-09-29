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
