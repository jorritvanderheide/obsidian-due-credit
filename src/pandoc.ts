// Running pandoc: the one program this plugin talks to.
import { execFile, spawn } from 'child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import afterCiteproc from '../pandoc/after-citeproc.lua';
import obsidian from '../pandoc/obsidian.lua';
import citations from '../pandoc/wikilink-citations.lua';
import bold from '../fonts/OpenSans-Bold.ttf';
import boldItalic from '../fonts/OpenSans-BoldItalic.ttf';
import italic from '../fonts/OpenSans-Italic.ttf';
import regular from '../fonts/OpenSans-Regular.ttf';
import { MARKDOWN_TEMPLATE } from './core/document';

/** A failure already written as a sentence for the person reading it. */
export class ExportError extends Error {}

/**
 * Call `use` with the filters, the Markdown template, the PDF's font and the
 * document's metadata on disk, and clean up afterwards.
 *
 * Pandoc takes all of them as paths. A plugin ships as one `main.js`, so the
 * filters and the template are bundled into it as text, and the font as bytes,
 * and written out for each export. The metadata is JSON, which pandoc reads as
 * the YAML it is.
 */
export async function withFiles<T>(
	metadata: Record<string, unknown>,
	use: (files: { obsidian: string; filter: string; afterCiteproc: string; template: string; fonts: string; metadata: string }) => Promise<T>,
): Promise<T> {
	const dir = await mkdtemp(join(tmpdir(), 'obsidian-due-credit-'));
	try {
		const files = {
			obsidian: join(dir, 'obsidian.lua'),
			filter: join(dir, 'wikilink-citations.lua'),
			afterCiteproc: join(dir, 'after-citeproc.lua'),
			template: join(dir, 'markdown.template'),
			fonts: join(dir, 'fonts'),
			metadata: join(dir, 'metadata.json'),
		};
		await writeFile(files.obsidian, obsidian);
		await writeFile(files.filter, citations);
		await writeFile(files.afterCiteproc, afterCiteproc);
		await writeFile(files.template, MARKDOWN_TEMPLATE);
		await mkdir(files.fonts);
		await writeFile(join(files.fonts, 'OpenSans-Regular.ttf'), regular);
		await writeFile(join(files.fonts, 'OpenSans-Italic.ttf'), italic);
		await writeFile(join(files.fonts, 'OpenSans-Bold.ttf'), bold);
		await writeFile(join(files.fonts, 'OpenSans-BoldItalic.ttf'), boldItalic);
		await writeFile(files.metadata, JSON.stringify(metadata));
		return await use(files);
	} finally {
		await rm(dir, { recursive: true, force: true });
	}
}

/** What pandoc makes of arguments: where it would write, then what it would read, from `--dump-args`. */
export function dumpArgs(executable: string, args: string[], cwd: string): Promise<string> {
	return new Promise((resolve, reject) => {
		execFile(executable, ['--dump-args', ...args], { cwd }, (error: (Error & { code?: unknown }) | null, stdout: string, stderr: string) => {
			if (error === null) resolve(stdout);
			else if (error.code === 'ENOENT') reject(new ExportError(`Pandoc was not found at "${executable}". Install it, or set its path in the Due Credit settings.`));
			else reject(new ExportError(`Pandoc does not take the Pandoc arguments setting: ${stderr.trim() || error.message}`));
		});
	});
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
