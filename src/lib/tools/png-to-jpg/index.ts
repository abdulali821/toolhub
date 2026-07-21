import type { ToolDefinition } from '$engine/types';
import { compressImage, PNG_FILE_CONSTRAINTS } from '$lib/utils/image-canvas';
import * as v from 'valibot';

export const inputSchema = v.object({
	dataUrl: v.pipe(v.string(), v.minLength(1)),
	quality: v.pipe(v.number(), v.minValue(0.1), v.maxValue(1))
});

export type PngToJpgInput = v.InferOutput<typeof inputSchema>;
export type PngToJpgOutput = { dataUrl: string };

export async function run(input: PngToJpgInput): Promise<PngToJpgOutput> {
	const dataUrl = await compressImage(input.dataUrl, input.quality, 'image/jpeg', '#ffffff');
	return { dataUrl };
}

export const pngToJpg: ToolDefinition<PngToJpgInput, PngToJpgOutput> = {
	id: 'png-to-jpg',
	version: '1.0.0',
	category: 'image',
	mode: 'instant',
	status: 'stable',
	tags: ['png', 'jpg', 'jpeg', 'convert', 'image'],
	capabilities: ['upload', 'download', 'copy', 'reset', 'favorite'],
	file: PNG_FILE_CONSTRAINTS,
	workflow: {
		next: ['jpg-to-png', 'png-to-webp', 'image-converter']
	},
	metadata: {
		name: 'PNG to JPG',
		title: 'PNG to JPG — Convert PNG images to JPEG',
		description:
			'Convert PNG files to JPEG with adjustable quality. Transparent areas are flattened to white locally in your browser.',
		keywords: ['png to jpg', 'png to jpeg', 'convert png'],
		related: ['jpg-to-png', 'png-to-webp', 'image-converter'],
		howTo: ['Upload a PNG file', 'Adjust JPEG quality', 'Download or copy the converted image'],
		faq: [
			{
				question: 'What happens to transparency?',
				answer: 'PNG alpha is composited onto a white background before JPEG export.'
			},
			{
				question: 'Is conversion done locally?',
				answer:
					'Yes. Your PNG is processed in the browser with a 2 MB file limit—nothing is uploaded.'
			},
			{
				question: 'Can I control JPEG quality?',
				answer: 'Yes. Adjust the quality slider to balance file size and visual fidelity.'
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
