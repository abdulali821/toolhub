import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { mergePdfBytes } from '../../src/lib/tools/pdf-merge';

async function createPdf(title: string): Promise<Uint8Array> {
	const doc = await PDFDocument.create();
	const page = doc.addPage([200, 200]);
	page.drawText(title, { x: 50, y: 100, size: 12 });
	return doc.save();
}

describe('pdf-merge', () => {
	it('merges multiple PDFs in order', async () => {
		const first = await createPdf('First');
		const second = await createPdf('Second');
		const out = await mergePdfBytes([first, second]);
		expect(out.pageCount).toBe(2);
		expect(out.pdfBytes.byteLength).toBeGreaterThan(0);

		const loaded = await PDFDocument.load(out.pdfBytes);
		expect(loaded.getPageCount()).toBe(2);
	});
});
