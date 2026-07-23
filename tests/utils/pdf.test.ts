import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import {
	compressPdf,
	deletePdfPages,
	extractPdfPages,
	imagesToPdf,
	parsePageSelection,
	readPdfMetadata,
	reorderPdfPages,
	rotatePdf,
	splitPdf
} from '../../src/lib/utils/pdf';

async function createMultiPagePdf(pages: string[]): Promise<Uint8Array> {
	const doc = await PDFDocument.create();
	for (const label of pages) {
		const page = doc.addPage([200, 200]);
		page.drawText(label, { x: 50, y: 100, size: 12 });
	}
	doc.setTitle('Test PDF');
	doc.setAuthor('HeyTools Tests');
	return doc.save();
}

describe('parsePageSelection', () => {
	it('parses single pages and ranges', () => {
		expect(parsePageSelection('1,3-5', 6)).toEqual([0, 2, 3, 4]);
	});

	it('sorts pages and deduplicates', () => {
		expect(parsePageSelection('5,1,3', 6)).toEqual([0, 2, 4]);
	});

	it('swaps reversed ranges', () => {
		expect(parsePageSelection('5-3', 6)).toEqual([2, 3, 4]);
	});

	it('throws on empty spec', () => {
		expect(() => parsePageSelection('', 3)).toThrow(/Enter page numbers/);
	});

	it('throws on out-of-range pages', () => {
		expect(() => parsePageSelection('9', 3)).toThrow(/out of range/);
	});

	it('throws on invalid tokens', () => {
		expect(() => parsePageSelection('a', 3)).toThrow(/Invalid page token/);
	});
});

describe('splitPdf', () => {
	it('splits every page in all mode', async () => {
		const pdf = await createMultiPagePdf(['A', 'B', 'C']);
		const out = await splitPdf(pdf, 'all');
		expect(out.pageCount).toBe(3);
		expect(out.files).toHaveLength(3);
		expect(out.files[0]?.name).toBe('page-1.pdf');
	});

	it('extracts a range into one file', async () => {
		const pdf = await createMultiPagePdf(['A', 'B', 'C']);
		const out = await splitPdf(pdf, 'ranges', '1,3');
		expect(out.files).toHaveLength(1);
		const loaded = await PDFDocument.load(out.files[0]!.bytes);
		expect(loaded.getPageCount()).toBe(2);
	});
});

describe('compressPdf', () => {
	it('returns rewritten bytes and sizes', async () => {
		const pdf = await createMultiPagePdf(['A']);
		const out = await compressPdf(pdf);
		expect(out.pageCount).toBe(1);
		expect(out.originalBytes).toBe(pdf.length);
		expect(out.compressedBytes).toBe(out.pdfBytes.length);
		expect(out.pdfBytes.byteLength).toBeGreaterThan(0);
	});
});

describe('rotatePdf', () => {
	it('rotates selected pages', async () => {
		const pdf = await createMultiPagePdf(['A', 'B']);
		const out = await rotatePdf(pdf, 90, '1');
		expect(out.rotated).toBe(1);
		expect(out.pageCount).toBe(2);
	});
});

describe('deletePdfPages', () => {
	it('removes pages and keeps the rest', async () => {
		const pdf = await createMultiPagePdf(['A', 'B', 'C']);
		const out = await deletePdfPages(pdf, '2');
		expect(out.removed).toBe(1);
		expect(out.pageCount).toBe(2);
	});

	it('cannot delete every page', async () => {
		const pdf = await createMultiPagePdf(['A']);
		await expect(deletePdfPages(pdf, '1')).rejects.toThrow(/Cannot delete every page/);
	});
});

describe('extractPdfPages', () => {
	it('copies selected pages', async () => {
		const pdf = await createMultiPagePdf(['A', 'B', 'C']);
		const out = await extractPdfPages(pdf, '2,3');
		expect(out.pageCount).toBe(2);
	});
});

describe('reorderPdfPages', () => {
	it('reorders all pages', async () => {
		const pdf = await createMultiPagePdf(['A', 'B', 'C']);
		const out = await reorderPdfPages(pdf, '3,1,2');
		expect(out.pageCount).toBe(3);
	});

	it('requires every page once', async () => {
		const pdf = await createMultiPagePdf(['A', 'B']);
		await expect(reorderPdfPages(pdf, '1')).rejects.toThrow(/expected 2 pages/);
		await expect(reorderPdfPages(pdf, '1,1')).rejects.toThrow(/duplicate/);
	});
});

describe('imagesToPdf', () => {
	it('embeds PNG bytes into a PDF', async () => {
		const png = Uint8Array.from(
			atob(
				'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
			),
			(c) => c.charCodeAt(0)
		);

		const out = await imagesToPdf([{ bytes: png, mime: 'image/png' }]);
		expect(out.pageCount).toBe(1);
		const loaded = await PDFDocument.load(out.pdfBytes);
		expect(loaded.getPageCount()).toBe(1);
	});

	it('rejects unsupported image types', async () => {
		await expect(
			imagesToPdf([{ bytes: new Uint8Array([1, 2, 3]), mime: 'image/gif' }])
		).rejects.toThrow(/Unsupported image type/);
	});
});

describe('readPdfMetadata', () => {
	it('reads common fields', async () => {
		const pdf = await createMultiPagePdf(['A']);
		const out = await readPdfMetadata(pdf);
		expect(out.pageCount).toBe(1);
		expect(out.fields.find((f) => f.key === 'Title')?.value).toBe('Test PDF');
		expect(out.fields.find((f) => f.key === 'Author')?.value).toBe('HeyTools Tests');
	});
});
