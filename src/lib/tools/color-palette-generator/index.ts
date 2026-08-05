import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';
import { parseColorToRgb, rgbToHex, clamp, type Rgb } from '$lib/utils/color';

export const inputSchema = v.object({
	baseHex: v.pipe(v.string(), v.minLength(1, 'Enter a base color')),
	mode: v.picklist(['tints-shades', 'complementary', 'analogous', 'triadic'])
});

export type ColorPaletteGeneratorInput = v.InferOutput<typeof inputSchema>;
export type PaletteColor = { hex: string; label: string };
export type ColorPaletteGeneratorOutput = {
	baseHex: string;
	colors: PaletteColor[];
	error?: string;
};

function rgbToHsl({ r, g, b }: Rgb): { h: number; s: number; l: number } {
	const rn = r / 255;
	const gn = g / 255;
	const bn = b / 255;
	const max = Math.max(rn, gn, bn);
	const min = Math.min(rn, gn, bn);
	const l = (max + min) / 2;
	if (max === min) return { h: 0, s: 0, l: l * 100 };
	const d = max - min;
	const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
	let h: number;
	switch (max) {
		case rn:
			h = (gn - bn) / d + (gn < bn ? 6 : 0);
			break;
		case gn:
			h = (bn - rn) / d + 2;
			break;
		default:
			h = (rn - gn) / d + 4;
	}
	h /= 6;
	return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToRgb(h: number, s: number, l: number): Rgb {
	const hn = ((h % 360) + 360) % 360;
	const sn = clamp(s, 0, 100) / 100;
	const ln = clamp(l, 0, 100) / 100;

	if (sn === 0) {
		const gray = Math.round(ln * 255);
		return { r: gray, g: gray, b: gray };
	}

	const c = (1 - Math.abs(2 * ln - 1)) * sn;
	const x = c * (1 - Math.abs(((hn / 60) % 2) - 1));
	const m = ln - c / 2;

	let rp = 0;
	let gp = 0;
	let bp = 0;
	if (hn < 60) {
		rp = c;
		gp = x;
	} else if (hn < 120) {
		rp = x;
		gp = c;
	} else if (hn < 180) {
		gp = c;
		bp = x;
	} else if (hn < 240) {
		gp = x;
		bp = c;
	} else if (hn < 300) {
		rp = x;
		bp = c;
	} else {
		rp = c;
		bp = x;
	}

	return {
		r: Math.round((rp + m) * 255),
		g: Math.round((gp + m) * 255),
		b: Math.round((bp + m) * 255)
	};
}

function mix(a: Rgb, b: Rgb, amount: number): Rgb {
	const t = clamp(amount, 0, 1);
	return {
		r: Math.round(a.r + (b.r - a.r) * t),
		g: Math.round(a.g + (b.g - a.g) * t),
		b: Math.round(a.b + (b.b - a.b) * t)
	};
}

const WHITE: Rgb = { r: 255, g: 255, b: 255 };
const BLACK: Rgb = { r: 0, g: 0, b: 0 };

function tintsShades(base: Rgb): PaletteColor[] {
	const shadeAmounts = [0.8, 0.6, 0.4, 0.2];
	const tintAmounts = [0.2, 0.4, 0.6, 0.8];

	const shades = shadeAmounts.map((amount) => ({
		hex: rgbToHex(mix(base, BLACK, amount)),
		label: `Shade ${Math.round(amount * 100)}%`
	}));
	const tints = tintAmounts.map((amount) => ({
		hex: rgbToHex(mix(base, WHITE, amount)),
		label: `Tint ${Math.round(amount * 100)}%`
	}));

	return [...shades, { hex: rgbToHex(base), label: 'Base' }, ...tints];
}

function complementary(base: Rgb): PaletteColor[] {
	const { h, s, l } = rgbToHsl(base);
	return [
		{ hex: rgbToHex(base), label: 'Base' },
		{ hex: rgbToHex(hslToRgb(h + 180, s, l)), label: 'Complementary' }
	];
}

function analogous(base: Rgb): PaletteColor[] {
	const { h, s, l } = rgbToHsl(base);
	return [
		{ hex: rgbToHex(hslToRgb(h - 60, s, l)), label: '-60°' },
		{ hex: rgbToHex(hslToRgb(h - 30, s, l)), label: '-30°' },
		{ hex: rgbToHex(base), label: 'Base' },
		{ hex: rgbToHex(hslToRgb(h + 30, s, l)), label: '+30°' },
		{ hex: rgbToHex(hslToRgb(h + 60, s, l)), label: '+60°' }
	];
}

function triadic(base: Rgb): PaletteColor[] {
	const { h, s, l } = rgbToHsl(base);
	return [
		{ hex: rgbToHex(base), label: 'Base' },
		{ hex: rgbToHex(hslToRgb(h + 120, s, l)), label: 'Triadic 1' },
		{ hex: rgbToHex(hslToRgb(h + 240, s, l)), label: 'Triadic 2' }
	];
}

export function run(input: ColorPaletteGeneratorInput): ColorPaletteGeneratorOutput {
	let base: Rgb;
	try {
		base = parseColorToRgb(input.baseHex);
	} catch (err) {
		return {
			baseHex: input.baseHex,
			colors: [],
			error: err instanceof Error ? err.message : 'Enter a valid color'
		};
	}

	const baseHex = rgbToHex(base);

	switch (input.mode) {
		case 'tints-shades':
			return { baseHex, colors: tintsShades(base) };
		case 'complementary':
			return { baseHex, colors: complementary(base) };
		case 'analogous':
			return { baseHex, colors: analogous(base) };
		case 'triadic':
			return { baseHex, colors: triadic(base) };
	}
}

export const colorPaletteGenerator: ToolDefinition<
	ColorPaletteGeneratorInput,
	ColorPaletteGeneratorOutput
> = {
	id: 'color-palette-generator',
	version: '1.0.0',
	category: 'color',
	mode: 'instant',
	status: 'stable',
	tags: ['palette', 'tint', 'shade', 'color'],
	capabilities: ['copy', 'share', 'reset', 'favorite'],
	share: {
		params: ['baseHex', 'mode']
	},
	presets: [
		{
			id: 'tints-shades',
			label: 'Tints & shades',
			params: { baseHex: '3b82f6', mode: 'tints-shades' }
		},
		{
			id: 'complementary',
			label: 'Complementary',
			params: { baseHex: '3b82f6', mode: 'complementary' }
		},
		{ id: 'analogous', label: 'Analogous', params: { baseHex: '3b82f6', mode: 'analogous' } },
		{ id: 'triadic', label: 'Triadic', params: { baseHex: '3b82f6', mode: 'triadic' } }
	],
	workflow: {
		next: ['color-converter', 'gradient-generator', 'contrast-checker']
	},
	metadata: {
		name: 'Color Palette Generator',
		title: 'Color Palette Generator — Tints, Shades & Harmonies',
		description:
			'Generate tints, shades, complementary, analogous, or triadic color palettes from a single base color. Copy any swatch as HEX, all locally in your browser.',
		keywords: [
			'color palette generator',
			'tints and shades',
			'complementary colors',
			'analogous colors',
			'triadic colors'
		],
		related: ['color-converter', 'gradient-generator', 'contrast-checker'],
		faq: [
			{
				question: 'What does “tints & shades” mean?',
				answer:
					'Tints mix your base color with white (lighter); shades mix it with black (darker). Together they form a simple monochrome ramp.'
			},
			{
				question: 'What’s the difference between complementary, analogous, and triadic?',
				answer:
					'Complementary picks the hue directly opposite on the color wheel (180°). Analogous picks nearby hues (±30–60°) for a harmonious look. Triadic picks two hues evenly spaced 120° apart for a bold, balanced palette.'
			},
			{
				question: 'Does my color leave my device?',
				answer: 'No. Every palette is computed locally in your browser.'
			}
		],
		howTo: [
			'Pick a base color',
			'Choose a palette mode (tints & shades, complementary, analogous, or triadic)',
			'Click any swatch to copy its HEX value'
		]
	},
	validation: { input: inputSchema },
	run,
	ui: { component: () => import('./ui.svelte') },
	analytics: { eventName: 'tool_run', props: ['mode'] }
};
