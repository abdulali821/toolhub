import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

const hexColor = v.pipe(
	v.string(),
	v.regex(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i, 'Enter a valid hex color (e.g. #ffffff)')
);

export const inputSchema = v.object({
	blur: v.pipe(v.number(), v.minValue(0), v.maxValue(60), v.finite()),
	saturation: v.pipe(v.number(), v.minValue(0), v.maxValue(300), v.finite()),
	bgColor: hexColor,
	bgOpacity: v.pipe(v.number(), v.minValue(0), v.maxValue(1)),
	borderOpacity: v.pipe(v.number(), v.minValue(0), v.maxValue(1)),
	borderWidth: v.pipe(v.number(), v.minValue(0), v.maxValue(10), v.finite()),
	borderRadius: v.pipe(v.number(), v.minValue(0), v.maxValue(64), v.finite()),
	shadow: v.boolean()
});

export type GlassmorphismGeneratorInput = v.InferOutput<typeof inputSchema>;
export type GlassmorphismGeneratorOutput = {
	/** Full `.glass { ... }` rule, ready to paste into a stylesheet. */
	css: string;
	/** Same declarations flattened for use in an inline `style` attribute. */
	panelStyle: string;
	/** Guidance for what to place behind the glass panel. */
	backgroundHint: string;
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

/** Convert a hex color + opacity (0–1) into an `rgba(...)` string. */
export function hexToRgba(color: string, opacity: number): string {
	const { r, g, b } = hexToRgb(color);
	const a = Math.round(Math.min(1, Math.max(0, opacity)) * 1000) / 1000;
	return `rgba(${r}, ${g}, ${b}, ${a})`;
}

const SHADOW = '0 8px 32px rgba(0, 0, 0, 0.24)';

export function run(input: GlassmorphismGeneratorInput): GlassmorphismGeneratorOutput {
	const parsed = v.parse(inputSchema, input);
	const background = hexToRgba(parsed.bgColor, parsed.bgOpacity);
	const borderColor = hexToRgba('#ffffff', parsed.borderOpacity);
	const filter = `blur(${parsed.blur}px) saturate(${parsed.saturation}%)`;

	const declarations: string[] = [
		`background: ${background}`,
		`backdrop-filter: ${filter}`,
		`-webkit-backdrop-filter: ${filter}`,
		`border: ${parsed.borderWidth}px solid ${borderColor}`,
		`border-radius: ${parsed.borderRadius}px`
	];
	if (parsed.shadow) declarations.push(`box-shadow: ${SHADOW}`);

	const panelStyle = declarations.map((d) => `${d};`).join(' ');
	const css = `.glass {\n  ${declarations.join(';\n  ')};\n}`;

	return {
		css,
		panelStyle,
		backgroundHint:
			'Glassmorphism needs contrast behind it — place .glass over a colorful gradient, photo, or busy background rather than a flat color.'
	};
}

export const glassmorphismGenerator: ToolDefinition<
	GlassmorphismGeneratorInput,
	GlassmorphismGeneratorOutput
> = {
	id: 'glassmorphism-generator',
	version: '1.0.0',
	category: 'color',
	mode: 'instant',
	status: 'stable',
	tags: ['css', 'glassmorphism', 'blur', 'ui', 'generator', 'backdrop-filter'],
	capabilities: ['copy', 'share', 'reset', 'favorite'],
	share: {
		params: [
			'blur',
			'saturation',
			'bgColor',
			'bgOpacity',
			'borderOpacity',
			'borderWidth',
			'borderRadius',
			'shadow'
		]
	},
	presets: [
		{
			id: 'soft',
			label: 'Soft',
			params: {
				blur: '8',
				saturation: '140',
				bgColor: 'ffffff',
				bgOpacity: '0.35',
				borderOpacity: '0.4',
				borderWidth: '1',
				borderRadius: '20',
				shadow: 'true'
			}
		},
		{
			id: 'frosted',
			label: 'Frosted',
			params: {
				blur: '20',
				saturation: '180',
				bgColor: 'ffffff',
				bgOpacity: '0.15',
				borderOpacity: '0.25',
				borderWidth: '1',
				borderRadius: '16',
				shadow: 'true'
			}
		},
		{
			id: 'dark-glass',
			label: 'Dark glass',
			params: {
				blur: '16',
				saturation: '120',
				bgColor: '000000',
				bgOpacity: '0.35',
				borderOpacity: '0.15',
				borderWidth: '1',
				borderRadius: '16',
				shadow: 'true'
			}
		}
	],
	workflow: {
		next: ['box-shadow-generator', 'gradient-generator', 'css-animation-generator']
	},
	metadata: {
		name: 'Glassmorphism Generator',
		title: 'Glassmorphism Generator — Frosted glass CSS with live preview',
		description:
			'Design a frosted-glass CSS card visually: blur, saturation, background tint, border, and radius. Live preview over a colorful backdrop, then copy the CSS.',
		keywords: [
			'glassmorphism generator',
			'frosted glass css',
			'backdrop-filter generator',
			'glass effect css',
			'glassmorphism css'
		],
		related: ['box-shadow-generator', 'gradient-generator', 'css-animation-generator'],
		faq: [
			{
				question: 'What CSS property creates the glass effect?',
				answer:
					'`backdrop-filter: blur() saturate()` blurs and boosts the saturation of whatever is behind the element, combined with a semi-transparent background and a light border to sell the glass look.'
			},
			{
				question: 'Why does the preview look flat / not glassy?',
				answer:
					'Backdrop blur only has an effect when there is something visually busy behind it — a gradient, photo, or pattern. Flat single-color backgrounds will look plain even with blur applied.'
			},
			{
				question: 'Do I need the -webkit- prefix?',
				answer:
					'Yes, for full Safari support. This tool includes both `backdrop-filter` and `-webkit-backdrop-filter` in the generated CSS automatically.'
			},
			{
				question: 'Can I share my settings with someone else?',
				answer:
					'Yes. All values are stored in the URL, so copying the link reproduces the exact glass effect.'
			},
			{
				question: 'Does this run on a server?',
				answer: 'No. The CSS string is generated locally in your browser.'
			}
		],
		howTo: [
			'Pick a preset (Soft, Frosted, or Dark glass) or start from scratch',
			'Adjust blur, saturation, background color/opacity, and border',
			'Toggle the optional shadow and tune the corner radius',
			'Copy the generated CSS from the Action Bar'
		]
	},
	validation: { input: inputSchema },
	run,
	ui: { component: () => import('./ui.svelte') },
	analytics: { eventName: 'tool_run', props: ['shadow'] }
};
