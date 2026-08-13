import type { ToolDefinition } from '$engine/types';
import { IMAGE_FILE_CONSTRAINTS, removeBackground } from '$lib/utils/image-canvas';
import * as v from 'valibot';

/** Slightly higher limit for photo-oriented AI removal; still Dropzone-validated. */
export const BG_REMOVER_FILE_CONSTRAINTS = {
	...IMAGE_FILE_CONSTRAINTS,
	maxBytes: 5 * 1024 * 1024
};

export const inputSchema = v.object({
	dataUrl: v.pipe(v.string(), v.minLength(1)),
	mode: v.picklist(['ai', 'color', 'wand']),
	color: v.pipe(v.string(), v.minLength(4)),
	tolerance: v.pipe(v.number(), v.minValue(0), v.maxValue(255)),
	feather: v.pipe(v.number(), v.minValue(0), v.maxValue(64)),
	seedX: v.optional(v.number()),
	seedY: v.optional(v.number())
});

export type BackgroundRemoverInput = v.InferOutput<typeof inputSchema>;
export type BackgroundRemoverOutput = { dataUrl: string };

export async function run(input: BackgroundRemoverInput): Promise<BackgroundRemoverOutput> {
	if (input.mode === 'ai') {
		if (typeof window === 'undefined') {
			throw new Error('AI background removal only runs in the browser.');
		}
		const { removeBackgroundWithAi } = await import('$lib/background-removal/client');
		const dataUrl = await removeBackgroundWithAi(input.dataUrl);
		return { dataUrl };
	}

	const dataUrl = await removeBackground(input.dataUrl, {
		mode: input.mode,
		color: input.color,
		tolerance: input.tolerance,
		feather: input.feather,
		seedX: input.seedX,
		seedY: input.seedY
	});
	return { dataUrl };
}

export const backgroundRemover: ToolDefinition<BackgroundRemoverInput, BackgroundRemoverOutput> = {
	id: 'background-remover',
	version: '1.1.0',
	category: 'image',
	mode: 'instant',
	status: 'stable',
	tags: [
		'image',
		'background',
		'remove',
		'transparent',
		'ai',
		'onnx',
		'chroma',
		'magic wand',
		'color key'
	],
	capabilities: ['upload', 'download', 'copy', 'reset', 'favorite'],
	file: BG_REMOVER_FILE_CONSTRAINTS,
	workflow: {
		next: ['crop-image', 'image-compressor', 'image-converter']
	},
	metadata: {
		name: 'Background Remover',
		title: 'Background Remover — AI in Your Browser (Private)',
		description:
			'Remove image backgrounds with on-device AI in your browser—or classic color-key and magic wand. Your photo isn’t uploaded to our servers for processing. Export a transparent PNG.',
		keywords: [
			'background remover',
			'remove background',
			'transparent png',
			'ai background remover',
			'browser background removal',
			'magic wand',
			'color key',
			'make background transparent'
		],
		related: ['crop-image', 'image-converter', 'image-compressor', 'favicon-generator'],
		howTo: [
			'Upload a PNG, JPEG, GIF, or WebP (up to 5 MB)',
			'Use AI (default) for photos and products, or switch to Color key / Magic wand for logos',
			'Wait for the on-device model on first use (cached afterward)',
			'Download the transparent PNG'
		],
		faq: [
			{
				question: 'Does my image get uploaded to your servers?',
				answer:
					'No. AI and classic modes both run in your browser. The first AI run may download model files to your device; your photo is not sent to HeyTools for inference.'
			},
			{
				question: 'Why is the first AI run slow?',
				answer:
					'The browser downloads and caches an ONNX model (and WASM). Later images reuse the cache and are much faster.'
			},
			{
				question: 'AI vs color key vs magic wand?',
				answer:
					'AI segments the subject automatically and works best on photos and products. Color key removes all pixels near a chosen color. Magic wand removes a connected region you click—useful for simple logos.'
			},
			{
				question: 'Why is Share disabled?',
				answer: 'Image data is too large for URL sharing. Use Download or Copy instead.'
			}
		]
	},
	validation: { input: inputSchema },
	run,
	ui: {
		component: () => import('./ui.svelte')
	},
	analytics: { eventName: 'tool_run', props: ['mode'] }
};
