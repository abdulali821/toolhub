import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { listEmbeddedImageCandidates } from '../../src/lib/utils/pdf-image-compress';
import { run } from '../../src/lib/tools/pdf-compress';

async function createPdf(): Promise<Uint8Array> {
	const doc = await PDFDocument.create();
	doc.addPage([100, 100]);
	doc.setTitle('Test');
	doc.setAuthor('HeyTools');
	return doc.save();
}

describe('pdf-compress', () => {
	it('rewrites a PDF in high mode', async () => {
		const pdf = await createPdf();
		const out = await run({ pdf, mode: 'high' });
		expect(out.pageCount).toBe(1);
		expect(out.mode).toBe('high');
		expect(out.technique).toBe('rewrite');
		expect(out.imagesReplaced).toBe(0);
		expect(out.imagesScanned).toBe(0);
		expect(out.originalBytes).toBe(pdf.length);
		expect(out.pdfBytes.byteLength).toBeGreaterThan(0);
	});

	it('uses embedded image recompression hook in recommended mode', async () => {
		const pdf = await createPdf();
		const out = await run(
			{ pdf, mode: 'recommended' },
			{
				recompressImages: async () => ({ scanned: 3, replaced: 2, skipped: 1, failed: 0 })
			}
		);
		expect(out.mode).toBe('recommended');
		expect(out.technique).toBe('images');
		expect(out.imagesReplaced).toBe(2);
		expect(out.imagesScanned).toBe(3);
		expect(out.pdfBytes.byteLength).toBeGreaterThan(0);
	});

	it('requires rasterize callback for extreme mode', async () => {
		const pdf = await createPdf();
		await expect(run({ pdf, mode: 'extreme' })).rejects.toThrow(/rasterizer/i);
	});

	it('does not rasterize recommended mode even when rasterize is provided', async () => {
		const pdf = await createPdf();
		const out = await run(
			{ pdf, mode: 'recommended' },
			{
				rasterize: async () => new Uint8Array([1, 2, 3]),
				recompressImages: async () => ({ scanned: 0, replaced: 0, skipped: 0, failed: 0 })
			}
		);
		expect(out.technique).toBe('rewrite');
		expect(out.imagesReplaced).toBe(0);
	});
});

describe('listEmbeddedImageCandidates', () => {
	it('finds embedded JPEG XObjects anywhere in the document', async () => {
		const sharp = await import('sharp');
		const jpeg = await sharp
			.default({
				create: { width: 1800, height: 1200, channels: 3, background: '#336699' }
			})
			.jpeg({ quality: 95 })
			.toBuffer();

		const doc = await PDFDocument.create();
		const image = await doc.embedJpg(jpeg);
		const page = doc.addPage([image.width, image.height]);
		page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
		page.drawText('Selectable text', { x: 40, y: 80, size: 18 });

		const pdf = await doc.save();
		const loaded = await PDFDocument.load(pdf);
		const candidates = listEmbeddedImageCandidates(loaded);
		expect(candidates.length).toBe(1);
		expect(candidates[0]?.decode.kind).toBe('blob');
		expect(candidates[0]?.originalSize).toBeGreaterThan(1000);
	});
});
