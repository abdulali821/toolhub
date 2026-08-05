import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

export const inputSchema = v.object({
	minute: v.string(),
	hour: v.string(),
	dayOfMonth: v.string(),
	month: v.string(),
	dayOfWeek: v.string()
});

export type CronGeneratorInput = v.InferOutput<typeof inputSchema>;
export type CronGeneratorOutput = {
	expression: string;
	explanation: string;
	error?: string;
};

type FieldName = 'minute' | 'hour' | 'dayOfMonth' | 'month' | 'dayOfWeek';

const FIELD_BOUNDS: Record<FieldName, [number, number]> = {
	minute: [0, 59],
	hour: [0, 23],
	dayOfMonth: [1, 31],
	month: [1, 12],
	dayOfWeek: [0, 7]
};

const FIELD_LABELS: Record<FieldName, string> = {
	minute: 'minute',
	hour: 'hour',
	dayOfMonth: 'day-of-month',
	month: 'month',
	dayOfWeek: 'day-of-week'
};

const MONTH_NAMES = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December'
];

const DAY_NAMES = [
	'Sunday',
	'Monday',
	'Tuesday',
	'Wednesday',
	'Thursday',
	'Friday',
	'Saturday',
	'Sunday'
];

function isPlainNumber(value: string): boolean {
	return /^[0-9]+$/.test(value);
}

function validateField(name: FieldName, value: string): string | null {
	const trimmed = value.trim();
	if (!trimmed) return `${FIELD_LABELS[name]} cannot be empty`;
	if (!/^[0-9*/,-]+$/.test(trimmed)) {
		return `Invalid ${FIELD_LABELS[name]}: "${value}"`;
	}
	if (isPlainNumber(trimmed)) {
		const n = Number(trimmed);
		const [min, max] = FIELD_BOUNDS[name];
		if (n < min || n > max) {
			return `${FIELD_LABELS[name]} must be between ${min} and ${max}`;
		}
	}
	return null;
}

function formatTime(hour: number, minute: number): string {
	const period = hour >= 12 ? 'PM' : 'AM';
	const h12 = hour % 12 === 0 ? 12 : hour % 12;
	return `${h12}:${String(minute).padStart(2, '0')} ${period}`;
}

function describeDayOfWeek(value: string): string {
	if (isPlainNumber(value)) {
		const idx = Number(value);
		if (idx >= 0 && idx <= 7) return DAY_NAMES[idx]!;
	}
	return `day-of-week "${value}"`;
}

function describeMonth(value: string): string {
	if (isPlainNumber(value)) {
		const idx = Number(value);
		if (idx >= 1 && idx <= 12) return MONTH_NAMES[idx - 1]!;
	}
	return `month "${value}"`;
}

function explainCron(fields: CronGeneratorInput): string {
	const { minute, hour, dayOfMonth, month, dayOfWeek } = fields;
	const minuteWild = minute === '*';
	const hourWild = hour === '*';
	const domWild = dayOfMonth === '*';
	const monthWild = month === '*';
	const dowWild = dayOfWeek === '*';

	if (minuteWild && hourWild && domWild && monthWild && dowWild) {
		return 'Runs every minute.';
	}

	if (!minuteWild && isPlainNumber(minute) && hourWild && domWild && monthWild && dowWild) {
		return `Runs every hour, at minute ${minute}.`;
	}

	if (isPlainNumber(minute) && isPlainNumber(hour)) {
		const time = formatTime(Number(hour), Number(minute));
		if (domWild && monthWild && dowWild) {
			return `Runs every day at ${time}.`;
		}
		if (domWild && monthWild && !dowWild) {
			return `Runs every week on ${describeDayOfWeek(dayOfWeek)} at ${time}.`;
		}
		if (!domWild && monthWild && dowWild) {
			return `Runs every month on day ${dayOfMonth} at ${time}.`;
		}
		if (!domWild && !monthWild && dowWild) {
			return `Runs every year on ${describeMonth(month)} ${dayOfMonth} at ${time}.`;
		}
	}

	return (
		`Runs at minute "${minute}", hour "${hour}", day-of-month "${dayOfMonth}", ` +
		`month "${month}", day-of-week "${dayOfWeek}".`
	);
}

export function run(input: CronGeneratorInput): CronGeneratorOutput {
	const fields: [FieldName, string][] = [
		['minute', input.minute],
		['hour', input.hour],
		['dayOfMonth', input.dayOfMonth],
		['month', input.month],
		['dayOfWeek', input.dayOfWeek]
	];

	for (const [name, value] of fields) {
		const error = validateField(name, value);
		if (error) {
			return { expression: '', explanation: '', error };
		}
	}

	const expression = `${input.minute} ${input.hour} ${input.dayOfMonth} ${input.month} ${input.dayOfWeek}`;
	return { expression, explanation: explainCron(input) };
}

export const cronGenerator: ToolDefinition<CronGeneratorInput, CronGeneratorOutput> = {
	id: 'cron-generator',
	version: '1.0.0',
	category: 'generators',
	mode: 'instant',
	status: 'stable',
	tags: ['cron', 'schedule', 'crontab', 'generator'],
	capabilities: ['copy', 'share', 'reset', 'favorite'],
	share: {
		params: ['minute', 'hour', 'dayOfMonth', 'month', 'dayOfWeek']
	},
	presets: [
		{
			id: 'every-minute',
			label: 'Every minute',
			params: { minute: '*', hour: '*', dayOfMonth: '*', month: '*', dayOfWeek: '*' }
		},
		{
			id: 'hourly',
			label: 'Hourly',
			params: { minute: '0', hour: '*', dayOfMonth: '*', month: '*', dayOfWeek: '*' }
		},
		{
			id: 'daily-noon',
			label: 'Daily at noon',
			params: { minute: '0', hour: '12', dayOfMonth: '*', month: '*', dayOfWeek: '*' }
		},
		{
			id: 'weekly-monday-9am',
			label: 'Weekly, Monday 9am',
			params: { minute: '0', hour: '9', dayOfMonth: '*', month: '*', dayOfWeek: '1' }
		},
		{
			id: 'monthly-1st-midnight',
			label: 'Monthly, 1st at midnight',
			params: { minute: '0', hour: '0', dayOfMonth: '1', month: '*', dayOfWeek: '*' }
		}
	],
	workflow: {
		next: ['timestamp-converter', 'date-calculator']
	},
	metadata: {
		name: 'Cron Expression Generator',
		title: 'Cron Expression Generator — Build & Explain Crontab Schedules',
		description:
			'Build a cron expression from minute, hour, day, month, and weekday fields, with a plain-English explanation. Runs entirely in your browser.',
		keywords: [
			'cron expression generator',
			'crontab generator',
			'cron schedule',
			'cron explained',
			'crontab syntax'
		],
		related: ['timestamp-converter', 'date-calculator'],
		faq: [
			{
				question: 'What do the five cron fields mean?',
				answer:
					'In order: minute (0–59), hour (0–23), day-of-month (1–31), month (1–12), and day-of-week (0–7, where both 0 and 7 mean Sunday).'
			},
			{
				question: 'What does an asterisk (*) mean?',
				answer:
					'An asterisk means "every value" for that field. For example, "* * * * *" fires every minute.'
			},
			{
				question: 'Can I use ranges, lists, and steps?',
				answer:
					'Yes. You can combine digits, commas, hyphens, and slashes (e.g. "*/15", "1-5", "0,30") — this tool validates the characters and known plain-number bounds for each field.'
			}
		],
		howTo: [
			'Pick a preset or fill in each field',
			'Review the generated cron expression',
			'Copy it into your crontab or scheduler'
		]
	},
	validation: { input: inputSchema },
	run,
	ui: {
		component: () => import('./ui.svelte')
	},
	analytics: { eventName: 'tool_run' }
};
