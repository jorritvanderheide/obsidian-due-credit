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
 * heading or block reference, a folder, or `.md`.
 */
export function keyOf(target: string): string {
	const path = linkpathOf(target);
	return path.slice(path.lastIndexOf('/') + 1).replace(/\.md$/, '');
}

/**
 * The keys of links to papers that the bibliography does not have, each once.
 *
 * Only links to papers, because every other link is meant to become its words.
 * A paper whose key is missing is almost always a key Better BibTeX changed, or
 * an auto-export that has not run yet, and the filter would print its name
 * where the citation should be.
 */
export function missingKeys(targets: string[], isPaper: (target: string) => boolean, keys: Set<string>): string[] {
	const missing = new Set<string>();
	for (const target of targets) {
		const key = keyOf(target);
		if (!keys.has(key) && isPaper(target)) missing.add(key);
	}
	return [...missing].sort();
}
