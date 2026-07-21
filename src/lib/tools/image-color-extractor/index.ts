import type { ToolDefinition } from '$engine/types';
import {
	extractDominantColors,
	IMAGE_FILE_CONSTRAINTS,
	type ExtractedColor
} from '$lib/utils/image-canvas';
import * as v from 'valibot';

export const inputSchema = v.object({
	dataUrl: v.pipe(v.string(), v.minLength(1)),
	maxColors: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(12)), 6)
});

export type ImageColorExtractorInput = v.InferOutput<typeof inputSchema>;
export type ImageColorExtractorOutput = { colors: ExtractedColor[] };

export async function run(input: ImageColorExtractorInput): Promise<ImageColorExtractorOutput> {
	const colors = await extractDominantColors(input.dataUrl, input.maxColors ?? 6);
	return { colors };
}

export const imageColorExtractor: ToolDefinition<
	ImageColorExtractorInput,
	ImageColorExtractorOutput
> = {
	id: 'image-color-extractor',
	version: '1.0.0',
	category: 'image',
	mode: 'instant',
	status: 'stable',
	tags: ['image', 'color', 'palette', 'extract'],
	capabilities: ['upload', 'copy', 'reset', 'favorite'],
	file: IMAGE_FILE_CONSTRAINTS,
	workflow: {
		next: ['color-picker', 'color-converter', 'image-metadata']
	},
	metadata: {
		name: 'Image Color Extractor',
		title: 'Image Color Extractor — Dominant colors from photos',
		description:
			'Upload an image to extract dominant colors with hex codes and percentages. Copy the palette for design work—all in your browser.',
		keywords: ['image color extractor', 'palette from image', 'dominant colors', 'color picker'],
		related: ['color-picker', 'color-converter', 'image-metadata'],
		faq: [
			{
				question: 'Is my image uploaded?',
				answer: 'No. Colors are sampled with a canvas in your browser. Max file size is 2 MB.'
			},
			{
				question: 'How are colors chosen?',
				answer:
					'Pixels are bucketed into a simplified palette and ranked by frequency. Transparent pixels are ignored.'
			},
			{
				question: 'Why is Share disabled?',
				answer:
					'Image data is too large for URL sharing. Copy the hex list or open related color tools instead.'
			}
		],
		howTo: [
			'Upload an image',
			'Review swatches with hex and percent',
			'Copy the hex list for your palette'
		]
	},
	validation: { input: inputSchema },
	run,
	ui: {
		component: () => import('./ui.svelte')
	},
	analytics: { eventName: 'tool_run', props: ['maxColors'] }
};
