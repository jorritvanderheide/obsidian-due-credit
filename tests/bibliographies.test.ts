import { describe, expect, it } from 'vitest';
import { keysReadable } from '../src/core/bibliographies';

describe('keysReadable', () => {
	it('is true when every bibliography is a .bib, whose keys the check can read', () => {
		expect(keysReadable(['/v/library.bib', '/home/a/extra.BIBTEX'])).toBe(true);
	});

	it('is false with none, or with one of another kind, whose keys it can not', () => {
		expect(keysReadable([])).toBe(false);
		expect(keysReadable(['/v/library.bib', '/v/more.json'])).toBe(false);
		expect(keysReadable(['/v/library.yaml'])).toBe(false);
	});
});
