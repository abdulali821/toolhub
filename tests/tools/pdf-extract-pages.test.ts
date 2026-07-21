import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { run } from '../../src/lib/tools/pdf-extract-pages';

async function createPdf(): Promise<Uint8Array> {
	const doc = await PDFDocument.create();
	doc.addPage([100, 100]);
	doc.addPage([100, 100]);
	return doc.save();
}

describe('pdf-extract-pages', () => {
	it('extracts selected pages', async () => {
		const pdf = await createPdf();
		const out = await run({ pdf, pagesSpec: '2' });
		expect(out.pageCount).toBe(1);
	});
});
