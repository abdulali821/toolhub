import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

export const inputSchema = v.object({
	css: v.string(),
	mode: v.picklist(['minify', 'beautify'])
});

export type CssMinifierInput = v.InferOutput<typeof inputSchema>;
export type CssMinifierOutput = {
	result: string;
	error?: string;
};

function minifyCss(css: string): string {
	let out = css.replace(/\/\*[\s\S]*?\*\//g, '');
	out = out.replace(/\s+/g, ' ');
	out = out.replace(/\s*([{}:;,])\s*/g, '$1');
	out = out.replace(/;+}/g, '}');
	return out.trim();
}

function formatDeclaration(text: string): string {
	const trimmed = text.trim();
	const idx = trimmed.indexOf(':');
	if (idx === -1) return trimmed;
	return `${trimmed.slice(0, idx)}: ${trimmed.slice(idx + 1).trim()}`;
}

function beautifyCss(css: string): string {
	const compact = minifyCss(css);
	let result = '';
	let indent = 0;
	let buffer = '';
	const indentStr = () => '  '.repeat(indent);

	for (const char of compact) {
		if (char === '{') {
			result += `${indentStr()}${buffer.trim()} {\n`;
			buffer = '';
			indent += 1;
		} else if (char === '}') {
			if (buffer.trim()) {
				result += `${indentStr()}${formatDeclaration(buffer)};\n`;
			}
			buffer = '';
			indent = Math.max(0, indent - 1);
			result += `${indentStr()}}\n`;
		} else if (char === ';') {
			if (buffer.trim()) {
				result += `${indentStr()}${formatDeclaration(buffer)};\n`;
			}
			buffer = '';
		} else {
			buffer += char;
		}
	}
	if (buffer.trim()) {
		result += `${indentStr()}${formatDeclaration(buffer)}\n`;
	}
	return result.trim();
}

export function run(input: CssMinifierInput): CssMinifierOutput {
	const css = input.css ?? '';
	if (!css.trim()) {
		return { result: '', error: 'Enter some CSS' };
	}
	try {
		const result = input.mode === 'minify' ? minifyCss(css) : beautifyCss(css);
		return { result };
	} catch (err) {
		return { result: '', error: err instanceof Error ? err.message : 'Failed to process CSS' };
	}
}

export const cssMinifier: ToolDefinition<CssMinifierInput, CssMinifierOutput> = {
	id: 'css-minifier',
	version: '1.0.0',
	category: 'developer',
	mode: 'instant',
	status: 'stable',
	tags: ['css', 'minify', 'beautify', 'formatter'],
	capabilities: ['copy', 'download', 'share', 'reset', 'favorite'],
	share: {
		params: ['css', 'mode'],
		maxParamBytes: 4000
	},
	presets: [
		{
			id: 'minify-sample',
			label: 'Minify sample',
			params: {
				mode: 'minify',
				css: '.card {\n  color: #111;\n  padding: 8px 12px; /* spacing */\n}\n'
			}
		},
		{
			id: 'beautify-sample',
			label: 'Beautify sample',
			params: { mode: 'beautify', css: '.card{color:#111;padding:8px 12px}' }
		}
	],
	workflow: {
		next: ['json-minifier', 'json-formatter']
	},
	metadata: {
		name: 'CSS Minifier',
		title: 'CSS Minifier & Beautifier — Compress or Format CSS',
		description:
			'Minify CSS by stripping comments and whitespace, or beautify compact CSS with indented rules — instantly in your browser.',
		keywords: [
			'css minifier',
			'css beautifier',
			'compress css',
			'format css',
			'css formatter online'
		],
		related: ['json-minifier', 'json-formatter', 'sql-formatter'],
		faq: [
			{
				question: 'What does minify do?',
				answer:
					'It removes comments and collapses unnecessary whitespace around braces, colons, semicolons, and commas to shrink basic CSS.'
			},
			{
				question: 'What does beautify do?',
				answer:
					'It reformats compact CSS into indented, one-declaration-per-line rules so it is easier to read and edit.'
			},
			{
				question: 'Will this handle every CSS edge case?',
				answer:
					'It covers everyday stylesheets well, but very unusual constructs — like colons inside quoted string values — are not specially preserved. For production builds, use a dedicated build-tool minifier.'
			}
		],
		howTo: ['Paste your CSS', 'Choose minify or beautify', 'Copy or download the transformed CSS']
	},
	validation: { input: inputSchema },
	run,
	ui: {
		component: () => import('./ui.svelte')
	},
	analytics: { eventName: 'tool_run', props: ['mode'] }
};
