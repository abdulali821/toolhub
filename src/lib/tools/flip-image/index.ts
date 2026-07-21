import type { ToolDefinition } from '$engine/types';
import { flipImage as flipImageCanvas, IMAGE_FILE_CONSTRAINTS } from '$lib/utils/image-canvas';
import * as v from 'valibot';

export const inputSchema = v.object({
	dataUrl: v.pipe(v.string(), v.minLength(1)),
	axis: v.picklist(['horizontal', 'vertical', 'both'])
});

export type FlipImageInput = v.InferOutput<typeof inputSchema>;
export type FlipImageOutput = { dataUrl: string };

export async function run(input: FlipImageInput): Promise<FlipImageOutput> {
	const dataUrl = await flipImageCanvas(input.dataUrl, input.axis);
	return { dataUrl };
}

export const flipImage: ToolDefinition<FlipImageInput, FlipImageOutput> = {
	id: 'flip-image',
	version: '1.0.0',
	category: 'image',
	mode: 'instant',
	status: 'stable',
	tags: ['image', 'flip', 'mirror', 'reflect'],
	capabilities: ['upload', 'download', 'copy', 'reset', 'favorite'],
	file: IMAGE_FILE_CONSTRAINTS,
	workflow: {
		next: ['rotate-image', 'crop-image', 'image-compressor']
	},
	metadata: {
		name: 'Flip Image',
		title: 'Flip Image — Mirror horizontally or vertically',
		description:
			'Flip or mirror PNG, JPEG, GIF, or WebP images in your browser. Choose horizontal, vertical, or both axes.',
		keywords: ['flip image', 'mirror image', 'reflect image online'],
		related: ['rotate-image', 'crop-image', 'image-compressor'],
		howTo: ['Upload an image', 'Pick flip axis', 'Download or copy the mirrored PNG'],
		faq: [
			{
				question: 'What is the difference between horizontal and vertical flip?',
				answer:
					'Horizontal mirrors left-to-right; vertical mirrors top-to-bottom. Both applies both flips.'
			},
			{
				question: 'Why is Share disabled?',
				answer: 'Flipped image data is too large for URL sharing. Use Download or Copy instead.'
			}
		]
	},
	validation: { input: inputSchema },
	run,
	ui: {
		component: () => import('./ui.svelte')
	},
	analytics: { eventName: 'tool_run', props: ['axis'] }
};
