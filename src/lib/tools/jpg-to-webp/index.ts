import type { ToolDefinition } from '$engine/types';
import { compressImage, JPEG_FILE_CONSTRAINTS } from '$lib/utils/image-canvas';
import * as v from 'valibot';

export const inputSchema = v.object({
	dataUrl: v.pipe(v.string(), v.minLength(1)),
	quality: v.pipe(v.number(), v.minValue(0.1), v.maxValue(1))
});

export type JpgToWebpInput = v.InferOutput<typeof inputSchema>;
export type JpgToWebpOutput = { dataUrl: string };

export async function run(input: JpgToWebpInput): Promise<JpgToWebpOutput> {
	const dataUrl = await compressImage(input.dataUrl, input.quality, 'image/webp');
	return { dataUrl };
}

export const jpgToWebp: ToolDefinition<JpgToWebpInput, JpgToWebpOutput> = {
	id: 'jpg-to-webp',
	version: '1.0.0',
	category: 'image',
	mode: 'instant',
	status: 'stable',
	tags: ['jpg', 'jpeg', 'webp', 'convert', 'image'],
	capabilities: ['upload', 'download', 'copy', 'reset', 'favorite'],
	file: JPEG_FILE_CONSTRAINTS,
	workflow: {
		next: ['webp-to-jpg', 'jpg-to-png', 'image-converter']
	},
	metadata: {
		name: 'JPG to WebP',
		title: 'JPG to WebP — Convert JPEG images to WebP',
		description:
			'Convert JPEG images to WebP with adjustable quality for smaller file sizes—all processing stays local.',
		keywords: ['jpg to webp', 'jpeg to webp', 'convert jpg'],
		related: ['webp-to-jpg', 'jpg-to-png', 'image-converter'],
		howTo: ['Upload a JPEG file', 'Adjust WebP quality', 'Download or copy the converted image'],
		faq: [
			{
				question: 'Do I need to upload my photo?',
				answer: 'No. Conversion uses canvas in the browser with a 2 MB file limit.'
			},
			{
				question: 'Will WebP reduce file size?',
				answer:
					'Usually yes. WebP often produces smaller files than JPEG at similar visual quality.'
			},
			{
				question: 'Can I adjust quality?',
				answer: 'Yes. Lower quality yields smaller files; higher quality preserves more detail.'
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
