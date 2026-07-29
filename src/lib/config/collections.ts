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
			'Format, validate, minify, compare, and bridge JSON with YAML—everything in one workflow.',
		toolIds: [
			'json-formatter',
			'json-validator',
			'json-minifier',
			'json-compare',
			'json-to-yaml',
			'yaml-to-json',
			'csv-json-converter'
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
			'case-converter'
		]
	},
	{
		id: 'developer-starter-pack',
		name: 'Developer Starter Pack',
		description: 'Format SQL/YAML/XML, decode JWTs, test regex, hash strings, and generate UUIDs.',
		toolIds: [
			'sql-formatter',
			'yaml-formatter',
			'xml-formatter',
			'jwt-decoder',
			'regex-tester',
			'hash-generator',
			'uuid-generator'
		]
	},
	{
		id: 'image-essentials',
		name: 'Image Essentials',
		description:
			'Compress, resize, crop, convert, and inspect images locally—PNG, JPG, WebP, and SVG.',
		toolIds: [
			'image-compressor',
			'image-resizer',
			'crop-image',
			'rotate-image',
			'image-converter',
			'image-metadata',
			'image-color-extractor',
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
			'pdf-metadata'
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
			'Pick colors, check contrast, simulate color blindness, build gradients, and extract palettes.',
		toolIds: [
			'color-picker',
			'contrast-checker',
			'color-blindness-simulator',
			'gradient-generator',
			'color-converter',
			'image-color-extractor'
		]
	},
	{
		id: 'generators-pack',
		name: 'Generators Pack',
		description:
			'QR codes, barcodes, passwords, fake data, random strings, and placeholder content.',
		toolIds: [
			'qr-code-generator',
			'barcode-generator',
			'password-generator',
			'fake-data-generator',
			'random-string-generator',
			'uuid-generator',
			'lorem-ipsum'
		]
	}
];

export function getCollection(id: string): PlatformCollection | undefined {
	return platformCollections.find((c) => c.id === id);
}

export function listCollections(): PlatformCollection[] {
	return platformCollections;
}
