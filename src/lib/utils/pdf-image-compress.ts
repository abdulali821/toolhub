import {
	PDFDocument,
	PDFName,
	PDFDict,
	PDFRef,
	PDFRawStream,
	PDFNumber,
	PDFArray,
	PDFBool,
	PDFFlateStream,
	decodePDFRawStream,
	type PDFStream
} from 'pdf-lib';

export type PdfImageCompressOptions = {
	/** JPEG quality (0.4–0.92). */
	quality: number;
	/** Downscale so the longest edge is at most this many pixels. */
	maxLongEdge: number;
};

export type PdfImageCompressStats = {
	scanned: number;
	replaced: number;
	skipped: number;
	failed: number;
};

type RawLayout = {
	colorSpace: 'DeviceRGB' | 'DeviceGray' | 'DeviceCMYK';
	bytes: Uint8Array;
};

type ImageCandidate = {
	ref: PDFRef;
	stream: PDFStream;
	width: number;
	height: number;
	/** Bytes used for size comparison (encoded stream or decoded raw). */
	originalSize: number;
	decode: { kind: 'blob'; bytes: Uint8Array; mime: string } | { kind: 'raw'; layout: RawLayout };
};

function isPdfStream(value: unknown): value is PDFStream {
	return (
		value instanceof PDFRawStream ||
		value instanceof PDFFlateStream ||
		(typeof value === 'object' &&
			value !== null &&
			'dict' in value &&
			'getContents' in value &&
			typeof (value as PDFStream).getContents === 'function')
	);
}

function hasMask(dict: PDFDict): boolean {
	if (dict.lookup(PDFName.of('SMask'))) return true;
	if (dict.lookup(PDFName.of('Mask'))) return true;
	const imageMask = dict.lookup(PDFName.of('ImageMask'));
	if (imageMask instanceof PDFBool && imageMask.asBoolean()) return true;
	return false;
}

function filterChain(dict: PDFDict): string[] {
	const filter = dict.lookup(PDFName.of('Filter'));
	if (filter instanceof PDFName) return [filter.asString()];
	if (filter instanceof PDFArray) {
		const names: string[] = [];
		for (let i = 0; i < filter.size(); i++) {
			const entry = filter.lookup(i, PDFName);
			if (entry) names.push(entry.asString());
		}
		return names;
	}
	return [];
}

function primaryFilter(dict: PDFDict): string | null {
	const chain = filterChain(dict);
	return chain.length ? chain[chain.length - 1]! : null;
}

function isJpegBytes(bytes: Uint8Array): boolean {
	return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

function isPngBytes(bytes: Uint8Array): boolean {
	return (
		bytes.length > 4 &&
		bytes[0] === 0x89 &&
		bytes[1] === 0x50 &&
		bytes[2] === 0x4e &&
		bytes[3] === 0x47
	);
}

function isJp2Bytes(bytes: Uint8Array): boolean {
	return (
		bytes.length > 12 &&
		bytes[4] === 0x6a &&
		bytes[5] === 0x50 &&
		bytes[6] === 0x20 &&
		bytes[7] === 0x20
	);
}

function rawColorSpace(
	dict: PDFDict,
	context: PDFDocument['context']
): RawLayout['colorSpace'] | null {
	let cs = dict.lookup(PDFName.of('ColorSpace'));
	if (cs instanceof PDFRef) {
		cs = context.lookup(cs);
	}
	if (cs === PDFName.of('DeviceRGB')) return 'DeviceRGB';
	if (cs === PDFName.of('DeviceGray')) return 'DeviceGray';
	if (cs === PDFName.of('DeviceCMYK')) return 'DeviceCMYK';

	if (cs instanceof PDFArray && cs.size() >= 1) {
		const first = cs.lookup(0, PDFName);
		if (first === PDFName.of('ICCBased') && cs.size() >= 2) {
			const profileRef = cs.lookup(1, PDFRef);
			const profile = profileRef ? context.lookup(profileRef) : undefined;
			const profileDict =
				profile instanceof PDFDict ? profile : isPdfStream(profile) ? profile.dict : undefined;
			const n = profileDict?.lookup(PDFName.of('N'));
			if (n instanceof PDFNumber) {
				if (n.asNumber() === 3) return 'DeviceRGB';
				if (n.asNumber() === 1) return 'DeviceGray';
				if (n.asNumber() === 4) return 'DeviceCMYK';
			}
		}
		if (first === PDFName.of('CalRGB')) return 'DeviceRGB';
		if (first === PDFName.of('CalGray')) return 'DeviceGray';
		if (first === PDFName.of('CalCMYK')) return 'DeviceCMYK';
	}

	return null;
}

function decodeStreamBytes(stream: PDFStream): Uint8Array {
	const contents = stream.getContents();
	const filters = filterChain(stream.dict);
	if (!filters.length || filters.every((f) => f === 'DCTDecode' || f === 'JPXDecode')) {
		return contents.slice();
	}
	try {
		const raw = PDFRawStream.of(stream.dict, contents);
		const decoded = decodePDFRawStream(raw);
		return decoded.decode();
	} catch {
		return contents.slice();
	}
}

/** List compressible embedded image XObjects anywhere in the document. */
export function listEmbeddedImageCandidates(doc: PDFDocument): ImageCandidate[] {
	const context = doc.context;
	const candidates: ImageCandidate[] = [];

	for (const [ref, obj] of context.enumerateIndirectObjects()) {
		if (!isPdfStream(obj)) continue;
		if (obj.dict.lookup(PDFName.of('Subtype')) !== PDFName.of('Image')) continue;
		if (hasMask(obj.dict)) continue;

		const widthEntry = obj.dict.lookup(PDFName.of('Width'));
		const heightEntry = obj.dict.lookup(PDFName.of('Height'));
		if (!(widthEntry instanceof PDFNumber) || !(heightEntry instanceof PDFNumber)) continue;

		const width = widthEntry.asNumber();
		const height = heightEntry.asNumber();
		if (width <= 0 || height <= 0) continue;

		const filter = primaryFilter(obj.dict);
		const encoded = obj.getContents().slice();

		if (filter === 'DCTDecode' || isJpegBytes(encoded)) {
			candidates.push({
				ref,
				stream: obj,
				width,
				height,
				originalSize: encoded.length,
				decode: { kind: 'blob', bytes: encoded, mime: 'image/jpeg' }
			});
			continue;
		}

		if (filter === 'JPXDecode' || isJp2Bytes(encoded)) {
			candidates.push({
				ref,
				stream: obj,
				width,
				height,
				originalSize: encoded.length,
				decode: { kind: 'blob', bytes: encoded, mime: 'image/jp2' }
			});
			continue;
		}

		let decoded: Uint8Array;
		try {
			decoded = decodeStreamBytes(obj);
		} catch {
			continue;
		}

		if (isJpegBytes(decoded)) {
			candidates.push({
				ref,
				stream: obj,
				width,
				height,
				originalSize: encoded.length,
				decode: { kind: 'blob', bytes: decoded, mime: 'image/jpeg' }
			});
			continue;
		}

		if (isPngBytes(decoded)) {
			candidates.push({
				ref,
				stream: obj,
				width,
				height,
				originalSize: encoded.length,
				decode: { kind: 'blob', bytes: decoded, mime: 'image/png' }
			});
			continue;
		}

		const colorSpace = rawColorSpace(obj.dict, context);
		if (!colorSpace) continue;

		const expected =
			colorSpace === 'DeviceGray'
				? width * height
				: colorSpace === 'DeviceCMYK'
					? width * height * 4
					: width * height * 3;
		if (decoded.length < expected) continue;

		candidates.push({
			ref,
			stream: obj,
			width,
			height,
			originalSize: encoded.length,
			decode: { kind: 'raw', layout: { colorSpace, bytes: decoded } }
		});
	}

	return candidates;
}

function rawToRgba(layout: RawLayout, width: number, height: number): Uint8ClampedArray {
	const pixels = width * height;
	const rgba = new Uint8ClampedArray(pixels * 4);
	const { bytes, colorSpace } = layout;

	if (colorSpace === 'DeviceGray') {
		for (let i = 0; i < pixels; i++) {
			const gray = bytes[i] ?? 0;
			const o = i * 4;
			rgba[o] = gray;
			rgba[o + 1] = gray;
			rgba[o + 2] = gray;
			rgba[o + 3] = 255;
		}
		return rgba;
	}

	if (colorSpace === 'DeviceCMYK') {
		for (let i = 0; i < pixels; i++) {
			const s = i * 4;
			const c = (bytes[s] ?? 0) / 255;
			const m = (bytes[s + 1] ?? 0) / 255;
			const y = (bytes[s + 2] ?? 0) / 255;
			const k = (bytes[s + 3] ?? 0) / 255;
			const o = i * 4;
			rgba[o] = Math.round(255 * (1 - c) * (1 - k));
			rgba[o + 1] = Math.round(255 * (1 - m) * (1 - k));
			rgba[o + 2] = Math.round(255 * (1 - y) * (1 - k));
			rgba[o + 3] = 255;
		}
		return rgba;
	}

	for (let i = 0; i < pixels; i++) {
		const o = i * 4;
		const s = i * 3;
		rgba[o] = bytes[s] ?? 0;
		rgba[o + 1] = bytes[s + 1] ?? 0;
		rgba[o + 2] = bytes[s + 2] ?? 0;
		rgba[o + 3] = 255;
	}
	return rgba;
}

async function drawCandidate(
	candidate: ImageCandidate,
	quality: number,
	maxLongEdge: number
): Promise<{ bytes: Uint8Array; width: number; height: number } | null> {
	const scale = Math.min(1, maxLongEdge / Math.max(candidate.width, candidate.height));
	const targetWidth = Math.max(1, Math.round(candidate.width * scale));
	const targetHeight = Math.max(1, Math.round(candidate.height * scale));

	const canvas = document.createElement('canvas');
	canvas.width = targetWidth;
	canvas.height = targetHeight;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Canvas is not supported in this browser');

	if (candidate.decode.kind === 'blob') {
		const blob = new Blob([candidate.decode.bytes.slice()], { type: candidate.decode.mime });
		try {
			const bitmap = await createImageBitmap(blob);
			ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
			bitmap.close();
		} catch {
			const url = URL.createObjectURL(blob);
			try {
				const img = await new Promise<HTMLImageElement>((resolve, reject) => {
					const el = new Image();
					el.onload = () => resolve(el);
					el.onerror = () => reject(new Error('Image decode failed'));
					el.src = url;
				});
				ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
			} finally {
				URL.revokeObjectURL(url);
			}
		}
	} else {
		const rgba = rawToRgba(candidate.decode.layout, candidate.width, candidate.height);
		const imageData = new ImageData(new Uint8ClampedArray(rgba), candidate.width, candidate.height);
		const temp = document.createElement('canvas');
		temp.width = candidate.width;
		temp.height = candidate.height;
		const tempCtx = temp.getContext('2d');
		if (!tempCtx) throw new Error('Canvas is not supported in this browser');
		tempCtx.putImageData(imageData, 0, 0);
		ctx.drawImage(temp, 0, 0, targetWidth, targetHeight);
	}

	const outBlob = await new Promise<Blob | null>((resolve) => {
		canvas.toBlob(resolve, 'image/jpeg', quality);
	});
	if (!outBlob) throw new Error('Failed to encode JPEG');

	const bytes = new Uint8Array(await outBlob.arrayBuffer());
	if (bytes.length >= candidate.originalSize) return null;

	return { bytes, width: targetWidth, height: targetHeight };
}

function replaceImageStream(
	doc: PDFDocument,
	ref: PDFRef,
	stream: PDFStream,
	next: { bytes: Uint8Array; width: number; height: number }
): void {
	const dict = stream.dict;
	dict.set(PDFName.of('Filter'), PDFName.of('DCTDecode'));
	dict.delete(PDFName.of('DecodeParms'));
	dict.set(PDFName.of('Width'), PDFNumber.of(next.width));
	dict.set(PDFName.of('Height'), PDFNumber.of(next.height));
	dict.set(PDFName.of('BitsPerComponent'), PDFNumber.of(8));
	dict.set(PDFName.of('ColorSpace'), PDFName.of('DeviceRGB'));
	doc.context.assign(ref, PDFRawStream.of(dict, next.bytes));
}

/** Recompress embedded image XObjects in-place. Text and vectors stay intact. */
export async function recompressEmbeddedImages(
	doc: PDFDocument,
	options: PdfImageCompressOptions
): Promise<PdfImageCompressStats> {
	if (typeof document === 'undefined') {
		return { scanned: 0, replaced: 0, skipped: 0, failed: 0 };
	}

	const quality = Math.min(0.92, Math.max(0.4, options.quality));
	const maxLongEdge = Math.max(400, options.maxLongEdge);
	const candidates = listEmbeddedImageCandidates(doc);

	let replaced = 0;
	let skipped = 0;
	let failed = 0;

	for (const image of candidates) {
		try {
			const next = await drawCandidate(image, quality, maxLongEdge);
			if (!next) {
				skipped++;
				continue;
			}
			replaceImageStream(doc, image.ref, image.stream, next);
			replaced++;
		} catch {
			failed++;
		}
	}

	return { scanned: candidates.length, replaced, skipped, failed };
}

export function imageCompressPreset(mode: 'recommended' | 'high'): PdfImageCompressOptions {
	if (mode === 'high') {
		return { quality: 0.82, maxLongEdge: 2000 };
	}
	return { quality: 0.65, maxLongEdge: 1200 };
}
