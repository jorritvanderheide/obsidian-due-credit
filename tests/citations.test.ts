import { describe, expect, it } from 'vitest';
import { bibKeys, keyOf, linkpathOf, missingKeys } from '../src/core/citations';

describe('bibKeys', () => {
	it('reads every entry type, and nothing inside a field', () => {
		const bib = '@article{jacobs2024,\n  title = {@misc{nope, x}},\n}\n\n@book{ keshav2007 ,\n}\n@inproceedings(paren2020,\n';
		expect([...bibKeys(bib)]).toEqual(['jacobs2024', 'keshav2007', 'paren2020']);
	});
});

describe('keyOf', () => {
	it('reads the key however Obsidian wrote the target', () => {
		expect(['key', 'Literature/key', 'Literature/key.md', 'key#p. 12', 'key#^block', '@key', 'Literature/@key.md#p. 3'].map(keyOf)).toEqual(['key', 'key', 'key', 'key', 'key', 'key', 'key']);
	});
});

describe('linkpathOf', () => {
	it('drops a heading or block reference', () => {
		expect(linkpathOf('Literature/key#p. 12')).toBe('Literature/key');
	});
});

describe('missingKeys', () => {
	const papers = new Set(['jacobs2024', 'hoepman2025']);
	const isPaper = (target: string) => papers.has(keyOf(target));

	it('lists each paper the bibliography lacks, once and sorted', () => {
		const targets = ['jacobs2024', 'hoepman2025#p. 3', 'hoepman2025', 'Notes/My idea'];
		expect(missingKeys(targets, isPaper, new Set(['jacobs2024']))).toEqual(['hoepman2025']);
	});

	it('ignores links to anything that is not a paper', () => {
		expect(missingKeys(['Notes/My idea'], isPaper, new Set())).toEqual([]);
	});
});
