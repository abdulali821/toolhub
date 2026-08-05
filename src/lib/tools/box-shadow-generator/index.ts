import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

const hexColor = v.pipe(
	v.string(),
	v.regex(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i, 'Enter a valid hex color (e.g. #2563eb)')
);

export const inputSchema = v.object({
	offsetX: v.pipe(v.number(), v.finite()),
	offsetY: v.pipe(v.number(), v.finite()),
	blur: v.pipe(v.number(), v.minValue(0), v.finite()),
	spread: v.pipe(v.number(), v.finite()),
	color: hexColor,
	opacity: v.pipe(v.number(), v.minValue(0), v.maxValue(1)),
	inset: v.boolean()
});

export type BoxShadowGeneratorInput = v.InferOutput<typeof inputSchema>;
export type BoxShadowGeneratorOutput = {
	/** The box-shadow value only, e.g. "2px 4px 10px 0px rgba(0,0,0,0.35)" */
	value: string;
	/** Full CSS declaration, e.g. "box-shadow: ...;" */
	css: string;
	rgba: string;
};

export function normalizeHex(color: string): string {
	const raw = color.trim();
	return raw.startsWith('#') ? raw : `#${raw}`;
}

export function hexToRgb(color: string): { r: number; g: number; b: number } {
	let hex = normalizeHex(color).slice(1);
	if (hex.length === 3) {
		hex = hex
			.split('')
			.map((c) => c + c)
			.join('');
	}
	return {
		r: parseInt(hex.slice(0, 2), 16),
		g: parseInt(hex.slice(2, 4), 16),
		b: parseInt(hex.slice(4, 6), 16)
	};
}

export function run(input: BoxShadowGeneratorInput): BoxShadowGeneratorOutput {
	const { r, g, b } = hexToRgb(input.color);
	const opacity = Math.round(Math.min(1, Math.max(0, input.opacity)) * 1000) / 1000;
	const rgba = `rgba(${r}, ${g}, ${b}, ${opacity})`;
	const value = `${input.inset ? 'inset ' : ''}${input.offsetX}px ${input.offsetY}px ${input.blur}px ${input.spread}px ${rgba}`;
	return { value, css: `box-shadow: ${value};`, rgba };
}

export const boxShadowGenerator: ToolDefinition<BoxShadowGeneratorInput, BoxShadowGeneratorOutput> =
	{
		id: 'box-shadow-generator',
		version: '1.0.0',
		category: 'color',
		mode: 'instant',
		status: 'stable',
		tags: ['css', 'shadow', 'box-shadow', 'generator'],
		capabilities: ['copy', 'share', 'reset', 'favorite'],
		share: {
			params: ['offsetX', 'offsetY', 'blur', 'spread', 'color', 'opacity', 'inset']
		},
		presets: [
			{
				id: 'soft',
				label: 'Soft card shadow',
				params: {
					offsetX: '0',
					offsetY: '4',
					blur: '12',
					spread: '0',
					color: '000000',
					opacity: '0.12',
					inset: 'false'
				}
			},
			{
				id: 'sharp',
				label: 'Sharp offset',
				params: {
					offsetX: '6',
					offsetY: '6',
					blur: '0',
					spread: '0',
					color: '000000',
					opacity: '0.8',
					inset: 'false'
				}
			},
			{
				id: 'inset',
				label: 'Inset well',
				params: {
					offsetX: '0',
					offsetY: '2',
					blur: '4',
					spread: '0',
					color: '000000',
					opacity: '0.25',
					inset: 'true'
				}
			}
		],
		workflow: {
			next: ['gradient-generator', 'color-picker', 'contrast-checker']
		},
		metadata: {
			name: 'Box Shadow Generator',
			title: 'Box Shadow Generator — CSS box-shadow with live preview',
			description:
				'Design a CSS box-shadow visually: offset, blur, spread, color, opacity, and inset. Live preview and one-click copy.',
			keywords: [
				'box shadow generator',
				'css box-shadow',
				'box shadow css',
				'drop shadow css',
				'inset shadow'
			],
			related: ['gradient-generator', 'color-picker', 'contrast-checker'],
			faq: [
				{
					question: 'What do offset, blur, and spread control?',
					answer:
						'Offset X/Y move the shadow horizontally and vertically. Blur softens the edge (higher = softer). Spread grows or shrinks the shadow shape before blurring.'
				},
				{
					question: 'What does inset do?',
					answer:
						'Inset draws the shadow inside the element\u2019s border, creating a pressed-in or well look instead of a shadow cast outward.'
				},
				{
					question: 'Can I share my shadow settings?',
					answer:
						'Yes. All values are stored in the URL, so copying the link reproduces the exact shadow.'
				},
				{
					question: 'Does this run on a server?',
					answer: 'No. The CSS string is generated locally in your browser.'
				}
			],
			howTo: [
				'Set offset X/Y, blur, and spread in pixels',
				'Pick a color and adjust opacity',
				'Toggle inset if you want an inward shadow',
				'Copy the generated box-shadow CSS'
			]
		},
		validation: { input: inputSchema },
		run,
		ui: { component: () => import('./ui.svelte') },
		analytics: { eventName: 'tool_run', props: ['inset'] }
	};
