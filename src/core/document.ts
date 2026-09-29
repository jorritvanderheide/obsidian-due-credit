// What pandoc is asked to make: the document's metadata and the command line.

export type Format = 'docx' | 'pdf' | 'md' | 'tex';

export const FORMATS: Record<Format, { name: string; extension: string }> = {
	docx: { name: 'Word', extension: 'docx' },
	pdf: { name: 'PDF', extension: 'pdf' },
	md: { name: 'Markdown', extension: 'md' },
	tex: { name: 'LaTeX', extension: 'tex' },
};

/**
 * The frontmatter keys pandoc makes something of, and the only ones passed on.
 *
 * Not the whole frontmatter: the Word writer keeps every key it does not know
 * as a custom document property, so tags, reading states and whatever else
 * organises the vault would travel inside the file you send a supervisor.
 */
const DOCUMENT_KEYS = ['subtitle', 'author', 'date', 'abstract', 'keywords', 'lang', 'reference-section-title'];

/**
 * The document's metadata, from the note.
 *
 * The title is the note's leading H1 when it has one, because that is the title
 * the note shows; then a `title` property; then the file name, which is what
 * Obsidian shows when there is neither. A reference list is headed References
 * unless the note says otherwise, for a note in another language.
 */
export function documentMetadata(frontmatter: unknown, heading: string | null, name: string): Record<string, unknown> {
	const properties = frontmatter !== null && typeof frontmatter === 'object' ? (frontmatter as Record<string, unknown>) : {};
	const property = typeof properties.title === 'string' ? properties.title.trim() : '';

	const metadata: Record<string, unknown> = {
		title: heading ?? (property || name),
		'reference-section-title': 'References',
	};
	for (const key of DOCUMENT_KEYS) {
		if (properties[key] !== undefined && properties[key] !== null) metadata[key] = properties[key];
	}
	return metadata;
}

export interface Run {
	/** The citation filter, on disk. */
	filter: string;
	/** The bibliography, on disk, or null to export without citations. */
	bibliography: string | null;
	/** A `.csl` file, or null for pandoc's built-in style. */
	csl: string | null;
	/** Where pandoc looks for images, joined with the platform's delimiter. */
	resourcePath: string;
	output: string;
}

/**
 * Pandoc's arguments for one format. The note itself goes in on stdin.
 *
 * The order matters: pandoc runs filters and citeproc in the order they are
 * given, and citeproc can only resolve citations the filter has already made.
 *
 * - Word, PDF and Markdown render citations and a reference list with
 *   citeproc, in the chosen style.
 * - LaTeX is a body to paste into a journal's or conference's class, with the
 *   `\cite` commands intact so its own bibliography style formats them. No
 *   style is applied, because the class decides.
 */
export function pandocArgs(format: Format, run: Run): string[] {
	const args = ['--from=markdown+wikilinks_title_after_pipe', `--lua-filter=${run.filter}`];
	if (run.bibliography) args.push(`--bibliography=${run.bibliography}`);
	args.push(`--resource-path=${run.resourcePath}`);

	if (format === 'tex') {
		args.push('--natbib', '--to=latex');
	} else {
		args.push('--citeproc');
		if (run.csl) args.push(`--csl=${run.csl}`);
	}
	// xelatex rather than pandoc's default pdflatex, which stops at any Unicode
	// character its input encoding has not been set up for.
	if (format === 'pdf') args.push('--pdf-engine=xelatex');
	if (format === 'md') args.push('--to=markdown-bracketed_spans-fenced_divs-native_divs-native_spans-raw_html');

	args.push(`--output=${run.output}`);
	return args;
}
