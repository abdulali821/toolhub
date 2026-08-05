import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

export const inputSchema = v.object({
	bill: v.pipe(v.number(), v.minValue(0, 'Bill must be zero or more')),
	tipPercent: v.pipe(v.number(), v.minValue(0, 'Tip percent must be zero or more')),
	people: v.pipe(v.number(), v.integer(), v.minValue(1, 'At least one person'))
});

export type TipCalculatorInput = v.InferOutput<typeof inputSchema>;
export type TipCalculatorOutput = {
	tipAmount: number;
	total: number;
	perPerson: number;
	tipPerPerson: number;
	error?: string;
};

function round2(value: number): number {
	return Math.round(value * 100) / 100;
}

export function run(input: TipCalculatorInput): TipCalculatorOutput {
	const { bill, tipPercent, people } = input;

	if (!Number.isFinite(bill) || bill < 0) {
		return {
			tipAmount: 0,
			total: 0,
			perPerson: 0,
			tipPerPerson: 0,
			error: 'Enter a valid bill amount'
		};
	}
	if (!Number.isFinite(tipPercent) || tipPercent < 0) {
		return {
			tipAmount: 0,
			total: 0,
			perPerson: 0,
			tipPerPerson: 0,
			error: 'Enter a valid tip percent'
		};
	}
	if (!Number.isInteger(people) || people < 1) {
		return {
			tipAmount: 0,
			total: 0,
			perPerson: 0,
			tipPerPerson: 0,
			error: 'People must be at least 1'
		};
	}

	const tipAmount = round2(bill * (tipPercent / 100));
	const total = round2(bill + tipAmount);
	const perPerson = round2(total / people);
	const tipPerPerson = round2(tipAmount / people);

	return { tipAmount, total, perPerson, tipPerPerson };
}

export const tipCalculator: ToolDefinition<TipCalculatorInput, TipCalculatorOutput> = {
	id: 'tip-calculator',
	version: '1.0.0',
	category: 'calculators',
	mode: 'instant',
	status: 'stable',
	tags: ['tip', 'bill', 'calculator', 'restaurant', 'split'],
	capabilities: ['copy', 'share', 'reset', 'favorite'],
	share: {
		params: ['bill', 'tipPercent', 'people']
	},
	presets: [
		{
			id: 'default',
			label: '15% tip, 1 person',
			params: { bill: '50', tipPercent: '15', people: '1' }
		},
		{
			id: 'group',
			label: '20% tip, split 4 ways',
			params: { bill: '120', tipPercent: '20', people: '4' }
		}
	],
	workflow: {
		next: ['percentage-calculator', 'bmi-calculator']
	},
	metadata: {
		name: 'Tip Calculator',
		title: 'Tip Calculator — Split the bill and tip evenly',
		description:
			'Calculate the tip amount, total bill, and cost per person. Enter the bill, tip percent, and number of people.',
		keywords: [
			'tip calculator',
			'bill splitter',
			'restaurant tip',
			'split the bill',
			'gratuity calculator'
		],
		related: ['percentage-calculator', 'bmi-calculator'],
		faq: [
			{
				question: 'How is the tip calculated?',
				answer:
					'Tip amount = bill × (tip percent / 100). The total is the bill plus the tip amount.'
			},
			{
				question: 'How is the per-person amount split?',
				answer: 'The total (bill + tip) is divided evenly by the number of people you enter.'
			},
			{
				question: 'What is the default tip percent?',
				answer: 'The calculator starts at 15%, a common baseline, but you can set any percentage.'
			},
			{
				question: 'Is my bill information stored anywhere?',
				answer: 'No. The calculation runs locally in your browser and nothing is uploaded.'
			}
		],
		howTo: [
			'Enter the bill amount',
			'Set the tip percent (defaults to 15%)',
			'Enter the number of people splitting the bill',
			'Read the tip, total, and per-person amounts'
		]
	},
	validation: { input: inputSchema },
	run,
	ui: {
		component: () => import('./ui.svelte')
	},
	analytics: { eventName: 'tool_run', props: ['tipPercent', 'people'] }
};
