import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { run } from '../../src/lib/tools/pdf-rotate';

async function createPdf(): Promise<Uint8Array> {
	const doc = await PDFDocument.create();
	doc.addPage([100, 100]);
	doc.addPage([100, 100]);
	return doc.save();
}

describe('pdf-rotate', () => {
	it('rotates all pages', async () => {
		const pdf = await createPdf();
		const out = await run({ pdf, angle: 90, pagesSpec: 'all' });
		expect(out.rotated).toBe(2);
	});
});
