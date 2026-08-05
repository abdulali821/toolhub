import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

export const inputSchema = v.object({
	unit: v.picklist(['metric', 'imperial']),
	weight: v.pipe(v.number(), v.minValue(0, 'Weight must be greater than zero')),
	height: v.pipe(v.number(), v.minValue(0, 'Height must be greater than zero'))
});

export type BmiCalculatorInput = v.InferOutput<typeof inputSchema>;
export type BmiCategory = 'underweight' | 'normal' | 'overweight' | 'obese';

export type BmiCalculatorOutput = {
	bmi: number;
	category: BmiCategory | null;
	error?: string;
};

export function categorize(bmi: number): BmiCategory {
	if (bmi < 18.5) return 'underweight';
	if (bmi < 25) return 'normal';
	if (bmi < 30) return 'overweight';
	return 'obese';
}

export function run(input: BmiCalculatorInput): BmiCalculatorOutput {
	const { unit, weight, height } = input;

	if (!Number.isFinite(weight) || weight <= 0) {
		return { bmi: 0, category: null, error: 'Enter a weight greater than zero' };
	}
	if (!Number.isFinite(height) || height <= 0) {
		return { bmi: 0, category: null, error: 'Enter a height greater than zero' };
	}

	const bmi = unit === 'metric' ? weight / (height / 100) ** 2 : (703 * weight) / height ** 2;

	if (!Number.isFinite(bmi) || bmi <= 0) {
		return { bmi: 0, category: null, error: 'Could not calculate BMI from the given values' };
	}

	const rounded = Math.round(bmi * 10) / 10;
	return { bmi: rounded, category: categorize(rounded) };
}

export const bmiCalculator: ToolDefinition<BmiCalculatorInput, BmiCalculatorOutput> = {
	id: 'bmi-calculator',
	version: '1.0.0',
	category: 'calculators',
	mode: 'instant',
	status: 'stable',
	tags: ['bmi', 'health', 'calculator', 'weight', 'fitness'],
	capabilities: ['copy', 'share', 'reset', 'favorite'],
	share: {
		params: ['unit', 'weight', 'height']
	},
	presets: [
		{
			id: 'metric',
			label: 'Metric example',
			params: { unit: 'metric', weight: '70', height: '175' }
		},
		{
			id: 'imperial',
			label: 'Imperial example',
			params: { unit: 'imperial', weight: '154', height: '69' }
		}
	],
	workflow: {
		next: ['tip-calculator', 'unit-converter', 'percentage-calculator']
	},
	metadata: {
		name: 'BMI Calculator',
		title: 'BMI Calculator — Body Mass Index in metric or imperial',
		description:
			'Calculate your Body Mass Index (BMI) using metric (kg, cm) or imperial (lb, in) units, with the standard weight category.',
		keywords: ['bmi calculator', 'body mass index', 'bmi chart', 'healthy weight calculator'],
		related: ['tip-calculator', 'unit-converter', 'percentage-calculator'],
		faq: [
			{
				question: 'How is BMI calculated?',
				answer:
					'Metric: weight (kg) ÷ height (m)². Imperial: 703 × weight (lb) ÷ height (in)². Both formulas produce the same BMI scale.'
			},
			{
				question: 'What do the categories mean?',
				answer:
					'Using the standard WHO ranges: under 18.5 is underweight, 18.5–24.9 is normal, 25–29.9 is overweight, and 30+ is obese.'
			},
			{
				question: 'Is this medical advice?',
				answer:
					'No. BMI is a simple screening measure and does not account for muscle mass, bone density, age, or sex. Consult a healthcare professional for medical guidance.'
			},
			{
				question: 'Is my data stored anywhere?',
				answer: 'No. The calculation runs entirely in your browser and nothing is uploaded.'
			}
		],
		howTo: [
			'Choose metric (kg, cm) or imperial (lb, in) units',
			'Enter your weight and height',
			'Read your BMI value and category'
		]
	},
	validation: { input: inputSchema },
	run,
	ui: {
		component: () => import('./ui.svelte')
	},
	analytics: { eventName: 'tool_run', props: ['unit'] }
};
