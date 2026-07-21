import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

export const inputSchema = v.object({
	left: v.string(),
	right: v.string()
});

export type JsonCompareInput = v.InferOutput<typeof inputSchema>;
export type JsonCompareOutput = {
	equal: boolean;
	validLeft: boolean;
	validRight: boolean;
	errorLeft?: string;
	errorRight?: string;
	changed: string[];
	added: string[];
	removed: string[];
	counts: { changed: number; added: number; removed: number };
	summary: string;
};

type DiffBuckets = { changed: string[]; added: string[]; removed: string[] };

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function mergeDiffs(target: DiffBuckets, source: DiffBuckets): void {
	target.changed.push(...source.changed);
	target.added.push(...source.added);
	target.removed.push(...source.removed);
}

function compareValues(left: unknown, right: unknown, path: string): DiffBuckets {
	const diff: DiffBuckets = { changed: [], added: [], removed: [] };

	if (Object.is(left, right)) return diff;

	if (typeof left !== typeof right || Array.isArray(left) !== Array.isArray(right)) {
		diff.changed.push(path);
		return diff;
	}

	if (Array.isArray(left) && Array.isArray(right)) {
		const max = Math.max(left.length, right.length);
		for (let i = 0; i < max; i++) {
			const childPath = `${path}[${i}]`;
			if (i >= left.length) {
				diff.added.push(childPath);
			} else if (i >= right.length) {
				diff.removed.push(childPath);
			} else {
				mergeDiffs(diff, compareValues(left[i], right[i], childPath));
			}
		}
		return diff;
	}

	if (isPlainObject(left) && isPlainObject(right)) {
		const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
		for (const key of keys) {
			const childPath = path === '$' ? `$.${key}` : `${path}.${key}`;
			if (!(key in left)) {
				diff.added.push(childPath);
			} else if (!(key in right)) {
				diff.removed.push(childPath);
			} else {
				mergeDiffs(diff, compareValues(left[key], right[key], childPath));
			}
		}
		return diff;
	}

	diff.changed.push(path);
	return diff;
}

function formatSummary(diff: DiffBuckets): string {
	const { changed, added, removed } = diff;
	const counts = {
		changed: changed.length,
		added: added.length,
		removed: removed.length
	};

	if (!counts.changed && !counts.added && !counts.removed) {
		return 'JSON documents are identical.';
	}

	const lines = [`${counts.changed} changed, ${counts.added} added, ${counts.removed} removed`, ''];

	if (changed.length) {
		lines.push('Changed:', ...changed.map((path) => `  ${path}`), '');
	}
	if (added.length) {
		lines.push('Added:', ...added.map((path) => `  ${path}`), '');
	}
	if (removed.length) {
		lines.push('Removed:', ...removed.map((path) => `  ${path}`));
	}

	return lines.join('\n').trimEnd();
}

export function run(input: JsonCompareInput): JsonCompareOutput {
	let leftValue: unknown;
	let rightValue: unknown;
	let validLeft = true;
	let validRight = true;
	let errorLeft: string | undefined;
	let errorRight: string | undefined;

	try {
		leftValue = JSON.parse(input.left);
	} catch (err) {
		validLeft = false;
		errorLeft = err instanceof Error ? err.message : 'Invalid JSON';
	}

	try {
		rightValue = JSON.parse(input.right);
	} catch (err) {
		validRight = false;
		errorRight = err instanceof Error ? err.message : 'Invalid JSON';
	}

	if (!validLeft || !validRight) {
		return {
			equal: false,
			validLeft,
			validRight,
			errorLeft,
			errorRight,
			changed: [],
			added: [],
			removed: [],
			counts: { changed: 0, added: 0, removed: 0 },
			summary:
				!validLeft && !validRight
					? 'Both inputs contain invalid JSON.'
					: !validLeft
						? `Left JSON is invalid: ${errorLeft}`
						: `Right JSON is invalid: ${errorRight}`
		};
	}

	const diff = compareValues(leftValue, rightValue, '$');
	const counts = {
		changed: diff.changed.length,
		added: diff.added.length,
		removed: diff.removed.length
	};

	return {
		equal: !counts.changed && !counts.added && !counts.removed,
		validLeft,
		validRight,
		changed: diff.changed,
		added: diff.added,
		removed: diff.removed,
		counts,
		summary: formatSummary(diff)
	};
}

const DEFAULT_LEFT = '{\n  "name": "Ada",\n  "role": "Engineer"\n}';
const DEFAULT_RIGHT = '{\n  "name": "Ada",\n  "role": "Scientist",\n  "team": "Research"\n}';

export const jsonCompare: ToolDefinition<JsonCompareInput, JsonCompareOutput> = {
	id: 'json-compare',
	version: '1.0.0',
	category: 'data',
	mode: 'instant',
	status: 'stable',
	tags: ['json', 'diff', 'compare', 'dev'],
	capabilities: ['copy', 'share', 'reset', 'favorite'],
	share: {
		params: ['left', 'right'],
		maxParamBytes: 4000
	},
	presets: [
		{
			id: 'diff',
			label: 'Different objects',
			params: { left: DEFAULT_LEFT, right: DEFAULT_RIGHT }
		},
		{
			id: 'identical',
			label: 'Identical JSON',
			params: { left: DEFAULT_LEFT, right: DEFAULT_LEFT }
		},
		{
			id: 'array',
			label: 'Array changes',
			params: {
				left: '{"items":[1,2,3]}',
				right: '{"items":[1,4,3,5]}'
			}
		}
	],
	workflow: {
		next: ['json-formatter', 'text-diff', 'json-validator']
	},
	metadata: {
		name: 'JSON Compare',
		title: 'JSON Compare — Deep diff two JSON documents',
		description:
			'Compare two JSON payloads and see which paths changed, were added, or removed. Structural diff with counts—runs locally in your browser.',
		keywords: ['json compare', 'json diff', 'compare json', 'json difference'],
		related: ['json-formatter', 'text-diff', 'json-validator'],
		faq: [
			{
				question: 'Is key order compared?',
				answer:
					'Objects are compared by keys and values, not key order. Two objects with the same keys and values are equal.'
			},
			{
				question: 'How is this different from Text Diff?',
				answer:
					'JSON Compare understands structure—reporting paths like $.items[1]—while Text Diff compares raw lines of text.'
			},
			{
				question: 'Is my data uploaded?',
				answer: 'No. Comparison runs entirely in your browser.'
			}
		],
		howTo: [
			'Paste the original JSON on the left',
			'Paste the revised JSON on the right',
			'Review changed, added, and removed paths'
		]
	},
	validation: { input: inputSchema },
	run,
	ui: {
		component: () => import('./ui.svelte'),
		layout: 'split'
	},
	analytics: { eventName: 'tool_run', props: ['equal'] }
};
