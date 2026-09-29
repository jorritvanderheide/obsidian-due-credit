import { describe, expect, it } from 'vitest';
import { cslPath, expandHome, inFolder, within } from '../src/core/paths';

describe('expandHome', () => {
	it('reads ~ as the home folder, and nothing else', () => {
		expect(expandHome('~', '/home/a')).toBe('/home/a');
		expect(expandHome('~/Documents', '/home/a')).toBe('/home/a/Documents');
		expect(expandHome('/srv/~x', '/home/a')).toBe('/srv/~x');
	});
});

describe('cslPath', () => {
	it('looks a bare name up among the styles', () => {
		expect(cslPath('apa', '/z/styles')).toBe('/z/styles/apa.csl');
		expect(cslPath('apa.csl', '/z/styles')).toBe('/z/styles/apa.csl');
	});

	it('takes a path as given', () => {
		expect(cslPath('/styles/mine.csl', '/z/styles')).toBe('/styles/mine.csl');
	});
});

describe('within', () => {
	it('is true only strictly inside the folder', () => {
		expect(within('/vault', '/vault/Notes/a.md')).toBe(true);
		expect(within('/vault', '/vault')).toBe(false);
		expect(within('/vault', '/vault-2/a.md')).toBe(false);
		expect(within('/vault', '/home/a/Documents/a.md')).toBe(false);
	});
});

describe('inFolder', () => {
	it('matches the folder, not a prefix of its name', () => {
		expect(inFolder('Literature/a.md', 'Literature')).toBe(true);
		expect(inFolder('Literature/a.md', 'Literature/')).toBe(true);
		expect(inFolder('Literature notes/a.md', 'Literature')).toBe(false);
	});
});
