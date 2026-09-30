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

/**
 * Whether one newline in the note is a line break, as Obsidian shows it: unless
 * its strict line breaks are on, which they are not by default, and pandoc
 * would join the lines. `app` is the vault's `app.json`, which holds the
 * setting, since the plugin API does not.
 */
export function lineBreaks(app: unknown): boolean {
	return !(app !== null && typeof app === 'object' && (app as Record<string, unknown>).strictLineBreaks === true);
}

export interface Run {
	/** The filter for Obsidian's syntax that is not about citations, on disk. */
	obsidian: string;
	/** The citation filter, on disk. */
	filter: string;
	/** The filter that clears the bibliography's and the style's paths after citeproc, on disk. */
	afterCiteproc: string;
	/** `MARKDOWN_TEMPLATE`, on disk. */
	template: string;
	/** The folder holding Open Sans, on disk. */
	fonts: string;
	/** The document's metadata, as JSON on disk. */
	metadata: string;
	/** The bibliography, on disk, or null to export without citations. */
	bibliography: string | null;
	/** A `.csl` file, or null for pandoc's built-in style. */
	csl: string | null;
	/** Where pandoc looks for images, joined with the platform's delimiter. */
	resourcePath: string;
	/** Whether one newline is a line break, from `lineBreaks`. */
	hardLineBreaks: boolean;
	/** The Word template, on disk, or null for pandoc's own styles. */
	referenceDoc: string | null;
	/** Pandoc arguments of your own, from `splitArgs`, none of them `refused`. */
	extra: string[];
	output: string;
}

/**
 * Pandoc's arguments for one format. The note itself goes in on stdin, and its
 * metadata in a file of its own: pandoc reads a block between `---` lines as
 * metadata wherever it is, and in the note that is text Obsidian shows, whose
 * keys would travel inside a Word file. The two table syntaxes Obsidian does
 * not have go too, since they read the same block as a table, and so do the
 * blank lines pandoc wants before a list, a quote and a heading, which
 * Obsidian does not: a callout inside a callout is a quote right after a line.
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
 *   style is applied, because the class decides. Natbib's commands, unless
 *   your arguments ask for biblatex's, whose `\autocite` is a footnote in a
 *   class with a footnote style.
 */
export function pandocArgs(format: Format, run: Run): string[] {
	const breaks = run.hardLineBreaks ? '+hard_line_breaks' : '';
	const args = [
		`--from=markdown+wikilinks_title_after_pipe+mark+lists_without_preceding_blankline${breaks}-yaml_metadata_block-simple_tables-multiline_tables-blank_before_blockquote-blank_before_header`,
		`--metadata-file=${run.metadata}`,
		`--lua-filter=${run.obsidian}`,
		`--lua-filter=${run.filter}`,
	];
	if (run.bibliography) args.push(`--bibliography=${run.bibliography}`);
	args.push(`--resource-path=${run.resourcePath}`);
	if (format === 'docx' && run.referenceDoc) args.push(`--reference-doc=${run.referenceDoc}`);
	// xelatex rather than pandoc's default pdflatex, which stops at any Unicode
	// character its input encoding has not been set up for.
	if (format === 'pdf') {
		args.push('--pdf-engine=xelatex');
		// Open Sans rather than LaTeX's Latin Modern, whose hairline strokes look
		// grey and soft on a screen. Bundled, because few machines have it and
		// xelatex stops at a font it cannot find. A font of yours replaces it.
		if (!choosesFont(run.extra)) args.push(...openSans(run.fonts));
		// Left-aligned, where justifying stretches the spaces and hyphenates, and
		// one space after a full stop or colon, where LaTeX puts a wider one.
		args.push('--variable=header-includes=\\frenchspacing', '--variable=header-includes=\\raggedright');
	}
	if (format === 'md') {
		// Text for pasting elsewhere, so none of pandoc's own syntax: no `{=html}`
		// or `{#id .class}`, no divs or spans. Highlights as Obsidian writes them.
		args.push('--to=markdown+mark-bracketed_spans-fenced_divs-native_divs-native_spans-raw_html-raw_attribute-header_attributes');
		args.push('--standalone', `--template=${run.template}`, '--shift-heading-level-by=1');
	}

	// Yours after these, so an option of yours wins over its default here, and
	// before citeproc, so a filter of yours, such as pandoc-crossref, runs where
	// it has to: after these filters and before citations are rendered. LaTeX's
	// citation commands only for LaTeX: the other formats render citations with
	// citeproc, and a PDF would stop at a bibliography its LaTeX never had.
	args.push(...(styled(format) ? run.extra.filter((arg) => !CITATION_COMMANDS.includes(arg)) : run.extra));

	if (styled(format)) {
		// Citeproc needs the paths, and the file never does: the Word writer
		// would keep them as properties, user name and all.
		args.push('--citeproc', `--lua-filter=${run.afterCiteproc}`);
		if (run.csl) args.push(`--csl=${run.csl}`);
	} else {
		if (!run.extra.some((arg) => CITATION_COMMANDS.includes(arg))) args.push('--natbib');
		args.push('--to=latex');
	}

	args.push(`--output=${run.output}`);
	return args;
}

/** The options that choose LaTeX's citation commands. */
const CITATION_COMMANDS = ['--natbib', '--biblatex'];

/**
 * Open Sans from `folder`, through fontspec. The path is written with forward
 * slashes, which TeX reads on Windows too, and detokenized, so a `~` in it, as
 * in a Windows short name, stays a character.
 */
function openSans(folder: string): string[] {
	const path = folder.replace(/\\/g, '/').replace(/\/?$/, '/');
	const options = [`Path={\\detokenize{${path}}}`, 'Extension=.ttf', 'UprightFont=*-Regular', 'ItalicFont=*-Italic', 'BoldFont=*-Bold', 'BoldItalicFont=*-BoldItalic'];
	return ['--variable=mainfont=OpenSans', ...options.map((option) => `--variable=mainfontoptions=${option}`)];
}

/**
 * Whether your own arguments set the main font. Pandoc's variables override
 * its metadata, so Open Sans would win over your `-M mainfont`, and join your
 * `-V mainfont` as a list.
 */
function choosesFont(extra: string[]): boolean {
	return extra.some(
		(arg, i) => /^(-V|-M|--variable=|--metadata=)mainfont[=:]/.test(arg) || (/^mainfont[=:]/.test(arg) && ['-V', '-M', '--variable', '--metadata'].includes(extra[i - 1] ?? '')),
	);
}

/**
 * The Pandoc arguments setting, as arguments: split at spaces, with quotes,
 * single or double, holding a value with spaces together, and `~` at the start
 * of a path as the home folder. A backslash is only a backslash, so a Windows
 * path is written as it is.
 */
export function splitArgs(value: string, home: string): string[] {
	const args: string[] = [];
	let arg: string | null = null;
	let quote: string | null = null;
	for (const char of value) {
		if (quote !== null) {
			if (char === quote) quote = null;
			else arg += char;
		} else if (char === '"' || char === "'") {
			quote = char;
			arg ??= '';
		} else if (/\s/.test(char)) {
			if (arg !== null) args.push(arg);
			arg = null;
		} else {
			arg = (arg ?? '') + char;
		}
	}
	if (arg !== null) args.push(arg);
	return args.map((each) => each.replace(/^~(?=\/|$)/, home).replace(/^(--[\w-]+=)~(?=\/)/, `$1${home}`));
}

// What Due Credit decides itself, or what would break a promise it makes, and
// why, by the options that do it: long ones by name, short ones with or
// without their value attached.
const REFUSED: [string[], string][] = [
	[['-o', '--output'], 'the save dialog decides where the export goes, and that it is not in the vault'],
	[['-f', '-r', '--from', '--read'], 'the note is read the way Obsidian writes it'],
	[['-t', '-w', '--to', '--write'], 'the export command decides the format'],
	[['-d', '--defaults'], 'a defaults file can set any of what Due Credit decides'],
	[['--extract-media', '--log'], 'it writes a file of its own, which could be in the vault'],
	[['-h', '--help', '-v', '--version', '-D', '--print-default-template', '--print-default-data-file', '--print-highlight-style', '--list-input-formats', '--list-output-formats', '--list-extensions', '--list-highlight-languages', '--list-highlight-styles', '--dump-args', '--bash-completion'], 'it prints something and exports nothing'],
];

/** The first argument Due Credit will not pass on, and why, or null. */
export function refused(args: string[]): { arg: string; why: string } | null {
	for (const arg of args) {
		for (const [options, why] of REFUSED) {
			const hit = options.some((option) =>
				option.startsWith('--') ? arg === option || arg.startsWith(`${option}=`) : !arg.startsWith('--') && arg.startsWith(option),
			);
			if (hit) return { arg, why };
		}
	}
	return null;
}

/**
 * The files pandoc would read instead of the note, from `pandoc --dump-args`
 * with the extra arguments: the output on its first line, then the inputs, `-`
 * for standard input. A word pandoc does not take as an option's value is a
 * file to read, and the export would be of that file.
 */
export function inputFiles(dump: string): string[] {
	return dump
		.split(/\r?\n/)
		.slice(1)
		.map((line) => line.trim())
		.filter((line) => line !== '' && line !== '-');
}
