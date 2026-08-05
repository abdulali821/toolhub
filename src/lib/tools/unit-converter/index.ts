import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

export const inputSchema = v.object({
	category: v.picklist(['length', 'weight', 'temperature', 'data-size']),
	fromUnit: v.pipe(v.string(), v.minLength(1, 'Choose a source unit')),
	toUnit: v.pipe(v.string(), v.minLength(1, 'Choose a target unit')),
	value: v.number()
});

export type UnitConverterInput = v.InferOutput<typeof inputSchema>;
export type UnitConverterOutput = {
	result: number | null;
	formatted: string;
	error?: string;
};

export type UnitCategory = UnitConverterInput['category'];

/** Linear categories store a factor to their base unit (meters, grams, bytes). */
const LINEAR_UNITS: Record<'length' | 'weight' | 'data-size', Record<string, number>> = {
	length: {
		m: 1,
		cm: 0.01,
		km: 1000,
		in: 0.0254,
		ft: 0.3048,
		mi: 1609.344
	},
	weight: {
		kg: 1000,
		g: 1,
		lb: 453.59237,
		oz: 28.349523125
	},
	'data-size': {
		B: 1,
		KB: 1024,
		MB: 1024 ** 2,
		GB: 1024 ** 3,
		TB: 1024 ** 4
	}
};

const TEMPERATURE_UNITS = ['C', 'F', 'K'] as const;

export const UNIT_OPTIONS: Record<UnitCategory, string[]> = {
	length: Object.keys(LINEAR_UNITS.length),
	weight: Object.keys(LINEAR_UNITS.weight),
	temperature: [...TEMPERATURE_UNITS],
	'data-size': Object.keys(LINEAR_UNITS['data-size'])
};

function toCelsius(value: number, unit: string): number {
	switch (unit) {
		case 'C':
			return value;
		case 'F':
			return ((value - 32) * 5) / 9;
		case 'K':
			return value - 273.15;
		default:
			throw new Error(`Unknown temperature unit: ${unit}`);
	}
}

function fromCelsius(value: number, unit: string): number {
	switch (unit) {
		case 'C':
			return value;
		case 'F':
			return (value * 9) / 5 + 32;
		case 'K':
			return value + 273.15;
		default:
			throw new Error(`Unknown temperature unit: ${unit}`);
	}
}

function convertLinear(
	value: number,
	fromUnit: string,
	toUnit: string,
	table: Record<string, number>
): number {
	const fromFactor = table[fromUnit];
	const toFactor = table[toUnit];
	if (fromFactor == null) throw new Error(`Unknown unit: ${fromUnit}`);
	if (toFactor == null) throw new Error(`Unknown unit: ${toUnit}`);
	return (value * fromFactor) / toFactor;
}

function formatNumber(value: number): string {
	if (!Number.isFinite(value)) return '';
	const rounded = Math.round(value * 1e8) / 1e8;
	return String(rounded);
}

export function run(input: UnitConverterInput): UnitConverterOutput {
	const { category, fromUnit, toUnit, value } = input;

	if (!Number.isFinite(value)) {
		return { result: null, formatted: '', error: 'Enter a valid number' };
	}

	try {
		let result: number;
		if (category === 'temperature') {
			result = fromCelsius(toCelsius(value, fromUnit), toUnit);
		} else {
			result = convertLinear(value, fromUnit, toUnit, LINEAR_UNITS[category]);
		}
		return {
			result,
			formatted: `${formatNumber(value)} ${fromUnit} = ${formatNumber(result)} ${toUnit}`
		};
	} catch (err) {
		return {
			result: null,
			formatted: '',
			error: err instanceof Error ? err.message : 'Conversion failed'
		};
	}
}

export const unitConverter: ToolDefinition<UnitConverterInput, UnitConverterOutput> = {
	id: 'unit-converter',
	version: '1.0.0',
	category: 'converters',
	mode: 'instant',
	status: 'stable',
	tags: ['unit', 'convert', 'metric', 'imperial'],
	capabilities: ['copy', 'share', 'reset', 'favorite'],
	share: {
		params: ['category', 'fromUnit', 'toUnit', 'value']
	},
	presets: [
		{
			id: 'km-mi',
			label: '5 km → mi',
			params: { category: 'length', fromUnit: 'km', toUnit: 'mi', value: '5' }
		},
		{
			id: 'f-c',
			label: '98.6 °F → °C',
			params: { category: 'temperature', fromUnit: 'F', toUnit: 'C', value: '98.6' }
		},
		{
			id: 'gb-mb',
			label: '1 GB → MB',
			params: { category: 'data-size', fromUnit: 'GB', toUnit: 'MB', value: '1' }
		},
		{
			id: 'kg-lb',
			label: '1 kg → lb',
			params: { category: 'weight', fromUnit: 'kg', toUnit: 'lb', value: '1' }
		}
	],
	workflow: {
		next: ['number-base-converter', 'percentage-calculator']
	},
	metadata: {
		name: 'Unit Converter',
		title: 'Unit Converter — Length, Weight, Temperature, Data Size',
		description:
			'Convert length, weight, temperature, and data size units instantly. Metric and imperial, calculated locally in your browser.',
		keywords: [
			'unit converter',
			'length converter',
			'weight converter',
			'temperature converter',
			'data size converter',
			'metric to imperial'
		],
		related: ['number-base-converter', 'percentage-calculator', 'aspect-ratio-calculator'],
		faq: [
			{
				question: 'Which unit categories are supported?',
				answer:
					'Length (m, cm, km, in, ft, mi), weight (kg, g, lb, oz), temperature (°C, °F, K), and data size (B, KB, MB, GB, TB).'
			},
			{
				question: 'How is data size calculated?',
				answer:
					'Data size units use binary (base-1024) factors — 1 KB = 1024 B, 1 MB = 1024 KB, and so on — matching how operating systems typically report file sizes.'
			},
			{
				question: 'Does my data leave my device?',
				answer: 'No. Every conversion runs locally in your browser.'
			}
		],
		howTo: [
			'Choose a unit category',
			'Pick the source and target units',
			'Enter a value to see the converted result'
		]
	},
	validation: { input: inputSchema },
	run,
	ui: {
		component: () => import('./ui.svelte')
	},
	analytics: { eventName: 'tool_run', props: ['category'] }
};
