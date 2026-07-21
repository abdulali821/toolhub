import * as pdfjs from 'pdfjs-dist';

let workerInitialized = false;

export function initPdfJsWorker(): void {
	if (workerInitialized) return;
	try {
		pdfjs.GlobalWorkerOptions.workerSrc = new URL(
			'pdfjs-dist/build/pdf.worker.min.mjs',
			import.meta.url
		).toString();
	} catch {
		pdfjs.GlobalWorkerOptions.workerSrc = new URL(
			'pdfjs-dist/build/pdf.worker.mjs',
			import.meta.url
		).toString();
	}
	workerInitialized = true;
}

export type RenderedPage = {
	pageNumber: number;
	dataUrl: string;
	width: number;
	height: number;
};

export async function getPdfPageCount(bytes: Uint8Array): Promise<number> {
	initPdfJsWorker();
	const copy = bytes.slice();
	const pdf = await pdfjs.getDocument({ data: copy }).promise;
	return pdf.numPages;
}

export async function renderPdfPages(
	bytes: Uint8Array,
	pageNumbers: number[],
	scale = 1.5,
	mimeType: 'image/png' | 'image/jpeg' = 'image/png',
	quality = 0.82
): Promise<RenderedPage[]> {
	initPdfJsWorker();
	const copy = bytes.slice();
	const pdf = await pdfjs.getDocument({ data: copy }).promise;
	const results: RenderedPage[] = [];

	for (const pageNumber of pageNumbers) {
		const page = await pdf.getPage(pageNumber);
		const viewport = page.getViewport({ scale });
		const canvas = document.createElement('canvas');
		canvas.width = viewport.width;
		canvas.height = viewport.height;
		const ctx = canvas.getContext('2d');
		if (!ctx) throw new Error('Canvas is not supported in this browser');

		await page.render({ canvasContext: ctx, viewport, canvas }).promise;
		results.push({
			pageNumber,
			dataUrl: canvas.toDataURL(mimeType, quality),
			width: viewport.width,
			height: viewport.height
		});
	}

	return results;
}
