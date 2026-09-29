import { describe, expect, it } from 'vitest';
import { documentMetadata, lineBreaks, pandocArgs, styled, type Run } from '../src/core/document';

describe('documentMetadata', () => {
	it('takes the title from the heading first, then the property, then the name', () => {
		expect(documentMetadata({ title: 'Property' }, 'Heading', 'name').title).toBe('Heading');
		expect(documentMetadata({ title: 'Property' }, null, 'name').title).toBe('Property');
		expect(documentMetadata({ title: ' ' }, null, 'name').title).toBe('name');
		expect(documentMetadata(null, null, 'name').title).toBe('name');
	});

	it('passes on only the keys pandoc uses, so vault metadata stays out of the file', () => {
		const metadata = documentMetadata({ tags: ['secret'], reading: 'queued', lang: 'nl', author: ['A', 'B'] }, 'T', 'n');
		expect(metadata).toEqual({ title: 'T', 'reference-section-title': 'References', lang: 'nl', author: ['A', 'B'] });
	});

	it('lets a note head its references in its own language', () => {
		expect(documentMetadata({ 'reference-section-title': 'Bronnen' }, null, 'n')['reference-section-title']).toBe('Bronnen');
	});
});

describe('styled', () => {
	it('is every format but LaTeX, whose class styles its citations', () => {
		expect((['docx', 'pdf', 'md', 'tex'] as const).map(styled)).toEqual([true, true, true, false]);
	});
});

describe('lineBreaks', () => {
	it('breaks lines unless strict line breaks are on, which by default they are not', () => {
		expect([null, {}, { strictLineBreaks: false }, 'broken'].map(lineBreaks)).toEqual([true, true, true, true]);
		expect(lineBreaks({ strictLineBreaks: true })).toBe(false);
	});
});

describe('pandocArgs', () => {
	const run: Run = { obsidian: '/tmp/o.lua', filter: '/tmp/f.lua', afterCiteproc: '/tmp/a.lua', template: '/tmp/t.md', metadata: '/tmp/m.json', bibliography: '/v/lib.bib', csl: null, hardLineBreaks: false, resourcePath: '/v', output: '/out/n.docx' };

	it('runs the filter before citeproc, which can only cite what the filter made', () => {
		const args = pandocArgs('docx', run);
		expect(args.indexOf('--lua-filter=/tmp/f.lua')).toBeLessThan(args.indexOf('--citeproc'));
		expect(args[0]).toBe('--from=markdown+wikilinks_title_after_pipe+mark-yaml_metadata_block-simple_tables-multiline_tables-blank_before_blockquote');
		expect(args.indexOf('--lua-filter=/tmp/o.lua')).toBeLessThan(args.indexOf('--lua-filter=/tmp/f.lua'));
		expect(args).toContain('--metadata-file=/tmp/m.json');
		expect(args.at(-1)).toBe('--output=/out/n.docx');
	});

	it('clears the paths after citeproc, which is the last to need them', () => {
		const args = pandocArgs('docx', run);
		expect(args.indexOf('--lua-filter=/tmp/a.lua')).toBeGreaterThan(args.indexOf('--citeproc'));
		expect(pandocArgs('tex', run)).not.toContain('--lua-filter=/tmp/a.lua');
	});

	it('reads one newline as a line break when Obsidian does', () => {
		expect(pandocArgs('docx', { ...run, hardLineBreaks: true })[0]).toMatch(/^--from=markdown\+wikilinks_title_after_pipe\+mark\+hard_line_breaks-/);
		expect(pandocArgs('docx', run)[0]).not.toContain('hard_line_breaks');
	});

	it('passes a style when there is one', () => {
		expect(pandocArgs('docx', { ...run, csl: '/s/apa.csl' })).toContain('--csl=/s/apa.csl');
	});

	it('makes PDF with xelatex', () => {
		expect(pandocArgs('pdf', run)).toContain('--pdf-engine=xelatex');
	});

	it('keeps pandoc syntax out of a Markdown export', () => {
		expect(pandocArgs('md', run).find((arg) => arg.startsWith('--to='))).toMatch(/^--to=markdown\+mark-.*-raw_html-raw_attribute-header_attributes$/);
	});

	it('puts a Markdown export under its title, References too', () => {
		const args = pandocArgs('md', run);
		expect(args).toEqual(expect.arrayContaining(['--standalone', '--template=/tmp/t.md', '--shift-heading-level-by=1']));
		expect(pandocArgs('docx', run).some((arg) => arg.startsWith('--template') || arg.startsWith('--shift'))).toBe(false);
	});

	it('leaves LaTeX citations to the class: natbib, no citeproc, no style', () => {
		const args = pandocArgs('tex', { ...run, csl: '/s/apa.csl' });
		expect(args).toContain('--natbib');
		expect(args).not.toContain('--citeproc');
		expect(args.some((arg) => arg.startsWith('--csl'))).toBe(false);
	});

	it('exports without a bibliography when there is none', () => {
		expect(pandocArgs('md', { ...run, bibliography: null }).some((arg) => arg.startsWith('--bibliography'))).toBe(false);
	});
});
