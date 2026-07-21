import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

export const inputSchema = v.object({
	mode: v.picklist(['users', 'json']),
	count: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)),
	seed: v.optional(v.pipe(v.number(), v.integer()))
});

export type FakeDataGeneratorInput = v.InferOutput<typeof inputSchema>;
export type FakeUser = {
	name: string;
	email: string;
	phone: string;
	address: string;
	city: string;
	country: string;
};

export type FakeDataGeneratorOutput = {
	text: string;
	users?: FakeUser[];
	items?: Record<string, unknown>[];
};

const FIRST_NAMES = [
	'James',
	'Mary',
	'Robert',
	'Patricia',
	'John',
	'Jennifer',
	'Michael',
	'Linda',
	'William',
	'Elizabeth',
	'David',
	'Barbara',
	'Richard',
	'Susan',
	'Joseph',
	'Jessica',
	'Thomas',
	'Sarah',
	'Charles',
	'Karen'
];

const LAST_NAMES = [
	'Smith',
	'Johnson',
	'Williams',
	'Brown',
	'Jones',
	'Garcia',
	'Miller',
	'Davis',
	'Rodriguez',
	'Martinez',
	'Hernandez',
	'Lopez',
	'Wilson',
	'Anderson',
	'Thomas',
	'Taylor',
	'Moore',
	'Jackson',
	'Martin',
	'Lee'
];

const STREETS = [
	'Main St',
	'Oak Ave',
	'Maple Dr',
	'Cedar Ln',
	'Pine Rd',
	'Elm St',
	'Washington Blvd',
	'Lakeview Ter',
	'Park Pl',
	'Sunset Way'
];

const CITIES = [
	'New York',
	'Los Angeles',
	'Chicago',
	'Houston',
	'London',
	'Toronto',
	'Sydney',
	'Berlin',
	'Paris',
	'Tokyo'
];

const COUNTRIES = [
	'United States',
	'Canada',
	'United Kingdom',
	'Australia',
	'Germany',
	'France',
	'Japan',
	'Netherlands',
	'Sweden',
	'Spain'
];

const DOMAINS = ['example.com', 'mail.test', 'demo.io', 'sample.net'];

export function createRng(seed?: number): () => number {
	if (seed == null) return Math.random;

	let state = seed >>> 0;
	return () => {
		state = (state + 0x6d2b79f5) | 0;
		let t = Math.imul(state ^ (state >>> 15), 1 | state);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function pick<T>(items: T[], rng: () => number): T {
	return items[Math.floor(rng() * items.length)]!;
}

function buildUser(rng: () => number): FakeUser {
	const first = pick(FIRST_NAMES, rng);
	const last = pick(LAST_NAMES, rng);
	const streetNo = Math.floor(rng() * 9000) + 100;
	const city = pick(CITIES, rng);
	const country = pick(COUNTRIES, rng);

	return {
		name: `${first} ${last}`,
		email: `${first.toLowerCase()}.${last.toLowerCase()}${Math.floor(rng() * 1000)}@${pick(DOMAINS, rng)}`,
		phone: `+1 (${Math.floor(rng() * 900) + 100}) ${Math.floor(rng() * 900) + 100}-${Math.floor(rng() * 9000) + 1000}`,
		address: `${streetNo} ${pick(STREETS, rng)}`,
		city,
		country
	};
}

function buildJsonItem(id: number, rng: () => number): Record<string, unknown> {
	const user = buildUser(rng);
	return {
		id,
		name: user.name,
		email: user.email,
		active: rng() > 0.25,
		score: Math.round(rng() * 1000) / 10,
		role: pick(['admin', 'editor', 'viewer', 'guest'], rng),
		createdAt: new Date(1_700_000_000_000 + Math.floor(rng() * 86400000 * 365)).toISOString()
	};
}

export function run(input: FakeDataGeneratorInput): FakeDataGeneratorOutput {
	const count = Math.min(100, Math.max(1, input.count));
	const rng = createRng(input.seed);

	if (input.mode === 'users') {
		const users = Array.from({ length: count }, () => buildUser(rng));
		return {
			users,
			text: users
				.map(
					(u) => `${u.name}\n  ${u.email}\n  ${u.phone}\n  ${u.address}, ${u.city}, ${u.country}`
				)
				.join('\n\n')
		};
	}

	const items = Array.from({ length: count }, (_, i) => buildJsonItem(i + 1, rng));
	return {
		items,
		text: JSON.stringify(items, null, 2)
	};
}

export const fakeDataGenerator: ToolDefinition<FakeDataGeneratorInput, FakeDataGeneratorOutput> = {
	id: 'fake-data-generator',
	version: '1.0.0',
	category: 'generators',
	mode: 'instant',
	status: 'stable',
	tags: ['fake', 'data', 'mock', 'fixture', 'json'],
	capabilities: ['copy', 'download', 'share', 'reset', 'favorite'],
	share: {
		params: ['mode', 'count', 'seed']
	},
	workflow: {
		next: ['json-formatter', 'random-string-generator', 'lorem-ipsum']
	},
	metadata: {
		name: 'Fake Data Generator',
		title: 'Fake Data Generator — Mock users and JSON arrays',
		description:
			'Generate fake user records or JSON object arrays for prototypes and tests. Optional seed for repeatable output—no external libraries.',
		keywords: ['fake data generator', 'mock data', 'test users', 'json fixture'],
		related: ['json-formatter', 'random-string-generator', 'lorem-ipsum'],
		faq: [
			{
				question: 'Can I get repeatable data?',
				answer:
					'Yes. Provide an integer seed in the URL or options to get the same fake records again.'
			},
			{
				question: 'Is faker.js used?',
				answer:
					'No. Names, addresses, and JSON shapes are generated from built-in word lists in your browser.'
			}
		],
		howTo: ['Pick users or JSON mode', 'Set count and optional seed', 'Copy or download the output']
	},
	validation: { input: inputSchema },
	run,
	ui: {
		component: () => import('./ui.svelte')
	},
	analytics: { eventName: 'tool_run', props: ['mode', 'count'] }
};
