import { describe, expect, it } from 'vitest';
import { citeByKey, dropPluginBlocks, imageEmbeds, liftHeadings, segments, splitFrontmatter, stripBlockIds, stripComments, stripTags, wikilinkTargets } from '../src/core/markdown';

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

	it('reads a line that opens with inline code as a line, not a fence', () => {
		expect(segments('```npm i``` installs it.\n\nMy point.')).toEqual([
			{ code: true, text: '```npm i```' },
			{ code: false, text: ' installs it.\n\nMy point.' },
		]);
		expect(segments('```js\nx\n```\n')).toEqual([{ code: true, text: '```js\nx\n```\n' }]);
	});

	it('reads an escaped backtick as text, and the rest of its run as a run', () => {
		expect(segments('a \\`` b` c')).toEqual([
			{ code: false, text: 'a \\`' },
			{ code: true, text: '` b`' },
			{ code: false, text: ' c' },
		]);
		expect(segments('\\\\`code`')).toEqual([
			{ code: false, text: '\\\\' },
			{ code: true, text: '`code`' },
		]);
	});

	it('keeps each fenced block a segment of its own, even right after another', () => {
		expect(segments('```a\nx\n```\n~~~b\ny\n~~~\n')).toEqual([
			{ code: true, text: '```a\nx\n```\n' },
			{ code: true, text: '~~~b\ny\n~~~\n' },
		]);
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

	it('removes an HTML comment, inline or across lines', () => {
		expect(stripComments('a <!-- private --> b\n<!--\nfor me\n-->\nc')).toBe('a  b\n\nc');
	});

	it('closes a comment only with its own kind of marker', () => {
		expect(stripComments('a <!-- 50%% sure --> b %% x --> y %% c')).toBe('a  b  c');
	});

	it('runs an unclosed HTML comment to the end of the note', () => {
		expect(stripComments('kept <!-- not kept\nnor this')).toBe('kept ');
	});

	it('leaves <!-- in code alone', () => {
		expect(stripComments('`<!-- a -->` and\n```html\n<!-- b -->\n```\n')).toBe('`<!-- a -->` and\n```html\n<!-- b -->\n```\n');
	});

	it('hides a comment after a line that opens with inline code', () => {
		expect(stripComments('```npm i``` installs it.\n\nMy point. %%private%%\n')).toBe('```npm i``` installs it.\n\nMy point. \n');
	});

	it('hides a comment after an escaped backtick', () => {
		expect(stripComments('Escape \\`, like so. %%private `code` here%% after\n\nNext.')).toBe('Escape \\`, like so.  after\n\nNext.');
	});

	it('hides code inside a comment', () => {
		expect(stripComments('a %% `code` %% b')).toBe('a  b');
	});
});

describe('dropPluginBlocks', () => {
	it('drops a block in each plugin language, by either fence', () => {
		const blocks = ['dataview', 'dataviewjs', 'tasks', 'query', 'base'].map((language) => `\`\`\`${language}\nLIST FROM #x\n\`\`\`\n`).join('\nText.\n');
		expect(dropPluginBlocks(blocks)).toBe('\nText.\n'.repeat(4));
		expect(dropPluginBlocks('a\n~~~~ dataview\nTABLE x\n~~~~\nb')).toBe('a\nb');
	});

	it('keeps the block after one it drops, and every other language', () => {
		expect(dropPluginBlocks('```tasks\nnot done\n```\n```js\nx()\n```\n')).toBe('```js\nx()\n```\n');
		const kept = '```dataviews\nx\n```\n```python\nquery = 1\n```\nA `dataview` query in prose.\n';
		expect(dropPluginBlocks(kept)).toBe(kept);
	});
});

describe('stripTags', () => {
	it('drops a line of tags, line and all', () => {
		expect(stripTags('Text.\n#todo #draft\r\n  #réflexion/deux  \nMore.\n#end')).toBe('Text.\nMore.\n');
	});

	it('keeps a tag in a sentence as its word', () => {
		expect(stripTags('About #project/alpha and #ideas.\n#first word')).toBe('About project/alpha and ideas.\nfirst word');
	});

	it('leaves what is no tag, and code, alone', () => {
		const text = '#1 in the list\n#1 #2\n[[note#Heading]] (#id) https://x.org/#top C# \n# Heading\n`#code` and\n```\n#tag\n```\n';
		expect(stripTags(text)).toBe(text);
	});
});

describe('stripBlockIds', () => {
	it('removes an ID at the end of a line', () => {
		expect(stripBlockIds('Paragraph. ^abc123\n- item ^li-1\r\nlast ^x')).toBe('Paragraph.\n- item\r\nlast');
	});

	it('empties a line that holds only an ID', () => {
		expect(stripBlockIds('| a |\n|---|\n\n^tbl\n\nafter')).toBe('| a |\n|---|\n\n\n\nafter');
	});

	it('leaves footnotes, IDs in links, mid-line carets and code alone', () => {
		const text = 'a[^1] and [[note#^abc]]\n2 ^ 3 is x^2^\n`code ^x`\n```\nline ^id\n```\n';
		expect(stripBlockIds(text)).toBe(text);
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

	it('reads an embed whose pipe a table cell escaped', () => {
		expect(imageEmbeds('| ![[a.png\\|300]] |', resolve)).toBe('| ![](</vault/Attachments/a.png>){width=300px} |');
	});

	it('leaves an unresolved image, for pandoc to name, and code as written', () => {
		const text = '![[missing.png]] `![[a.png]]` `![[Chapter 1]]`';
		expect(imageEmbeds(text, resolve)).toBe(text);
	});

	it('drops every other embed: a note, a section, a block, a PDF and a canvas', () => {
		expect(imageEmbeds('See ![[Chapter 1]], ![[Chapter 1#Method]], ![[Chapter 1#^abc]], ![[paper.pdf#page=3]] and ![[Map.canvas]].', resolve)).toBe('See , , ,  and .');
	});

	it('takes the line of an embed on a line of its own with it', () => {
		expect(imageEmbeds('Before.\n\n![[Chapter 1]]\n\n  ![[paper.pdf]]  \r\nAfter.\n![[Chapter 2]]', resolve)).toBe('Before.\n\n\nAfter.\n');
		expect(imageEmbeds('Before.\n![[a.png]]\n', resolve)).toBe('Before.\n![](</vault/Attachments/a.png>)\n');
	});
});

describe('wikilinkTargets', () => {
	it('lists targets without labels, embeds or code', () => {
		expect(wikilinkTargets('[[a]] [[b#p. 3|see]] ![[c.png]] `[[d]]` [[Literature/e.md]]')).toEqual(['a', 'b#p. 3', 'Literature/e.md']);
	});
});

describe('citeByKey', () => {
	const keys: Record<string, string> = { 'Marsh (2024) The Quiet Archive': 'marsh2024', oldkey: 'newkey', '@oldkey': 'newkey', 'Literature/oldkey.md': 'newkey' };
	const keyFor = (linkpath: string) => keys[linkpath] ?? null;

	it('points a link to a note named for its title at the note’s key', () => {
		expect(citeByKey('as [[Marsh (2024) The Quiet Archive]] shows', keyFor)).toBe('as [[marsh2024]] shows');
	});

	it('follows a key Better BibTeX changed, keeping the page and the alias', () => {
		expect(citeByKey('[[oldkey#p. 12|label]] [[oldkey|see oldkey, p. 4]]', keyFor)).toBe('[[newkey#p. 12|label]] [[newkey|see newkey, p. 4]]');
	});

	it('keeps the pipe a table cell escaped', () => {
		expect(citeByKey('| [[oldkey\\|see oldkey, p. 4]] | [[oldkey#p. 12\\|x]] |', keyFor)).toBe('| [[newkey\\|see newkey, p. 4]] | [[newkey#p. 12\\|x]] |');
	});

	it('keeps the author left out when the key changes', () => {
		expect(citeByKey('[[oldkey|-oldkey, p. 4]]', keyFor)).toBe('[[newkey|-newkey, p. 4]]');
	});

	it('reads the target however Obsidian wrote it', () => {
		expect(citeByKey('[[@oldkey|@oldkey]] [[Literature/oldkey.md]]', keyFor)).toBe('[[newkey|@newkey]] [[newkey]]');
	});

	it('leaves a link within the note alone, which Obsidian resolves to the note itself', () => {
		const own = (linkpath: string) => (linkpath === '' ? 'ownkey' : null);
		expect(citeByKey('[[#Summary]] [[#Summary|the summary]]', own)).toBe('[[#Summary]] [[#Summary|the summary]]');
	});

	it('leaves links without a key, embeds and code as written', () => {
		const text = '[[My idea|this idea]] ![[oldkey]] `[[oldkey]]`';
		expect(citeByKey(text, keyFor)).toBe(text);
	});
});
