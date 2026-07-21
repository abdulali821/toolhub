import { PDFDocument, degrees, type PDFPage } from 'pdf-lib';
import * as v from 'valibot';

export const uint8ArraySchema = v.custom<Uint8Array>(
	(input) => input instanceof Uint8Array,
	'Expected binary data'
);

export const PDF_FILE_CONSTRAINTS = {
	maxBytes: 10 * 1024 * 1024,
	accept: 'application/pdf',
	mimeAllowlist: ['application/pdf'],
	extensions: ['.pdf']
};

export function pdfBytesToDataUrl(bytes: Uint8Array): string {
	let binary = '';
	const chunk = 0x8000;
	for (let i = 0; i < bytes.length; i += chunk) {
		binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
	}
	return `data:application/pdf;base64,${btoa(binary)}`;
}

/** Parse "1,3-5,8" style page ranges into 0-based indices. */
export function parsePageSelection(spec: string, pageCount: number): number[] {
	const trimmed = spec.trim();
	if (!trimmed) throw new Error('Enter page numbers (e.g. 1,3-5)');
	const selected = new Set<number>();

	for (const part of trimmed.split(',')) {
		const token = part.trim();
		if (!token) continue;
		const range = token.match(/^(\d+)\s*-\s*(\d+)$/);
		if (range) {
			let start = Number(range[1]);
			let end = Number(range[2]);
			if (start > end) [start, end] = [end, start];
			for (let p = start; p <= end; p++) {
				if (p < 1 || p > pageCount) throw new Error(`Page ${p} is out of range (1–${pageCount})`);
				selected.add(p - 1);
			}
			continue;
		}
		if (!/^\d+$/.test(token)) throw new Error(`Invalid page token: ${token}`);
		const page = Number(token);
		if (page < 1 || page > pageCount)
			throw new Error(`Page ${page} is out of range (1–${pageCount})`);
		selected.add(page - 1);
	}

	if (!selected.size) throw new Error('No pages selected');
	return [...selected].sort((a, b) => a - b);
}

export async function splitPdf(
	bytes: Uint8Array,
	mode: 'all' | 'ranges',
	ranges?: string
): Promise<{ files: { name: string; bytes: Uint8Array }[]; pageCount: number }> {
	const src = await PDFDocument.load(bytes);
	const pageCount = src.getPageCount();
	const files: { name: string; bytes: Uint8Array }[] = [];

	if (mode === 'all') {
		for (let i = 0; i < pageCount; i++) {
			const doc = await PDFDocument.create();
			const [page] = await doc.copyPages(src, [i]);
			doc.addPage(page);
			files.push({ name: `page-${i + 1}.pdf`, bytes: await doc.save() });
		}
		return { files, pageCount };
	}

	const indices = parsePageSelection(ranges ?? '', pageCount);
	const doc = await PDFDocument.create();
	const pages = await doc.copyPages(src, indices);
	for (const page of pages) doc.addPage(page);
	files.push({ name: 'split.pdf', bytes: await doc.save() });
	return { files, pageCount };
}

export async function compressPdf(
	bytes: Uint8Array,
	options: {
		mode?: 'structure' | 'balanced' | 'strong';
		/** Used by strong mode (0.4–0.92). */
		quality?: number;
		/** Render scale for strong mode. */
		scale?: number;
		/**
		 * Browser-only strong compressor. Injected from UI so Node tests stay pure.
		 * Receives PDF bytes and returns compressed PDF bytes.
		 */
		rasterize?: (input: {
			bytes: Uint8Array;
			quality: number;
			scale: number;
		}) => Promise<Uint8Array>;
	} = {}
): Promise<{
	pdfBytes: Uint8Array;
	originalBytes: number;
	compressedBytes: number;
	pageCount: number;
	mode: 'structure' | 'balanced' | 'strong';
}> {
	const mode = options.mode ?? 'structure';
	const quality = options.quality ?? 0.72;
	const scale = options.scale ?? 1.25;

	if (mode === 'strong') {
		if (!options.rasterize) {
			throw new Error('Strong compression requires the browser rasterizer');
		}
		const pdfBytes = await options.rasterize({ bytes, quality, scale });
		const src = await PDFDocument.load(bytes);
		return {
			pdfBytes,
			originalBytes: bytes.length,
			compressedBytes: pdfBytes.length,
			pageCount: src.getPageCount(),
			mode
		};
	}

	const src = await PDFDocument.load(bytes);
	const pageCount = src.getPageCount();
	const out = await PDFDocument.create();
	const pages = await out.copyPages(src, src.getPageIndices());
	for (const page of pages) out.addPage(page);

	if (mode === 'balanced') {
		// Keep title/author lightly; drop bulk metadata that often bloats exports
		const title = src.getTitle();
		if (title) out.setTitle(title);
	} else {
		const title = src.getTitle();
		const author = src.getAuthor();
		if (title) out.setTitle(title);
		if (author) out.setAuthor(author);
	}

	const pdfBytes = await out.save({
		useObjectStreams: true
	});

	return {
		pdfBytes,
		originalBytes: bytes.length,
		compressedBytes: pdfBytes.length,
		pageCount,
		mode
	};
}

export async function rotatePdf(
	bytes: Uint8Array,
	angle: 90 | 180 | 270,
	pagesSpec: string | 'all'
): Promise<{ pdfBytes: Uint8Array; pageCount: number; rotated: number }> {
	const doc = await PDFDocument.load(bytes);
	const pageCount = doc.getPageCount();
	const indices =
		pagesSpec === 'all' || pagesSpec.trim() === ''
			? doc.getPageIndices()
			: parsePageSelection(pagesSpec, pageCount);

	for (const i of indices) {
		const page = doc.getPage(i);
		page.setRotation(degrees((page.getRotation().angle + angle) % 360));
	}

	return { pdfBytes: await doc.save(), pageCount, rotated: indices.length };
}

export async function deletePdfPages(
	bytes: Uint8Array,
	pagesSpec: string
): Promise<{ pdfBytes: Uint8Array; pageCount: number; removed: number }> {
	const src = await PDFDocument.load(bytes);
	const pageCount = src.getPageCount();
	const toRemove = new Set(parsePageSelection(pagesSpec, pageCount));
	if (toRemove.size >= pageCount) throw new Error('Cannot delete every page');

	const keep = src.getPageIndices().filter((i) => !toRemove.has(i));
	const out = await PDFDocument.create();
	const pages = await out.copyPages(src, keep);
	for (const page of pages) out.addPage(page);
	return {
		pdfBytes: await out.save(),
		pageCount: keep.length,
		removed: toRemove.size
	};
}

export async function extractPdfPages(
	bytes: Uint8Array,
	pagesSpec: string
): Promise<{ pdfBytes: Uint8Array; pageCount: number }> {
	const src = await PDFDocument.load(bytes);
	const indices = parsePageSelection(pagesSpec, src.getPageCount());
	const out = await PDFDocument.create();
	const pages = await out.copyPages(src, indices);
	for (const page of pages) out.addPage(page);
	return { pdfBytes: await out.save(), pageCount: indices.length };
}

export async function reorderPdfPages(
	bytes: Uint8Array,
	orderSpec: string
): Promise<{ pdfBytes: Uint8Array; pageCount: number }> {
	const src = await PDFDocument.load(bytes);
	const pageCount = src.getPageCount();
	const order = parsePageSelection(orderSpec, pageCount);
	if (order.length !== pageCount) {
		throw new Error(`Order must list each page exactly once (expected ${pageCount} pages)`);
	}
	if (new Set(order).size !== pageCount) {
		throw new Error('Order contains duplicate pages');
	}

	const out = await PDFDocument.create();
	const pages = await out.copyPages(src, order);
	for (const page of pages) out.addPage(page);
	return { pdfBytes: await out.save(), pageCount };
}

export async function imagesToPdf(
	images: { bytes: Uint8Array; mime: string }[]
): Promise<{ pdfBytes: Uint8Array; pageCount: number }> {
	if (!images.length) throw new Error('Add at least one image');
	const doc = await PDFDocument.create();

	for (const image of images) {
		let embedded;
		if (image.mime === 'image/png' || image.mime.endsWith('png')) {
			embedded = await doc.embedPng(image.bytes);
		} else if (
			image.mime === 'image/jpeg' ||
			image.mime === 'image/jpg' ||
			image.mime.endsWith('jpeg') ||
			image.mime.endsWith('jpg')
		) {
			embedded = await doc.embedJpg(image.bytes);
		} else {
			throw new Error(`Unsupported image type for PDF embedding: ${image.mime}. Use PNG or JPEG.`);
		}
		const page = doc.addPage([embedded.width, embedded.height]);
		page.drawImage(embedded, {
			x: 0,
			y: 0,
			width: embedded.width,
			height: embedded.height
		});
	}

	return { pdfBytes: await doc.save(), pageCount: images.length };
}

export type PdfMetaField = { key: string; value: string };

export async function readPdfMetadata(bytes: Uint8Array): Promise<{
	fields: PdfMetaField[];
	pageCount: number;
}> {
	const doc = await PDFDocument.load(bytes);
	const pageCount = doc.getPageCount();
	const fields: PdfMetaField[] = [
		{ key: 'Pages', value: String(pageCount) },
		{ key: 'File size', value: `${bytes.length} bytes` },
		{ key: 'Title', value: doc.getTitle() || '—' },
		{ key: 'Author', value: doc.getAuthor() || '—' },
		{ key: 'Subject', value: doc.getSubject() || '—' },
		{ key: 'Creator', value: doc.getCreator() || '—' },
		{ key: 'Producer', value: doc.getProducer() || '—' },
		{ key: 'Keywords', value: doc.getKeywords() || '—' }
	];

	const created = doc.getCreationDate();
	const modified = doc.getModificationDate();
	if (created) fields.push({ key: 'Created', value: created.toISOString() });
	if (modified) fields.push({ key: 'Modified', value: modified.toISOString() });

	const first = doc.getPage(0);
	const { width, height } = first.getSize();
	fields.push({ key: 'First page size', value: `${Math.round(width)} × ${Math.round(height)} pt` });

	return { fields, pageCount };
}

/** Re-export for tools that need page helpers. */
export type { PDFPage };
