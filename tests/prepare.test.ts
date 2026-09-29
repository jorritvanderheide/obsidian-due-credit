import { describe, expect, it } from 'vitest';
import { prepare, type Linked, type Vault } from '../src/core/prepare';

// A vault, as the note being exported sees it.
const notes: Record<string, Linked> = {
	'Marsh (2024) The Quiet Archive': { path: 'Literature/Marsh (2024) The Quiet Archive.md', file: '/v/Literature/Marsh (2024) The Quiet Archive.md', frontmatter: { citekey: 'marsh2024' } },
	okafor2019: { path: 'Literature/okafor2019.md', file: '/v/Literature/okafor2019.md', frontmatter: {} },
	'My idea': { path: 'Notes/My idea.md', file: '/v/Notes/My idea.md', frontmatter: { tags: ['idea'] } },
	'figure.png': { path: 'Attachments/figure.png', file: 'C:\\v\\Attachments\\figure.png', frontmatter: undefined },
	// Obsidian resolves an empty linkpath to the note itself: here, a paper note.
	'': { path: 'Literature/lindqvist2025.md', file: '/v/Literature/lindqvist2025.md', frontmatter: { citekey: 'lindqvist2025' } },
};
const vault: Vault = {
	resolve: (linkpath) => notes[linkpath] ?? null,
	parseYaml: (yaml) => (yaml.includes('title: Old') ? { title: 'Old', tags: ['private'], author: 'Ann' } : {}),
};
const options = { name: 'note', papersFolder: 'Literature', keyProperty: 'citekey', keys: new Set(['marsh2024']) };

describe('prepare', () => {
	it('makes the note pandoc input, every step in its order', () => {
		const note = [
			'---',
			'title: Old',
			'---',
			'# On archives',
			'',
			'## Argument',
			'',
			'As [[Marsh (2024) The Quiet Archive|Marsh, p. 4]] shows. %%not for you%% ^abc123',
			'',
			'![[figure.png|300]]',
			'',
		].join('\n');
		expect(prepare(note, vault, options)).toEqual({
			markdown: ['', '# Argument', '', 'As [[marsh2024|Marsh, p. 4]] shows.', '', '![](<C:/v/Attachments/figure.png>){width=300px}', ''].join('\n'),
			metadata: { title: 'On archives', 'reference-section-title': 'References', author: 'Ann' },
			missing: { papers: [], unresolved: [] },
		});
	});

	it('lists a paper the bibliography lacks, by its key property or its name in the papers folder', () => {
		const { missing } = prepare('[[okafor2019#p. 3]] [[Marsh (2024) The Quiet Archive]]', vault, { ...options, keys: new Set() });
		expect(missing).toEqual({ papers: ['marsh2024', 'okafor2019'], unresolved: [] });
	});

	it('lists a link to no note whose name the bibliography lacks, as the filter would read its key', () => {
		const { missing } = prepare('[[new2025|see new2025, p. 4]] [[@later2026]] [[marsh2024]] [[Idea to write]]', vault, options);
		expect(missing).toEqual({ papers: [], unresolved: ['Idea to write', 'later2026', 'new2025'] });
	});

	it('lists no note of your own, nothing in a comment, and nothing without a bibliography', () => {
		expect(prepare('[[My idea]] %%[[okafor2019]] [[new2025]]%%', vault, options).missing).toEqual({ papers: [], unresolved: [] });
		expect(prepare('[[okafor2019]] [[new2025]]', vault, { ...options, keys: null }).missing).toEqual({ papers: [], unresolved: [] });
	});

	it('points only a link to a note with a key property at that key', () => {
		expect(prepare('[[Marsh (2024) The Quiet Archive#p. 4]] [[okafor2019|see okafor2019]]', vault, options).markdown).toBe('[[marsh2024#p. 4]] [[okafor2019|see okafor2019]]');
	});

	it('never takes a link within the note for a paper, though it resolves to one', () => {
		const prepared = prepare('[[#Summary]] [[#Summary|the summary]]', vault, { ...options, keys: new Set() });
		expect(prepared.markdown).toBe('[[#Summary]] [[#Summary|the summary]]');
		expect(prepared.missing).toEqual({ papers: [], unresolved: [] });
	});
});
