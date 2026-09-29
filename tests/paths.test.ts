import { describe, expect, it } from 'vitest';
import { bibliographyPath, cslPath, expandHome, inFolder, insideVault, withExtension, within } from '../src/core/paths';

describe('expandHome', () => {
	it('reads ~ as the home folder, and nothing else', () => {
		expect(expandHome('~', '/home/a')).toBe('/home/a');
		expect(expandHome('~/Documents', '/home/a')).toBe('/home/a/Documents');
		expect(expandHome('/srv/~x', '/home/a')).toBe('/srv/~x');
	});
});

describe('bibliographyPath', () => {
	it('reads a relative path in the vault, and an absolute or ~ one outside it', () => {
		expect(bibliographyPath('Literature/library.bib', '/v', '/home/a')).toBe('/v/Literature/library.bib');
		expect(bibliographyPath('/srv/zotero/library.bib', '/v', '/home/a')).toBe('/srv/zotero/library.bib');
		expect(bibliographyPath('~/Zotero/library.bib', '/v', '/home/a')).toBe('/home/a/Zotero/library.bib');
	});
});

describe('cslPath', () => {
	it('looks a bare name up among the styles', () => {
		expect(cslPath('apa', '/z/styles')).toBe('/z/styles/apa.csl');
		expect(cslPath('apa.csl', '/z/styles')).toBe('/z/styles/apa.csl');
	});

	it('takes a path as given', () => {
		expect(cslPath('/styles/mine.csl', '/z/styles')).toBe('/styles/mine.csl');
	});
});

describe('within', () => {
	it('is true only strictly inside the folder', () => {
		expect(within('/vault', '/vault/Notes/a.md')).toBe(true);
		expect(within('/vault', '/vault')).toBe(false);
		expect(within('/vault', '/vault-2/a.md')).toBe(false);
		expect(within('/vault', '/home/a/Documents/a.md')).toBe(false);
	});

	it('reads a name that starts with .. as a name', () => {
		expect(within('/vault', '/vault/..draft.md')).toBe(true);
		expect(within('/vault', '/vault/..archive/a.md')).toBe(true);
		expect(within('/vault', '/vault/../a.md')).toBe(false);
	});
});

describe('insideVault', () => {
	// A stand-in for the disk: what each path resolves to, and nothing else exists.
	const real: Record<string, string> = {
		'/data/vault': '/data/vault',
		'/home/a/vault': '/data/vault',
		'/data/vault/Drafts': '/elsewhere/drafts',
		'/home/a/Out': '/home/a/Out',
		'/home/a/Out/link.md': '/data/vault/Note.md',
	};
	const realpath = (path: string) => {
		const resolved = real[path];
		if (resolved === undefined) throw new Error(`ENOENT: ${path}`);
		return resolved;
	};

	it('finds a vault opened through a symlink', () => {
		expect(insideVault('/home/a/vault', '/data/vault/new.md', realpath)).toBe(true);
	});

	it('finds a folder in the vault that is a symlink out of it', () => {
		expect(insideVault('/data/vault', '/data/vault/Drafts/Chapter.md', realpath)).toBe(true);
	});

	it('finds a file outside that is a symlink to a note', () => {
		expect(insideVault('/data/vault', '/home/a/Out/link.md', realpath)).toBe(true);
	});

	it('lets a new file outside the vault through', () => {
		expect(insideVault('/data/vault', '/home/a/Out/new.md', realpath)).toBe(false);
	});
});

describe('withExtension', () => {
	it('adds the extension when the name does not end in it', () => {
		expect(withExtension('/out/Chapter', 'docx')).toBe('/out/Chapter.docx');
		expect(withExtension('/out/notes.txt', 'docx')).toBe('/out/notes.txt.docx');
		expect(withExtension('/out/v1.2', 'pdf')).toBe('/out/v1.2.pdf');
	});

	it('leaves a name that ends in it, in any case', () => {
		expect(withExtension('/out/Chapter.docx', 'docx')).toBe('/out/Chapter.docx');
		expect(withExtension('/out/Chapter.PDF', 'pdf')).toBe('/out/Chapter.PDF');
	});
});

describe('inFolder', () => {
	it('matches the folder, not a prefix of its name', () => {
		expect(inFolder('Literature/a.md', 'Literature')).toBe(true);
		expect(inFolder('Literature/a.md', 'Literature/')).toBe(true);
		expect(inFolder('Literature notes/a.md', 'Literature')).toBe(false);
	});
});
