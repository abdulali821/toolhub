import type { ToolDefinition } from '$engine/types';
import { IMAGE_FILE_CONSTRAINTS, resizeImage } from '$lib/utils/image-canvas';
import * as v from 'valibot';

export const inputSchema = v.object({
	dataUrl: v.pipe(v.string(), v.minLength(1)),
	width: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1))),
	height: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1))),
	keepAspect: v.boolean()
});

export type ImageResizerInput = v.InferOutput<typeof inputSchema>;
export type ImageResizerOutput = { dataUrl: string; width: number; height: number };

export async function run(input: ImageResizerInput): Promise<ImageResizerOutput> {
	const out = await resizeImage(
		input.dataUrl,
		input.width ?? null,
		input.height ?? null,
		input.keepAspect
	);
	return out;
}

export const imageResizer: ToolDefinition<ImageResizerInput, ImageResizerOutput> = {
	id: 'image-resizer',
	version: '1.0.0',
	category: 'image',
	mode: 'instant',
	status: 'stable',
	tags: ['image', 'resize', 'scale', 'dimensions'],
	capabilities: ['upload', 'download', 'copy', 'reset', 'favorite'],
	file: IMAGE_FILE_CONSTRAINTS,
	workflow: {
		next: ['crop-image', 'rotate-image', 'image-compressor']
	},
	metadata: {
		name: 'Image Resizer',
		title: 'Image Resizer — Resize by width and height',
		description:
			'Resize PNG, JPEG, GIF, or WebP images in the browser. Optionally keep aspect ratio when setting dimensions.',
		keywords: ['image resizer', 'resize image', 'scale image', 'change image dimensions'],
		related: ['crop-image', 'rotate-image', 'image-compressor'],
		howTo: ['Upload an image', 'Set width and/or height', 'Download or copy the resized PNG'],
		faq: [
			{
				question: 'Can I keep aspect ratio?',
				answer:
					'Yes. Enable keep aspect ratio and provide width, height, or both—the tool scales proportionally.'
			},
			{
				question: 'Is my image uploaded to a server?',
				answer: 'No. Resizing uses canvas in your browser; files never leave your device.'
			},
			{
				question: 'What output format do I get?',
				answer: 'The resized image is exported as PNG, ready to download or copy from the toolbar.'
			}
		]
	},
	validation: { input: inputSchema },
	run,
	ui: {
		component: () => import('./ui.svelte')
	},
	analytics: { eventName: 'tool_run' }
};
