// Paths, as strings. Nothing here touches the disk.
import { basename, dirname, extname, isAbsolute, join, relative, sep } from 'path';

/** `~` and `~/…` as the home folder, the way a shell reads them. */
export function expandHome(path: string, home: string): string {
	if (path === '~') return home;
	if (path.startsWith('~/')) return join(home, path.slice(2));
	return path;
}

/**
 * Where the bibliography is on disk: a path relative to the vault inside it,
 * or an absolute one, or one starting with `~`, outside it. Better BibTeX
 * often keeps its auto-export in a folder of its own.
 */
export function bibliographyPath(value: string, vault: string, home: string): string {
	const path = expandHome(value, home);
	return isAbsolute(path) ? path : join(vault, path);
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

/** Whether `path` is inside `folder`, on disk. `..draft.md` is a name, not a way out. */
export function within(folder: string, path: string): boolean {
	const rel = relative(folder, path);
	return rel !== '' && rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel);
}

/**
 * Whether a file picked in the save dialog is inside the vault, however either
 * is reached. The path as picked catches a folder in the vault that is a
 * symlink to somewhere else, and the real path a vault opened through a
 * symlink, or a file outside it that is a symlink to a note. `realpath` throws
 * for a path that does not exist, and a new file's folder is resolved instead.
 */
export function insideVault(vault: string, output: string, realpath: (path: string) => string): boolean {
	let real: string;
	try {
		real = realpath(output);
	} catch {
		real = join(realpath(dirname(output)), basename(output));
	}
	const vaults = [vault, realpath(vault)];
	return [output, real].some((path) => vaults.some((folder) => within(folder, path)));
}

/**
 * The path with the format's extension, unless it ends in it already. Pandoc
 * picks the format from the extension, and without one makes HTML, so a name
 * typed over the dialog's without it would be the wrong kind of file.
 */
export function withExtension(path: string, extension: string): string {
	return extname(path).toLowerCase() === `.${extension}` ? path : `${path}.${extension}`;
}

/** Whether a vault path is inside a vault folder. */
export function inFolder(path: string, folder: string): boolean {
	return path.startsWith(`${folder.replace(/\/+$/, '')}/`);
}
