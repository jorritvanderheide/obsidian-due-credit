import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, SETTINGS_VERSION, loadSettings } from '../src/core/settings';

describe('loadSettings', () => {
	it('fills in defaults', () => {
		expect(loadSettings(null)).toEqual(DEFAULT_SETTINGS);
	});

	it('trims, because a stray space in a path is a silent miss', () => {
		expect(loadSettings({ outputFolder: ' ~/Exports ' }).outputFolder).toBe('~/Exports');
	});

	it('falls back when an address is blanked, rather than pointing at nothing', () => {
		expect(loadSettings({ pandocPath: ' ', outputFolder: '', literatureFolder: '  ' })).toMatchObject({
			pandocPath: 'pandoc',
			outputFolder: '~/Documents',
			literatureFolder: 'Literature',
		});
	});

	it('keeps an empty bibliography and style, where empty is an answer', () => {
		expect(loadSettings({ bibliography: '', csl: '' })).toMatchObject({ bibliography: '', csl: '' });
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
