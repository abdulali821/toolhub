import { PDFDocument } from 'pdf-lib';
import { renderPdfPages } from '../pdf-to-images/render';

function dataUrlToBytes(dataUrl: string): Uint8Array {
	const base64 = dataUrl.split(',')[1] ?? '';
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return bytes;
}

/** Render each page to JPEG and rebuild a PDF (browser only). */
export async function rasterizePdfToJpeg(
	bytes: Uint8Array,
	quality: number,
	scale: number
): Promise<Uint8Array> {
	const src = await PDFDocument.load(bytes);
	const count = src.getPageCount();
	const pages = await renderPdfPages(
		bytes,
		Array.from({ length: count }, (_, i) => i + 1),
		scale,
		'image/jpeg',
		quality
	);

	const out = await PDFDocument.create();
	for (const page of pages) {
		const jpgBytes = dataUrlToBytes(page.dataUrl);
		const image = await out.embedJpg(jpgBytes);
		const pdfPage = out.addPage([page.width, page.height]);
		pdfPage.drawImage(image, {
			x: 0,
			y: 0,
			width: page.width,
			height: page.height
		});
	}
	return out.save({ useObjectStreams: true });
}

/** Pick a render scale that avoids upscaling small pages. */
export function adaptiveRasterScale(pageWidthPt: number, requestedScale: number): number {
	const maxPx = 1600;
	const minScale = 0.75;
	const scaleForWidth = maxPx / Math.max(1, pageWidthPt);
	return Math.min(requestedScale, Math.max(minScale, scaleForWidth));
}
