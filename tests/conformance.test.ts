// How far pandoc's markdown, as the export reads a note, is from Obsidian's.
//
// Pandoc's own markdown has to be the reader, since its CommonMark reader has
// no `[@key]` citations; but Obsidian follows CommonMark, and every place the
// two read a note differently is a note that exports wrong. This reads each
// note both ways and lists where the blocks differ, and where `segments`, which
// keeps comments from leaking, disagrees with CommonMark about what is code.
//
// Only one side of that is a failure: text `segments` takes for code, where a
// comment would be kept. Code it takes for text, such as an indented code
// block, is reported and allowed: telling one from an indented paragraph in a
// list needs a list parser, and a wrong guess the other way would leak.
// Differences in raw HTML blocks are real, but notes rarely have them.
//
// Not part of the suite: it needs notes. Run it on a vault, or any folder:
//
//   VAULT=~/path/to/vault npx vitest run tests/conformance.test.ts
import { execFileSync } from 'child_process';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { pandocArgs } from '../src/core/document';
import { segments, splitFrontmatter, stripComments } from '../src/core/markdown';

type Node = { t: string; c?: unknown };

function notes(folder: string): string[] {
	return readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
		if (entry.name.startsWith('.')) return [];
		const path = join(folder, entry.name);
		if (entry.isDirectory()) return notes(path);
		return entry.name.endsWith('.md') ? [path] : [];
	});
}

function parse(from: string, text: string): Node[] {
	return (JSON.parse(execFileSync('pandoc', [`--from=${from}`, '--to=json'], { input: text }).toString()) as { blocks: Node[] }).blocks;
}

/** The export's reader, from `pandocArgs`, so the two cannot drift apart. */
const OURS = pandocArgs('md', { obsidian: '', filter: '', afterCiteproc: '', template: '', metadata: '', bibliography: null, csl: null, resourcePath: '', hardLineBreaks: false, referenceDoc: null, extra: [], output: '' })[0]!.slice('--from='.length);
const COMMONMARK = 'commonmark_x+wikilinks_title_after_pipe';

/** Words, roughly, for saying where a difference is. */
function words(value: unknown): string {
	if (Array.isArray(value)) return value.map(words).join('');
	if (value && typeof value === 'object') {
		const node = value as Node;
		if (node.t === 'Str') return node.c as string;
		if (node.t === 'Space' || node.t === 'SoftBreak' || node.t === 'LineBreak') return ' ';
		return words(node.c);
	}
	return '';
}

/**
 * The blocks as a flat list of what they are, with what is in them: enough to
 * tell a list from a paragraph, not two ways of writing the same list. A
 * paragraph and a figure of one image are one thing, and a GitHub alert, which
 * Obsidian writes as a callout, is a quote.
 */
function shape(blocks: Node[], out: { kind: string; text: string }[] = []): { kind: string; text: string }[] {
	for (const block of blocks) {
		const c = block.c as unknown[];
		switch (block.t) {
			case 'Para':
			case 'Plain':
			case 'Figure':
				out.push({ kind: 'paragraph', text: words(c) });
				break;
			case 'Header':
				out.push({ kind: `heading ${String(c[0])}`, text: words(c[2]) });
				break;
			case 'BulletList':
			case 'OrderedList':
				out.push({ kind: block.t === 'BulletList' ? 'list' : 'numbered list', text: '' });
				for (const item of (block.t === 'BulletList' ? c : c[1]) as Node[][]) shape(item, out);
				out.push({ kind: 'end of list', text: '' });
				break;
			case 'BlockQuote':
				out.push({ kind: 'quote', text: '' });
				shape(c as Node[], out);
				out.push({ kind: 'end of quote', text: '' });
				break;
			case 'Div': {
				const [[, classes], inner] = c as [[string, string[]], Node[]];
				const alert = ['note', 'tip', 'important', 'warning', 'caution'].some((kind) => classes.includes(kind));
				if (alert) out.push({ kind: 'quote', text: '' });
				shape(alert ? inner.filter((node) => !(node.t === 'Div' && ((node.c as [[string, string[]]])[0][1] ?? []).includes('title'))) : inner, out);
				if (alert) out.push({ kind: 'end of quote', text: '' });
				break;
			}
			case 'CodeBlock':
				out.push({ kind: 'code block', text: (c[1] as string).split('\n')[0] ?? '' });
				break;
			default:
				out.push({ kind: block.t, text: words(c) });
		}
	}
	return out;
}

/** The code CommonMark finds, span and block, as text. */
function code(value: unknown, out: string[] = []): string[] {
	if (Array.isArray(value)) value.forEach((item) => code(item, out));
	else if (value && typeof value === 'object') {
		const node = value as Node;
		if (node.t === 'Code' || node.t === 'CodeBlock') out.push(((node.c as [unknown, string])[1] ?? '').trim());
		else code(node.c, out);
	}
	return out;
}

/** The code \`segments\` finds, with its fences and backticks taken off. */
function segmentCode(text: string): string[] {
	return segments(text)
		.filter((segment) => segment.code)
		.map((segment) => {
			// Without the `>` of the quotes a block is in, which is not its code;
			// a `>` inside the code is.
			const depth = (/^(?:[ \t]*>)*/.exec(segment.text)?.[0] ?? '').split('>').length - 1;
			const quote = new RegExp(`^(?:[ \\t]*>){${depth}}`);
			const lines = segment.text.replace(/\n$/, '').split('\n').map((line) => line.replace(quote, ''));
			if (/^[ \t]*(`{3,}|~{3,})/.test(lines[0] ?? '')) {
				const closed = /^[ \t]*(`{3,}|~{3,})\s*$/.test(lines.at(-1) ?? '');
				return lines.slice(1, closed ? -1 : undefined).join('\n').trim();
			}
			// In a table cell, CommonMark takes `\|` in code for `|`.
			return segment.text.replace(/^`+|`+$/g, '').replace(/\\\|/g, '|').trim();
		});
}

const vault = process.env.VAULT;

describe.skipIf(!vault)(`conformance with CommonMark: ${vault ?? ''}`, () => {
	it('reads every note the way Obsidian does', () => {
		const differences: string[] = [];
		const missed: string[] = [];
		for (const path of notes(vault!)) {
			const { body } = splitFrontmatter(readFileSync(path, 'utf8'));
			const name = path.slice(vault!.length + 1);

			// Pandoc never sees a comment: compare what it does see.
			const ours = shape(parse(OURS, stripComments(body)));
			const theirs = shape(parse(COMMONMARK, stripComments(body)));
			const at = ours.findIndex((block, i) => block.kind !== theirs[i]?.kind);
			if (at !== -1 || ours.length !== theirs.length) {
				const i = at === -1 ? Math.min(ours.length, theirs.length) : at;
				const show = (block?: { kind: string; text: string }) => (block ? `${block.kind} "${block.text.slice(0, 50)}"` : 'nothing');
				differences.push(`${name}: pandoc reads ${show(ours[i])}, CommonMark ${show(theirs[i])}`);
			}

			// Whitespace aside: pandoc turns a tab in code into spaces.
			const flat = (text: string) => text.replace(/\s+/g, ' ');
			const mine = segmentCode(stripComments(body)).map(flat);
			const commonmark = code(parse(COMMONMARK, stripComments(body))).map(flat);
			const missing = commonmark.filter((text) => !mine.includes(text));
			const extra = mine.filter((text) => !commonmark.includes(text));
			if (missing.length > 0) missed.push(`${name}: segments misses code ${JSON.stringify(missing[0]!.slice(0, 50))}`);
			if (extra.length > 0) differences.push(`${name}: segments takes for code ${JSON.stringify(extra[0]!.slice(0, 50))}`);
		}
		if (missed.length > 0) process.stdout.write(`Code read as text, allowed:\n${missed.join('\n')}\n`);
		expect(differences).toEqual([]);
	});
});
