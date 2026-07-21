import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

export const inputSchema = v.object({
	mode: v.picklist(['percent-of', 'is-what-percent', 'percent-change']),
	a: v.number(),
	b: v.number()
});

export type PercentageCalculatorInput = v.InferOutput<typeof inputSchema>;
export type PercentageCalculatorOutput = {
	result: number | null;
	label: string;
	formatted: string;
	error?: string;
};

function formatNumber(value: number): string {
	if (!Number.isFinite(value)) return '';
	const rounded = Math.round(value * 1e10) / 1e10;
	return String(rounded);
}

export function run(input: PercentageCalculatorInput): PercentageCalculatorOutput {
	const { mode, a, b } = input;

	if (!Number.isFinite(a) || !Number.isFinite(b)) {
		return {
			result: null,
			label: '',
			formatted: '',
			error: 'Enter valid numbers for both values'
		};
	}

	switch (mode) {
		case 'percent-of': {
			const result = (a / 100) * b;
			return {
				result,
				label: `${formatNumber(a)}% of ${formatNumber(b)}`,
				formatted: formatNumber(result)
			};
		}
		case 'is-what-percent': {
			if (b === 0) {
				return {
					result: null,
					label: '',
					formatted: '',
					error: 'Cannot divide by zero — value B must be non-zero'
				};
			}
			const result = (a / b) * 100;
			return {
				result,
				label: `${formatNumber(a)} is what % of ${formatNumber(b)}`,
				formatted: `${formatNumber(result)}%`
			};
		}
		case 'percent-change': {
			if (a === 0) {
				return {
					result: null,
					label: '',
					formatted: '',
					error: 'Cannot compute percent change from zero — value A (from) must be non-zero'
				};
			}
			const result = ((b - a) / Math.abs(a)) * 100;
			return {
				result,
				label: `Change from ${formatNumber(a)} to ${formatNumber(b)}`,
				formatted: `${formatNumber(result)}%`
			};
		}
	}
}

export const percentageCalculator: ToolDefinition<
	PercentageCalculatorInput,
	PercentageCalculatorOutput
> = {
	id: 'percentage-calculator',
	version: '1.0.0',
	category: 'calculators',
	mode: 'instant',
	status: 'stable',
	tags: ['percent', 'percentage', 'math', 'calculator'],
	capabilities: ['copy', 'share', 'reset', 'favorite'],
	share: {
		params: ['mode', 'a', 'b']
	},
	presets: [
		{
			id: 'of',
			label: '15% of 200',
			params: { mode: 'percent-of', a: '15', b: '200' }
		},
		{
			id: 'what',
			label: '50 is what % of 200',
			params: { mode: 'is-what-percent', a: '50', b: '200' }
		},
		{
			id: 'change',
			label: 'Percent change',
			params: { mode: 'percent-change', a: '80', b: '100' }
		}
	],
	workflow: {
		next: ['number-base-converter', 'word-counter']
	},
	metadata: {
		name: 'Percentage Calculator',
		title: 'Percentage Calculator — % of, is what %, percent change',
		description:
			'Calculate what X% of Y is, what percent X is of Y, or percent change between two numbers. Free online percentage calculator.',
		keywords: ['percentage calculator', 'percent of', 'percent change', 'what percent'],
		related: ['number-base-converter', 'word-counter'],
		faq: [
			{
				question: 'What does percent change mean?',
				answer:
					'Percent change is ((new − old) / |old|) × 100. Positive means an increase; negative means a decrease.'
			},
			{
				question: 'Which value is A and which is B?',
				answer:
					'For “X% of Y”, A is the percent and B is the base. For “X is what % of Y”, A is X and B is Y. For percent change, A is the starting value and B is the ending value.'
			},
			{
				question: 'Does calculation leave my device?',
				answer: 'No. Everything runs locally in your browser.'
			}
		],
		howTo: ['Choose a calculation mode', 'Enter values A and B', 'Copy the formatted result']
	},
	validation: { input: inputSchema },
	run,
	ui: { component: () => import('./ui.svelte') },
	analytics: { eventName: 'tool_run', props: ['mode'] }
};
