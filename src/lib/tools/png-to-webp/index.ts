import type { ToolDefinition } from '$engine/types';
import { convertImageFormat, PNG_FILE_CONSTRAINTS } from '$lib/utils/image-canvas';
import * as v from 'valibot';

export const inputSchema = v.object({
	dataUrl: v.pipe(v.string(), v.minLength(1)),
	quality: v.pipe(v.number(), v.minValue(0.1), v.maxValue(1))
});

export type PngToWebpInput = v.InferOutput<typeof inputSchema>;
export type PngToWebpOutput = { dataUrl: string };

export async function run(input: PngToWebpInput): Promise<PngToWebpOutput> {
	const dataUrl = await convertImageFormat(input.dataUrl, 'webp', input.quality);
	return { dataUrl };
}

export const pngToWebp: ToolDefinition<PngToWebpInput, PngToWebpOutput> = {
	id: 'png-to-webp',
	version: '1.0.0',
	category: 'image',
	mode: 'instant',
	status: 'stable',
	tags: ['png', 'webp', 'convert', 'image'],
	capabilities: ['upload', 'download', 'copy', 'reset', 'favorite'],
	file: PNG_FILE_CONSTRAINTS,
	workflow: {
		next: ['webp-to-png', 'jpg-to-webp', 'image-compressor']
	},
	metadata: {
		name: 'PNG to WebP',
		title: 'PNG to WebP — Convert PNG images to WebP',
		description:
			'Convert PNG to WebP with adjustable quality for smaller file sizes. All conversion runs locally in your browser.',
		keywords: ['png to webp', 'convert png to webp', 'png webp converter'],
		related: ['webp-to-png', 'jpg-to-webp', 'image-compressor'],
		howTo: ['Upload a PNG file', 'Adjust WebP quality', 'Download or copy the converted image'],
		faq: [
			{
				question: 'Will WebP be smaller than PNG?',
				answer:
					'Usually yes at comparable visual quality. Lower the quality slider to reduce size further.'
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
