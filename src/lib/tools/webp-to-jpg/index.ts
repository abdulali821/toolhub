import type { ToolDefinition } from '$engine/types';
import { convertImageFormat, WEBP_FILE_CONSTRAINTS } from '$lib/utils/image-canvas';
import * as v from 'valibot';

export const inputSchema = v.object({
	dataUrl: v.pipe(v.string(), v.minLength(1)),
	quality: v.pipe(v.number(), v.minValue(0.1), v.maxValue(1))
});

export type WebpToJpgInput = v.InferOutput<typeof inputSchema>;
export type WebpToJpgOutput = { dataUrl: string };

export async function run(input: WebpToJpgInput): Promise<WebpToJpgOutput> {
	const dataUrl = await convertImageFormat(input.dataUrl, 'jpeg', input.quality);
	return { dataUrl };
}

export const webpToJpg: ToolDefinition<WebpToJpgInput, WebpToJpgOutput> = {
	id: 'webp-to-jpg',
	version: '1.0.0',
	category: 'image',
	mode: 'instant',
	status: 'stable',
	tags: ['webp', 'jpg', 'jpeg', 'convert', 'image'],
	capabilities: ['upload', 'download', 'copy', 'reset', 'favorite'],
	file: WEBP_FILE_CONSTRAINTS,
	workflow: {
		next: ['jpg-to-webp', 'webp-to-png', 'image-compressor']
	},
	metadata: {
		name: 'WebP to JPG',
		title: 'WebP to JPG — Convert WebP images to JPEG',
		description:
			'Convert WebP to JPEG with adjustable quality. Transparent areas are flattened to white—all processing stays local.',
		keywords: ['webp to jpg', 'webp to jpeg', 'convert webp'],
		related: ['jpg-to-webp', 'webp-to-png', 'image-compressor'],
		howTo: ['Upload a WebP file', 'Adjust JPEG quality', 'Download or copy the converted image'],
		faq: [
			{
				question: 'What happens to transparency?',
				answer: 'WebP alpha is composited onto a white background before JPEG export.'
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
