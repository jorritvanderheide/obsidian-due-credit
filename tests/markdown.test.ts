import { describe, expect, it } from 'vitest';
import { citeByKey, imageEmbeds, liftHeadings, segments, splitFrontmatter, stripComments, wikilinkTargets } from '../src/core/markdown';

describe('segments', () => {
	it('concatenates back to the note', () => {
		const text = 'a `b` c\n```js\n%% x\n```\nd ``e ` f`` g\n';
		expect(segments(text).map((segment) => segment.text).join('')).toBe(text);
	});

	it('marks fenced blocks and backtick spans as code', () => {
		expect(segments('a `b` c\n~~~\nd\n~~~\ne')).toEqual([
			{ code: false, text: 'a ' },
			{ code: true, text: '`b`' },
			{ code: false, text: ' c\n' },
			{ code: true, text: '~~~\nd\n~~~\n' },
			{ code: false, text: 'e' },
		]);
	});

	it('closes a fence only on the same character, at least as long', () => {
		const text = '````\n```\n~~~~\n````\nafter';
		expect(segments(text).at(-1)).toEqual({ code: false, text: 'after' });
		expect(segments(text)[0]?.text).toBe('````\n```\n~~~~\n````\n');
	});

	it('reads an unmatched backtick as text', () => {
		expect(segments('it`s')).toEqual([{ code: false, text: 'it`s' }]);
	});

	it('leaves backtick spans alone when asked for fences only', () => {
		expect(segments('a `b` c', false)).toEqual([{ code: false, text: 'a `b` c' }]);
	});
});

describe('splitFrontmatter', () => {
	it('splits the block off the top', () => {
		expect(splitFrontmatter('---\ntitle: A\n---\n# A\n')).toEqual({ yaml: 'title: A\n', body: '# A\n' });
	});

	it('reads an empty block', () => {
		expect(splitFrontmatter('---\n---\nbody')).toEqual({ yaml: '', body: 'body' });
	});

	it('finds none unless it opens the note', () => {
		expect(splitFrontmatter('text\n---\na: b\n---\n')).toEqual({ yaml: null, body: 'text\n---\na: b\n---\n' });
	});
});

describe('stripComments', () => {
	it('removes an inline comment', () => {
		expect(stripComments('a %%private%% b')).toBe('a  b');
	});

	it('removes a comment across lines, down to one line break', () => {
		expect(stripComments('before\n\n%%\nfor me\n[[key]]\n%%\n\nafter')).toBe('before\n\n\n\nafter');
	});

	it('runs an unclosed comment to the end of the note, as Obsidian does', () => {
		expect(stripComments('kept %% not kept\nnor this')).toBe('kept ');
	});

	it('leaves %% in code alone', () => {
		expect(stripComments('`a %% b` and\n```\n%%\n```\n')).toBe('`a %% b` and\n```\n%%\n```\n');
	});

	it('hides code inside a comment', () => {
		expect(stripComments('a %% `code` %% b')).toBe('a  b');
	});
});

describe('liftHeadings', () => {
	it('takes the leading H1 as the title and promotes the rest', () => {
		expect(liftHeadings('# Title\n\n## Section\n\n### Sub\ntext')).toEqual({ title: 'Title', body: '\n# Section\n\n## Sub\ntext' });
	});

	it('finds the H1 after blank lines left by the frontmatter or a comment', () => {
		expect(liftHeadings('\n\n# Title\nbody').title).toBe('Title');
	});

	it('drops closing hashes from the title', () => {
		expect(liftHeadings('# Title ##\n').title).toBe('Title');
	});

	it('does not promote when an H1 is left in the body', () => {
		expect(liftHeadings('# Meeting\n\n## Notes\n\n# Tasks\n')).toEqual({ title: 'Meeting', body: '\n## Notes\n\n# Tasks\n' });
	});

	it('promotes without a title when the note has no H1 at all', () => {
		expect(liftHeadings('intro\n\n## A\n')).toEqual({ title: null, body: 'intro\n\n# A\n' });
	});

	it('only takes an H1 that opens the note', () => {
		expect(liftHeadings('intro\n# Late\n## A').title).toBeNull();
	});

	it('leaves tags and code alone', () => {
		expect(liftHeadings('#tag\n```\n## not a heading\n```\n## A').body).toBe('#tag\n```\n## not a heading\n```\n# A');
	});
});

describe('imageEmbeds', () => {
	const resolve = (linkpath: string) => (linkpath === 'missing.png' ? null : `/vault/Attachments/${linkpath}`);

	it('turns an image embed into a markdown image of the resolved file', () => {
		expect(imageEmbeds('![[diagram.png]]', resolve)).toBe('![](</vault/Attachments/diagram.png>)');
	});

	it('reads |300 as a width and other text as a description', () => {
		expect(imageEmbeds('![[a.png|300]] ![[b.jpg|640x480]] ![[c.svg|A chart]]', resolve)).toBe(
			'![](</vault/Attachments/a.png>){width=300px} ![](</vault/Attachments/b.jpg>){width=640px} ![A chart](</vault/Attachments/c.svg>)',
		);
	});

	it('leaves notes, unresolved images and code as written', () => {
		const text = '![[Chapter 1]] ![[missing.png]] `![[a.png]]`';
		expect(imageEmbeds(text, resolve)).toBe(text);
	});
});

describe('wikilinkTargets', () => {
	it('lists targets without labels, embeds or code', () => {
		expect(wikilinkTargets('[[a]] [[b#p. 3|see]] ![[c.png]] `[[d]]` [[Literature/e.md]]')).toEqual(['a', 'b#p. 3', 'Literature/e.md']);
	});
});

describe('citeByKey', () => {
	const keys: Record<string, string> = { 'Jacobs (2024) The Authenticity Crisis': 'jacobs2024', oldkey: 'newkey', '@oldkey': 'newkey', 'Literature/oldkey.md': 'newkey' };
	const keyFor = (linkpath: string) => keys[linkpath] ?? null;

	it('points a link to a note named for its title at the note’s key', () => {
		expect(citeByKey('as [[Jacobs (2024) The Authenticity Crisis]] shows', keyFor)).toBe('as [[jacobs2024]] shows');
	});

	it('follows a key Better BibTeX changed, keeping the page and the alias', () => {
		expect(citeByKey('[[oldkey#p. 12|label]] [[oldkey|see oldkey, p. 4]]', keyFor)).toBe('[[newkey#p. 12|label]] [[newkey|see newkey, p. 4]]');
	});

	it('reads the target however Obsidian wrote it', () => {
		expect(citeByKey('[[@oldkey|@oldkey]] [[Literature/oldkey.md]]', keyFor)).toBe('[[newkey|@oldkey]] [[newkey]]');
	});

	it('leaves links without a key, embeds and code as written', () => {
		const text = '[[My idea|this idea]] ![[oldkey]] `[[oldkey]]`';
		expect(citeByKey(text, keyFor)).toBe(text);
	});
});
