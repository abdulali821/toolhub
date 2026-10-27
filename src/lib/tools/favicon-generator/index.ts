import type { ToolDefinition } from '$engine/types';
import { IMAGE_FILE_CONSTRAINTS, loadImage } from '$lib/utils/image-canvas';
import * as v from 'valibot';

export const FAVICON_FILE_CONSTRAINTS = {
	maxBytes: IMAGE_FILE_CONSTRAINTS.maxBytes,
	accept: `${IMAGE_FILE_CONSTRAINTS.accept},image/svg+xml,.svg`,
	mimeAllowlist: [...IMAGE_FILE_CONSTRAINTS.mimeAllowlist, 'image/svg+xml'],
	extensions: [...IMAGE_FILE_CONSTRAINTS.extensions, '.svg']
};

export const FAVICON_SIZES = [16, 32, 48, 180, 192, 512] as const;
export type FaviconSize = (typeof FAVICON_SIZES)[number];

export const DISPLAY_MODES = ['standalone', 'fullscreen', 'minimal-ui', 'browser'] as const;
export type DisplayMode = (typeof DISPLAY_MODES)[number];

export type PlatformPaint = {
	/** 0–50: shrink source inside the canvas */
	marginPercent: number;
	addBackground: boolean;
	backgroundColor: string;
};

export const inputSchema = v.object({
	mode: v.picklist(['image', 'text']),
	imageDataUrl: v.optional(v.string()),
	text: v.optional(v.pipe(v.string(), v.maxLength(2, 'Use at most 2 characters'))),
	textColor: v.pipe(v.string(), v.minLength(1)),
	rounded: v.boolean(),
	/** Legacy single-bg path (text mode / simple generate) */
	backgroundColor: v.pipe(v.string(), v.minLength(1)),
	desktop: v.optional(
		v.object({
			marginPercent: v.pipe(v.number(), v.minValue(0), v.maxValue(50)),
			addBackground: v.boolean(),
			backgroundColor: v.pipe(v.string(), v.minLength(1)),
			includeSvg: v.boolean()
		})
	),
	ios: v.optional(
		v.object({
			marginPercent: v.pipe(v.number(), v.minValue(0), v.maxValue(50)),
			backgroundColor: v.pipe(v.string(), v.minLength(1))
		})
	),
	pwa: v.optional(
		v.object({
			marginPercent: v.pipe(v.number(), v.minValue(0), v.maxValue(50)),
			addBackground: v.boolean(),
			backgroundColor: v.pipe(v.string(), v.minLength(1)),
			includeMaskable: v.boolean(),
			maskableBackgroundColor: v.pipe(v.string(), v.minLength(1)),
			maskableMarginPercent: v.pipe(v.number(), v.minValue(0), v.maxValue(50))
		})
	),
	site: v.optional(
		v.object({
			appName: v.pipe(v.string(), v.maxLength(80)),
			shortName: v.pipe(v.string(), v.maxLength(40)),
			description: v.pipe(v.string(), v.maxLength(200)),
			startUrl: v.pipe(v.string(), v.maxLength(200)),
			assetPath: v.pipe(v.string(), v.maxLength(200)),
			display: v.picklist(DISPLAY_MODES),
			themeColor: v.pipe(v.string(), v.minLength(1)),
			darkThemeColor: v.pipe(v.string(), v.minLength(1)),
			useDarkTheme: v.boolean(),
			backgroundColor: v.pipe(v.string(), v.minLength(1))
		})
	),
	sizes: v.optional(v.array(v.pipe(v.number(), v.integer(), v.minValue(16), v.maxValue(512))))
});

export type FaviconGeneratorInput = v.InferOutput<typeof inputSchema>;

export type FaviconPng = {
	size: number;
	/** Logical asset id for zip naming */
	id: string;
	dataUrl: string;
	bytes: Uint8Array;
};

export type FaviconGeneratorOutput = {
	pngs: FaviconPng[];
	icoDataUrl: string;
	icoBytes: Uint8Array;
	html: string;
	manifest: string;
	svgText: string | null;
};

export function normalizeInitials(text: string | undefined | null): string {
	return (text ?? '').replace(/\s+/g, '').slice(0, 2);
}

/** @deprecated Prefer assetFilename / png.id — kept for older call sites */
export function pngFilename(size: number): string {
	if (size === 180) return 'apple-touch-icon.png';
	if (size === 192) return 'pwa-192x192.png';
	if (size === 512) return 'pwa-512x512.png';
	return `favicon-${size}x${size}.png`;
}

export function assetFilename(id: string): string {
	switch (id) {
		case 'favicon-16':
			return 'favicon-16x16.png';
		case 'favicon-32':
			return 'favicon-32x32.png';
		case 'favicon-48':
			return 'favicon-48x48.png';
		case 'apple':
			return 'apple-touch-icon.png';
		case 'pwa-192':
			return 'pwa-192x192.png';
		case 'pwa-512':
			return 'pwa-512x512.png';
		case 'maskable-192':
			return 'pwa-maskable-192x192.png';
		case 'maskable-512':
			return 'pwa-maskable-512x512.png';
		default:
			return `${id}.png`;
	}
}

function normalizeHex(color: string): string {
	const raw = color.trim();
	if (/^#?[0-9a-f]{3}([0-9a-f]{3})?$/i.test(raw)) {
		return raw.startsWith('#') ? raw : `#${raw}`;
	}
	return raw || '#ffffff';
}

export function normalizeAssetPath(path: string): string {
	const trimmed = (path || '/').trim() || '/';
	if (trimmed === '/') return '/';
	const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
	return withSlash.endsWith('/') ? withSlash : `${withSlash}/`;
}

export function joinAssetPath(assetPath: string, file: string): string {
	const base = normalizeAssetPath(assetPath);
	return base === '/' ? `/${file}` : `${base}${file}`;
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
	view.setUint16(0, 0, true);
	view.setUint16(2, 1, true);
	view.setUint16(4, count, true);

	for (let i = 0; i < count; i++) {
		const { size, bytes } = pngs[i]!;
		const entry = 6 + i * 16;
		const dim = size >= 256 ? 0 : size;
		out[entry] = dim;
		out[entry + 1] = dim;
		out[entry + 2] = 0;
		out[entry + 3] = 0;
		view.setUint16(entry + 4, 1, true);
		view.setUint16(entry + 6, 32, true);
		view.setUint32(entry + 8, bytes.length, true);
		view.setUint32(entry + 12, offsets[i]!, true);
		out.set(bytes, offsets[i]!);
	}

	return out;
}

export function buildFaviconHtml(options?: {
	assetPath?: string;
	includeSvg?: boolean;
	themeColor?: string;
	darkThemeColor?: string;
	useDarkTheme?: boolean;
	includeManifest?: boolean;
}): string {
	const path = options?.assetPath ?? '/';
	const lines = [
		`<link rel="icon" href="${joinAssetPath(path, 'favicon.ico')}" sizes="any">`,
		`<link rel="icon" type="image/png" sizes="32x32" href="${joinAssetPath(path, 'favicon-32x32.png')}">`,
		`<link rel="icon" type="image/png" sizes="16x16" href="${joinAssetPath(path, 'favicon-16x16.png')}">`,
		`<link rel="apple-touch-icon" sizes="180x180" href="${joinAssetPath(path, 'apple-touch-icon.png')}">`
	];
	if (options?.includeSvg) {
		lines.splice(
			1,
			0,
			`<link rel="icon" href="${joinAssetPath(path, 'favicon.svg')}" type="image/svg+xml">`
		);
	}
	if (options?.includeManifest !== false) {
		lines.push(`<link rel="manifest" href="${joinAssetPath(path, 'site.webmanifest')}">`);
	}
	const theme = normalizeHex(options?.themeColor ?? '#ffffff');
	lines.push(`<meta name="theme-color" content="${theme}">`);
	if (options?.useDarkTheme) {
		const dark = normalizeHex(options.darkThemeColor ?? '#000000');
		lines.push(`<meta name="theme-color" media="(prefers-color-scheme: dark)" content="${dark}">`);
	}
	return lines.join('\n');
}

export function buildWebManifest(options: {
	appName: string;
	shortName: string;
	description?: string;
	startUrl: string;
	display: DisplayMode;
	themeColor: string;
	backgroundColor: string;
	assetPath: string;
	includeMaskable: boolean;
}): string {
	const path = options.assetPath;
	const icons: Array<Record<string, string>> = [
		{
			src: joinAssetPath(path, 'pwa-192x192.png'),
			sizes: '192x192',
			type: 'image/png',
			purpose: 'any'
		},
		{
			src: joinAssetPath(path, 'pwa-512x512.png'),
			sizes: '512x512',
			type: 'image/png',
			purpose: 'any'
		}
	];
	if (options.includeMaskable) {
		icons.push(
			{
				src: joinAssetPath(path, 'pwa-maskable-192x192.png'),
				sizes: '192x192',
				type: 'image/png',
				purpose: 'maskable'
			},
			{
				src: joinAssetPath(path, 'pwa-maskable-512x512.png'),
				sizes: '512x512',
				type: 'image/png',
				purpose: 'maskable'
			}
		);
	}

	const manifest: Record<string, unknown> = {
		name: options.appName || 'App',
		short_name: options.shortName || options.appName || 'App',
		start_url: options.startUrl || '/',
		display: options.display,
		background_color: normalizeHex(options.backgroundColor),
		theme_color: normalizeHex(options.themeColor),
		icons
	};
	const desc = options.description?.trim();
	if (desc) manifest.description = desc;

	return `${JSON.stringify(manifest, null, 2)}\n`;
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

export type RenderSource =
	| { kind: 'image'; dataUrl: string }
	| { kind: 'text'; text: string; textColor: string; rounded: boolean };

export async function renderIcon(
	size: number,
	source: RenderSource,
	paint: PlatformPaint & { forceOpaque?: boolean; rounded?: boolean }
): Promise<{ dataUrl: string; bytes: Uint8Array }> {
	const canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Canvas is not supported in this browser');

	ctx.clearRect(0, 0, size, size);
	const round = paint.rounded ?? (source.kind === 'text' ? true : false);
	roundedClip(ctx, size, round);

	const opaque = Boolean(paint.forceOpaque || paint.addBackground);
	if (opaque) {
		ctx.fillStyle = normalizeHex(paint.backgroundColor);
		ctx.fillRect(0, 0, size, size);
	}

	const margin = Math.max(0, Math.min(50, paint.marginPercent)) / 100;
	const inner = size * (1 - margin);
	const ox = (size - inner) / 2;
	const oy = (size - inner) / 2;

	if (source.kind === 'image') {
		const img = await loadImage(source.dataUrl);
		const scale = Math.min(inner / img.naturalWidth, inner / img.naturalHeight);
		const w = img.naturalWidth * scale;
		const h = img.naturalHeight * scale;
		const x = ox + (inner - w) / 2;
		const y = oy + (inner - h) / 2;
		ctx.drawImage(img, x, y, w, h);
	} else {
		const label = normalizeInitials(source.text) || 'H';
		ctx.fillStyle = normalizeHex(source.textColor);
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.font = `600 ${Math.round(inner * (label.length === 1 ? 0.55 : 0.42))}px system-ui,Segoe UI,sans-serif`;
		ctx.fillText(label.toUpperCase(), size / 2, size / 2 + size * 0.02);
	}

	const dataUrl = canvas.toDataURL('image/png');
	return { dataUrl, bytes: dataUrlToBytes(dataUrl) };
}

function defaultDesktop(input: FaviconGeneratorInput) {
	return (
		input.desktop ?? {
			marginPercent: 0,
			addBackground: input.mode === 'text',
			backgroundColor: input.backgroundColor,
			includeSvg: true
		}
	);
}

function defaultIos(input: FaviconGeneratorInput) {
	return (
		input.ios ?? {
			marginPercent: 0,
			backgroundColor: input.backgroundColor
		}
	);
}

function defaultPwa(input: FaviconGeneratorInput) {
	return (
		input.pwa ?? {
			marginPercent: 0,
			addBackground: input.mode === 'text',
			backgroundColor: input.backgroundColor,
			includeMaskable: true,
			maskableBackgroundColor: input.backgroundColor,
			maskableMarginPercent: 40
		}
	);
}

function defaultSite(input: FaviconGeneratorInput) {
	return (
		input.site ?? {
			appName: 'App',
			shortName: 'App',
			description: '',
			startUrl: '/',
			assetPath: '/',
			display: 'standalone' as const,
			themeColor: '#ffffff',
			darkThemeColor: '#000000',
			useDarkTheme: true,
			backgroundColor: '#ffffff'
		}
	);
}

function resolveSource(input: FaviconGeneratorInput): RenderSource {
	if (input.mode === 'image') {
		const src = input.imageDataUrl?.trim();
		if (!src) throw new Error('Upload an image');
		return { kind: 'image', dataUrl: src };
	}
	return {
		kind: 'text',
		text: normalizeInitials(input.text) || 'HT',
		textColor: input.textColor,
		rounded: input.rounded
	};
}

export function isSvgDataUrl(dataUrl: string | undefined | null): boolean {
	if (!dataUrl) return false;
	return /^data:image\/svg\+xml/i.test(dataUrl) || dataUrl.includes('image/svg+xml');
}

export async function svgTextFromDataUrl(dataUrl: string): Promise<string> {
	if (dataUrl.startsWith('data:image/svg+xml;base64,')) {
		const b64 = dataUrl.slice('data:image/svg+xml;base64,'.length);
		return typeof atob === 'function' ? atob(b64) : Buffer.from(b64, 'base64').toString('utf8');
	}
	if (dataUrl.startsWith('data:image/svg+xml,')) {
		return decodeURIComponent(dataUrl.slice('data:image/svg+xml,'.length));
	}
	const res = await fetch(dataUrl);
	return res.text();
}

/** Build a ZIP of all assets. */
export async function buildFaviconZip(output: FaviconGeneratorOutput): Promise<Blob> {
	const JSZip = (await import('jszip')).default;
	const zip = new JSZip();
	for (const png of output.pngs) {
		zip.file(assetFilename(png.id), png.bytes);
	}
	zip.file('favicon.ico', output.icoBytes);
	zip.file('site.webmanifest', output.manifest);
	zip.file('favicon-links.html', `${output.html}\n`);
	if (output.svgText) zip.file('favicon.svg', output.svgText);
	return zip.generateAsync({ type: 'blob' });
}

export async function run(input: FaviconGeneratorInput): Promise<FaviconGeneratorOutput> {
	const parsed = v.parse(inputSchema, {
		...input,
		text: input.mode === 'text' ? normalizeInitials(input.text) : input.text
	});
	if (typeof document === 'undefined') {
		throw new Error('Favicon generation requires a browser');
	}

	const source = resolveSource(parsed);
	const desktop = defaultDesktop(parsed);
	const ios = defaultIos(parsed);
	const pwa = defaultPwa(parsed);
	const site = defaultSite(parsed);
	const rounded = parsed.rounded;

	const pngs: FaviconPng[] = [];

	const push = async (
		id: string,
		size: number,
		paint: PlatformPaint & { forceOpaque?: boolean }
	) => {
		const rendered = await renderIcon(size, source, { ...paint, rounded });
		pngs.push({ id, size, dataUrl: rendered.dataUrl, bytes: rendered.bytes });
	};

	await push('favicon-16', 16, desktop);
	await push('favicon-32', 32, desktop);
	await push('favicon-48', 48, desktop);
	await push('apple', 180, {
		marginPercent: ios.marginPercent,
		addBackground: true,
		backgroundColor: ios.backgroundColor,
		forceOpaque: true
	});
	await push('pwa-192', 192, pwa);
	await push('pwa-512', 512, pwa);

	if (pwa.includeMaskable) {
		const maskPaint = {
			marginPercent: pwa.maskableMarginPercent,
			addBackground: true,
			backgroundColor: pwa.maskableBackgroundColor,
			forceOpaque: true
		};
		await push('maskable-192', 192, maskPaint);
		await push('maskable-512', 512, maskPaint);
	}

	const icoSources = (['favicon-16', 'favicon-32', 'favicon-48'] as const)
		.map((id) => pngs.find((p) => p.id === id)!)
		.filter(Boolean)
		.map((p) => ({ size: p.size, bytes: p.bytes }));
	const icoBytes = packPngsAsIco(icoSources);

	let svgText: string | null = null;
	if (desktop.includeSvg && parsed.mode === 'image' && isSvgDataUrl(parsed.imageDataUrl)) {
		try {
			svgText = await svgTextFromDataUrl(parsed.imageDataUrl!);
		} catch {
			svgText = null;
		}
	}

	return {
		pngs,
		icoBytes,
		icoDataUrl: bytesToDataUrl(icoBytes, 'image/x-icon'),
		html: buildFaviconHtml({
			assetPath: site.assetPath,
			includeSvg: Boolean(svgText),
			themeColor: site.themeColor,
			darkThemeColor: site.darkThemeColor,
			useDarkTheme: site.useDarkTheme,
			includeManifest: true
		}),
		manifest: buildWebManifest({
			appName: site.appName,
			shortName: site.shortName,
			description: site.description,
			startUrl: site.startUrl,
			display: site.display,
			themeColor: site.themeColor,
			backgroundColor: site.backgroundColor,
			assetPath: site.assetPath,
			includeMaskable: pwa.includeMaskable
		}),
		svgText
	};
}

export const faviconGenerator: ToolDefinition<FaviconGeneratorInput, FaviconGeneratorOutput> = {
	id: 'favicon-generator',
	version: '2.0.0',
	category: 'image',
	mode: 'instant',
	status: 'stable',
	tags: [
		'favicon',
		'icon',
		'png',
		'ico',
		'generator',
		'apple-touch-icon',
		'pwa',
		'manifest',
		'maskable'
	],
	capabilities: ['upload', 'download', 'copy', 'reset', 'favorite'],
	file: FAVICON_FILE_CONSTRAINTS,
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
		title: 'Favicon Generator — ICO, PNG, Apple Touch & PWA Icons',
		description:
			'Build a complete favicon bundle in your browser: multi-size ICO, PNG variants, Apple touch icon, PWA + maskable icons, web manifest, and HTML snippet—with live platform previews. Nothing is uploaded.',
		keywords: [
			'favicon generator',
			'favicon maker',
			'create favicon',
			'ico generator',
			'apple touch icon',
			'pwa icons',
			'maskable icon',
			'webmanifest'
		],
		related: ['image-resizer', 'image-compressor', 'qr-code-generator', 'svg-optimizer'],
		faq: [
			{
				question: 'What files do I get?',
				answer:
					'favicon.ico (16/32/48), favicon-16/32 PNGs, apple-touch-icon.png (180), pwa-192/512, optional maskable PWA icons, site.webmanifest, HTML <link> snippet, and favicon.svg when your source is SVG.'
			},
			{
				question: 'What do the platform margins do?',
				answer:
					'Each platform (desktop, iOS, PWA) has its own margin so you can leave breathing room inside the icon. Maskable icons use a larger safe-zone margin (40% recommended) so Android masks don’t crop your logo.'
			},
			{
				question: 'Can I use text instead of a logo?',
				answer:
					'Yes. Switch to Text / initials, enter up to 2 characters, and pick colors. Platform backgrounds and margins still apply.'
			},
			{
				question: 'Is my image uploaded?',
				answer:
					'No. Everything is rendered with canvas in your browser and packaged into a ZIP locally.'
			}
		],
		howTo: [
			'Upload a logo (or use initials)',
			'Set site name, theme colors, and asset path',
			'Tweak desktop, iOS, and PWA options while watching live previews',
			'Download the ZIP and paste the HTML snippet into your <head>'
		]
	},
	validation: { input: inputSchema },
	run,
	ui: {
		component: () => import('./ui.svelte')
	},
	analytics: { eventName: 'tool_run', props: ['mode'] }
};
