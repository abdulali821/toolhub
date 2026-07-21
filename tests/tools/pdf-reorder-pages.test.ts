import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { run } from '../../src/lib/tools/pdf-reorder-pages';

async function createPdf(): Promise<Uint8Array> {
	const doc = await PDFDocument.create();
	doc.addPage([100, 100]);
	doc.addPage([100, 100]);
	return doc.save();
}

describe('pdf-reorder-pages', () => {
	it('reorders pages', async () => {
		const pdf = await createPdf();
		const out = await run({ pdf, orderSpec: '2,1' });
		expect(out.pageCount).toBe(2);
	});
});
