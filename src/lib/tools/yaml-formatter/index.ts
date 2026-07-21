import type { ToolDefinition } from '$engine/types';
import { parse, stringify } from 'yaml';
import * as v from 'valibot';

export const inputSchema = v.object({
	yaml: v.pipe(v.string(), v.minLength(1, 'Paste YAML to format')),
	indent: v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(8)), 2)
});

export type YamlFormatterInput = v.InferOutput<typeof inputSchema>;
export type YamlFormatterOutput = {
	formatted: string;
	valid: boolean;
	error?: string;
};

export function run(input: YamlFormatterInput): YamlFormatterOutput {
	try {
		const parsed = parse(input.yaml);
		const indent = input.indent ?? 2;
		const formatted =
			indent === 0 ? stringify(parsed, { lineWidth: 0 }).trimEnd() : stringify(parsed, { indent });
		return { formatted, valid: true };
	} catch (err) {
		return {
			formatted: input.yaml,
			valid: false,
			error: err instanceof Error ? err.message : 'Invalid YAML'
		};
	}
}

const DEFAULT_YAML = 'hello: world\nitems:\n  - one\n  - two';

export const yamlFormatter: ToolDefinition<YamlFormatterInput, YamlFormatterOutput> = {
	id: 'yaml-formatter',
	version: '1.0.0',
	category: 'developer',
	mode: 'instant',
	status: 'stable',
	tags: ['yaml', 'format', 'beautify', 'dev'],
	capabilities: ['copy', 'download', 'share', 'reset', 'favorite'],
	share: {
		params: ['yaml', 'indent'],
		maxParamBytes: 4000
	},
	presets: [
		{
			id: 'pretty',
			label: 'Pretty Print',
			params: { indent: '2', yaml: DEFAULT_YAML }
		},
		{
			id: 'compact',
			label: 'Compact',
			params: { indent: '0' }
		},
		{
			id: 'validate',
			label: 'Validate sample',
			params: { indent: '2', yaml: DEFAULT_YAML }
		}
	],
	workflow: {
		next: ['yaml-validator', 'yaml-to-json', 'json-formatter']
	},
	metadata: {
		name: 'YAML Formatter',
		title: 'YAML Formatter — Beautify and validate YAML',
		description:
			'Paste YAML to format, validate, and beautify it instantly in your browser. Free online YAML formatter.',
		keywords: ['yaml formatter', 'yaml beautify', 'validate yaml', 'pretty print yaml'],
		related: ['yaml-validator', 'yaml-to-json', 'json-formatter'],
		faq: [
			{
				question: 'Does my YAML leave my device?',
				answer: 'No. Formatting runs entirely in your browser. Nothing is uploaded to our servers.'
			},
			{
				question: 'Can I minify YAML too?',
				answer:
					'Set indentation to 0 to produce compact YAML output on a single line where possible.'
			},
			{
				question: 'Can I share my YAML?',
				answer:
					'Yes. Use Share link to copy a URL with your input and indent settings (large payloads may be omitted from the URL).'
			}
		],
		howTo: ['Paste your YAML', 'Choose indentation', 'Copy the formatted result']
	},
	validation: { input: inputSchema },
	run,
	ui: {
		component: () => import('./ui.svelte'),
		layout: 'editor'
	},
	analytics: { eventName: 'tool_run', props: ['valid'] }
};
