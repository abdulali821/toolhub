import type { ToolId } from '$engine/types';

export type PlatformCollection = {
	id: string;
	name: string;
	description: string;
	toolIds: ToolId[];
};

/**
 * Static, account-free curated tool packs.
 * Not user collections — defined in code only (no Supabase).
 * Aligned with SEO clusters so packs reinforce internal linking.
 */
export const platformCollections: PlatformCollection[] = [
	{
		id: 'json-data-pack',
		name: 'JSON & Data Pack',
		description:
			'Format, validate, minify, compare, and bridge JSON with YAML and CSV—everything in one workflow.',
		toolIds: [
			'json-formatter',
			'json-validator',
			'json-minifier',
			'json-compare',
			'json-to-yaml',
			'yaml-to-json',
			'csv-json-converter',
			'query-string-json',
			'csv-viewer'
		]
	},
	{
		id: 'text-cleanup-pack',
		name: 'Text Cleanup Pack',
		description:
			'Trim, dedupe, sort, replace, and tidy lines before you paste them into code or spreadsheets.',
		toolIds: [
			'remove-empty-lines',
			'trim-lines',
			'whitespace-cleaner',
			'add-prefix-suffix',
			'duplicate-line-remover',
			'line-sort',
			'find-replace',
			'case-converter',
			'markdown-to-html',
			'reading-time-estimator'
		]
	},
	{
		id: 'developer-starter-pack',
		name: 'Developer Starter Pack',
		description:
			'Format SQL/YAML/XML/CSS, encode/decode JWTs, test regex, hash strings, generate IDs, and convert curl commands.',
		toolIds: [
			'sql-formatter',
			'yaml-formatter',
			'xml-formatter',
			'css-minifier',
			'jwt-decoder',
			'jwt-encoder',
			'regex-tester',
			'url-parser',
			'curl-to-fetch'
		]
	},
	{
		id: 'image-essentials',
		name: 'Image Essentials',
		description:
			'Compress, resize, crop, convert, tile, split, and make divider banners locally—PNG, JPG, WebP, and SVG.',
		toolIds: [
			'image-compressor',
			'image-resizer',
			'crop-image',
			'rotate-image',
			'background-remover',
			'image-tiler',
			'image-splitter',
			'image-divider',
			'favicon-generator',
			'image-converter',
			'image-watermark',
			'image-metadata',
			'svg-optimizer'
		]
	},
	{
		id: 'pdf-toolkit',
		name: 'PDF Toolkit',
		description:
			'Merge, split, rotate, extract, compress, and convert PDFs entirely in your browser.',
		toolIds: [
			'pdf-merge',
			'pdf-split',
			'pdf-compress',
			'pdf-rotate',
			'pdf-extract-pages',
			'pdf-delete-pages',
			'pdf-reorder-pages',
			'images-to-pdf',
			'pdf-to-images',
			'pdf-metadata',
			'markdown-to-pdf'
		]
	},
	{
		id: 'encoding-pack',
		name: 'Encoders Pack',
		description:
			'Base64, hex, binary, ASCII, Unicode escapes, ROT13, and Morse—encode and decode locally.',
		toolIds: [
			'base64-codec',
			'hex-codec',
			'binary-converter',
			'ascii-converter',
			'unicode-escape',
			'url-codec',
			'html-codec',
			'rot13',
			'morse-codec'
		]
	},
	{
		id: 'color-design-pack',
		name: 'Color & Design Pack',
		description:
			'Pick colors, check contrast, build palettes, gradients, shadows, glassmorphism, CSS animations, and more.',
		toolIds: [
			'color-picker',
			'contrast-checker',
			'color-palette-generator',
			'gradient-generator',
			'box-shadow-generator',
			'css-animation-generator',
			'glassmorphism-generator',
			'color-converter'
		]
	},
	{
		id: 'generators-pack',
		name: 'Generators Pack',
		description:
			'QR codes, barcodes, cron schedules, passwords, NanoIDs, fake data, timezone meeting planner, and device testers.',
		toolIds: [
			'qr-code-generator',
			'barcode-generator',
			'cron-generator',
			'nanoid-generator',
			'password-generator',
			'uuid-generator',
			'lorem-ipsum',
			'timezone-meeting-planner',
			'keyboard-tester',
			'device-tester'
		]
	}
];

export function getCollection(id: string): PlatformCollection | undefined {
	return platformCollections.find((c) => c.id === id);
}

export function listCollections(): PlatformCollection[] {
	return platformCollections;
}
