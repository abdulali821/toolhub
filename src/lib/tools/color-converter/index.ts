import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

export const inputSchema = v.object({
	value: v.pipe(v.string(), v.minLength(1, 'Enter a color'))
});

export type ColorInput = v.InferOutput<typeof inputSchema>;
export type ColorOutput = {
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

function parseColor(value: string): { r: number; g: number; b: number } {
	const raw = value.trim();
	const hex = raw.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
	if (hex) {
		let h = hex[1]!;
		if (h.length === 3)
			h = h
				.split('')
				.map((c) => c + c)
				.join('');
		return {
			r: parseInt(h.slice(0, 2), 16),
			g: parseInt(h.slice(2, 4), 16),
			b: parseInt(h.slice(4, 6), 16)
		};
	}

	const rgb = raw.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
	if (rgb) {
		return {
			r: clamp(Number(rgb[1]), 0, 255),
			g: clamp(Number(rgb[2]), 0, 255),
			b: clamp(Number(rgb[3]), 0, 255)
		};
	}

	throw new Error('Enter #hex or rgb(r, g, b)');
}

export function run(input: ColorInput): ColorOutput {
	try {
		const { r, g, b } = parseColor(input.value);
		const hex = `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
		const { h, s, l } = rgbToHsl(r, g, b);
		return {
			hex,
			rgb: `rgb(${r}, ${g}, ${b})`,
			hsl: `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`
		};
	} catch (err) {
		return {
			hex: '',
			rgb: '',
			hsl: '',
			error: err instanceof Error ? err.message : 'Invalid color'
		};
	}
}

export const colorConverter: ToolDefinition<ColorInput, ColorOutput> = {
	id: 'color-converter',
	version: '1.0.0',
	category: 'color',
	mode: 'instant',
	status: 'stable',
	tags: ['color', 'hex', 'rgb', 'hsl'],
	capabilities: ['copy', 'share', 'reset', 'favorite'],
	share: {
		params: ['hex']
	},
	presets: [
		{
			id: 'hex-red',
			label: 'HEX → RGB (red)',
			params: { hex: 'ff0000' }
		},
		{
			id: 'brand-teal',
			label: 'Brand teal',
			params: { hex: '0f766e' }
		},
		{
			id: 'rgb-sample',
			label: 'RGB sample',
			params: { hex: '2563eb' }
		}
	],
	workflow: {
		next: ['contrast-checker', 'color-blindness-simulator', 'color-picker', 'gradient-generator']
	},
	metadata: {
		name: 'Color Converter',
		title: 'Color Converter — HEX, RGB, HSL',
		description: 'Convert colors between HEX, RGB, and HSL formats instantly.',
		keywords: ['hex to rgb', 'rgb to hex', 'hsl converter', 'color picker'],
		related: [
			'contrast-checker',
			'color-blindness-simulator',
			'color-picker',
			'gradient-generator'
		],
		faq: [
			{
				question: 'What formats are accepted?',
				answer: 'HEX (#fff or #ffffff) and rgb()/rgba() values.'
			},
			{
				question: 'Can I share a color?',
				answer: 'Yes. Use Share link — the URL includes the hex value (e.g. ?hex=ff0000).'
			}
		],
		howTo: [
			'Enter a HEX or RGB color',
			'View synced HEX, RGB, and HSL values',
			'Copy or share your color'
		]
	},
	validation: { input: inputSchema },
	run,
	ui: { component: () => import('./ui.svelte') },
	analytics: { eventName: 'tool_run' }
};
