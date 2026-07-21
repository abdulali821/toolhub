import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

export const inputSchema = v.object({
	hex: v.pipe(v.string(), v.minLength(1, 'Enter a color'))
});

export type ColorPickerInput = v.InferOutput<typeof inputSchema>;
export type ColorPickerOutput = {
	hex: string;
	rgb: string;
	hsl: string;
	error?: string;
};

function clamp(n: number, min: number, max: number) {
	return Math.min(max, Math.max(min, n));
}

function rgbToHsl(r: number, g: number, b: number) {
	r /= 255;
	g /= 255;
	b /= 255;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const l = (max + min) / 2;
	if (max === min) return { h: 0, s: 0, l };
	const d = max - min;
	const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
	let h: number;
	switch (max) {
		case r:
			h = (g - b) / d + (g < b ? 6 : 0);
			break;
		case g:
			h = (b - r) / d + 2;
			break;
		default:
			h = (r - g) / d + 4;
	}
	h /= 6;
	return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToRgb(h: number, s: number, l: number) {
	h /= 360;
	s /= 100;
	l /= 100;
	if (s === 0) {
		const val = Math.round(l * 255);
		return { r: val, g: val, b: val };
	}
	const hue2rgb = (p: number, q: number, t: number) => {
		if (t < 0) t += 1;
		if (t > 1) t -= 1;
		if (t < 1 / 6) return p + (q - p) * 6 * t;
		if (t < 1 / 2) return q;
		if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
		return p;
	};
	const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
	const p = 2 * l - q;
	return {
		r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
		g: Math.round(hue2rgb(p, q, h) * 255),
		b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255)
	};
}

function fromRgbParts(r: number, g: number, b: number): ColorPickerOutput {
	const hex = `#${[r, g, b].map((n) => clamp(n, 0, 255).toString(16).padStart(2, '0')).join('')}`;
	const { h, s, l } = rgbToHsl(r, g, b);
	return {
		hex,
		rgb: `rgb(${r}, ${g}, ${b})`,
		hsl: `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`
	};
}

export function parseColorValue(value: string): ColorPickerOutput {
	const raw = value.trim();

	const hex = raw.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
	if (hex) {
		let h = hex[1]!;
		if (h.length === 3) {
			h = h
				.split('')
				.map((c) => c + c)
				.join('');
		}
		return fromRgbParts(
			parseInt(h.slice(0, 2), 16),
			parseInt(h.slice(2, 4), 16),
			parseInt(h.slice(4, 6), 16)
		);
	}

	const rgb = raw.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
	if (rgb) {
		return fromRgbParts(
			clamp(Number(rgb[1]), 0, 255),
			clamp(Number(rgb[2]), 0, 255),
			clamp(Number(rgb[3]), 0, 255)
		);
	}

	const hsl = raw.match(/^hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%/i);
	if (hsl) {
		const { r, g, b } = hslToRgb(Number(hsl[1]), Number(hsl[2]), Number(hsl[3]));
		return fromRgbParts(r, g, b);
	}

	throw new Error('Enter #hex, rgb(), or hsl()');
}

export function run(input: ColorPickerInput): ColorPickerOutput {
	try {
		return parseColorValue(input.hex.trim());
	} catch (err) {
		return {
			hex: '',
			rgb: '',
			hsl: '',
			error: err instanceof Error ? err.message : 'Invalid color'
		};
	}
}

export const colorPicker: ToolDefinition<ColorPickerInput, ColorPickerOutput> = {
	id: 'color-picker',
	version: '1.0.0',
	category: 'color',
	mode: 'instant',
	status: 'stable',
	tags: ['color', 'picker', 'hex', 'rgb', 'hsl'],
	capabilities: ['copy', 'share', 'reset', 'favorite'],
	share: {
		params: ['hex']
	},
	workflow: {
		next: ['contrast-checker', 'color-blindness-simulator', 'color-converter', 'gradient-generator']
	},
	metadata: {
		name: 'Color Picker',
		title: 'Color Picker — HEX, RGB, and HSL synced',
		description:
			'Pick a color with the native swatch or type HEX, RGB, and HSL values kept in sync. Copy any format or share via URL.',
		keywords: ['color picker', 'hex picker', 'rgb color picker', 'hsl picker'],
		related: [
			'contrast-checker',
			'color-blindness-simulator',
			'color-converter',
			'gradient-generator'
		],
		faq: [
			{
				question: 'Which formats sync?',
				answer: 'HEX, RGB, and HSL fields stay in sync, along with the native browser color input.'
			},
			{
				question: 'Can I share a picked color?',
				answer: 'Yes. Share link stores the hex value in the URL query string.'
			}
		],
		howTo: [
			'Pick a color with the swatch or type a value',
			'Copy HEX, RGB, or HSL',
			'Share the color via URL'
		]
	},
	validation: { input: inputSchema },
	run,
	ui: {
		component: () => import('./ui.svelte')
	},
	analytics: { eventName: 'tool_run' }
};
