import type { ToolDefinition } from '$engine/types';
import { parseColorToRgb, rgbToHex, simulateColorBlindness } from '$lib/utils/color';
import { IMAGE_FILE_CONSTRAINTS } from '$lib/utils/image-canvas';
import * as v from 'valibot';

export const inputSchema = v.object({
	mode: v.picklist(['colors', 'image']),
	type: v.picklist(['protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia']),
	colors: v.string()
});

export type ColorBlindnessSimulatorInput = v.InferOutput<typeof inputSchema>;
export type SimulatedColor = { original: string; simulated: string };
export type ColorBlindnessSimulatorOutput = {
	colors: SimulatedColor[];
	error?: string;
};

const DEFAULT_COLORS = '#ef4444, #22c55e, #3b82f6';
const DEFAULT_TYPE: ColorBlindnessSimulatorInput['type'] = 'deuteranopia';

export function parseColorList(input: string): string[] {
	return input
		.split(/[\n,]+/)
		.map((part) => part.trim())
		.filter(Boolean);
}

export function run(input: ColorBlindnessSimulatorInput): ColorBlindnessSimulatorOutput {
	if (input.mode === 'image') {
		return { colors: [] };
	}

	try {
		const items = parseColorList(input.colors);
		if (!items.length) {
			return { colors: [], error: 'Enter at least one color' };
		}

		const colors = items.map((original) => {
			const rgb = parseColorToRgb(original);
			const simulated = simulateColorBlindness(rgb, input.type);
			return {
				original: rgbToHex(rgb),
				simulated: rgbToHex(simulated)
			};
		});

		return { colors };
	} catch (err) {
		return {
			colors: [],
			error: err instanceof Error ? err.message : 'Invalid color'
		};
	}
}

export const colorBlindnessSimulator: ToolDefinition<
	ColorBlindnessSimulatorInput,
	ColorBlindnessSimulatorOutput
> = {
	id: 'color-blindness-simulator',
	version: '1.0.0',
	category: 'color',
	mode: 'instant',
	status: 'stable',
	tags: ['colorblind', 'accessibility', 'cvd', 'simulator'],
	capabilities: ['copy', 'share', 'reset', 'favorite'],
	file: IMAGE_FILE_CONSTRAINTS,
	share: {
		params: ['mode', 'type', 'colors']
	},
	presets: [
		{
			id: 'palette',
			label: 'RGB palette',
			params: { mode: 'colors', type: DEFAULT_TYPE, colors: DEFAULT_COLORS }
		},
		{
			id: 'protanopia',
			label: 'Protanopia palette',
			params: { mode: 'colors', type: 'protanopia', colors: DEFAULT_COLORS }
		},
		{
			id: 'achromatopsia',
			label: 'Grayscale (achromatopsia)',
			params: { mode: 'colors', type: 'achromatopsia', colors: DEFAULT_COLORS }
		}
	],
	workflow: {
		next: ['contrast-checker', 'color-picker', 'image-color-extractor']
	},
	metadata: {
		name: 'Color Blindness Simulator',
		title: 'Color Blindness Simulator — CVD palette and image preview',
		description:
			'Simulate protanopia, deuteranopia, tritanopia, or achromatopsia on hex color palettes or uploaded images. Preview how designs appear to color-vision-deficient users.',
		keywords: [
			'color blindness simulator',
			'protanopia',
			'deuteranopia',
			'color blind test',
			'cvd simulator'
		],
		related: ['contrast-checker', 'color-picker', 'image-color-extractor'],
		faq: [
			{
				question: 'Which simulation types are available?',
				answer:
					'Protanopia (red weak), deuteranopia (green weak), tritanopia (blue weak), and achromatopsia (no color).'
			},
			{
				question: 'How do I simulate a palette?',
				answer:
					'Choose Colors mode and enter hex values separated by commas or new lines. Each swatch shows original vs simulated.'
			},
			{
				question: 'Are uploaded images sent to a server?',
				answer: 'No. Image simulation uses canvas locally in your browser.'
			}
		],
		howTo: [
			'Pick Colors or Image mode and a CVD type',
			'Enter hex colors or upload an image',
			'Compare original and simulated results'
		]
	},
	validation: { input: inputSchema },
	run,
	ui: { component: () => import('./ui.svelte') },
	analytics: { eventName: 'tool_run', props: ['mode', 'type'] }
};
