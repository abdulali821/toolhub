import type { ToolDefinition } from '$engine/types';
import { evaluateContrast, parseColorToRgb, rgbToHex } from '$lib/utils/color';
import * as v from 'valibot';

export const inputSchema = v.object({
	fg: v.string(),
	bg: v.string()
});

export type ContrastCheckerInput = v.InferOutput<typeof inputSchema>;
export type ContrastCheckerOutput = {
	ratio: number;
	ratioLabel: string;
	aaNormal: boolean;
	aaLarge: boolean;
	aaaNormal: boolean;
	aaaLarge: boolean;
	fgHex: string;
	bgHex: string;
	error?: string;
};

const DEFAULT_FG = '#1e293b';
const DEFAULT_BG = '#ffffff';

export function run(input: ContrastCheckerInput): ContrastCheckerOutput {
	try {
		const fgRgb = parseColorToRgb(input.fg);
		const bgRgb = parseColorToRgb(input.bg);
		const contrast = evaluateContrast(fgRgb, bgRgb);
		return {
			...contrast,
			fgHex: rgbToHex(fgRgb),
			bgHex: rgbToHex(bgRgb)
		};
	} catch (err) {
		return {
			ratio: 0,
			ratioLabel: '—',
			aaNormal: false,
			aaLarge: false,
			aaaNormal: false,
			aaaLarge: false,
			fgHex: '',
			bgHex: '',
			error: err instanceof Error ? err.message : 'Invalid color'
		};
	}
}

export const contrastChecker: ToolDefinition<ContrastCheckerInput, ContrastCheckerOutput> = {
	id: 'contrast-checker',
	version: '1.0.0',
	category: 'color',
	mode: 'instant',
	status: 'stable',
	tags: ['contrast', 'a11y', 'wcag', 'accessibility'],
	capabilities: ['copy', 'share', 'reset', 'favorite'],
	share: {
		params: ['fg', 'bg']
	},
	presets: [
		{
			id: 'dark-on-light',
			label: 'Dark text on white',
			params: { fg: DEFAULT_FG, bg: DEFAULT_BG }
		},
		{
			id: 'white-on-blue',
			label: 'White on brand blue',
			params: { fg: '#ffffff', bg: '#2563eb' }
		},
		{
			id: 'fail-example',
			label: 'Low contrast example',
			params: { fg: '#94a3b8', bg: '#cbd5e1' }
		}
	],
	workflow: {
		next: ['color-picker', 'color-blindness-simulator', 'color-converter']
	},
	metadata: {
		name: 'Contrast Checker',
		title: 'Contrast Checker — WCAG AA and AAA ratios',
		description:
			'Check foreground and background color contrast for WCAG 2.x. See the ratio plus AA/AAA pass flags for normal and large text with a live preview.',
		keywords: [
			'contrast checker',
			'wcag contrast',
			'color contrast ratio',
			'accessibility checker'
		],
		related: ['color-picker', 'color-blindness-simulator', 'color-converter'],
		faq: [
			{
				question: 'What contrast levels does WCAG require?',
				answer:
					'AA requires 4.5:1 for normal text and 3:1 for large text. AAA requires 7:1 normal and 4.5:1 large.'
			},
			{
				question: 'Which color formats are accepted?',
				answer: 'Enter #hex (3 or 6 digits) or rgb(r, g, b) for foreground and background.'
			},
			{
				question: 'Can I share a color pair?',
				answer: 'Yes. Share link stores both foreground and background values in the URL.'
			}
		],
		howTo: [
			'Enter foreground and background colors',
			'Review the contrast ratio and WCAG pass flags',
			'Adjust colors until AA or AAA targets pass'
		]
	},
	validation: { input: inputSchema },
	run,
	ui: { component: () => import('./ui.svelte') },
	analytics: { eventName: 'tool_run' }
};
