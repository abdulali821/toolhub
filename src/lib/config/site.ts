/**
 * Site configuration (public, non-secret).
 * ToolHub is a free online tools platform (SEO-first), not a SaaS.
 * Environment-specific values come from `$env` via `$server/env`.
 *
 * Categories are SEO landing pages — prefer clear, cluster-aligned labels.
 */
export const site = {
	name: 'ToolHub',
	tagline: 'Fast, focused online tools',
	defaultTitleTemplate: '%s | ToolHub'
} as const;

export const categories = [
	{
		id: 'developer',
		label: 'Developer Tools',
		description:
			'JWTs, regex, hashes, SQL/YAML/XML formatters, and everyday engineering helpers—no install required.'
	},
	{
		id: 'text',
		label: 'Text Tools',
		description:
			'Count words, sort lines, find and replace, clean whitespace, and transform text privately in your browser.'
	},
	{
		id: 'data',
		label: 'Data Tools',
		description:
			'Format, validate, minify, compare, and convert JSON, CSV, YAML, and XML for APIs and configs.'
	},
	{
		id: 'image',
		label: 'Image Tools',
		description: 'Compress, resize, convert, and inspect images locally—PNG, JPG, WebP, and more.'
	},
	{
		id: 'pdf',
		label: 'PDF Tools',
		description:
			'Merge, split, compress, and transform PDFs without uploading to a third-party server.'
	},
	{
		id: 'color',
		label: 'Color Tools',
		description:
			'Convert colors, build palettes and gradients, and check contrast for accessible design.'
	},
	{
		id: 'encoders',
		label: 'Encoders & Decoders',
		description:
			'Base64, HTML entities, URL encoding, hex, Unicode escapes, and other encode/decode utilities.'
	},
	{
		id: 'converters',
		label: 'Converters',
		description:
			'Move values between formats—timestamps, number bases, and other everyday conversions.'
	},
	{
		id: 'generators',
		label: 'Generators',
		description:
			'Passwords, UUIDs, QR codes, fake data, random strings, and placeholder content for prototypes.'
	},
	{
		id: 'calculators',
		label: 'Calculators',
		description: 'Percentages and quick calculations that stay private in your browser.'
	}
] as const;

export type CategoryId = (typeof categories)[number]['id'];

/** Map legacy category ids (pre–SEO cluster rename) to current ids. */
export const legacyCategoryRedirects: Record<string, CategoryId> = {
	dev: 'developer'
};
