import type { ToolDefinition } from '$engine/types';
import { convertImageFormat, JPEG_FILE_CONSTRAINTS } from '$lib/utils/image-canvas';
import * as v from 'valibot';

export const inputSchema = v.object({
	dataUrl: v.pipe(v.string(), v.minLength(1))
});

export type JpgToPngInput = v.InferOutput<typeof inputSchema>;
export type JpgToPngOutput = { dataUrl: string };

export async function run(input: JpgToPngInput): Promise<JpgToPngOutput> {
	const dataUrl = await convertImageFormat(input.dataUrl, 'png');
	return { dataUrl };
}

export const jpgToPng: ToolDefinition<JpgToPngInput, JpgToPngOutput> = {
	id: 'jpg-to-png',
	version: '1.0.0',
	category: 'image',
	mode: 'instant',
	status: 'stable',
	tags: ['jpg', 'jpeg', 'png', 'convert', 'image'],
	capabilities: ['upload', 'download', 'copy', 'reset', 'favorite'],
	file: JPEG_FILE_CONSTRAINTS,
	workflow: {
		next: ['png-to-jpg', 'png-to-webp', 'image-converter']
	},
	metadata: {
		name: 'JPG to PNG',
		title: 'JPG to PNG — Convert JPEG images to PNG',
		description:
			'Convert JPEG photos to lossless PNG in your browser. Processing stays local with a 2 MB file limit.',
		keywords: ['jpg to png', 'jpeg to png', 'convert jpg to png'],
		related: ['png-to-jpg', 'png-to-webp', 'image-converter'],
		howTo: ['Upload a JPEG file', 'Preview the PNG output', 'Download or copy the converted image'],
		faq: [
			{
				question: 'Will file size increase?',
				answer:
					'PNG is lossless and often larger than JPEG. Consider compressing afterward if size matters.'
			},
			{
				question: 'Why is Share disabled?',
				answer: 'Converted image data is too large for URL sharing. Use Download or Copy instead.'
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
