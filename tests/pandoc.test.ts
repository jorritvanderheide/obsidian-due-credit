// The filter and the pipeline against a real pandoc, skipped where there is none.
import { execFileSync } from 'child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterAll, describe, expect, it } from 'vitest';
import { keyOf, renameInAlias } from '../src/core/citations';
import { inputFiles, MARKDOWN_TEMPLATE, pandocArgs } from '../src/core/document';
import { prepare } from '../src/core/prepare';

function installed(program = 'pandoc'): boolean {
	try {
		execFileSync(program, ['--version']);
		return true;
	} catch {
		return false;
	}
}

const dir = mkdtempSync(join(tmpdir(), 'due-credit-test-'));
const obsidian = join(process.cwd(), 'pandoc', 'obsidian.lua');
const filter = join(process.cwd(), 'pandoc', 'wikilink-citations.lua');
const afterCiteproc = join(process.cwd(), 'pandoc', 'after-citeproc.lua');
const template = join(dir, 'markdown.template');
const fonts = join(process.cwd(), 'fonts');
writeFileSync(template, MARKDOWN_TEMPLATE);
const metadata = join(dir, 'metadata.json');
writeFileSync(metadata, '{}');
const bib = join(dir, 'library.bib');
writeFileSync(bib, '@article{a,\n  author = {A, Ann},\n  title = {First},\n  year = {2024}\n}\n@article{b,\n  author = {B, Bob},\n  title = {Second},\n  year = {2025}\n}\n');
afterAll(() => rmSync(dir, { recursive: true, force: true }));

/** The body of a one-paragraph note, cited and rendered to plain text. */
function cite(markdown: string): string {
	const output = join(dir, 'out.md');
	const args = pandocArgs('md', { obsidian, filter, afterCiteproc, template, fonts, metadata, bibliography: bib, csl: null, hardLineBreaks: false, referenceDoc: null, extra: [], resourcePath: dir, output });
	execFileSync('pandoc', [...args.filter((arg) => !arg.startsWith('--to=')), '--to=plain', '--wrap=none'], { input: markdown });
	return readFileSync(output, 'utf8').split('\n')[0] ?? '';
}

describe.skipIf(!installed())('wikilink-citations.lua', () => {
	it.each([
		['[[a]]', '(A 2024)'],
		['[[Literature/a.md]]', '(A 2024)'],
		['[[@a]]', '(A 2024)'],
		['[[Literature/@a.md#p. 12]]', '(A 2024, 12)'],
		['[[a#p. 12]]', '(A 2024, 12)'],
		['[[a#pp. 12-14]]', '(A 2024, 12–14)'],
		['[[a#ch. 3]]', '(A 2024, ch. 3)'],
		['[[a#§ 3]]', '(A 2024, sec. 3)'],
		['[[a#p. 12|label]]', '(A 2024, 12)'],
		['[[a#Claim]]', '(A 2024)'],
		['[[a#p. 12]]; [[b#p. 3]]', '(A 2024, 12; B 2025, 3)'],
		['[[a]], [[b]]', '(A 2024), (B 2025)'],
		['[[a]] and [[b]]', '(A 2024) and (B 2025)'],
		['[[My idea|this idea]] holds', 'this idea holds'],
		// A note's headings are for whoever wrote it: a link to one is words.
		['[[Other note#Section]] says', 'Other note says'],
		['[[Other note#^abc123]] says', 'Other note says'],
		['[[Other note#Section|there]] it is', 'there it is'],
		['[[#Local heading]] above', 'Local heading above'],
		// An in-text citation does not swallow the wikilink after it, and keeps a page in brackets.
		['As @a [[b]] argues', 'As A (2024) (B 2025) argues'],
		['As @a [[My idea|this idea]] argues', 'As A (2024) this idea argues'],
		['@a [[b|see b, p. 3]]', 'A (2024) (see B 2025, 3)'],
		['@a [p. 4] says', 'A (2024, 4) says'],
		// A web link stays one, even when its last part is a key.
		['[the page](https://example.org/a) says', 'the page says'],
		['<https://example.org/a>', 'https://example.org/a'],
		// Paper Trail's form for Better BibTeX's dialog: everything around the key, in the alias.
		['[[a|a, p. 4]]', '(A 2024, 4)'],
		['[[a|see a, p. 4, emphasis added]]', '(see A 2024, 4, emphasis added)'],
		['[[a|a, p. 4]]; [[b]]', '(A 2024, 4; B 2025)'],
		// A - against the key leaves the author out, as [-@a] does.
		['[[a|-a, p. 4]]', '(2024, 4)'],
		['[[a|see -a, p. 4]]', '(see 2024, 4)'],
		['[[a|-a]]; [[b]]', '(2024; B 2025)'],
		['[[a|re-a]]', '(A 2024)'],
		// An @ against the key, the way pandoc writes it, is read the same.
		['[[a|see @a, p. 4]]', '(see A 2024, 4)'],
		['[[a|-@a, p. 4]]', '(2024, 4)'],
		['[[@a|see @a, p. 4]]', '(see A 2024, 4)'],
		['[[a|me@a]]', '(A 2024)'],
		['[[a|about a, ch. 2]]', '(about A 2024, ch. 2)'],
		['[[a#p. 12|a]]', '(A 2024, 12)'],
		['[[a#p. 12|a, p. 4]]', '(A 2024, 4)'],
		['[[a|Ann’s paper]]', '(A 2024)'],
		// Paper Trail's Add page to citation on a label you wrote: the page after its first comma.
		['[[a|Marsh, p. 4]]', '(A 2024, 4)'],
		['[[a|Marsh, pp. 4, 6]]', '(A 2024, 4, 6)'],
		['[[a|Smith, Jones]]', '(A 2024)'],
		// Every abbreviation Better BibTeX writes counts as a locator.
		['[[a|a, col. 2]]', '(A 2024, col. 2)'],
		['[[a|Marsh, art. 12]]', '(A 2024, art. 12)'],
	])('%s exports as %s', (written, exported) => {
		expect(cite(written)).toBe(exported);
	});
});

// The rules `core/citations.ts` repeats from the filter, held to one table.
type Inline = { t: string; c?: unknown };
type Citation = { citationId: string; citationPrefix: Inline[]; citationSuffix: Inline[]; citationMode: { t: string } };

/** The first citation the filter alone makes of a paragraph, or null. */
function filtered(markdown: string): { key: string; prefix: string; suffix: string; mode: string } | null {
	const args = ['--from=markdown+wikilinks_title_after_pipe', `--lua-filter=${filter}`, `--bibliography=${bib}`, '--to=json'];
	const json = JSON.parse(execFileSync('pandoc', args, { input: markdown }).toString()) as { blocks: { c: Inline[] }[] };
	const cite = json.blocks[0]?.c.find((inline) => inline.t === 'Cite');
	const first = (cite?.c as [Citation[]] | undefined)?.[0][0];
	if (!first) return null;
	const words = (inlines: Inline[]) => inlines.map((inline) => (inline.t === 'Str' ? (inline.c as string) : ' ')).join('');
	return { key: first.citationId, prefix: words(first.citationPrefix), suffix: words(first.citationSuffix), mode: first.citationMode.t };
}

describe.skipIf(!installed())('one rule, written twice', () => {
	it.each(['a', 'Literature/a', 'Literature/a.md', 'a#p. 12', 'a#^block', '@a', 'Literature/@a.md#Claim', '@@a', 'a.pdf', 'ab', 'a.md.md', 'Notes/b a'])(
		'[[%s]] is a citation in the filter exactly when keyOf names the key',
		(target) => {
			expect(filtered(`[[${target}]]`)?.key ?? null).toBe(keyOf(target) === 'a' ? 'a' : null);
		},
	);

	// Where `renameInAlias` finds the key is where `spelled` splits the alias.
	it.each(['a', 'see a, p. 4', '-a, p. 4', 'see -a', '@a', 'see @a, p. 4', '-@a', 'about a; b', 'aa a', 're-a', 'me@a', 'ab', 'a.', 'see (a)', 'Smith and Jones', 'see\u00A0a'])(
		'[[a|%s]] is read around the key where renameInAlias finds it',
		(alias) => {
			const renamed = renameInAlias(alias, 'a', 'Z');
			let at = 0;
			while (at < alias.length && alias[at] === renamed[at]) at++;
			let start = alias[at - 1] === '@' ? at - 1 : at;
			const suppressed = renamed !== alias && alias[start - 1] === '-';
			if (suppressed) start--;
			expect(filtered(`[[a|${alias}]]`)).toEqual(
				renamed === alias
					? { key: 'a', prefix: '', suffix: '', mode: 'NormalCitation' }
					: { key: 'a', prefix: alias.slice(0, start).trim(), suffix: alias.slice(at + 1).trimEnd(), mode: suppressed ? 'SuppressAuthor' : 'NormalCitation' },
			);
		},
	);
});

describe.skipIf(!installed())('a bibliography with a byte order mark', () => {
	it('keeps its first entry', () => {
		const marked = join(dir, 'marked.bib');
		writeFileSync(marked, '\uFEFF@article{c,\n  author = {C, Cy},\n  title = {Third},\n  year = {2023}\n}\n');
		const output = join(dir, 'marked.txt');
		const args = pandocArgs('md', { obsidian, filter, afterCiteproc, template, fonts, metadata, bibliography: marked, csl: null, hardLineBreaks: false, referenceDoc: null, extra: [], resourcePath: dir, output });
		execFileSync('pandoc', [...args.filter((arg) => !arg.startsWith('--to=')), '--to=plain'], { input: '[[c]]\n' });
		expect(readFileSync(output, 'utf8')).toContain('(C 2023)');
	});
});

/** A note's body, exported as Markdown with the plugin's arguments. */
function markdown(input: string): string {
	const output = join(dir, 'export.md');
	execFileSync('pandoc', pandocArgs('md', { obsidian, filter, afterCiteproc, template, fonts, metadata, bibliography: bib, csl: null, hardLineBreaks: false, referenceDoc: null, extra: [], resourcePath: dir, output }), { input });
	return readFileSync(output, 'utf8');
}

describe.skipIf(!installed())('obsidian.lua', () => {
	it('exports a callout as a quote under its title in bold', () => {
		expect(markdown('> [!note]- My *title*\n> Body [[a]].\n')).toBe('> **My *title***\\\n> Body (A 2024).\n\nA, Ann. 2024. "First."\n');
	});

	it('drops the marker of a callout without a title, and leaves a plain quote alone', () => {
		expect(markdown('> [!tip]\n> Untitled.\n\n> A quote.\n')).toBe('> Untitled.\n\n> A quote.\n');
		expect(markdown('> [!warning] Only a title\n')).toBe('> **Only a title**\n');
	});

	it('reads a callout inside a callout, without the blank line pandoc wants', () => {
		expect(markdown('> [!info|wide] Outer\n> > [!quote] Inner\n> > Said.\n')).toBe('> **Outer**\n>\n> > **Inner**\\\n> > Said.\n');
	});
});

describe.skipIf(!installed())('a heading', () => {
	it('is one right after a line of text, as in Obsidian', () => {
		expect(markdown('Text right before\n## Heading\n')).toMatch(/^Text right before\n\n#+ Heading\n$/);
	});
});

describe.skipIf(!installed())('a list', () => {
	it('is one right after a line of text, as in Obsidian', () => {
		expect(markdown('Some points:\n- one\n- two\n\nSteps:\n1. first\n2. second\n')).toBe('Some points:\n\n- one\n- two\n\nSteps:\n\n1.  first\n2.  second\n');
	});
});

describe.skipIf(!installed())('a line break', () => {
	it('is kept where Obsidian shows one, in a paragraph and a list item', () => {
		const output = join(dir, 'breaks.md');
		execFileSync('pandoc', pandocArgs('md', { obsidian, filter, afterCiteproc, template, fonts, metadata, bibliography: bib, csl: null, hardLineBreaks: true, referenceDoc: null, extra: [], resourcePath: dir, output }), { input: 'line one\nline two\n\n- item\n  continued\n' });
		expect(readFileSync(output, 'utf8')).toBe('line one\\\nline two\n\n- item\\\n  continued\n');
	});
});

describe.skipIf(!installed())('a highlight', () => {
	const exported = (format: 'md' | 'tex') => {
		const output = join(dir, `marked.${format}`);
		execFileSync('pandoc', pandocArgs(format, { obsidian, filter, afterCiteproc, template, fonts, metadata, bibliography: bib, csl: null, hardLineBreaks: false, referenceDoc: null, extra: [], resourcePath: dir, output }), { input: 'Some ==marked== text.\n' });
		return readFileSync(output, 'utf8');
	};

	it('stays one in Markdown', () => {
		expect(exported('md')).toBe('Some ==marked== text.\n');
	});

	it('is plain text in a LaTeX body, whose class need not load soul', () => {
		expect(exported('tex')).toBe('Some marked text.\n');
	});
});

describe.skipIf(!installed())('arguments of your own', () => {
	const dump = (args: string[]) => execFileSync('pandoc', ['--dump-args', ...args]).toString();

	it('are options and their values, which pandoc reads as no file', () => {
		expect(inputFiles(dump(['--toc', '-V', 'geometry:margin=1in', '--filter', 'x', '-N']))).toEqual([]);
	});

	it('give away a word pandoc would read in place of the note', () => {
		expect(inputFiles(dump(['--toc', 'notes.md']))).toEqual(['notes.md']);
	});
});

describe.skipIf(!installed())('a Word template', () => {
	it('is taken for a Word export', () => {
		const reference = join(dir, 'reference.docx');
		execFileSync('pandoc', ['-o', reference, '--print-default-data-file', 'reference.docx']);
		const output = join(dir, 'templated.docx');
		execFileSync('pandoc', pandocArgs('docx', { obsidian, filter, afterCiteproc, template, fonts, metadata, bibliography: bib, csl: null, hardLineBreaks: false, referenceDoc: reference, extra: [], resourcePath: dir, output }), { input: 'As shown [[a]].\n' });
		expect(readFileSync(output).subarray(0, 2).toString()).toBe('PK');
	});
});

describe.skipIf(!installed() || !installed('xelatex'))('a PDF', () => {
	/** The fonts a PDF embeds, which it names when uncompressed. */
	const embedded = (extra: string[]) => {
		const output = join(dir, 'set.pdf');
		execFileSync('pandoc', pandocArgs('pdf', { obsidian, filter, afterCiteproc, template, fonts, metadata, bibliography: bib, csl: null, hardLineBreaks: false, referenceDoc: null, extra: [...extra, '--pdf-engine-opt=-output-driver=xdvipdfmx -z0'], resourcePath: dir, output }), { input: 'Plain, *italic*, **bold** and ***both***.\n', stdio: ['pipe', 'pipe', 'ignore'] });
		return [...readFileSync(output, 'latin1').matchAll(/\/FontName\s*\/[A-Z]{6}\+([\w-]+)/g)].map((match) => match[1]).sort();
	};

	it('is set in the bundled Open Sans', () => {
		expect(embedded([])).toEqual(['OpenSans-Bold', 'OpenSans-BoldItalic', 'OpenSans-Italic', 'OpenSans-Regular']);
	});

	it('is set in a font of yours instead', () => {
		expect(embedded(['-V', 'mainfont=lmroman10-regular.otf'])).toEqual(['LMRoman10-Regular']);
	});
});

describe.skipIf(!installed())('a markdown link', () => {
	it('to a heading by its pandoc ID stays a link', () => {
		const output = join(dir, 'anchor.md');
		const args = pandocArgs('md', { obsidian, filter, afterCiteproc, template, fonts, metadata, bibliography: bib, csl: null, hardLineBreaks: false, referenceDoc: null, extra: [], resourcePath: dir, output });
		execFileSync('pandoc', args, { input: '# Intro {#intro}\n\n[back](#intro)\n' });
		expect(readFileSync(output, 'utf8')).toContain('[back](#intro)');
	});
});

describe.skipIf(!installed())('a table', () => {
	it('reads a citation whose pipe the cell escaped', () => {
		const output = join(dir, 'table.md');
		const args = pandocArgs('md', { obsidian, filter, afterCiteproc, template, fonts, metadata, bibliography: bib, csl: null, hardLineBreaks: false, referenceDoc: null, extra: [], resourcePath: dir, output });
		const table = '| x | y |\n|---|---|\n| [[a\\|a, p. 4]] | [[a#p. 5\\|a]] |\n| [[b\\|Bob, p. 6]] | [[My idea\\|this idea]] |\n';
		execFileSync('pandoc', [...args.filter((arg) => !arg.startsWith('--to=')), '--to=plain'], { input: table });
		const exported = readFileSync(output, 'utf8');
		for (const cell of ['(A 2024, 4)', '(A 2024, 5)', '(B 2025, 6)', 'this idea']) expect(exported).toContain(cell);
		expect(exported).not.toContain('\\');
	});
});

describe.skipIf(!installed())('a note, end to end', () => {
	it('exports without comments, titled by its H1, with sections and references under it', () => {
		const note = '---\ntitle: Old title\ntags: [private]\n---\n# On archives\n\n## Argument\n\nAs shown [[a]] and [[First paper]].%%not for you%%\n\n---\nTODO: ask supervisor\n---\n';
		// A paper note named for its title, whose key property says which paper it is.
		const vault = {
			resolve: (linkpath: string) => (linkpath === 'First paper' ? { path: 'Literature/First paper.md', file: join(dir, 'First paper.md'), frontmatter: { citekey: 'a' } } : null),
			parseYaml: () => ({ title: 'Old title', tags: ['private'] }),
		};
		const { markdown: input, metadata } = prepare(note, vault, { name: 'note', papersFolder: 'Literature', keyProperty: 'citekey', keys: null, noteStyle: false });
		const files = { obsidian, filter, afterCiteproc, template, fonts, metadata: join(dir, 'note.json'), bibliography: bib, csl: null, hardLineBreaks: false, referenceDoc: null, extra: [], resourcePath: dir, output: join(dir, 'note.md') };
		writeFileSync(files.metadata, JSON.stringify(metadata));

		execFileSync('pandoc', pandocArgs('md', files), { input });
		const exported = readFileSync(files.output, 'utf8');
		// A block between `---` lines in the body is text, as Obsidian shows it, and no metadata.
		expect(exported).toMatch(/^#+ TODO: ask supervisor$/m);
		const json = execFileSync('pandoc', [...pandocArgs('md', files).filter((arg) => !/^--(to|output|standalone|template|shift)/.test(arg)), '--to=json'], { input });
		const meta = (JSON.parse(json.toString()) as { meta: object }).meta;
		expect(meta).not.toHaveProperty('TODO');
		// Nor the paths citeproc needed, which the Word writer would keep as properties.
		expect(meta).not.toHaveProperty('bibliography');
		expect(meta).not.toHaveProperty('reference-section-title');
		expect(meta).toHaveProperty('title');

		expect(exported).toMatch(/^# On archives\n\n## Argument$/m);
		expect(exported).not.toContain('private');
		expect(exported).not.toContain('not for you');
		expect(exported).not.toContain(bib);
		expect(exported).toMatch(/^## References/m);
		expect(exported).toContain('As shown (A 2024) and (A 2024).');
	});
});
