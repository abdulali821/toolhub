import type { ToolDefinition } from '$engine/types';
import { parse } from 'yaml';
import * as v from 'valibot';

export const inputSchema = v.object({
	yaml: v.pipe(v.string(), v.minLength(1, 'Paste YAML to convert'))
});

export type YamlToJsonInput = v.InferOutput<typeof inputSchema>;
export type YamlToJsonOutput = {
	json: string;
	valid: boolean;
	error?: string;
};

export function run(input: YamlToJsonInput): YamlToJsonOutput {
	try {
		const parsed = parse(input.yaml);
		return { json: JSON.stringify(parsed, null, 2), valid: true };
	} catch (err) {
		return {
			json: '',
			valid: false,
			error: err instanceof Error ? err.message : 'Conversion failed'
		};
	}
}

const DEFAULT_YAML = 'hello: world\nitems:\n  - 1\n  - 2\n  - 3';

export const yamlToJson: ToolDefinition<YamlToJsonInput, YamlToJsonOutput> = {
	id: 'yaml-to-json',
	version: '1.0.0',
	category: 'data',
	mode: 'instant',
	status: 'stable',
	tags: ['yaml', 'json', 'convert', 'dev'],
	capabilities: ['copy', 'download', 'share', 'reset', 'favorite'],
	share: {
		params: ['yaml'],
		maxParamBytes: 4000
	},
	presets: [
		{
			id: 'object',
			label: 'Object sample',
			params: { yaml: DEFAULT_YAML }
		},
		{
			id: 'config',
			label: 'Config sample',
			params: {
				yaml: 'app: ToolHub\nfeatures:\n  share: true\n  offline: true'
			}
		}
	],
	workflow: {
		next: ['json-to-yaml', 'json-formatter', 'yaml-validator']
	},
	metadata: {
		name: 'YAML to JSON',
		title: 'YAML to JSON — Convert YAML to pretty JSON',
		description:
			'Paste YAML and get formatted JSON for APIs, tests, or documentation. Conversion stays local in your browser.',
		keywords: ['yaml to json', 'convert yaml to json', 'yaml json converter'],
		related: ['json-to-yaml', 'json-formatter', 'yaml-validator'],
		faq: [
			{
				question: 'Does this support multi-document YAML?',
				answer:
					'The parser reads the first YAML document. Split multi-doc files before converting if you need each document separately.'
			},
			{
				question: 'Can I validate YAML first?',
				answer: 'Use YAML Validator to check syntax, then convert here for pretty JSON output.'
			},
			{
				question: 'Is my data uploaded?',
				answer: 'No. Conversion runs entirely in your browser.'
			}
		],
		howTo: ['Paste YAML', 'Copy the formatted JSON', 'Download or share the result']
	},
	validation: { input: inputSchema },
	run,
	ui: {
		component: () => import('./ui.svelte'),
		layout: 'editor'
	},
	analytics: { eventName: 'tool_run', props: ['valid'] }
};
