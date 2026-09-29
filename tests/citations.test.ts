import { describe, expect, it } from 'vitest';
import { bibKeys, keyOf, linkpathOf, missingKeys, propertyKey, renameInAlias } from '../src/core/citations';

describe('bibKeys', () => {
	it('reads every entry type, and nothing inside a field', () => {
		const bib = '@article{marsh2024,\n  title = {@misc{nope, x}},\n}\n\n@book{ okafor2019 ,\n}\n@inproceedings(paren2020,\n';
		expect([...bibKeys(bib)]).toEqual(['marsh2024', 'okafor2019', 'paren2020']);
	});

	it('reads the first entry after a byte order mark, as the filter does', () => {
		expect([...bibKeys('\uFEFF@article{marsh2024,\n}\n')]).toEqual(['marsh2024']);
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

	it('drops the \\ Obsidian leaves before an escaped pipe in a table cell', () => {
		expect(['key\\', 'key#p. 12\\'].map(linkpathOf)).toEqual(['key', 'key']);
		expect(keyOf('Literature/@key.md\\')).toBe('key');
	});
});

describe('propertyKey', () => {
	it('reads a non-empty string, trimmed', () => {
		expect(propertyKey({ citekey: ' marsh2024 ' }, 'citekey')).toBe('marsh2024');
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

	it('keeps a - that leaves the author out with the new key', () => {
		expect(renameInAlias('-old, p. 4', 'old', 'new')).toBe('-new, p. 4');
		expect(renameInAlias('see -old', 'old', 'new')).toBe('see -new');
		expect(renameInAlias('re-old', 'old', 'new')).toBe('re-old');
	});

	it('keeps an @ against the key', () => {
		expect(renameInAlias('see @old, p. 4', 'old', 'new')).toBe('see @new, p. 4');
		expect(renameInAlias('-@old', 'old', 'new')).toBe('-@new');
		expect(renameInAlias('me@old', 'old', 'new')).toBe('me@old');
	});

	it('leaves the alias alone for an empty key, rather than finding it everywhere', () => {
		expect(renameInAlias('the summary', '', 'new')).toBe('the summary');
	});

	it('takes a non-breaking space for part of a word, as the filter does', () => {
		expect(renameInAlias('see\u00A0old', 'old', 'new')).toBe('see\u00A0old');
	});

	it('leaves the key inside another word alone', () => {
		expect(renameInAlias('bold old; x', 'old', 'new')).toBe('bold new; x');
		expect(renameInAlias('oldest', 'old', 'new')).toBe('oldest');
	});
});

describe('missingKeys', () => {
	// Papers by their key, one of them in a note named for its title.
	const papers: Record<string, string> = { marsh2024: 'marsh2024', lindqvist2025: 'lindqvist2025', 'Lindqvist (2025) Small Hours': 'lindqvist2025' };
	const keyFor = (target: string) => papers[linkpathOf(target)] ?? null;

	it('lists each paper the bibliography lacks, once and sorted', () => {
		const targets = ['marsh2024', 'lindqvist2025#p. 3', 'Lindqvist (2025) Small Hours', 'Notes/My idea'];
		expect(missingKeys(targets, keyFor, new Set(['marsh2024']))).toEqual(['lindqvist2025']);
	});

	it('ignores links to anything that is not a paper', () => {
		expect(missingKeys(['Notes/My idea'], keyFor, new Set())).toEqual([]);
	});
});
