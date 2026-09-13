import type { ToolDefinition } from '$engine/types';
import {
	MP4_FILE_CONSTRAINTS,
	blobToDataUrl,
	convertMp4ToGif,
	type FfmpegProgress
} from '$lib/utils/media-convert';
import * as v from 'valibot';

export { MP4_FILE_CONSTRAINTS };

export const inputSchema = v.object({
	dataUrl: v.pipe(v.string(), v.minLength(1)),
	fps: v.optional(v.pipe(v.number(), v.minValue(4), v.maxValue(15)), 10),
	maxWidth: v.optional(v.pipe(v.number(), v.integer(), v.minValue(160), v.maxValue(720)), 480)
});

export type Mp4ToGifInput = v.InferOutput<typeof inputSchema> & {
	onProgress?: (progress: FfmpegProgress) => void;
};
export type Mp4ToGifOutput = { dataUrl: string; blobUrl: string };

export async function run(input: Mp4ToGifInput): Promise<Mp4ToGifOutput> {
	const blob = await convertMp4ToGif({
		input: input.dataUrl,
		fps: input.fps,
		maxWidth: input.maxWidth,
		onProgress: input.onProgress
	});
	const dataUrl = await blobToDataUrl(blob);
	const blobUrl = URL.createObjectURL(blob);
	return { dataUrl, blobUrl };
}

export const mp4ToGif: ToolDefinition<Mp4ToGifInput, Mp4ToGifOutput> = {
	id: 'mp4-to-gif',
	version: '1.0.0',
	category: 'image',
	mode: 'upload',
	status: 'stable',
	tags: ['mp4', 'gif', 'video', 'convert', 'animated'],
	capabilities: ['upload', 'download', 'copy', 'reset', 'favorite'],
	file: MP4_FILE_CONSTRAINTS,
	workflow: {
		next: ['gif-to-mp4', 'svg-to-gif', 'image-divider']
	},
	metadata: {
		name: 'MP4 to GIF',
		title: 'MP4 to GIF — Turn Video Clips into Animated GIFs',
		description:
			'Turn an MP4 clip into an animated GIF in your browser. Pick speed (FPS) and size—nothing is uploaded.',
		keywords: ['mp4 to gif', 'video to gif', 'convert mp4 gif', 'make gif from video'],
		related: ['gif-to-mp4', 'svg-to-gif', 'image-divider', 'image-converter'],
		howTo: [
			'Upload an MP4 (up to 20 MB)',
			'Set FPS and max width',
			'Click Generate GIF',
			'Download the GIF'
		],
		faq: [
			{
				question: 'Is conversion done on a server?',
				answer:
					'No. Everything runs in your browser. The first convert may download a small helper once, then it works on that device.'
			},
			{
				question: 'Why is my GIF large or choppy?',
				answer: 'Try a lower FPS or smaller max width. GIFs get big fast—short clips work best.'
			},
			{
				question: 'What is the file size limit?',
				answer: '20 MB per MP4. Longer or higher-resolution clips may take more time.'
			}
		]
	},
	validation: { input: inputSchema },
	run,
	ui: {
		component: () => import('./ui.svelte')
	},
	analytics: { eventName: 'tool_run', props: ['fps', 'maxWidth'] }
};
