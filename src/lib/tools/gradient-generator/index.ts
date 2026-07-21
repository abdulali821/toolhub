import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

export const inputSchema = v.object({
	type: v.picklist(['linear', 'radial']),
	angle: v.pipe(v.number(), v.minValue(0), v.maxValue(360)),
	color1: v.pipe(v.string(), v.minLength(1)),
	color2: v.pipe(v.string(), v.minLength(1))
});

export type GradientGeneratorInput = v.InferOutput<typeof inputSchema>;
export type GradientGeneratorOutput = { css: string };

function normalizeHex(color: string): string {
	const raw = color.trim();
	if (/^#?[0-9a-f]{3}([0-9a-f]{3})?$/i.test(raw)) {
		return raw.startsWith('#') ? raw : `#${raw}`;
	}
	return raw;
}

export function buildGradientCss(input: GradientGeneratorInput): string {
	const color1 = normalizeHex(input.color1);
	const color2 = normalizeHex(input.color2);
	const angle = Math.round(input.angle);

	if (input.type === 'radial') {
		return `radial-gradient(circle, ${color1}, ${color2})`;
	}

	return `linear-gradient(${angle}deg, ${color1}, ${color2})`;
}

export function run(input: GradientGeneratorInput): GradientGeneratorOutput {
	return { css: buildGradientCss(input) };
}

export const gradientGenerator: ToolDefinition<GradientGeneratorInput, GradientGeneratorOutput> = {
	id: 'gradient-generator',
	version: '1.0.0',
	category: 'color',
	mode: 'instant',
	status: 'stable',
	tags: ['gradient', 'css', 'color', 'background'],
	capabilities: ['copy', 'share', 'reset', 'favorite'],
	share: {
		params: ['type', 'angle', 'color1', 'color2']
	},
	workflow: {
		next: ['contrast-checker', 'color-blindness-simulator', 'color-picker', 'color-converter']
	},
	metadata: {
		name: 'Gradient Generator',
		title: 'Gradient Generator — CSS linear and radial gradients',
		description:
			'Build linear or radial CSS gradients with two colors and a live preview. Copy the gradient string for your stylesheets.',
		keywords: ['gradient generator', 'css gradient', 'linear gradient', 'radial gradient'],
		related: ['contrast-checker', 'color-blindness-simulator', 'color-picker', 'color-converter'],
		faq: [
			{
				question: 'What output do I get?',
				answer: 'A ready-to-use CSS gradient value such as linear-gradient(90deg, #000, #fff).'
			},
			{
				question: 'Can I share my gradient?',
				answer: 'Yes. Type, angle, and both colors are stored in the shareable URL.'
			}
		],
		howTo: [
			'Choose linear or radial gradient',
			'Set colors and angle',
			'Copy the CSS gradient string'
		]
	},
	validation: { input: inputSchema },
	run,
	ui: {
		component: () => import('./ui.svelte')
	},
	analytics: { eventName: 'tool_run', props: ['type'] }
};
