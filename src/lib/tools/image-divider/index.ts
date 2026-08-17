import type { ToolDefinition } from '$engine/types';
import { IMAGE_FILE_CONSTRAINTS, loadImage } from '$lib/utils/image-canvas';
import {
	DIVIDER_PATTERNS,
	layoutDividerSlots,
	motifCycle,
	paintDivider,
	patternNeedsImage
} from '$lib/utils/image-divider';
import * as v from 'valibot';

export {
	DIVIDER_PATTERNS,
	DIVIDER_SIZE_PRESETS,
	patternNeedsImage,
	type DividerPattern
} from '$lib/utils/image-divider';

export const inputSchema = v.object({
	dataUrls: v.optional(v.array(v.pipe(v.string(), v.minLength(1))), []),
	pattern: v.picklist(DIVIDER_PATTERNS),
	width: v.pipe(v.number(), v.integer(), v.minValue(200), v.maxValue(4000)),
	height: v.pipe(v.number(), v.integer(), v.minValue(32), v.maxValue(1200)),
	iconSize: v.pipe(v.number(), v.minValue(12), v.maxValue(200)),
	gap: v.pipe(v.number(), v.minValue(0), v.maxValue(120)),
	background: v.picklist(['transparent', 'color']),
	backgroundColor: v.pipe(v.string(), v.minLength(4), v.maxLength(9)),
	accentColor: v.pipe(v.string(), v.minLength(4), v.maxLength(9))
});

export type ImageDividerInput = v.InferOutput<typeof inputSchema>;
export type ImageDividerOutput = { dataUrl: string };

function requireCtx(canvas: HTMLCanvasElement) {
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Canvas is not supported in this browser');
	return ctx;
}

export async function run(input: ImageDividerInput): Promise<ImageDividerOutput> {
	if (typeof document === 'undefined') {
		throw new Error('Divider maker requires a browser environment');
	}

	const dataUrls = input.dataUrls ?? [];
	if (patternNeedsImage(input.pattern) && !dataUrls.length) {
		throw new Error('Upload at least one image for this pattern');
	}

	const icons = [];
	for (const url of dataUrls.slice(0, 8)) {
		const img = await loadImage(url);
		icons.push({ width: img.naturalWidth, height: img.naturalHeight, draw: img });
	}

	const cycle = motifCycle(input.pattern, icons.length);
	const slots = layoutDividerSlots(input.width, input.height, cycle, input.iconSize, input.gap);
	const canvas = document.createElement('canvas');
	canvas.width = input.width;
	canvas.height = input.height;
	paintDivider(requireCtx(canvas), {
		width: input.width,
		height: input.height,
		slots,
		icons,
		background: input.background,
		backgroundColor: input.backgroundColor,
		accentColor: input.accentColor
	});

	return { dataUrl: canvas.toDataURL('image/png') };
}

export const imageDivider: ToolDefinition<ImageDividerInput, ImageDividerOutput> = {
	id: 'image-divider',
	version: '1.0.0',
	category: 'image',
	mode: 'upload',
	status: 'stable',
	tags: ['image', 'divider', 'banner', 'repeat', 'pattern', 'carrd', 'tumblr', 'pixel'],
	capabilities: ['upload', 'download', 'copy', 'reset', 'favorite'],
	file: IMAGE_FILE_CONSTRAINTS,
	workflow: {
		next: ['image-tiler', 'background-remover', 'image-resizer']
	},
	metadata: {
		name: 'Divider Maker',
		title: 'Divider Maker — Repeating Icon Banners for Blogs & Carrd',
		description:
			'Turn small icons into a wide repeating divider. Upload sprites, pick a pattern, and download a PNG banner—default 1200×480, all in your browser.',
		keywords: [
			'divider maker',
			'blog divider',
			'carrd divider',
			'repeating icon banner',
			'pixel divider',
			'tumblr divider',
			'page divider image'
		],
		related: ['image-tiler', 'background-remover', 'image-resizer', 'crop-image'],
		howTo: [
			'Upload one or more small icons (PNG with a transparent background works best)',
			'Pick a pattern — repeat, alternate, sequence, dots, dashes, or tilted',
			'Set size (1200×480 is a common blog/Carrd size) and spacing',
			'Download the PNG'
		],
		faq: [
			{
				question: 'How is this different from Image Tiler?',
				answer:
					'Image Tiler fills a whole wallpaper. Divider Maker lays icons in one thin horizontal strip for blogs, Carrd pages, and profile headers.'
			},
			{
				question: 'Do I need more than one image?',
				answer:
					'No. One icon is enough for Repeat, Tilted, or Icon + dots. Upload several if you want them to take turns (like a carrot, then a golden carrot).'
			},
			{
				question: 'Are images uploaded to a server?',
				answer: 'No. Everything runs in your browser. Max 2 MB per file, up to 8 icons.'
			}
		]
	},
	validation: { input: inputSchema },
	run,
	ui: {
		component: () => import('./ui.svelte')
	},
	analytics: { eventName: 'tool_run', props: ['pattern'] }
};
