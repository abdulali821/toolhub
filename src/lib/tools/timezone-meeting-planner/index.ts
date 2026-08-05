import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

export type TimezonePreset = {
	id: string;
	label: string;
	timeZone: string;
};

/** Curated list of popular meeting-planning cities (~40). One entry per IANA zone. */
export const TIMEZONE_PRESETS: TimezonePreset[] = [
	// Americas
	{ id: 'honolulu', label: 'Honolulu', timeZone: 'Pacific/Honolulu' },
	{ id: 'anchorage', label: 'Anchorage', timeZone: 'America/Anchorage' },
	{ id: 'vancouver', label: 'Vancouver', timeZone: 'America/Vancouver' },
	{ id: 'la', label: 'Los Angeles', timeZone: 'America/Los_Angeles' },
	{ id: 'phoenix', label: 'Phoenix', timeZone: 'America/Phoenix' },
	{ id: 'denver', label: 'Denver', timeZone: 'America/Denver' },
	{ id: 'mexico-city', label: 'Mexico City', timeZone: 'America/Mexico_City' },
	{ id: 'chicago', label: 'Chicago', timeZone: 'America/Chicago' },
	{ id: 'bogota', label: 'Bogotá', timeZone: 'America/Bogota' },
	{ id: 'nyc', label: 'New York', timeZone: 'America/New_York' },
	{ id: 'toronto', label: 'Toronto', timeZone: 'America/Toronto' },
	{ id: 'lima', label: 'Lima', timeZone: 'America/Lima' },
	{ id: 'santiago', label: 'Santiago', timeZone: 'America/Santiago' },
	{ id: 'sao-paulo', label: 'São Paulo', timeZone: 'America/Sao_Paulo' },
	{ id: 'buenos-aires', label: 'Buenos Aires', timeZone: 'America/Argentina/Buenos_Aires' },
	// Europe & Africa
	{ id: 'utc', label: 'UTC', timeZone: 'UTC' },
	{ id: 'london', label: 'London', timeZone: 'Europe/London' },
	{ id: 'dublin', label: 'Dublin', timeZone: 'Europe/Dublin' },
	{ id: 'lisbon', label: 'Lisbon', timeZone: 'Europe/Lisbon' },
	{ id: 'lagos', label: 'Lagos', timeZone: 'Africa/Lagos' },
	{ id: 'paris', label: 'Paris', timeZone: 'Europe/Paris' },
	{ id: 'berlin', label: 'Berlin', timeZone: 'Europe/Berlin' },
	{ id: 'amsterdam', label: 'Amsterdam', timeZone: 'Europe/Amsterdam' },
	{ id: 'rome', label: 'Rome', timeZone: 'Europe/Rome' },
	{ id: 'madrid', label: 'Madrid', timeZone: 'Europe/Madrid' },
	{ id: 'stockholm', label: 'Stockholm', timeZone: 'Europe/Stockholm' },
	{ id: 'warsaw', label: 'Warsaw', timeZone: 'Europe/Warsaw' },
	{ id: 'athens', label: 'Athens', timeZone: 'Europe/Athens' },
	{ id: 'johannesburg', label: 'Johannesburg', timeZone: 'Africa/Johannesburg' },
	{ id: 'cairo', label: 'Cairo', timeZone: 'Africa/Cairo' },
	{ id: 'istanbul', label: 'Istanbul', timeZone: 'Europe/Istanbul' },
	{ id: 'moscow', label: 'Moscow', timeZone: 'Europe/Moscow' },
	// Middle East & Asia
	{ id: 'dubai', label: 'Dubai', timeZone: 'Asia/Dubai' },
	{ id: 'riyadh', label: 'Riyadh', timeZone: 'Asia/Riyadh' },
	{ id: 'tehran', label: 'Tehran', timeZone: 'Asia/Tehran' },
	{ id: 'karachi', label: 'Karachi', timeZone: 'Asia/Karachi' },
	{ id: 'mumbai', label: 'Mumbai', timeZone: 'Asia/Kolkata' },
	{ id: 'dhaka', label: 'Dhaka', timeZone: 'Asia/Dhaka' },
	{ id: 'bangkok', label: 'Bangkok', timeZone: 'Asia/Bangkok' },
	{ id: 'jakarta', label: 'Jakarta', timeZone: 'Asia/Jakarta' },
	{ id: 'singapore', label: 'Singapore', timeZone: 'Asia/Singapore' },
	{ id: 'hong-kong', label: 'Hong Kong', timeZone: 'Asia/Hong_Kong' },
	{ id: 'shanghai', label: 'Shanghai', timeZone: 'Asia/Shanghai' },
	{ id: 'taipei', label: 'Taipei', timeZone: 'Asia/Taipei' },
	{ id: 'seoul', label: 'Seoul', timeZone: 'Asia/Seoul' },
	{ id: 'tokyo', label: 'Tokyo', timeZone: 'Asia/Tokyo' },
	{ id: 'manila', label: 'Manila', timeZone: 'Asia/Manila' },
	// Oceania
	{ id: 'perth', label: 'Perth', timeZone: 'Australia/Perth' },
	{ id: 'sydney', label: 'Sydney', timeZone: 'Australia/Sydney' },
	{ id: 'auckland', label: 'Auckland', timeZone: 'Pacific/Auckland' }
];

const TIMEZONE_LABELS: Record<string, string> = Object.fromEntries(
	TIMEZONE_PRESETS.map((p) => [p.timeZone, p.label])
);

export const DEFAULT_TIMEZONES = [
	'America/New_York',
	'Europe/London',
	'Asia/Karachi',
	'Asia/Singapore',
	'Asia/Tokyo',
	'UTC'
];

export const inputSchema = v.object({
	/** Naive "YYYY-MM-DDTHH:mm" value straight from a <input type="datetime-local">. */
	datetime: v.pipe(v.string(), v.minLength(1, 'Pick a date and time')),
	/** IANA timezone identifiers to show the instant in. */
	zones: v.pipe(
		v.array(v.pipe(v.string(), v.minLength(1))),
		v.minLength(1, 'Select at least one timezone')
	),
	/** IANA timezone the `datetime` value is anchored in. Defaults to UTC. */
	baseZone: v.optional(v.pipe(v.string(), v.minLength(1)))
});

export type TimezoneMeetingPlannerInput = v.InferOutput<typeof inputSchema>;

export type ZoneResult = {
	/** IANA timezone identifier. */
	zone: string;
	/** Friendly city label (falls back to the zone id for unlisted zones). */
	label: string;
	/** Human-readable instant, e.g. "Mon, Jan 15, 2:30 PM". */
	formatted: string;
	/** UTC offset label, e.g. "UTC-5" or "UTC+5:30". */
	offset: string;
	/** Offset from UTC in minutes, used for sorting west-to-east. */
	offsetMinutes: number;
	/** Local calendar date, "YYYY-MM-DD". */
	localDate: string;
	/** Local wall-clock time, e.g. "2:30 PM". */
	localTime: string;
	/** Day difference vs. the base zone's calendar date (-1, 0, 1, ...). */
	dayOffset: number;
	/** True when this zone's date differs from the base zone's date. */
	isOvernight: boolean;
};

export type TimezoneMeetingPlannerOutput = {
	baseZone: string;
	results: ZoneResult[];
};

function parseLocalDateTime(value: string): {
	y: number;
	m: number;
	d: number;
	h: number;
	min: number;
} {
	const match = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(value.trim());
	if (!match) throw new Error('Invalid date/time. Use the date & time picker.');
	const [, y, m, d, h, min] = match;
	return { y: Number(y), m: Number(m), d: Number(d), h: Number(h), min: Number(min) };
}

/** UTC-offset of `timeZone` at `date`, in milliseconds (positive = ahead of UTC). */
function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
	const dtf = new Intl.DateTimeFormat('en-US', {
		timeZone,
		hourCycle: 'h23',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit'
	});
	const parts = dtf.formatToParts(date);
	const map: Record<string, string> = {};
	for (const part of parts) map[part.type] = part.value;
	const hour = map.hour === '24' ? '0' : map.hour;
	const asUtc = Date.UTC(
		Number(map.year),
		Number(map.month) - 1,
		Number(map.day),
		Number(hour),
		Number(map.minute),
		Number(map.second)
	);
	return asUtc - date.getTime();
}

/** Resolve the UTC instant for wall-clock components interpreted in `timeZone`. */
function zonedTimeToUtc(
	components: { y: number; m: number; d: number; h: number; min: number },
	timeZone: string
): number {
	const guess = Date.UTC(
		components.y,
		components.m - 1,
		components.d,
		components.h,
		components.min
	);
	const offset = getTimeZoneOffsetMs(new Date(guess), timeZone);
	return guess - offset;
}

function formatLocalDate(date: Date, timeZone: string): string {
	return new Intl.DateTimeFormat('en-CA', {
		timeZone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).format(date);
}

function formatLocalTime(date: Date, timeZone: string): string {
	return new Intl.DateTimeFormat('en-US', {
		timeZone,
		hour: 'numeric',
		minute: '2-digit',
		hour12: true
	}).format(date);
}

function formatFull(date: Date, timeZone: string): string {
	return new Intl.DateTimeFormat('en-US', {
		timeZone,
		weekday: 'short',
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
		hour12: true
	}).format(date);
}

function getOffsetLabel(date: Date, timeZone: string): string {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone,
		timeZoneName: 'shortOffset'
	}).formatToParts(date);
	const tzName = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT';
	return tzName.replace('GMT', 'UTC');
}

function daysSinceEpoch(isoDate: string): number {
	const [y, m, d] = isoDate.split('-').map(Number);
	return Date.UTC(y, (m ?? 1) - 1, d ?? 1) / 86_400_000;
}

export function timezoneLabel(zone: string): string {
	return TIMEZONE_LABELS[zone] ?? zone;
}

/** "YYYY-MM-DDTHH:mm" for right now, rounded up to the next 15 minutes — a sensible default for the picker. */
export function defaultDatetimeLocal(): string {
	const now = new Date();
	now.setSeconds(0, 0);
	now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15);
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

/** Best-effort detection of the browser's IANA timezone; falls back to UTC. */
export function detectBaseZone(): string {
	try {
		return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
	} catch {
		return 'UTC';
	}
}

export function run(input: TimezoneMeetingPlannerInput): TimezoneMeetingPlannerOutput {
	const parsed = v.parse(inputSchema, input);
	const baseZone = parsed.baseZone || 'UTC';
	const components = parseLocalDateTime(parsed.datetime);
	const anchorMs = zonedTimeToUtc(components, baseZone);
	const anchorDate = new Date(anchorMs);
	const baseDays = daysSinceEpoch(formatLocalDate(anchorDate, baseZone));

	const results: ZoneResult[] = parsed.zones.map((zone) => {
		const localDate = formatLocalDate(anchorDate, zone);
		const dayOffset = daysSinceEpoch(localDate) - baseDays;
		return {
			zone,
			label: timezoneLabel(zone),
			formatted: formatFull(anchorDate, zone),
			offset: getOffsetLabel(anchorDate, zone),
			offsetMinutes: Math.round(getTimeZoneOffsetMs(anchorDate, zone) / 60_000),
			localDate,
			localTime: formatLocalTime(anchorDate, zone),
			dayOffset,
			isOvernight: dayOffset !== 0
		};
	});

	results.sort((a, b) => a.offsetMinutes - b.offsetMinutes);

	return { baseZone, results };
}

export const timezoneMeetingPlanner: ToolDefinition<
	TimezoneMeetingPlannerInput,
	TimezoneMeetingPlannerOutput
> = {
	id: 'timezone-meeting-planner',
	version: '1.0.0',
	category: 'converters',
	mode: 'instant',
	status: 'stable',
	tags: ['timezone', 'meeting', 'utc', 'world-clock', 'scheduling'],
	capabilities: ['copy', 'share', 'reset', 'favorite'],
	share: {
		params: ['datetime', 'zones']
	},
	presets: [
		{
			id: 'us-eu',
			label: 'US ↔ EU',
			params: {
				datetime: '2025-06-16T14:00',
				zones: 'America/Los_Angeles,America/New_York,Europe/London,Europe/Paris'
			}
		},
		{
			id: 'asia-business',
			label: 'Asia business',
			params: {
				datetime: '2025-06-16T10:00',
				zones: 'Asia/Karachi,Asia/Kolkata,Asia/Singapore,Asia/Tokyo'
			}
		},
		{
			id: 'global-standup',
			label: 'Global standup',
			params: {
				datetime: '2025-06-16T09:00',
				zones:
					'America/Los_Angeles,America/New_York,Europe/London,Asia/Dubai,Asia/Singapore,Australia/Sydney'
			}
		}
	],
	workflow: {
		next: ['timestamp-converter', 'date-calculator', 'cron-generator']
	},
	metadata: {
		name: 'Timezone Meeting Planner',
		title: 'Timezone Meeting Planner — Compare times across cities',
		description:
			'Pick a date and time, then see that exact instant across 50 popular cities worldwide—so you can schedule meetings without timezone math.',
		keywords: [
			'timezone meeting planner',
			'meeting time converter',
			'world clock',
			'timezone converter',
			'schedule across timezones'
		],
		related: ['timestamp-converter', 'date-calculator', 'cron-generator'],
		faq: [
			{
				question: 'What timezone is my picked date and time anchored to?',
				answer:
					'Your device\u2019s local timezone by default. Every city in the table then shows the same instant converted into its own local time.'
			},
			{
				question: 'What does the overnight hint mean?',
				answer:
					'If a city\u2019s calendar date differs from your date (because the instant lands very early or very late there), the row is flagged so you don\u2019t accidentally book a meeting on the wrong day.'
			},
			{
				question: 'How is daylight saving time handled?',
				answer:
					'Offsets are computed live for the exact date you pick using the IANA timezone database via the browser\u2019s Intl API, so DST transitions are respected automatically.'
			},
			{
				question: 'Can I share my comparison with teammates?',
				answer:
					'Yes. The date/time and selected cities are encoded in the URL, so copying the link reproduces the same table for anyone who opens it.'
			},
			{
				question: 'Does my data leave my device?',
				answer: 'No. All conversions run locally in your browser using the native Intl API.'
			}
		],
		howTo: [
			'Pick a date and time using the picker',
			'Check the cities you want to compare',
			'Read each city\u2019s local time, offset, and overnight hint',
			'Copy the summary or share the link with your team'
		]
	},
	validation: { input: inputSchema },
	run,
	ui: {
		component: () => import('./ui.svelte')
	},
	analytics: { eventName: 'tool_run', props: ['baseZone'] }
};
