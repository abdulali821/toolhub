import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

export const inputSchema = v.object({
	value: v.string(),
	mode: v.picklist(['unix-to-date', 'date-to-unix', 'now'])
});

export type TimestampInput = v.InferOutput<typeof inputSchema>;
export type TimestampOutput = {
	unix: number;
	iso: string;
	locale: string;
	error?: string;
};

export function run(input: TimestampInput): TimestampOutput {
	try {
		let date: Date;
		if (input.mode === 'now') {
			date = new Date();
		} else if (input.mode === 'unix-to-date') {
			const raw = Number(input.value);
			if (!Number.isFinite(raw)) throw new Error('Enter a valid Unix timestamp');
			const ms = Math.abs(raw) < 1e12 ? raw * 1000 : raw;
			date = new Date(ms);
		} else {
			date = new Date(input.value);
		}

		if (Number.isNaN(date.getTime())) throw new Error('Could not parse date/time');

		return {
			unix: Math.floor(date.getTime() / 1000),
			iso: date.toISOString(),
			locale: date.toLocaleString()
		};
	} catch (err) {
		return {
			unix: 0,
			iso: '',
			locale: '',
			error: err instanceof Error ? err.message : 'Invalid timestamp'
		};
	}
}

export const timestampConverter: ToolDefinition<TimestampInput, TimestampOutput> = {
	id: 'timestamp-converter',
	version: '1.0.0',
	category: 'converters',
	mode: 'instant',
	status: 'stable',
	tags: ['timestamp', 'unix', 'epoch', 'date'],
	capabilities: ['copy', 'share', 'reset', 'favorite'],
	share: {
		params: ['value', 'mode']
	},
	presets: [
		{
			id: 'unix',
			label: 'Unix → Date',
			params: { value: '1700000000', mode: 'unix-to-date' }
		},
		{
			id: 'iso',
			label: 'ISO → Unix',
			params: { value: '2024-01-01T00:00:00Z', mode: 'date-to-unix' }
		},
		{
			id: 'now',
			label: 'Current time',
			params: { value: '', mode: 'now' }
		}
	],
	workflow: {
		next: ['jwt-decoder', 'uuid-generator']
	},
	metadata: {
		name: 'Timestamp Converter',
		title: 'Timestamp Converter — Unix epoch ↔ human-readable dates',
		description:
			'Convert Unix timestamps to ISO and locale dates, or parse a date string back to epoch seconds. Supports seconds and milliseconds, plus a one-click “now” mode.',
		keywords: [
			'unix timestamp',
			'epoch converter',
			'date to timestamp',
			'timestamp to date',
			'iso date'
		],
		related: ['jwt-decoder', 'uuid-generator', 'hash-generator'],
		faq: [
			{
				question: 'Seconds or milliseconds?',
				answer:
					'Absolute values under 1e12 are treated as seconds; larger values are treated as milliseconds—so both common API formats work.'
			},
			{
				question: 'What outputs do I get?',
				answer:
					'Each conversion shows Unix seconds, an ISO-8601 UTC string, and a locale-formatted date from your browser settings.'
			},
			{
				question: 'Is conversion private?',
				answer: 'Yes. Parsing and formatting run entirely in your browser; nothing is uploaded.'
			}
		],
		howTo: [
			'Pick Unix → Date, Date → Unix, or Now',
			'Enter a timestamp or date string if needed',
			'Copy Unix, ISO, or locale output'
		]
	},
	validation: { input: inputSchema },
	run,
	ui: { component: () => import('./ui.svelte') },
	analytics: { eventName: 'tool_run', props: ['mode'] }
};
