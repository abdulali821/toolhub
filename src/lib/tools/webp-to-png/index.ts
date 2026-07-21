import type { ToolDefinition } from '$engine/types';
import { convertImageFormat, WEBP_FILE_CONSTRAINTS } from '$lib/utils/image-canvas';
import * as v from 'valibot';

export const inputSchema = v.object({
	dataUrl: v.pipe(v.string(), v.minLength(1))
});

export type WebpToPngInput = v.InferOutput<typeof inputSchema>;
export type WebpToPngOutput = { dataUrl: string };

export async function run(input: WebpToPngInput): Promise<WebpToPngOutput> {
	const dataUrl = await convertImageFormat(input.dataUrl, 'png');
	return { dataUrl };
}

export const webpToPng: ToolDefinition<WebpToPngInput, WebpToPngOutput> = {
	id: 'webp-to-png',
	version: '1.0.0',
	category: 'image',
	mode: 'instant',
	status: 'stable',
	tags: ['webp', 'png', 'convert', 'image'],
	capabilities: ['upload', 'download', 'copy', 'reset', 'favorite'],
	file: WEBP_FILE_CONSTRAINTS,
	workflow: {
		next: ['png-to-webp', 'webp-to-jpg', 'image-converter']
	},
	metadata: {
		name: 'WebP to PNG',
		title: 'WebP to PNG — Convert WebP images to PNG',
		description:
			'Convert WebP images to PNG locally in your browser. Preserve transparency when the source WebP supports it.',
		keywords: ['webp to png', 'convert webp', 'webp converter'],
		related: ['png-to-webp', 'webp-to-jpg', 'image-converter'],
		howTo: ['Upload a WebP file', 'Preview the PNG output', 'Download or copy the converted image'],
		faq: [
			{
				question: 'Is transparency preserved?',
				answer: 'Yes. PNG export keeps alpha from the decoded WebP image when present.'
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
