import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { run } from '../../src/lib/tools/pdf-metadata';

async function createPdf(): Promise<Uint8Array> {
	const doc = await PDFDocument.create();
	doc.addPage([100, 100]);
	doc.setTitle('Meta Test');
	return doc.save();
}

describe('pdf-metadata', () => {
	it('reads metadata fields', async () => {
		const pdf = await createPdf();
		const out = await run({ pdf });
		expect(out.pageCount).toBe(1);
		expect(out.fields.find((f) => f.key === 'Title')?.value).toBe('Meta Test');
	});
});
