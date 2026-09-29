// The filter and the pipeline against a real pandoc, skipped where there is none.
import { execFileSync } from 'child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterAll, describe, expect, it } from 'vitest';
import { documentMetadata, pandocArgs } from '../src/core/document';
import { liftHeadings, splitFrontmatter, stripComments } from '../src/core/markdown';

function installed(): boolean {
	try {
		execFileSync('pandoc', ['--version']);
		return true;
	} catch {
		return false;
	}
}

const dir = mkdtempSync(join(tmpdir(), 'sign-off-test-'));
const filter = join(process.cwd(), 'pandoc', 'wikilink-citations.lua');
const bib = join(dir, 'library.bib');
writeFileSync(bib, '@article{a,\n  author = {A, Ann},\n  title = {First},\n  year = {2024}\n}\n@article{b,\n  author = {B, Bob},\n  title = {Second},\n  year = {2025}\n}\n');
afterAll(() => rmSync(dir, { recursive: true, force: true }));

/** The body of a one-paragraph note, cited and rendered to plain text. */
function cite(markdown: string): string {
	const output = join(dir, 'out.md');
	const args = pandocArgs('md', { filter, bibliography: bib, csl: null, resourcePath: dir, output });
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
		// Paper Trail's form for Better BibTeX's dialog: everything around the key, in the alias.
		['[[a|a, p. 4]]', '(A 2024, 4)'],
		['[[a|see a, p. 4, emphasis added]]', '(see A 2024, 4, emphasis added)'],
		['[[a|a, p. 4]]; [[b]]', '(A 2024, 4; B 2025)'],
		['[[a|about a, ch. 2]]', '(about A 2024, ch. 2)'],
		['[[a#p. 12|a]]', '(A 2024, 12)'],
		['[[a#p. 12|a, p. 4]]', '(A 2024, 4)'],
		['[[a|Ann’s paper]]', '(A 2024)'],
	])('%s exports as %s', (written, exported) => {
		expect(cite(written)).toBe(exported);
	});
});

describe.skipIf(!installed())('a note, end to end', () => {
	it('exports without comments, titled by its H1, with sections and references at the top level', () => {
		const note = '---\ntitle: Old title\ntags: [private]\n---\n# On authenticity\n\n## Argument\n\nAs shown [[a]].%%not for you%%\n';
		const { yaml, body } = splitFrontmatter(note);
		const { title, body: lifted } = liftHeadings(stripComments(body));
		const metadata = documentMetadata(yaml === null ? null : { title: 'Old title', tags: ['private'] }, title, 'note');
		const input = `---\n${Object.entries(metadata).map(([key, value]) => `${key}: ${String(value)}`).join('\n')}\n---\n\n${lifted}`;

		const output = join(dir, 'note.md');
		execFileSync('pandoc', [...pandocArgs('md', { filter, bibliography: bib, csl: null, resourcePath: dir, output }), '--standalone'], { input });
		const exported = readFileSync(output, 'utf8');

		expect(exported).toContain('title: On authenticity');
		expect(exported).not.toContain('private');
		expect(exported).not.toContain('not for you');
		expect(exported).toMatch(/^# Argument$/m);
		expect(exported).toMatch(/^# References/m);
		expect(exported).toContain('As shown (A 2024).');
	});
});
