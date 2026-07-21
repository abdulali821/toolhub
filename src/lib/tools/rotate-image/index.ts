import type { ToolDefinition } from '$engine/types';
import { rotateImage as rotateImageCanvas, IMAGE_FILE_CONSTRAINTS } from '$lib/utils/image-canvas';
import * as v from 'valibot';

export const inputSchema = v.object({
	dataUrl: v.pipe(v.string(), v.minLength(1)),
	degrees: v.picklist([90, 180, 270])
});

export type RotateImageInput = v.InferOutput<typeof inputSchema>;
export type RotateImageOutput = { dataUrl: string };

export async function run(input: RotateImageInput): Promise<RotateImageOutput> {
	const dataUrl = await rotateImageCanvas(input.dataUrl, input.degrees);
	return { dataUrl };
}

export const rotateImage: ToolDefinition<RotateImageInput, RotateImageOutput> = {
	id: 'rotate-image',
	version: '1.0.0',
	category: 'image',
	mode: 'instant',
	status: 'stable',
	tags: ['image', 'rotate', 'orientation', 'turn'],
	capabilities: ['upload', 'download', 'copy', 'reset', 'favorite'],
	file: IMAGE_FILE_CONSTRAINTS,
	workflow: {
		next: ['crop-image', 'flip-image', 'image-resizer']
	},
	metadata: {
		name: 'Rotate Image',
		title: 'Rotate Image — Turn photos 90°, 180°, or 270°',
		description:
			'Rotate PNG, JPEG, GIF, or WebP images clockwise in your browser. Pick 90°, 180°, or 270° and export instantly.',
		keywords: ['rotate image', 'turn image', 'rotate photo online', 'image orientation'],
		related: ['crop-image', 'flip-image', 'image-resizer'],
		howTo: ['Upload an image', 'Choose rotation angle', 'Download or copy the rotated PNG'],
		faq: [
			{
				question: 'Does rotation reduce quality?',
				answer:
					'Output is re-encoded as PNG locally. JPEG artifacts are not added beyond canvas export.'
			},
			{
				question: 'Why is Share disabled?',
				answer: 'Rotated image data is too large for URL sharing. Use Download or Copy instead.'
			}
		]
	},
	validation: { input: inputSchema },
	run,
	ui: {
		component: () => import('./ui.svelte')
	},
	analytics: { eventName: 'tool_run', props: ['degrees'] }
};
