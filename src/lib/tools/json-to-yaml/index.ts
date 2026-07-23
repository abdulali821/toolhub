import type { ToolDefinition } from '$engine/types';
import { stringify } from 'yaml';
import * as v from 'valibot';

export const inputSchema = v.object({
	json: v.pipe(v.string(), v.minLength(1, 'Paste JSON to convert'))
});

export type JsonToYamlInput = v.InferOutput<typeof inputSchema>;
export type JsonToYamlOutput = {
	yaml: string;
	valid: boolean;
	error?: string;
};

export function run(input: JsonToYamlInput): JsonToYamlOutput {
	try {
		const parsed = JSON.parse(input.json) as unknown;
		const yaml = stringify(parsed);
		return { yaml, valid: true };
	} catch (err) {
		return {
			yaml: '',
			valid: false,
			error: err instanceof Error ? err.message : 'Conversion failed'
		};
	}
}

const DEFAULT_JSON = '{\n  "hello": "world",\n  "items": [1, 2, 3]\n}';

export const jsonToYaml: ToolDefinition<JsonToYamlInput, JsonToYamlOutput> = {
	id: 'json-to-yaml',
	version: '1.0.0',
	category: 'data',
	mode: 'instant',
	status: 'stable',
	tags: ['json', 'yaml', 'convert', 'dev'],
	capabilities: ['copy', 'download', 'share', 'reset', 'favorite'],
	share: {
		params: ['json'],
		maxParamBytes: 4000
	},
	presets: [
		{
			id: 'object',
			label: 'Object sample',
			params: { json: DEFAULT_JSON }
		},
		{
			id: 'config',
			label: 'Config sample',
			params: {
				json: '{"app":"HeyTools","features":{"share":true,"offline":true}}'
			}
		}
	],
	workflow: {
		next: ['yaml-to-json', 'yaml-formatter', 'json-formatter']
	},
	metadata: {
		name: 'JSON to YAML',
		title: 'JSON to YAML — Convert JSON to YAML online',
		description:
			'Paste JSON and get clean YAML output for configs, CI files, or Kubernetes manifests—all converted locally in your browser.',
		keywords: ['json to yaml', 'convert json to yaml', 'json yaml converter'],
		related: ['yaml-to-json', 'yaml-formatter', 'json-formatter'],
		faq: [
			{
				question: 'Will number types be preserved?',
				answer:
					'JSON numbers become YAML scalars. Very large integers may stringify differently—validate critical configs after conversion.'
			},
			{
				question: 'Can I convert YAML back?',
				answer:
					'Yes. Use YAML to JSON for the reverse direction, then JSON Formatter to pretty-print.'
			},
			{
				question: 'Is my data uploaded?',
				answer: 'No. Conversion runs entirely in your browser.'
			}
		],
		howTo: ['Paste JSON', 'Copy the YAML output', 'Download or share the result']
	},
	validation: { input: inputSchema },
	run,
	ui: {
		component: () => import('./ui.svelte'),
		layout: 'editor'
	},
	analytics: { eventName: 'tool_run', props: ['valid'] }
};
