import type { ToolDefinition } from '$engine/types';
import { IMAGE_FILE_CONSTRAINTS, loadImage } from '$lib/utils/image-canvas';
import * as v from 'valibot';

export const FAVICON_SIZES = [16, 32, 48, 180, 192, 512] as const;
export type FaviconSize = (typeof FAVICON_SIZES)[number];

export const inputSchema = v.object({
	mode: v.picklist(['image', 'text']),
	/** Source image as data URL when mode is image */
	imageDataUrl: v.optional(v.string()),
	/** Initials when mode is text — max 2 characters */
	text: v.optional(v.pipe(v.string(), v.maxLength(2, 'Use at most 2 characters'))),
	backgroundColor: v.pipe(v.string(), v.minLength(1)),
	textColor: v.pipe(v.string(), v.minLength(1)),
	rounded: v.boolean(),
	sizes: v.optional(v.array(v.pipe(v.number(), v.integer(), v.minValue(16), v.maxValue(512))))
});

export type FaviconGeneratorInput = v.InferOutput<typeof inputSchema>;

export type FaviconPng = {
	size: number;
	dataUrl: string;
	bytes: Uint8Array;
};

export type FaviconGeneratorOutput = {
	pngs: FaviconPng[];
	/** Multi-resolution ICO (PNG-compressed entries) as data URL */
	icoDataUrl: string;
	/** Ready-to-paste HTML <link> tags */
	html: string;
	/** Raw ICO bytes for packaging */
	icoBytes: Uint8Array;
};

export function normalizeInitials(text: string | undefined | null): string {
	return (text ?? '').replace(/\s+/g, '').slice(0, 2);
}

export function pngFilename(size: number): string {
	return size === 180 ? 'apple-touch-icon.png' : `favicon-${size}x${size}.png`;
}

/** Build a ZIP of all PNG sizes, favicon.ico, and HTML snippet. */
export async function buildFaviconZip(output: FaviconGeneratorOutput): Promise<Blob> {
	const JSZip = (await import('jszip')).default;
	const zip = new JSZip();
	for (const png of output.pngs) {
		zip.file(pngFilename(png.size), png.bytes);
	}
	zip.file('favicon.ico', output.icoBytes);
	zip.file('favicon-links.html', `${output.html}\n`);
	return zip.generateAsync({ type: 'blob' });
}

function normalizeHex(color: string): string {
	const raw = color.trim();
	if (/^#?[0-9a-f]{3}([0-9a-f]{3})?$/i.test(raw)) {
		return raw.startsWith('#') ? raw : `#${raw}`;
	}
	return raw;
}

export function dataUrlToBytes(dataUrl: string): Uint8Array {
	const comma = dataUrl.indexOf(',');
	if (comma < 0) throw new Error('Invalid data URL');
	const b64 = dataUrl.slice(comma + 1);
	if (typeof atob === 'function') {
		const bin = atob(b64);
		const out = new Uint8Array(bin.length);
		for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
		return out;
	}
	return Uint8Array.from(Buffer.from(b64, 'base64'));
}

export function bytesToDataUrl(bytes: Uint8Array, mime: string): string {
	if (typeof btoa === 'function') {
		let binary = '';
		const chunk = 0x8000;
		for (let i = 0; i < bytes.length; i += chunk) {
			binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
		}
		return `data:${mime};base64,${btoa(binary)}`;
	}
	return `data:${mime};base64,${Buffer.from(bytes).toString('base64')}`;
}

/** Pack one or more PNG buffers into a modern ICO (PNG payload per entry). */
export function packPngsAsIco(pngs: { size: number; bytes: Uint8Array }[]): Uint8Array {
	if (!pngs.length) throw new Error('At least one PNG is required for ICO');
	const count = pngs.length;
	const headerSize = 6 + count * 16;
	let offset = headerSize;
	const offsets: number[] = [];
	let total = headerSize;
	for (const png of pngs) {
		offsets.push(offset);
		offset += png.bytes.length;
		total += png.bytes.length;
	}

	const out = new Uint8Array(total);
	const view = new DataView(out.buffer);
	view.setUint16(0, 0, true); // reserved
	view.setUint16(2, 1, true); // type icon
	view.setUint16(4, count, true);

	for (let i = 0; i < count; i++) {
		const { size, bytes } = pngs[i];
		const entry = 6 + i * 16;
		const dim = size >= 256 ? 0 : size;
		out[entry] = dim;
		out[entry + 1] = dim;
		out[entry + 2] = 0; // color count
		out[entry + 3] = 0; // reserved
		view.setUint16(entry + 4, 1, true); // planes
		view.setUint16(entry + 6, 32, true); // bit count
		view.setUint32(entry + 8, bytes.length, true);
		view.setUint32(entry + 12, offsets[i], true);
		out.set(bytes, offsets[i]);
	}

	return out;
}

export function buildFaviconHtml(): string {
	return [
		`<link rel="icon" href="/favicon.ico" sizes="any">`,
		`<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">`,
		`<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">`,
		`<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">`,
		`<link rel="icon" type="image/png" sizes="192x192" href="/favicon-192x192.png">`
	].join('\n');
}

function roundedClip(ctx: CanvasRenderingContext2D, size: number, rounded: boolean) {
	if (!rounded) return;
	const r = size * 0.22;
	ctx.beginPath();
	ctx.moveTo(r, 0);
	ctx.arcTo(size, 0, size, size, r);
	ctx.arcTo(size, size, 0, size, r);
	ctx.arcTo(0, size, 0, 0, r);
	ctx.arcTo(0, 0, size, 0, r);
	ctx.closePath();
	ctx.clip();
}

async function renderSquare(
	size: number,
	input: FaviconGeneratorInput
): Promise<{ dataUrl: string; bytes: Uint8Array }> {
	const canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Canvas is not supported in this browser');

	ctx.clearRect(0, 0, size, size);
	roundedClip(ctx, size, input.rounded);

	const bg = normalizeHex(input.backgroundColor);
	ctx.fillStyle = bg;
	ctx.fillRect(0, 0, size, size);

	if (input.mode === 'image') {
		const src = input.imageDataUrl?.trim();
		if (!src) throw new Error('Upload an image');
		const img = await loadImage(src);
		const scale = Math.max(size / img.naturalWidth, size / img.naturalHeight);
		const w = img.naturalWidth * scale;
		const h = img.naturalHeight * scale;
		const x = (size - w) / 2;
		const y = (size - h) / 2;
		ctx.drawImage(img, x, y, w, h);
	} else {
		const label = normalizeInitials(input.text) || 'H';
		ctx.fillStyle = normalizeHex(input.textColor);
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.font = `600 ${Math.round(size * (label.length === 1 ? 0.55 : 0.42))}px system-ui,Segoe UI,sans-serif`;
		ctx.fillText(label.toUpperCase(), size / 2, size / 2 + size * 0.02);
	}

	const dataUrl = canvas.toDataURL('image/png');
	return { dataUrl, bytes: dataUrlToBytes(dataUrl) };
}

export async function run(input: FaviconGeneratorInput): Promise<FaviconGeneratorOutput> {
	const parsed = v.parse(inputSchema, {
		...input,
		text: input.mode === 'text' ? normalizeInitials(input.text) : input.text
	});
	if (typeof document === 'undefined') {
		throw new Error('Favicon generation requires a browser');
	}

	const sizes = (parsed.sizes?.length ? parsed.sizes : [...FAVICON_SIZES]).map((n) =>
		Math.min(512, Math.max(16, Math.round(n)))
	);
	const unique = [...new Set(sizes)].sort((a, b) => a - b);

	const pngs: FaviconPng[] = [];
	for (const size of unique) {
		const rendered = await renderSquare(size, parsed);
		pngs.push({ size, dataUrl: rendered.dataUrl, bytes: rendered.bytes });
	}

	const icoSizes = [16, 32, 48].filter((s) => pngs.some((p) => p.size === s));
	const icoSources = (icoSizes.length ? icoSizes : [pngs[0].size]).map((size) => {
		const png = pngs.find((p) => p.size === size)!;
		return { size, bytes: png.bytes };
	});
	const icoBytes = packPngsAsIco(icoSources);

	return {
		pngs,
		icoBytes,
		icoDataUrl: bytesToDataUrl(icoBytes, 'image/x-icon'),
		html: buildFaviconHtml()
	};
}

export const faviconGenerator: ToolDefinition<FaviconGeneratorInput, FaviconGeneratorOutput> = {
	id: 'favicon-generator',
	version: '1.0.0',
	category: 'image',
	mode: 'instant',
	status: 'stable',
	tags: ['favicon', 'icon', 'png', 'ico', 'generator', 'apple-touch-icon'],
	capabilities: ['upload', 'download', 'copy', 'reset', 'favorite'],
	file: IMAGE_FILE_CONSTRAINTS,
	share: {
		params: ['mode', 'text', 'backgroundColor', 'textColor', 'rounded']
	},
	presets: [
		{
			id: 'ht',
			label: 'HT initials',
			params: {
				mode: 'text',
				text: 'HT',
				backgroundColor: '2563eb',
				textColor: 'ffffff',
				rounded: 'true'
			}
		},
		{
			id: 'square',
			label: 'Square letter',
			params: {
				mode: 'text',
				text: 'A',
				backgroundColor: '111827',
				textColor: 'f9fafb',
				rounded: 'false'
			}
		}
	],
	workflow: {
		next: ['image-resizer', 'image-compressor', 'png-to-webp', 'svg-optimizer']
	},
	metadata: {
		name: 'Favicon Generator',
		title: 'Favicon Generator — Make favicons from image or text',
		description:
			'Create favicons in your browser from a logo or initials. Export PNG sizes, a multi-resolution .ico, and ready-to-paste HTML link tags—no upload required.',
		keywords: [
			'favicon generator',
			'favicon maker',
			'create favicon',
			'ico generator',
			'apple touch icon'
		],
		related: ['image-resizer', 'image-compressor', 'qr-code-generator', 'svg-optimizer'],
		faq: [
			{
				question: 'What files do I get?',
				answer:
					'PNG icons at 16, 32, 48, 180, 192, and 512px, plus a favicon.ico containing 16/32/48 PNG entries, and an HTML snippet with <link> tags.'
			},
			{
				question: 'Can I use text instead of a logo?',
				answer:
					'Yes. Switch to Text mode and enter up to 2 characters (initials), then pick background and text colors. Optional rounding softens the corners.'
			},
			{
				question: 'Can I download every size at once?',
				answer:
					'Yes. Use Download all (ZIP) to get every PNG size, favicon.ico, and an HTML snippet file in one archive.'
			},
			{
				question: 'Is my image uploaded?',
				answer: 'No. Everything is rendered with canvas in your browser.'
			}
		],
		howTo: [
			'Choose Image or Text mode',
			'Upload a logo or set initials and colors',
			'Preview sizes, then download PNG / ICO from the Action Bar',
			'Copy the HTML <link> snippet into your site <head>'
		]
	},
	validation: { input: inputSchema },
	run,
	ui: {
		component: () => import('./ui.svelte')
	},
	analytics: { eventName: 'tool_run', props: ['mode'] }
};
