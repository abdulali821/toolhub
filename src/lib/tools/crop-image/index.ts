import type { ToolDefinition } from '$engine/types';
import { cropImage as cropImageCanvas, IMAGE_FILE_CONSTRAINTS } from '$lib/utils/image-canvas';
import * as v from 'valibot';

export const inputSchema = v.object({
	dataUrl: v.pipe(v.string(), v.minLength(1)),
	x: v.pipe(v.number(), v.minValue(0)),
	y: v.pipe(v.number(), v.minValue(0)),
	width: v.pipe(v.number(), v.minValue(1)),
	height: v.pipe(v.number(), v.minValue(1))
});

export type CropImageInput = v.InferOutput<typeof inputSchema>;
export type CropImageOutput = { dataUrl: string };

export async function run(input: CropImageInput): Promise<CropImageOutput> {
	const dataUrl = await cropImageCanvas(input.dataUrl, {
		x: input.x,
		y: input.y,
		width: input.width,
		height: input.height
	});
	return { dataUrl };
}

export const cropImage: ToolDefinition<CropImageInput, CropImageOutput> = {
	id: 'crop-image',
	version: '1.0.0',
	category: 'image',
	mode: 'instant',
	status: 'stable',
	tags: ['image', 'crop', 'trim', 'cut'],
	capabilities: ['upload', 'download', 'copy', 'reset', 'favorite'],
	file: IMAGE_FILE_CONSTRAINTS,
	workflow: {
		next: ['rotate-image', 'image-compressor', 'image-converter']
	},
	metadata: {
		name: 'Crop Image',
		title: 'Crop Image — Trim PNG, JPEG, GIF, or WebP',
		description:
			'Crop images visually in your browser. Drag the selection box and handles to trim PNG, JPEG, GIF, or WebP—no upload required.',
		keywords: ['crop image', 'trim image', 'cut image online', 'image cropper', 'manual crop'],
		related: ['rotate-image', 'image-compressor', 'image-resizer'],
		howTo: [
			'Upload an image',
			'Drag the crop box to move it, or pull the corner and edge handles to resize',
			'Download or copy the cropped PNG'
		],
		faq: [
			{
				question: 'How do I crop manually?',
				answer:
					'Drag inside the white selection to move it. Use the corner and edge handles to resize. Outside the selection is dimmed so you can see what will be kept.'
			},
			{
				question: 'Are images uploaded to a server?',
				answer: 'No. Cropping uses canvas locally. Max file size is 2 MB.'
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
	analytics: { eventName: 'tool_run' }
};
