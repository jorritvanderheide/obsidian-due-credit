// What a note has to lose before pandoc sees it.
//
// Pandoc reads markdown, not Obsidian: it does not know that `%%` hides text,
// that the H1 is the title, or where `![[image.png]]` lives. Everything here
// works on the text of the note and never looks inside code, where all of these
// are only characters.

import { keyOf, linkpathOf, renameInAlias } from './citations';

/** A run of the note that is code, or that is not. */
export interface Segment {
	code: boolean;
	text: string;
}

// A backtick fence's info string holds no backtick, so a line such as
// ```` ```npm i``` installs it ```` opens with inline code, as in CommonMark and
// pandoc.
const FENCE = /^ {0,3}(`{3,}(?=[^`]*$)|~{3,})/;

/**
 * The note cut into code and everything else, which concatenate back to it.
 *
 * Code is a fenced block, and with `inline` also a backtick span within a line.
 * Headings want fences only, so that what is not code is always whole lines.
 * Each fenced block is a segment of its own, opening line first.
 */
export function segments(text: string, inline = true): Segment[] {
	const out: Segment[] = [];
	const push = (code: boolean, part: string) => {
		if (part === '') return;
		const last = out[out.length - 1];
		if (last && last.code === code) last.text += part;
		else out.push({ code, text: part });
	};

	let fence: string | null = null;
	for (const line of text.split(/(?<=\n)/)) {
		const marker = FENCE.exec(line)?.[1];
		if (fence !== null) {
			push(true, line);
			if (marker && marker[0] === fence[0] && marker.length >= fence.length && line.trim() === marker) fence = null;
		} else if (marker) {
			fence = marker;
			// A segment of its own, even right after another block, so that a
			// block can be told by its opening line.
			out.push({ code: true, text: line });
		} else if (inline) {
			spans(line, push);
		} else {
			push(false, line);
		}
	}
	return out;
}

/**
 * One line, with its backtick spans marked as code. An unmatched run of
 * backticks is text, and so is a backtick escaped with `\`, though the rest of
 * its run can still open a span, as in CommonMark.
 */
function spans(line: string, push: (code: boolean, part: string) => void): void {
	let start = 0;
	let i = 0;
	while (i < line.length) {
		if (line[i] !== '`') {
			i++;
			continue;
		}
		let slashes = 0;
		while (i - slashes > start && line[i - slashes - 1] === '\\') slashes++;
		if (slashes % 2 === 1) {
			i++;
			continue;
		}
		let n = 0;
		while (line[i + n] === '`') n++;

		// The span closes on a run of exactly as many backticks.
		const run = '`'.repeat(n);
		let close = -1;
		let j = i + n;
		while ((j = line.indexOf(run, j)) !== -1) {
			if (line[j + n] !== '`') {
				close = j;
				break;
			}
			while (line[j] === '`') j++;
		}

		if (close === -1) {
			i += n;
			continue;
		}
		push(false, line.slice(start, i));
		push(true, line.slice(i, close + n));
		i = start = close + n;
	}
	push(false, line.slice(start));
}

/** Apply `change` to everything that is not code. */
function outsideCode(text: string, change: (prose: string) => string, inline = true): string {
	return segments(text, inline)
		.map((segment) => (segment.code ? segment.text : change(segment.text)))
		.join('');
}

/** The frontmatter block, unparsed, and the note after it. */
export function splitFrontmatter(text: string): { yaml: string | null; body: string } {
	const match = /^---\r?\n([\s\S]*?\r?\n)?---[ \t]*(?:\r?\n|$)/.exec(text);
	if (!match) return { yaml: null, body: text };
	return { yaml: match[1] ?? '', body: text.slice(match[0].length) };
}

const COMMENT = /%%|<!--/;

/**
 * The note without its `%%comments%%` and `<!-- HTML comments -->`.
 *
 * The one thing here that is about privacy rather than looks: a comment is what
 * you wrote for yourself, and pandoc would print it, or keep it as raw HTML in
 * a Markdown export. Obsidian hides both kinds. A comment runs across lines
 * and past code, only its own kind of marker closes it, and one left open runs
 * to the end of the note, the cautious reading of a comment nobody closed.
 */
export function stripComments(text: string): string {
	// What closes the comment we are in, or null outside one.
	let closer: string | null = null;
	let out = '';
	for (const segment of segments(text)) {
		if (segment.code) {
			if (closer === null) out += segment.text;
			continue;
		}
		let rest = segment.text;
		while (rest !== '') {
			if (closer === null) {
				const open = COMMENT.exec(rest);
				if (!open) {
					out += rest;
					break;
				}
				out += rest.slice(0, open.index);
				closer = open[0] === '%%' ? '%%' : '-->';
				rest = rest.slice(open.index + open[0].length);
			} else {
				const at = rest.indexOf(closer);
				if (at === -1) break;
				rest = rest.slice(at + closer.length);
				closer = null;
			}
		}
	}
	return out;
}

const PLUGIN_BLOCK = /^ {0,3}(?:`{3,}|~{3,})[ \t]*(?:dataview|dataviewjs|tasks|query|base)(?![\w-])/;

/**
 * The note without the code blocks that plugins draw: Dataview, Tasks, search
 * and Bases. Each is a view of the vault, and exported it is only its query.
 * The whole block goes, told by the language on its opening line, and nothing
 * inside it is read.
 */
export function dropPluginBlocks(text: string): string {
	return segments(text, false)
		.filter((segment) => !(segment.code && PLUGIN_BLOCK.test(segment.text)))
		.map((segment) => segment.text)
		.join('');
}

const BLOCK_ID = /(?:^|[ \t]+)\^[A-Za-z0-9-]+[ \t]*(?=\r?$)/gm;

/**
 * The note without its block IDs: `^abc123` at the end of a line, or on a line
 * of its own after a table or a quote. They name a block for a link inside the
 * vault, and mean nothing to a reader. Fences only, so that the text is whole
 * lines, and an ID at the end of a line is never mistaken for the end of a
 * piece of it; a backtick span cannot end a line with an ID in it.
 */
export function stripBlockIds(text: string): string {
	return outsideCode(text, (prose) => prose.replace(BLOCK_ID, ''), false);
}

const LEADING_H1 =/^(?:[ \t]*\r?\n)*# +(.+?)(?:[ \t]+#+)?[ \t]*(?:\r?\n|$)/;

/**
 * The title the note opens with, and the note under it with its headings
 * promoted.
 *
 * An H1 on the first line is the title: it is what the note looks like it is
 * called, and it leaves the body for the document's title block. Under it,
 * `## Section` is a top-level section of the document, so every heading moves
 * up one level. Not when an H1 is left in the body, though: a note that uses H1
 * for its own sections has already said what its top level is, and promoting
 * would merge its `##` into them.
 *
 * Here rather than pandoc's `--shift-heading-level-by`, which also demotes the
 * References heading citeproc adds afterwards.
 */
export function liftHeadings(text: string): { title: string | null; body: string } {
	const match = LEADING_H1.exec(text);
	const title = match?.[1]?.trim() || null;
	const body = match ? text.slice(match[0].length) : text;

	const hasH1 = segments(body, false).some((segment) => !segment.code && /^#(?:[ \t]|$)/m.test(segment.text));
	if (hasH1) return { title, body };

	return { title, body: outsideCode(body, (prose) => prose.replace(/^#(#{1,5})(?=[ \t]|$)/gm, '$1'), false) };
}

const IMAGE = /\.(?:avif|bmp|gif|jpe?g|png|svg|webp)$/i;
const EMBED = /!\[\[([^\]|#^]+)(?:[#^][^\]|]*)?(?:\|([^\]]*))?\]\]/g;
const EMBED_LINE = new RegExp(`^[ \\t]*${EMBED.source}[ \\t]*(?:\\r?\\n|$)`, 'gm');

const isImage = (target: string) => IMAGE.test(linkpathOf(target.trim()));

/**
 * Every `![[image.png]]` as a markdown image of the file Obsidian would show,
 * and every other embed gone.
 *
 * Which file that is, is Obsidian's to say, so `resolve` asks it: a bare name
 * can live in any folder. An image it cannot resolve is left as written, so
 * pandoc's warning names it. `|300` is a width, as in Obsidian; any other text
 * after `|` is the image's description.
 *
 * An embedded note is for whoever wrote it, like the note linked, and so is a
 * PDF or a canvas: all of them are dropped, and one on a line of its own takes
 * its line with it. That pass reads whole lines, past backtick spans, since a
 * line with only an embed on it has none.
 */
export function imageEmbeds(text: string, resolve: (linkpath: string) => string | null): string {
	const lines = outsideCode(text, (prose) => prose.replace(EMBED_LINE, (line: string, target: string) => (isImage(target) ? line : '')), false);
	return outsideCode(lines, (prose) =>
		prose.replace(EMBED, (embed: string, target: string, label?: string) => {
			if (!isImage(target)) return '';
			const linkpath = linkpathOf(target.trim());
			const path = resolve(linkpath);
			if (path === null) return embed;

			const width = /^\s*(\d+)(?:x\d+)?\s*$/.exec(label ?? '')?.[1];
			const alt = width ? '' : (label ?? '').trim();
			return `![${alt}](<${path}>)${width ? `{width=${width}px}` : ''}`;
		}),
	);
}

const LINK = /(?<!!)\[\[([^\]|]+)(?:\|([^\]]*))?\]\]/g;

/**
 * Every link to a paper note, pointed at the paper's citation key.
 *
 * The filter only knows a link's name, and a note is not always named for its
 * key: a template can name it for its author and title, and Better BibTeX can
 * change a key long after the note was named. `keyFor` asks the note itself, so
 * `[[Marsh (2024) The Quiet Archive|see p. 4]]` exports as the citation
 * it is. A key the alias repeats changes with the target, so the alias still
 * spells the citation out. A link to anything without a key is left as written.
 */
export function citeByKey(text: string, keyFor: (linkpath: string) => string | null): string {
	return outsideCode(text, (prose) =>
		prose.replace(LINK, (link: string, target: string, alias?: string) => {
			const linkpath = linkpathOf(target);
			// A link within the note, `[[#Heading]]`, has no linkpath, and Obsidian
			// resolves that to the note itself: a paper note would cite itself.
			if (linkpath.trim() === '') return link;
			const key = keyFor(linkpath.trim());
			if (key === null) return link;
			const fragment = target.slice(linkpath.length);
			const label = alias === undefined ? '' : `|${renameInAlias(alias, keyOf(target), key)}`;
			return `[[${key}${fragment}${label}]]`;
		}),
	);
}

const WIKILINK = /(?<!!)\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g;

/** Every wikilink target outside code, as written. Embeds are not links. */
export function wikilinkTargets(text: string): string[] {
	return segments(text)
		.filter((segment) => !segment.code)
		.flatMap((segment) => [...segment.text.matchAll(WIKILINK)].map((match) => (match[1] ?? '').trim()));
}
