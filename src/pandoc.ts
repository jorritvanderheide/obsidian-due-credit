// Running pandoc: the one program this plugin talks to.
import { spawn } from 'child_process';
import { mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import citations from '../pandoc/wikilink-citations.lua';

/** A failure already written as a sentence for the person reading it. */
export class ExportError extends Error {}

/**
 * Call `use` with the citation filter on disk, and clean up afterwards.
 *
 * Pandoc takes a filter as a path, and a plugin ships as one `main.js`, so the
 * filter is bundled into it as text and written out for each export.
 */
export async function withFilter<T>(use: (filter: string) => Promise<T>): Promise<T> {
	const dir = await mkdtemp(join(tmpdir(), 'obsidian-sign-off-'));
	try {
		const filter = join(dir, 'wikilink-citations.lua');
		await writeFile(filter, citations);
		return await use(filter);
	} finally {
		await rm(dir, { recursive: true, force: true });
	}
}

/** Run pandoc with `input` on stdin. Resolves to what it warned about, if anything. */
export function run(executable: string, args: string[], input: string, cwd: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const child = spawn(executable, args, { cwd });
		let stderr = '';
		child.stderr.on('data', (chunk: Buffer) => (stderr += chunk.toString()));
		// A pandoc that exits before reading all of stdin closes the pipe on us,
		// and why it exited is in stderr, which `close` reports.
		child.stdin.on('error', () => {});
		child.on('error', (error: NodeJS.ErrnoException) => {
			reject(
				error.code === 'ENOENT'
					? new ExportError(`Pandoc was not found at "${executable}". Install it, or set its path in the Sign Off settings.`)
					: error,
			);
		});
		child.on('close', (code) => {
			if (code === 0) resolve(stderr.trim());
			else reject(new ExportError(stderr.trim() || `Pandoc stopped with exit code ${code ?? 'unknown'}.`));
		});
		child.stdin.end(input);
	});
}
