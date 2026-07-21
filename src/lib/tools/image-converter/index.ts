import type { ToolDefinition } from '$engine/types';
import { convertImageFormat, IMAGE_FILE_CONSTRAINTS } from '$lib/utils/image-canvas';
import * as v from 'valibot';

export const inputSchema = v.object({
	dataUrl: v.pipe(v.string(), v.minLength(1)),
	format: v.picklist(['png', 'jpeg', 'webp']),
	quality: v.optional(v.pipe(v.number(), v.minValue(0.1), v.maxValue(1)), 0.92)
});

export type ImageConverterInput = v.InferOutput<typeof inputSchema>;
export type ImageConverterOutput = { dataUrl: string };

export async function run(input: ImageConverterInput): Promise<ImageConverterOutput> {
	const dataUrl = await convertImageFormat(input.dataUrl, input.format, input.quality ?? 0.92);
	return { dataUrl };
}

export const imageConverter: ToolDefinition<ImageConverterInput, ImageConverterOutput> = {
	id: 'image-converter',
	version: '1.0.0',
	category: 'image',
	mode: 'instant',
	status: 'stable',
	tags: ['image', 'convert', 'png', 'jpeg', 'webp'],
	capabilities: ['upload', 'download', 'copy', 'reset', 'favorite'],
	file: IMAGE_FILE_CONSTRAINTS,
	workflow: {
		next: ['image-compressor', 'image-resizer', 'crop-image']
	},
	metadata: {
		name: 'Universal Image Converter',
		title: 'Universal Image Converter — PNG, JPEG, and WebP',
		description:
			'Convert PNG, JPEG, GIF, or WebP images to PNG, JPEG, or WebP with adjustable quality. The hub for image format changes in your browser.',
		keywords: ['image converter', 'png to jpg', 'jpg to webp', 'convert image format'],
		related: ['image-compressor', 'image-resizer', 'png-to-jpg', 'jpg-to-webp'],
		faq: [
			{
				question: 'Are images uploaded?',
				answer: 'No. Conversion uses a canvas in your browser. Max file size is 2 MB.'
			},
			{
				question: 'What happens to transparency when converting to JPEG?',
				answer: 'Transparent areas are flattened onto a white background before JPEG export.'
			},
			{
				question: 'Why is Share disabled?',
				answer: 'Converted image data is too large for URL sharing. Use Download or Copy instead.'
			}
		],
		howTo: [
			'Upload an image',
			'Choose output format and quality',
			'Download or copy the converted result'
		]
	},
	validation: { input: inputSchema },
	run,
	ui: {
		component: () => import('./ui.svelte')
	},
	analytics: { eventName: 'tool_run', props: ['format'] }
};
