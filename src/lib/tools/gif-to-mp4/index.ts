import type { ToolDefinition } from '$engine/types';
import {
	GIF_FILE_CONSTRAINTS,
	blobToDataUrl,
	convertGifToMp4,
	type FfmpegProgress
} from '$lib/utils/media-convert';
import * as v from 'valibot';

export { GIF_FILE_CONSTRAINTS };

export const inputSchema = v.object({
	dataUrl: v.pipe(v.string(), v.minLength(1))
});

export type GifToMp4Input = v.InferOutput<typeof inputSchema> & {
	onProgress?: (progress: FfmpegProgress) => void;
};
export type GifToMp4Output = { dataUrl: string; blobUrl: string };

export async function run(input: GifToMp4Input): Promise<GifToMp4Output> {
	const blob = await convertGifToMp4({
		input: input.dataUrl,
		onProgress: input.onProgress
	});
	const dataUrl = await blobToDataUrl(blob);
	const blobUrl = URL.createObjectURL(blob);
	return { dataUrl, blobUrl };
}

export const gifToMp4: ToolDefinition<GifToMp4Input, GifToMp4Output> = {
	id: 'gif-to-mp4',
	version: '1.0.0',
	category: 'image',
	mode: 'upload',
	status: 'stable',
	tags: ['gif', 'mp4', 'video', 'convert', 'animated'],
	capabilities: ['upload', 'download', 'copy', 'reset', 'favorite'],
	file: GIF_FILE_CONSTRAINTS,
	workflow: {
		next: ['mp4-to-gif', 'svg-to-gif', 'image-converter']
	},
	metadata: {
		name: 'GIF to MP4',
		title: 'GIF to MP4 — Turn Animated GIFs into Video',
		description:
			'Turn an animated GIF into an MP4 video in your browser. Usually much smaller and smoother to play—nothing is uploaded.',
		keywords: ['gif to mp4', 'gif to video', 'convert gif mp4', 'animated gif video'],
		related: ['mp4-to-gif', 'svg-to-gif', 'image-converter', 'image-divider'],
		howTo: [
			'Upload a GIF (up to 12 MB)',
			'Preview it, then click Generate MP4',
			'The first run may take a moment to set up—then download your video'
		],
		faq: [
			{
				question: 'Is conversion done on a server?',
				answer:
					'No. Everything runs in your browser. The first convert may download a small helper once, then it works offline on that device.'
			},
			{
				question: 'Why convert GIF to MP4?',
				answer:
					'MP4 files are usually much smaller and play more smoothly, while keeping the animation.'
			},
			{
				question: 'What is the file size limit?',
				answer: '12 MB per GIF.'
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
