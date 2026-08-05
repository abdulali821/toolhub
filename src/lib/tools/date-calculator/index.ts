import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

export const inputSchema = v.object({
	mode: v.picklist(['difference', 'age', 'add']),
	startDate: v.optional(v.string()),
	endDate: v.optional(v.string()),
	birthDate: v.optional(v.string()),
	amount: v.optional(v.number()),
	unit: v.optional(v.picklist(['days', 'weeks', 'months', 'years']))
});

export type DateCalculatorInput = v.InferOutput<typeof inputSchema>;
export type DateCalculatorOutput = {
	summary: string;
	totalDays?: number;
	totalWeeks?: number;
	years?: number;
	months?: number;
	days?: number;
	resultDate?: string;
	error?: string;
};

const MS_PER_DAY = 86_400_000;

function parseDate(value: string | undefined, label: string): Date {
	if (!value || !value.trim()) throw new Error(`Enter a ${label}`);
	const date = new Date(`${value.trim()}T00:00:00Z`);
	if (Number.isNaN(date.getTime())) throw new Error(`Invalid ${label}: "${value}"`);
	return date;
}

/** Calendar-aware years/months/days between two dates where `end` is on/after `start`. */
function diffYmd(start: Date, end: Date): { years: number; months: number; days: number } {
	let years = end.getUTCFullYear() - start.getUTCFullYear();
	let months = end.getUTCMonth() - start.getUTCMonth();
	let days = end.getUTCDate() - start.getUTCDate();

	if (days < 0) {
		months -= 1;
		const prevMonthLastDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 0));
		days += prevMonthLastDay.getUTCDate();
	}
	if (months < 0) {
		years -= 1;
		months += 12;
	}
	return { years, months, days };
}

function addDays(date: Date, amount: number): Date {
	const next = new Date(date.getTime());
	next.setUTCDate(next.getUTCDate() + amount);
	return next;
}

function addMonths(date: Date, amount: number): Date {
	const day = date.getUTCDate();
	const next = new Date(date.getTime());
	next.setUTCDate(1);
	next.setUTCMonth(next.getUTCMonth() + amount);
	const daysInTargetMonth = new Date(
		Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0)
	).getUTCDate();
	next.setUTCDate(Math.min(day, daysInTargetMonth));
	return next;
}

function todayUtc(): Date {
	return new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`);
}

function pluralize(n: number, word: string): string {
	return `${n} ${word}${Math.abs(n) === 1 ? '' : 's'}`;
}

export function run(input: DateCalculatorInput): DateCalculatorOutput {
	try {
		switch (input.mode) {
			case 'difference': {
				const start = parseDate(input.startDate, 'start date');
				const end = parseDate(input.endDate, 'end date');
				const totalDaysSigned = Math.round((end.getTime() - start.getTime()) / MS_PER_DAY);
				const [earlier, later] = totalDaysSigned >= 0 ? [start, end] : [end, start];
				const { years, months, days } = diffYmd(earlier, later);
				const totalDays = Math.abs(totalDaysSigned);
				const totalWeeks = Math.trunc(totalDays / 7);
				return {
					summary: `${pluralize(totalDays, 'day')} (${years}y ${months}m ${days}d)`,
					totalDays,
					totalWeeks,
					years,
					months,
					days
				};
			}
			case 'age': {
				const birth = parseDate(input.birthDate, 'birth date');
				const now = todayUtc();
				if (birth.getTime() > now.getTime()) {
					throw new Error('Birth date is in the future');
				}
				const totalDays = Math.round((now.getTime() - birth.getTime()) / MS_PER_DAY);
				const { years, months, days } = diffYmd(birth, now);
				return {
					summary: `${pluralize(years, 'year')}, ${pluralize(months, 'month')}, ${pluralize(days, 'day')} old`,
					totalDays,
					years,
					months,
					days
				};
			}
			case 'add': {
				const start = parseDate(input.startDate, 'start date');
				const amount = input.amount;
				const unit = input.unit;
				if (amount == null || !Number.isFinite(amount)) {
					throw new Error('Enter an amount to add');
				}
				if (!unit) throw new Error('Choose a unit (days, weeks, months, or years)');

				let result: Date;
				switch (unit) {
					case 'days':
						result = addDays(start, amount);
						break;
					case 'weeks':
						result = addDays(start, amount * 7);
						break;
					case 'months':
						result = addMonths(start, amount);
						break;
					case 'years':
						result = addMonths(start, amount * 12);
						break;
				}
				const resultDate = result.toISOString().slice(0, 10);
				return { summary: resultDate, resultDate };
			}
		}
	} catch (err) {
		return { summary: '', error: err instanceof Error ? err.message : 'Invalid input' };
	}
}

export const dateCalculator: ToolDefinition<DateCalculatorInput, DateCalculatorOutput> = {
	id: 'date-calculator',
	version: '1.0.0',
	category: 'calculators',
	mode: 'instant',
	status: 'stable',
	tags: ['date', 'age', 'difference', 'calculator'],
	capabilities: ['copy', 'share', 'reset', 'favorite'],
	share: {
		params: ['mode', 'startDate', 'endDate', 'birthDate', 'amount', 'unit']
	},
	presets: [
		{
			id: 'days-between',
			label: 'Days between two dates',
			params: { mode: 'difference', startDate: '2024-01-01', endDate: '2024-12-31' }
		},
		{
			id: 'age-from-birth',
			label: 'Age from birth date',
			params: { mode: 'age', birthDate: '2000-01-01' }
		},
		{
			id: 'add-30-days',
			label: 'Add 30 days',
			params: { mode: 'add', startDate: '2024-01-01', amount: '30', unit: 'days' }
		}
	],
	workflow: {
		next: ['timestamp-converter', 'cron-generator']
	},
	metadata: {
		name: 'Date Calculator',
		title: 'Date Calculator — Difference, Age, and Date Math',
		description:
			'Find the difference between two dates, calculate age from a birth date, or add days, weeks, months, or years to a date. Runs entirely in your browser.',
		keywords: [
			'date calculator',
			'days between dates',
			'age calculator',
			'add days to date',
			'date difference'
		],
		related: ['timestamp-converter', 'cron-generator'],
		faq: [
			{
				question: 'How is the year/month/day breakdown calculated?',
				answer:
					'It uses calendar-aware subtraction (like counting on a calendar) rather than a flat 30-day month or 365-day year, so results match how people naturally describe a span of time.'
			},
			{
				question: 'What happens if I add months across a shorter month?',
				answer:
					'Adding months clamps to the last valid day of the target month — for example, January 31 plus one month lands on February 28 (or 29 in a leap year) instead of overflowing into March.'
			},
			{
				question: 'Does my data leave my device?',
				answer: 'No. All date math runs locally in your browser.'
			}
		],
		howTo: [
			'Choose a mode: difference, age, or add',
			'Enter the relevant date(s) or amount',
			'Read the result and copy it if needed'
		]
	},
	validation: { input: inputSchema },
	run,
	ui: {
		component: () => import('./ui.svelte')
	},
	analytics: { eventName: 'tool_run', props: ['mode'] }
};
