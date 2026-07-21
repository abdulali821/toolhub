import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { run } from '../../src/lib/tools/pdf-delete-pages';

async function createPdf(): Promise<Uint8Array> {
	const doc = await PDFDocument.create();
	doc.addPage([100, 100]);
	doc.addPage([100, 100]);
	return doc.save();
}

describe('pdf-delete-pages', () => {
	it('deletes selected pages', async () => {
		const pdf = await createPdf();
		const out = await run({ pdf, pagesSpec: '1' });
		expect(out.pageCount).toBe(1);
		expect(out.removed).toBe(1);
	});
});
