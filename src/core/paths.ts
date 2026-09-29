// Paths, as strings. Nothing here touches the disk.
import { isAbsolute, join, relative } from 'path';

/** `~` and `~/…` as the home folder, the way a shell reads them. */
export function expandHome(path: string, home: string): string {
	if (path === '~') return home;
	if (path.startsWith('~/')) return join(home, path.slice(2));
	return path;
}

/**
 * Where a citation style is: a path as given, or a bare name looked up among
 * the styles Zotero has installed, so `apa` works as well as a full path. One
 * place to manage them: Zotero ships a set and installs more under Settings >
 * Cite.
 */
export function cslPath(value: string, styles: string): string {
	if (/[/\\]/.test(value)) return value;
	return join(styles, `${value.replace(/\.csl$/i, '')}.csl`);
}

/** Whether `path` is inside `folder`, on disk. */
export function within(folder: string, path: string): boolean {
	const rel = relative(folder, path);
	return rel !== '' && !rel.startsWith('..') && !isAbsolute(rel);
}

/** Whether a vault path is inside a vault folder. */
export function inFolder(path: string, folder: string): boolean {
	return path.startsWith(`${folder.replace(/\/+$/, '')}/`);
}
