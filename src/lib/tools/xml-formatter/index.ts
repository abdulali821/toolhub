import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

export const inputSchema = v.object({
	xml: v.pipe(v.string(), v.minLength(1, 'Paste XML to format')),
	indent: v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(8)), 2)
});

export type XmlFormatterInput = v.InferOutput<typeof inputSchema>;
export type XmlFormatterOutput = {
	formatted: string;
	valid: boolean;
	error?: string;
};

const TOKEN_RE =
	/(<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\?[\s\S]*?\?>|<\/([^\s>/]+)\s*>|<([^>\s/]+)([^>]*)\/>|<([^>\s/]+)([^>]*)>|[^<]+)/g;

export function formatXml(xml: string, indentSize = 2): XmlFormatterOutput {
	const trimmed = xml.trim();
	if (!trimmed) {
		return { formatted: '', valid: true };
	}

	const normalized = trimmed.replace(/>\s+</g, '><');
	const stack: string[] = [];
	const lines: string[] = [];
	let depth = 0;

	const pad = (level: number) => (indentSize > 0 ? ' '.repeat(level * indentSize) : '');

	TOKEN_RE.lastIndex = 0;
	let match: RegExpExecArray | null;

	while ((match = TOKEN_RE.exec(normalized)) !== null) {
		const token = match[0];

		if (token.startsWith('<!--') || token.startsWith('<?') || token.startsWith('<![CDATA[')) {
			lines.push(pad(depth) + token);
			continue;
		}

		if (token.startsWith('</')) {
			const tagName = match[2];
			if (stack.length === 0 || stack[stack.length - 1] !== tagName) {
				return {
					formatted: xml,
					valid: false,
					error: `Unbalanced closing tag: </${tagName}>`
				};
			}
			stack.pop();
			depth = Math.max(0, depth - 1);
			lines.push(pad(depth) + token);
			continue;
		}

		if (token.endsWith('/>')) {
			lines.push(pad(depth) + token);
			continue;
		}

		if (token.startsWith('<')) {
			const tagName = match[5];
			lines.push(pad(depth) + token);
			stack.push(tagName);
			depth += 1;
			continue;
		}

		const text = token.trim();
		if (text) {
			lines.push(pad(depth) + text);
		}
	}

	if (stack.length > 0) {
		return {
			formatted: xml,
			valid: false,
			error: `Unclosed tag: <${stack[stack.length - 1]}>`
		};
	}

	return { formatted: lines.join('\n'), valid: true };
}

export function run(input: XmlFormatterInput): XmlFormatterOutput {
	return formatXml(input.xml, input.indent ?? 2);
}

const DEFAULT_XML = '<root><item id="1">Hello</item><item id="2"/></root>';

export const xmlFormatter: ToolDefinition<XmlFormatterInput, XmlFormatterOutput> = {
	id: 'xml-formatter',
	version: '1.0.0',
	category: 'developer',
	mode: 'instant',
	status: 'stable',
	tags: ['xml', 'format', 'beautify', 'dev'],
	capabilities: ['copy', 'download', 'share', 'reset', 'favorite'],
	share: {
		params: ['xml', 'indent'],
		maxParamBytes: 4000
	},
	presets: [
		{
			id: 'pretty',
			label: 'Pretty Print',
			params: { indent: '2', xml: DEFAULT_XML }
		},
		{
			id: 'compact',
			label: 'Compact',
			params: { indent: '0' }
		},
		{
			id: 'sample',
			label: 'Sample document',
			params: { indent: '2', xml: DEFAULT_XML }
		}
	],
	workflow: {
		next: ['json-formatter', 'yaml-formatter']
	},
	metadata: {
		name: 'XML Formatter',
		title: 'XML Formatter — Pretty-print XML online',
		description:
			'Paste XML to format and indent it instantly in your browser. Free online XML pretty-printer with syntax checks.',
		keywords: ['xml formatter', 'xml beautify', 'pretty print xml', 'xml indent'],
		related: ['json-formatter', 'yaml-formatter', 'html-codec'],
		faq: [
			{
				question: 'Does my XML leave my device?',
				answer: 'No. Formatting runs entirely in your browser. Nothing is uploaded to our servers.'
			},
			{
				question: 'Does this validate XML schemas?',
				answer:
					'No. It checks basic tag balance and pretty-prints structure. For schema validation, use a dedicated XML validator.'
			},
			{
				question: 'Can I share formatted XML?',
				answer:
					'Yes. Use Share link to copy a URL with your input and indent settings (large payloads may be omitted from the URL).'
			}
		],
		howTo: ['Paste your XML', 'Choose indentation', 'Copy the formatted result']
	},
	validation: { input: inputSchema },
	run,
	ui: {
		component: () => import('./ui.svelte'),
		layout: 'editor'
	},
	analytics: { eventName: 'tool_run', props: ['valid'] }
};
