import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { run } from '../../src/lib/tools/pdf-split';

async function createPdf(pageCount: number): Promise<Uint8Array> {
	const doc = await PDFDocument.create();
	for (let i = 0; i < pageCount; i++) doc.addPage([100, 100]);
	return doc.save();
}

describe('pdf-split', () => {
	it('splits all pages', async () => {
		const pdf = await createPdf(2);
		const out = await run({ pdf, mode: 'all' });
		expect(out.files).toHaveLength(2);
	});

	it('splits a page range', async () => {
		const pdf = await createPdf(3);
		const out = await run({ pdf, mode: 'ranges', ranges: '1,3' });
		expect(out.files).toHaveLength(1);
		expect(out.files[0]?.name).toBe('split.pdf');
	});
});
