import type { ToolDefinition } from '$engine/types';
import { parse } from 'yaml';
import * as v from 'valibot';

export const inputSchema = v.object({
	yaml: v.pipe(v.string(), v.minLength(1, 'Paste YAML to validate'))
});

export type YamlValidatorInput = v.InferOutput<typeof inputSchema>;
export type YamlValidatorOutput = {
	valid: boolean;
	message: string;
	error?: string;
};

export function run(input: YamlValidatorInput): YamlValidatorOutput {
	try {
		parse(input.yaml);
		return { valid: true, message: 'Valid YAML' };
	} catch (err) {
		return {
			valid: false,
			message: 'Invalid YAML',
			error: err instanceof Error ? err.message : 'Invalid YAML'
		};
	}
}

const DEFAULT_YAML = 'hello: world\nitems:\n  - one\n  - two';

export const yamlValidator: ToolDefinition<YamlValidatorInput, YamlValidatorOutput> = {
	id: 'yaml-validator',
	version: '1.0.0',
	category: 'developer',
	mode: 'instant',
	status: 'stable',
	tags: ['yaml', 'validate', 'lint', 'dev'],
	capabilities: ['copy', 'share', 'reset', 'favorite'],
	share: {
		params: ['yaml'],
		maxParamBytes: 4000
	},
	presets: [
		{
			id: 'valid',
			label: 'Valid sample',
			params: { yaml: DEFAULT_YAML }
		},
		{
			id: 'invalid',
			label: 'Invalid sample',
			params: { yaml: 'hello: [unclosed' }
		}
	],
	workflow: {
		next: ['yaml-formatter', 'yaml-to-json']
	},
	metadata: {
		name: 'YAML Validator',
		title: 'YAML Validator — Check YAML syntax online',
		description:
			'Paste YAML to validate syntax instantly in your browser. Free online YAML validator with clear error messages.',
		keywords: ['yaml validator', 'validate yaml', 'yaml lint', 'yaml syntax check'],
		related: ['yaml-formatter', 'yaml-to-json', 'json-validator'],
		faq: [
			{
				question: 'Does my YAML leave my device?',
				answer: 'No. Validation runs entirely in your browser. Nothing is uploaded to our servers.'
			},
			{
				question: 'What YAML versions are supported?',
				answer:
					'The parser supports YAML 1.2 syntax, including maps, sequences, anchors, and multiline strings.'
			},
			{
				question: 'Can I share YAML for validation?',
				answer:
					'Yes. Use Share link to copy a URL with your YAML input (large payloads may be omitted from the URL).'
			}
		],
		howTo: ['Paste your YAML', 'Review the validation result', 'Fix any reported syntax errors']
	},
	validation: { input: inputSchema },
	run,
	ui: {
		component: () => import('./ui.svelte'),
		layout: 'editor'
	},
	analytics: { eventName: 'tool_run', props: ['valid'] }
};
