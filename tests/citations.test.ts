import { describe, expect, it } from 'vitest';
import { bibKeys, keyOf, linkpathOf, missingKeys, propertyKey, renameInAlias } from '../src/core/citations';

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

describe('propertyKey', () => {
	it('reads a non-empty string, trimmed', () => {
		expect(propertyKey({ citekey: ' jacobs2024 ' }, 'citekey')).toBe('jacobs2024');
	});

	it('finds none in a missing, empty or non-string property', () => {
		expect([undefined, null, {}, { citekey: ' ' }, { citekey: 3 }].map((frontmatter) => propertyKey(frontmatter, 'citekey'))).toEqual([null, null, null, null, null]);
	});
});

describe('renameInAlias', () => {
	it('swaps the key the alias repeats as a word', () => {
		expect(renameInAlias('see old, p. 4', 'old', 'new')).toBe('see new, p. 4');
		expect(renameInAlias('old', 'old', 'new')).toBe('new');
	});

	it('leaves the key inside another word alone', () => {
		expect(renameInAlias('bold old; x', 'old', 'new')).toBe('bold new; x');
		expect(renameInAlias('oldest', 'old', 'new')).toBe('oldest');
	});
});

describe('missingKeys', () => {
	// Papers by their key, one of them in a note named for its title.
	const papers: Record<string, string> = { jacobs2024: 'jacobs2024', hoepman2025: 'hoepman2025', 'Hoepman (2025) Antidote': 'hoepman2025' };
	const keyFor = (target: string) => papers[linkpathOf(target)] ?? null;

	it('lists each paper the bibliography lacks, once and sorted', () => {
		const targets = ['jacobs2024', 'hoepman2025#p. 3', 'Hoepman (2025) Antidote', 'Notes/My idea'];
		expect(missingKeys(targets, keyFor, new Set(['jacobs2024']))).toEqual(['hoepman2025']);
	});

	it('ignores links to anything that is not a paper', () => {
		expect(missingKeys(['Notes/My idea'], keyFor, new Set())).toEqual([]);
	});
});
