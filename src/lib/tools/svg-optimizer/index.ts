import type { ToolDefinition } from '$engine/types';
import { optimizeSvg, SVG_FILE_CONSTRAINTS } from '$lib/utils/image-canvas';
import * as v from 'valibot';

export const inputSchema = v.object({
	source: v.pipe(v.string(), v.minLength(1, 'Paste SVG markup or upload a file'))
});

export type SvgOptimizerInput = v.InferOutput<typeof inputSchema>;
export type SvgOptimizerOutput = {
	svg: string;
	originalBytes: number;
	optimizedBytes: number;
};

export function run(input: SvgOptimizerInput): SvgOptimizerOutput {
	return optimizeSvg(input.source);
}

const DEFAULT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
  <!-- decorative icon -->
  <rect x="0" y="0" width="100" height="100" fill="#2563eb"/>
</svg>`;

export const svgOptimizer: ToolDefinition<SvgOptimizerInput, SvgOptimizerOutput> = {
	id: 'svg-optimizer',
	version: '1.0.0',
	category: 'image',
	mode: 'instant',
	status: 'stable',
	tags: ['svg', 'optimize', 'minify', 'vector'],
	capabilities: ['copy', 'download', 'share', 'reset', 'favorite'],
	file: SVG_FILE_CONSTRAINTS,
	share: {
		params: ['source'],
		maxParamBytes: 4000
	},
	presets: [
		{
			id: 'sample-icon',
			label: 'Sample icon',
			params: { source: DEFAULT_SVG }
		}
	],
	workflow: {
		next: ['image-to-base64', 'image-converter']
	},
	metadata: {
		name: 'SVG Optimizer',
		title: 'SVG Optimizer — Minify and clean SVG markup',
		description:
			'Paste SVG or upload a file to strip comments, collapse whitespace, and reduce file size. Runs locally in your browser.',
		keywords: ['svg optimizer', 'minify svg', 'clean svg', 'compress svg'],
		related: ['image-to-base64', 'image-converter'],
		faq: [
			{
				question: 'Does my SVG leave my device?',
				answer: 'No. Optimization runs entirely in your browser. Nothing is uploaded.'
			},
			{
				question: 'What does the optimizer remove?',
				answer:
					'HTML comments, extra whitespace between tags, and repeated spaces. It does not rewrite paths or merge shapes.'
			},
			{
				question: 'Can I share my SVG?',
				answer:
					'Yes. Use Share link for small SVG text. Large files may be omitted from the URL—use Download or Copy instead.'
			}
		],
		howTo: [
			'Paste SVG or upload a file',
			'Review optimized output and byte savings',
			'Copy or download the result'
		]
	},
	validation: { input: inputSchema },
	run,
	ui: {
		component: () => import('./ui.svelte'),
		layout: 'editor'
	},
	analytics: { eventName: 'tool_run', props: ['originalBytes', 'optimizedBytes'] }
};
