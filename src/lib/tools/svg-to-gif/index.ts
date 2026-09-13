import type { ToolDefinition } from '$engine/types';
import { SVG_FILE_CONSTRAINTS } from '$lib/utils/image-canvas';
import { blobToDataUrl } from '$lib/utils/media-convert';
import { convertSvgToGif } from '$lib/utils/svg-gif';
import * as v from 'valibot';

export { SVG_FILE_CONSTRAINTS };

export const inputSchema = v.object({
	dataUrl: v.pipe(v.string(), v.minLength(1)),
	width: v.optional(v.pipe(v.number(), v.integer(), v.minValue(32), v.maxValue(1200)), 480),
	frames: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(24)), 8),
	pulse: v.optional(v.boolean(), true)
});

export type SvgToGifInput = v.InferOutput<typeof inputSchema>;
export type SvgToGifOutput = { dataUrl: string; blobUrl: string };

export async function run(input: SvgToGifInput): Promise<SvgToGifOutput> {
	const blob = await convertSvgToGif({
		svg: input.dataUrl,
		width: input.width,
		frames: input.frames,
		pulse: input.pulse
	});
	const dataUrl = await blobToDataUrl(blob);
	const blobUrl = URL.createObjectURL(blob);
	return { dataUrl, blobUrl };
}

export const svgToGif: ToolDefinition<SvgToGifInput, SvgToGifOutput> = {
	id: 'svg-to-gif',
	version: '1.0.0',
	category: 'image',
	mode: 'upload',
	status: 'stable',
	tags: ['svg', 'gif', 'convert', 'animated', 'vector'],
	capabilities: ['upload', 'download', 'copy', 'reset', 'favorite'],
	file: SVG_FILE_CONSTRAINTS,
	workflow: {
		next: ['mp4-to-gif', 'gif-to-mp4', 'svg-optimizer']
	},
	metadata: {
		name: 'SVG to GIF',
		title: 'SVG to GIF — Rasterize Vector Art to Animated GIF',
		description:
			'Turn an SVG into a GIF in your browser. Pick width and an optional gentle pulse loop—nothing is uploaded.',
		keywords: ['svg to gif', 'convert svg gif', 'vector to gif', 'svg animated gif'],
		related: ['svg-optimizer', 'mp4-to-gif', 'gif-to-mp4', 'image-converter'],
		howTo: [
			'Upload an SVG (up to 1 MB)',
			'Choose output width and frames',
			'Toggle pulse if you want a subtle loop',
			'Click Generate GIF, then download'
		],
		faq: [
			{
				question: 'Does this keep SVG as a vector?',
				answer:
					'No. It turns the SVG into pixels, then a GIF. Keep the original SVG if you still need to edit it.'
			},
			{
				question: 'Is conversion done locally?',
				answer: 'Yes. Everything runs in your browser—nothing is uploaded.'
			},
			{
				question: 'What does pulse do?',
				answer:
					'When you use more than one frame and pulse is on, the image gently scales in a loop so the GIF feels animated.'
			}
		]
	},
	validation: { input: inputSchema },
	run,
	ui: {
		component: () => import('./ui.svelte')
	},
	analytics: { eventName: 'tool_run', props: ['width', 'frames', 'pulse'] }
};
