import { describe, expect, it } from 'vitest';
import { run } from '../../src/lib/tools/images-to-pdf';

const MIN_PNG = Uint8Array.from(
	atob(
		'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
	),
	(c) => c.charCodeAt(0)
);

describe('images-to-pdf', () => {
	it('creates a PDF from images', async () => {
		const out = await run({ images: [{ bytes: MIN_PNG, mime: 'image/png' }] });
		expect(out.pageCount).toBe(1);
		expect(out.pdfBytes.byteLength).toBeGreaterThan(0);
	});
});
