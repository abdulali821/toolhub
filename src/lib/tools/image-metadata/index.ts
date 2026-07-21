import type { ToolDefinition } from '$engine/types';
import {
	IMAGE_FILE_CONSTRAINTS,
	readImageMetadata,
	type ImageMetaField
} from '$lib/utils/image-canvas';
import * as v from 'valibot';

export const inputSchema = v.object({
	bytes: v.array(v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(255))),
	fileName: v.pipe(v.string(), v.minLength(1)),
	mimeType: v.string()
});

export type ImageMetadataInput = v.InferOutput<typeof inputSchema>;
export type ImageMetadataOutput = { fields: ImageMetaField[] };

export function run(input: ImageMetadataInput): ImageMetadataOutput {
	return {
		fields: readImageMetadata(new Uint8Array(input.bytes), input.fileName, input.mimeType)
	};
}

export const imageMetadata: ToolDefinition<ImageMetadataInput, ImageMetadataOutput> = {
	id: 'image-metadata',
	version: '1.0.0',
	category: 'image',
	mode: 'instant',
	status: 'stable',
	tags: ['image', 'exif', 'metadata', 'dimensions'],
	capabilities: ['upload', 'reset', 'favorite'],
	file: IMAGE_FILE_CONSTRAINTS,
	workflow: {
		next: ['image-color-extractor', 'image-compressor', 'image-converter']
	},
	metadata: {
		name: 'Image Metadata Viewer',
		title: 'Image Metadata Viewer — Inspect image file details',
		description:
			'Upload PNG, JPEG, or WebP images to read format, dimensions, file size, and basic EXIF hints locally in your browser.',
		keywords: ['image metadata', 'exif viewer', 'image dimensions', 'file info'],
		related: ['image-color-extractor', 'image-compressor', 'image-converter'],
		faq: [
			{
				question: 'Is my image uploaded?',
				answer: 'No. Metadata is read from the file in your browser. Max size is 2 MB.'
			},
			{
				question: 'Which formats are supported?',
				answer:
					'PNG, JPEG, and WebP dimension parsing is supported. Other formats show file name, MIME type, and size only.'
			},
			{
				question: 'Why is Share disabled?',
				answer:
					'Image binary data is too large for URL sharing. Use related tools to convert or compress instead.'
			}
		],
		howTo: [
			'Upload an image',
			'Review the metadata table',
			'Continue with color, compress, or convert tools'
		]
	},
	validation: { input: inputSchema },
	run,
	ui: {
		component: () => import('./ui.svelte')
	},
	analytics: { eventName: 'tool_run' }
};
