import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

export const inputSchema = v.object({
	json: v.pipe(v.string(), v.minLength(1, 'Paste JSON to validate'))
});

export type JsonValidatorInput = v.InferOutput<typeof inputSchema>;
export type JsonValidatorOutput = {
	valid: boolean;
	error?: string;
	path?: string;
	parsedPreview?: string;
};

const PREVIEW_MAX = 2000;

function formatPath(segments: (string | number)[]): string {
	if (!segments.length) return '$';
	return segments.reduce<string>(
		(acc, segment) => (typeof segment === 'number' ? `${acc}[${segment}]` : `${acc}.${segment}`),
		'$'
	);
}

function pathAtPosition(json: string, position: number): string | undefined {
	const segments: (string | number)[] = [];
	const stack: ('object' | 'array')[] = [];
	let inString = false;
	let escape = false;
	let keyBuffer = '';
	let expectingKey = false;

	for (let i = 0; i < position && i < json.length; i++) {
		const ch = json[i]!;

		if (inString) {
			if (escape) {
				escape = false;
			} else if (ch === '\\') {
				escape = true;
			} else if (ch === '"') {
				inString = false;
				if (expectingKey) {
					segments.push(keyBuffer);
					keyBuffer = '';
					expectingKey = false;
				}
			} else if (expectingKey) {
				keyBuffer += ch;
			}
			continue;
		}

		if (/\s/.test(ch)) continue;

		if (ch === '"') {
			inString = true;
			if (stack.at(-1) === 'object') expectingKey = true;
			continue;
		}

		if (ch === '{') {
			stack.push('object');
			continue;
		}
		if (ch === '}') {
			stack.pop();
			if (segments.length) segments.pop();
			continue;
		}
		if (ch === '[') {
			stack.push('array');
			segments.push(0);
			continue;
		}
		if (ch === ']') {
			stack.pop();
			if (segments.length) segments.pop();
			continue;
		}
		if (ch === ',') {
			const last = segments.at(-1);
			if (typeof last === 'number') segments[segments.length - 1] = last + 1;
			continue;
		}
		if (ch === ':' && stack.at(-1) === 'object') {
			expectingKey = false;
		}
	}

	return formatPath(segments);
}

function errorPath(json: string, message: string): string | undefined {
	const match = message.match(/position (\d+)/i);
	if (!match) return undefined;
	return pathAtPosition(json, Number(match[1]));
}

export function run(input: JsonValidatorInput): JsonValidatorOutput {
	try {
		const parsed = JSON.parse(input.json) as unknown;
		let preview = JSON.stringify(parsed, null, 2);
		if (preview.length > PREVIEW_MAX) {
			preview = `${preview.slice(0, PREVIEW_MAX)}\n…`;
		}
		return { valid: true, parsedPreview: preview };
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Invalid JSON';
		return {
			valid: false,
			error: message,
			path: errorPath(input.json, message)
		};
	}
}

const DEFAULT_JSON = '{\n  "hello": "world"\n}';
const INVALID_JSON = '{ "hello": "world", }';

export const jsonValidator: ToolDefinition<JsonValidatorInput, JsonValidatorOutput> = {
	id: 'json-validator',
	version: '1.0.0',
	category: 'data',
	mode: 'instant',
	status: 'stable',
	tags: ['json', 'validate', 'lint', 'dev'],
	capabilities: ['copy', 'share', 'reset', 'favorite'],
	share: {
		params: ['json'],
		maxParamBytes: 4000
	},
	presets: [
		{
			id: 'valid',
			label: 'Valid sample',
			params: { json: DEFAULT_JSON }
		},
		{
			id: 'invalid',
			label: 'Invalid sample',
			params: { json: INVALID_JSON }
		},
		{
			id: 'array',
			label: 'Array sample',
			params: { json: '[1, 2, 3]' }
		}
	],
	workflow: {
		next: ['json-formatter', 'json-minifier', 'json-compare']
	},
	metadata: {
		name: 'JSON Validator',
		title: 'JSON Validator — Check JSON syntax online',
		description:
			'Paste JSON to validate syntax instantly in your browser. See parse errors with path hints and a preview of valid payloads.',
		keywords: ['json validator', 'validate json', 'json lint', 'json syntax check'],
		related: ['json-formatter', 'json-minifier', 'json-compare'],
		faq: [
			{
				question: 'Does my JSON leave my device?',
				answer: 'No. Validation runs entirely in your browser. Nothing is uploaded.'
			},
			{
				question: 'What does the path mean?',
				answer:
					'When parsing fails, we estimate a JSON Pointer-style path (e.g. $.items[0].name) near the error position to help you find the mistake.'
			},
			{
				question: 'Does this validate against a JSON Schema?',
				answer:
					'No. This tool checks syntax only—commas, quotes, brackets—not business rules or schema constraints.'
			}
		],
		howTo: ['Paste your JSON', 'Review valid/invalid status', 'Fix errors using the path hint']
	},
	validation: { input: inputSchema },
	run,
	ui: {
		component: () => import('./ui.svelte'),
		layout: 'editor'
	},
	analytics: { eventName: 'tool_run', props: ['valid'] }
};
