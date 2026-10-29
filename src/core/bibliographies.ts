// Which bibliographies the check before an export can read for their keys.

/**
 * Whether the check can know every key the export can cite: only when there's
 * a bibliography and each is a .bib, since `bibKeys` reads only those. With a
 * CSL JSON or YAML one among them, every citation would look missing, so there
 * is no check at all.
 */
export function keysReadable(paths: readonly string[]): boolean {
	return paths.length > 0 && paths.every((path) => /\.(bib|bibtex)$/i.test(path));
}
