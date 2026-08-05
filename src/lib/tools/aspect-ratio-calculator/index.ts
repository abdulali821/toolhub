import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

export const inputSchema = v.object({
	mode: v.picklist(['simplify', 'scale']),
	width: v.pipe(v.number(), v.minValue(0)),
	height: v.pipe(v.number(), v.minValue(0)),
	ratioW: v.pipe(v.number(), v.minValue(0)),
	ratioH: v.pipe(v.number(), v.minValue(0)),
	lock: v.picklist(['width', 'height']),
	target: v.pipe(v.number(), v.minValue(0))
});

export type AspectRatioCalculatorInput = v.InferOutput<typeof inputSchema>;
export type AspectRatioCalculatorOutput = {
	ratioW: number;
	ratioH: number;
	ratioLabel: string;
	decimalRatio: number | null;
	width: number | null;
	height: number | null;
	error?: string;
};

function gcd(a: number, b: number): number {
	let x = Math.round(Math.abs(a));
	let y = Math.round(Math.abs(b));
	while (y) {
		[x, y] = [y, x % y];
	}
	return x || 1;
}

function simplifyRatio(w: number, h: number): { ratioW: number; ratioH: number } {
	const g = gcd(w, h);
	return { ratioW: w / g, ratioH: h / g };
}

export function run(input: AspectRatioCalculatorInput): AspectRatioCalculatorOutput {
	const empty: AspectRatioCalculatorOutput = {
		ratioW: 0,
		ratioH: 0,
		ratioLabel: '',
		decimalRatio: null,
		width: null,
		height: null
	};

	if (input.mode === 'simplify') {
		const { width, height } = input;
		if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
			return { ...empty, error: 'Enter a width and height greater than zero' };
		}
		const { ratioW, ratioH } = simplifyRatio(width, height);
		return {
			ratioW,
			ratioH,
			ratioLabel: `${ratioW}:${ratioH}`,
			decimalRatio: width / height,
			width,
			height
		};
	}

	// mode === 'scale'
	const { ratioW: rw, ratioH: rh, lock, target } = input;
	if (!Number.isFinite(rw) || !Number.isFinite(rh) || rw <= 0 || rh <= 0) {
		return { ...empty, error: 'Enter a ratio with both sides greater than zero' };
	}
	if (!Number.isFinite(target) || target <= 0) {
		return { ...empty, error: 'Enter a target dimension greater than zero' };
	}

	const { ratioW, ratioH } = simplifyRatio(rw, rh);
	const decimalRatio = rw / rh;

	const width = lock === 'width' ? target : (target * rw) / rh;
	const height = lock === 'height' ? target : (target * rh) / rw;

	return {
		ratioW,
		ratioH,
		ratioLabel: `${ratioW}:${ratioH}`,
		decimalRatio,
		width,
		height
	};
}

export const aspectRatioCalculator: ToolDefinition<
	AspectRatioCalculatorInput,
	AspectRatioCalculatorOutput
> = {
	id: 'aspect-ratio-calculator',
	version: '1.0.0',
	category: 'calculators',
	mode: 'instant',
	status: 'stable',
	tags: ['aspect', 'ratio', 'resize', 'calculator'],
	capabilities: ['copy', 'share', 'reset', 'favorite'],
	share: {
		params: ['mode', 'width', 'height', 'ratioW', 'ratioH', 'lock', 'target']
	},
	presets: [
		{
			id: 'hd-simplify',
			label: 'Simplify 1920×1080',
			params: { mode: 'simplify', width: '1920', height: '1080' }
		},
		{
			id: '16-9-width',
			label: 'Scale 16:9 from width',
			params: { mode: 'scale', ratioW: '16', ratioH: '9', lock: 'width', target: '1280' }
		},
		{
			id: '4-3-height',
			label: 'Scale 4:3 from height',
			params: { mode: 'scale', ratioW: '4', ratioH: '3', lock: 'height', target: '768' }
		}
	],
	workflow: {
		next: ['unit-converter', 'image-resizer']
	},
	metadata: {
		name: 'Aspect Ratio Calculator',
		title: 'Aspect Ratio Calculator — Simplify or Scale Dimensions',
		description:
			'Simplify a width and height into a ratio (like 16:9), or compute a missing width/height from a ratio and one known dimension. Runs entirely in your browser.',
		keywords: [
			'aspect ratio calculator',
			'ratio simplifier',
			'image resize ratio',
			'16:9 calculator',
			'scale dimensions'
		],
		related: ['unit-converter', 'image-resizer', 'image-compressor'],
		faq: [
			{
				question: 'How is the ratio simplified?',
				answer:
					'The width and height are divided by their greatest common divisor (GCD), producing the smallest whole-number ratio (e.g. 1920×1080 → 16:9).'
			},
			{
				question: 'How do I compute a missing dimension?',
				answer:
					'Switch to "Scale from ratio", enter your ratio (e.g. 16:9), choose whether width or height is known, then enter that target value—the other dimension is computed automatically.'
			},
			{
				question: 'Does my data leave my device?',
				answer: 'No. All calculations run locally in your browser.'
			}
		],
		howTo: [
			'Choose "Simplify" to reduce a width×height to a ratio, or "Scale from ratio" to find a missing side',
			'Enter your known values',
			'Copy the resulting ratio or dimensions'
		]
	},
	validation: { input: inputSchema },
	run,
	ui: { component: () => import('./ui.svelte') },
	analytics: { eventName: 'tool_run', props: ['mode'] }
};
