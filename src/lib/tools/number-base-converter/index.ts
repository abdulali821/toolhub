import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

export const inputSchema = v.object({
	value: v.pipe(v.string(), v.minLength(1, 'Enter a number')),
	fromBase: v.pipe(v.number(), v.integer(), v.minValue(2), v.maxValue(36)),
	toBase: v.pipe(v.number(), v.integer(), v.minValue(2), v.maxValue(36))
});

export type NumberBaseInput = v.InferOutput<typeof inputSchema>;
export type NumberBaseOutput = { result: string; decimal: string; error?: string };

export function run(input: NumberBaseInput): NumberBaseOutput {
	try {
		const cleaned = input.value.trim().replace(/\s+/g, '');
		const decimal = Number.parseInt(cleaned, input.fromBase);
		if (!Number.isFinite(decimal)) throw new Error('Could not parse number for the selected base');
		return {
			result: decimal.toString(input.toBase).toUpperCase(),
			decimal: String(decimal)
		};
	} catch (err) {
		return {
			result: '',
			decimal: '',
			error: err instanceof Error ? err.message : 'Invalid conversion'
		};
	}
}

export const numberBaseConverter: ToolDefinition<NumberBaseInput, NumberBaseOutput> = {
	id: 'number-base-converter',
	version: '1.0.0',
	category: 'converters',
	mode: 'instant',
	status: 'stable',
	tags: ['binary', 'hex', 'octal', 'decimal', 'base'],
	capabilities: ['copy', 'share', 'reset', 'favorite'],
	share: {
		params: ['value', 'fromBase', 'toBase']
	},
	presets: [
		{
			id: 'dec-hex',
			label: 'Decimal → Hex',
			params: { value: '255', fromBase: '10', toBase: '16' }
		},
		{
			id: 'bin-dec',
			label: 'Binary → Decimal',
			params: { value: '11111111', fromBase: '2', toBase: '10' }
		},
		{
			id: 'hex-bin',
			label: 'Hex → Binary',
			params: { value: 'FF', fromBase: '16', toBase: '2' }
		}
	],
	workflow: {
		next: ['timestamp-converter', 'hash-generator']
	},
	metadata: {
		name: 'Number Base Converter',
		title: 'Number Base Converter — Binary, Octal, Decimal, Hex',
		description:
			'Convert numbers between bases 2–36 including binary, octal, decimal, and hexadecimal.',
		keywords: ['binary to decimal', 'hex converter', 'base converter', 'octal'],
		related: ['timestamp-converter', 'hash-generator'],
		faq: [
			{
				question: 'Which bases are supported?',
				answer: 'Any integer base from 2 to 36.'
			},
			{
				question: 'Are letters case-sensitive?',
				answer:
					'Input is parsed case-insensitively; output uses uppercase digits A–Z for bases above 10.'
			},
			{
				question: 'Can I share a conversion?',
				answer: 'Yes. Share link stores the value and from/to bases in the URL.'
			}
		],
		howTo: [
			'Enter a number in the source base',
			'Choose from and to bases',
			'Copy the converted result'
		]
	},
	validation: { input: inputSchema },
	run,
	ui: { component: () => import('./ui.svelte') },
	analytics: { eventName: 'tool_run' }
};
