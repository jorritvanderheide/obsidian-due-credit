// A note, made into what pandoc is given: every step, in its order.
import { inFolder } from './paths';
import { keyOf, linkpathOf, missingKeys, propertyKey } from './citations';
import { documentMetadata } from './document';
import { citeByKey, imageEmbeds, liftHeadings, splitFrontmatter, stripBlockIds, stripComments, wikilinkTargets } from './markdown';

/** What a link resolves to, from the note being exported. */
export interface Linked {
	/** Its path in the vault. */
	path: string;
	/** Its path on disk. */
	file: string;
	/** Its frontmatter, when it is a note that has one. */
	frontmatter: unknown;
}

/** What the vault answers, for the note being exported. */
export interface Vault {
	/** The note or file a linkpath resolves to, or null. */
	resolve(linkpath: string): Linked | null;
	/** A frontmatter block, parsed. */
	parseYaml(yaml: string): unknown;
}

export interface Options {
	/** The note's file name, the title of last resort. */
	name: string;
	/** The folder of paper notes. */
	papersFolder: string;
	/** The frontmatter property holding a paper note's citation key. */
	keyProperty: string;
	/** The bibliography's keys, or null when there is none to check against. */
	keys: Set<string> | null;
}

export interface Prepared {
	/** The note as pandoc's markdown, for stdin. */
	markdown: string;
	/** The document's metadata, for a file of its own. */
	metadata: Record<string, unknown>;
	/** Keys of links to papers that the bibliography does not have. */
	missing: string[];
}

/**
 * The note, made into pandoc's input.
 *
 * First what never leaves: comments, then block IDs. The check reads the note
 * then, before any link has been rewritten. Then links to paper notes are
 * pointed at their keys, the title is lifted, and images are resolved on what
 * is left.
 *
 * A link is a paper when the note it resolves to has a key property, whatever
 * the note is called, or is in the papers folder, by its name; only the first
 * kind is pointed at its key, since the second is named for it already. A
 * link within the note, `[[#Heading]]`, is never one, though Obsidian resolves
 * it to the note itself.
 */
export function prepare(text: string, vault: Vault, options: Options): Prepared {
	const resolve = (linkpath: string) => (linkpath === '' ? null : vault.resolve(linkpath));
	const propertyOf = (linkpath: string) => propertyKey(resolve(linkpath)?.frontmatter, options.keyProperty);
	const keyFor = (linkpath: string) => {
		const linked = resolve(linkpath);
		if (linked === null) return null;
		return propertyOf(linkpath) ?? (inFolder(linked.path, options.papersFolder) ? keyOf(linkpath) : null);
	};

	const { yaml, body } = splitFrontmatter(text);
	const prose = stripBlockIds(stripComments(body));
	const missing = options.keys ? missingKeys(wikilinkTargets(prose), (target) => keyFor(linkpathOf(target).trim()), options.keys) : [];

	const { title, body: lifted } = liftHeadings(citeByKey(prose, propertyOf));
	// Forward slashes, which pandoc reads on every platform.
	const markdown = imageEmbeds(lifted, (linkpath) => vault.resolve(linkpath)?.file.replace(/\\/g, '/') ?? null);
	const metadata = documentMetadata(yaml === null ? null : vault.parseYaml(yaml), title, options.name);
	return { markdown, metadata, missing };
}
