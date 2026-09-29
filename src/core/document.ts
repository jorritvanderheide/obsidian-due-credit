// What pandoc is asked to make: the document's metadata and the command line.

export type Format = 'docx' | 'pdf' | 'md' | 'tex';

export const FORMATS: Record<Format, { name: string; extension: string }> = {
	docx: { name: 'Word', extension: 'docx' },
	pdf: { name: 'PDF', extension: 'pdf' },
	md: { name: 'Markdown', extension: 'md' },
	tex: { name: 'LaTeX', extension: 'tex' },
};

/** Whether a format renders its citations in a style. LaTeX leaves them to the journal's class. */
export function styled(format: Format): boolean {
	return format !== 'tex';
}

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

/**
 * Markdown has no title block of its own, so the title goes on top as a
 * heading. Only the title: the rest of the metadata, and the bibliography's
 * path on your disk with it, stays out of text meant for pasting elsewhere.
 */
export const MARKDOWN_TEMPLATE = '$if(title)$# $title$\n\n$endif$$body$\n';

export interface Run {
	/** The filter for Obsidian's syntax that is not about citations, on disk. */
	obsidian: string;
	/** The citation filter, on disk. */
	filter: string;
	/** The filter that clears the bibliography's and the style's paths after citeproc, on disk. */
	afterCiteproc: string;
	/** `MARKDOWN_TEMPLATE`, on disk. */
	template: string;
	/** The document's metadata, as JSON on disk. */
	metadata: string;
	/** The bibliography, on disk, or null to export without citations. */
	bibliography: string | null;
	/** A `.csl` file, or null for pandoc's built-in style. */
	csl: string | null;
	/** Where pandoc looks for images, joined with the platform's delimiter. */
	resourcePath: string;
	output: string;
}

/**
 * Pandoc's arguments for one format. The note itself goes in on stdin, and its
 * metadata in a file of its own: pandoc reads a block between `---` lines as
 * metadata wherever it is, and in the note that is text Obsidian shows, whose
 * keys would travel inside a Word file. The two table syntaxes Obsidian does
 * not have go too, since they read the same block as a table, and so does the
 * blank line pandoc wants before a quote, which Obsidian does not: a callout
 * inside a callout is a quote right after a line.
 *
 * The order matters: pandoc runs filters and citeproc in the order they are
 * given, and citeproc can only resolve citations the filter has already made.
 *
 * - Word, PDF and Markdown render citations and a reference list with
 *   citeproc, in the chosen style.
 * - Markdown has its title as a heading on top, and every other heading,
 *   References too, a level under it. Shifted by pandoc rather than in
 *   `liftHeadings`, because citeproc adds References after the note is read.
 * - LaTeX is a body to paste into a journal's or conference's class, with the
 *   `\cite` commands intact so its own bibliography style formats them. No
 *   style is applied, because the class decides.
 */
export function pandocArgs(format: Format, run: Run): string[] {
	const args = [
		'--from=markdown+wikilinks_title_after_pipe-yaml_metadata_block-simple_tables-multiline_tables-blank_before_blockquote',
		`--metadata-file=${run.metadata}`,
		`--lua-filter=${run.obsidian}`,
		`--lua-filter=${run.filter}`,
	];
	if (run.bibliography) args.push(`--bibliography=${run.bibliography}`);
	args.push(`--resource-path=${run.resourcePath}`);

	if (styled(format)) {
		// Citeproc needs the paths, and the file never does: the Word writer
		// would keep them as properties, user name and all.
		args.push('--citeproc', `--lua-filter=${run.afterCiteproc}`);
		if (run.csl) args.push(`--csl=${run.csl}`);
	} else {
		args.push('--natbib', '--to=latex');
	}
	// xelatex rather than pandoc's default pdflatex, which stops at any Unicode
	// character its input encoding has not been set up for.
	if (format === 'pdf') args.push('--pdf-engine=xelatex');
	if (format === 'md') {
		// Text for pasting elsewhere, so none of pandoc's own syntax: no `{=html}`
		// or `{#id .class}`, no divs or spans.
		args.push('--to=markdown-bracketed_spans-fenced_divs-native_divs-native_spans-raw_html-raw_attribute-header_attributes');
		args.push('--standalone', `--template=${run.template}`, '--shift-heading-level-by=1');
	}

	args.push(`--output=${run.output}`);
	return args;
}
