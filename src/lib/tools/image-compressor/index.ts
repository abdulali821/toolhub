import type { ToolDefinition } from '$engine/types';
import { compressImage, IMAGE_FILE_CONSTRAINTS } from '$lib/utils/image-canvas';
import * as v from 'valibot';

export const inputSchema = v.object({
	dataUrl: v.pipe(v.string(), v.minLength(1)),
	quality: v.pipe(v.number(), v.minValue(0.1), v.maxValue(1)),
	format: v.picklist(['jpeg', 'webp'])
});

export type ImageCompressorInput = v.InferOutput<typeof inputSchema>;
export type ImageCompressorOutput = { dataUrl: string };

export async function run(input: ImageCompressorInput): Promise<ImageCompressorOutput> {
	const mimeType = input.format === 'webp' ? 'image/webp' : 'image/jpeg';
	const dataUrl = await compressImage(
		input.dataUrl,
		input.quality,
		mimeType,
		mimeType === 'image/jpeg' ? '#ffffff' : undefined
	);
	return { dataUrl };
}

export const imageCompressor: ToolDefinition<ImageCompressorInput, ImageCompressorOutput> = {
	id: 'image-compressor',
	version: '1.0.0',
	category: 'image',
	mode: 'instant',
	status: 'stable',
	tags: ['image', 'compress', 'optimize', 'jpeg', 'webp'],
	capabilities: ['upload', 'download', 'copy', 'reset', 'favorite'],
	file: IMAGE_FILE_CONSTRAINTS,
	workflow: {
		next: ['image-resizer', 'crop-image', 'image-converter']
	},
	metadata: {
		name: 'Image Compressor',
		title: 'Image Compressor — Reduce JPEG and WebP size',
		description:
			'Compress images in your browser with a quality slider. Export JPEG or WebP data URLs without uploading files.',
		keywords: ['image compressor', 'compress jpeg', 'compress webp', 'optimize image'],
		related: ['image-resizer', 'crop-image', 'image-converter'],
		howTo: [
			'Upload an image',
			'Adjust quality and output format',
			'Download or copy the compressed file'
		],
		faq: [
			{
				question: 'Are images uploaded?',
				answer: 'No. Compression uses a canvas in your browser. Max file size is 2 MB.'
			},
			{
				question: 'Why is Share disabled?',
				answer: 'Compressed image data is too large for URL sharing. Use Download or Copy instead.'
			}
		]
	},
	validation: { input: inputSchema },
	run,
	ui: {
		component: () => import('./ui.svelte')
	},
	analytics: { eventName: 'tool_run', props: ['format'] }
};
