// Running pandoc: the one program this plugin talks to.
import { spawn } from 'child_process';
import { mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import afterCiteproc from '../pandoc/after-citeproc.lua';
import citations from '../pandoc/wikilink-citations.lua';
import { MARKDOWN_TEMPLATE } from './core/document';

/** A failure already written as a sentence for the person reading it. */
export class ExportError extends Error {}

/**
 * Call `use` with the filters, the Markdown template and the document's
 * metadata on disk, and clean up afterwards.
 *
 * Pandoc takes all of them as paths. A plugin ships as one `main.js`, so the
 * filters and the template are bundled into it as text and written out for
 * each export. The metadata is JSON, which pandoc reads as the YAML it is.
 */
export async function withFiles<T>(
	metadata: Record<string, unknown>,
	use: (files: { filter: string; afterCiteproc: string; template: string; metadata: string }) => Promise<T>,
): Promise<T> {
	const dir = await mkdtemp(join(tmpdir(), 'obsidian-due-credit-'));
	try {
		const files = {
			filter: join(dir, 'wikilink-citations.lua'),
			afterCiteproc: join(dir, 'after-citeproc.lua'),
			template: join(dir, 'markdown.template'),
			metadata: join(dir, 'metadata.json'),
		};
		await writeFile(files.filter, citations);
		await writeFile(files.afterCiteproc, afterCiteproc);
		await writeFile(files.template, MARKDOWN_TEMPLATE);
		await writeFile(files.metadata, JSON.stringify(metadata));
		return await use(files);
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
					? new ExportError(`Pandoc was not found at "${executable}". Install it, or set its path in the Due Credit settings.`)
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
