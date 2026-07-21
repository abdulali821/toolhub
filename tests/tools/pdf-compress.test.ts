import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { run } from '../../src/lib/tools/pdf-compress';

async function createPdf(): Promise<Uint8Array> {
	const doc = await PDFDocument.create();
	doc.addPage([100, 100]);
	doc.setTitle('Test');
	doc.setAuthor('ToolHub');
	return doc.save();
}

describe('pdf-compress', () => {
	it('rewrites a PDF in structure mode', async () => {
		const pdf = await createPdf();
		const out = await run({ pdf, mode: 'structure' });
		expect(out.pageCount).toBe(1);
		expect(out.mode).toBe('structure');
		expect(out.originalBytes).toBe(pdf.length);
		expect(out.pdfBytes.byteLength).toBeGreaterThan(0);
	});

	it('supports balanced mode', async () => {
		const pdf = await createPdf();
		const out = await run({ pdf, mode: 'balanced' });
		expect(out.mode).toBe('balanced');
		expect(out.pdfBytes.byteLength).toBeGreaterThan(0);
	});

	it('requires rasterize callback for strong mode', async () => {
		const pdf = await createPdf();
		await expect(run({ pdf, mode: 'strong' })).rejects.toThrow(/rasterizer/i);
	});
});
