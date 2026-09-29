// Which wikilinks are citations, as the pandoc filter decides it.
//
// `pandoc/wikilink-citations.lua` makes a link a citation when the key it names
// is in the bibliography. These are the same two rules in TypeScript, so the
// export can say which citations are about to be lost before pandoc loses them.
// Change one side and the other has to follow.

/** `@article{key,` and every other entry type, as the filter's `read_bib` reads it. */
const ENTRY = /^\s*@\w+\s*[{(]\s*([^,\s]+)\s*,/;

/** Every entry key in a `.bib` file. */
export function bibKeys(bib: string): Set<string> {
	const keys = new Set<string>();
	for (const line of bib.split(/\r?\n/)) {
		const key = ENTRY.exec(line)?.[1];
		if (key) keys.add(key);
	}
	return keys;
}

/** A wikilink target without its heading or block reference. */
export function linkpathOf(target: string): string {
	return target.replace(/[#^].*$/, '');
}

/**
 * The key a wikilink target names, as the filter's `key_of` reads it: without a
 * heading or block reference, a folder, `.md`, or the `@` that the Citations
 * plugin puts in front of a literature note's name.
 */
export function keyOf(target: string): string {
	const path = linkpathOf(target);
	return path
		.slice(path.lastIndexOf('/') + 1)
		.replace(/\.md$/, '')
		.replace(/^@/, '');
}

/** A note's citation key, from the named frontmatter property, or null when it has none. */
export function propertyKey(frontmatter: unknown, property: string): string | null {
	if (frontmatter === null || typeof frontmatter !== 'object') return null;
	const value = (frontmatter as Record<string, unknown>)[property];
	return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

/**
 * The alias with the key it repeats, as a word, swapped for another: the same
 * rule the filter's `spelled` reads it by, so a citation whose target moves
 * keeps its page.
 */
export function renameInAlias(alias: string, from: string, to: string): string {
	let at = alias.indexOf(from);
	while (at !== -1) {
		// A `-` against the key leaves the author out, and stays with the new key.
		const start = alias[at - 1] === '-' ? at - 1 : at;
		const before = start === 0 || /\s/.test(alias[start - 1] ?? '');
		const end = at + from.length;
		const after = end === alias.length || /[\s,;]/.test(alias[end] ?? '');
		if (before && after) return alias.slice(0, at) + to + alias.slice(end);
		at = alias.indexOf(from, at + 1);
	}
	return alias;
}

/**
 * The keys of links to papers that the bibliography does not have, each once.
 *
 * `keyFor` says which key a link cites, or null when it links to something
 * that is not a paper, since every other link is meant to become its words. A
 * paper whose key is missing is almost always a key Better BibTeX changed, or
 * an auto-export that has not run yet, and the filter would print its name
 * where the citation should be.
 */
export function missingKeys(targets: string[], keyFor: (target: string) => string | null, keys: Set<string>): string[] {
	const missing = new Set<string>();
	for (const target of targets) {
		const key = keyFor(target);
		if (key !== null && !keys.has(key)) missing.add(key);
	}
	return [...missing].sort();
}
