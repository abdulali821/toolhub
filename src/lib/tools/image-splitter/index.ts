import type { ToolDefinition } from '$engine/types';
import { IMAGE_FILE_CONSTRAINTS } from '$lib/utils/image-canvas';
import {
	splitImage,
	type SplitAxisInput,
	type SplitDirection,
	type SplitImageResult,
	type SplitOutputFormat
} from '$lib/utils/image-split';
import * as v from 'valibot';

export const SPLIT_DIRECTIONS = ['vertical', 'horizontal', 'grid'] as const;
export const SPLIT_MEASURES = ['count', 'size'] as const;
export type SplitMeasure = (typeof SPLIT_MEASURES)[number];
export const OUTPUT_FORMATS = ['same', 'image/png', 'image/jpeg', 'image/webp'] as const;

const axisSchema = v.object({
	measure: v.picklist(SPLIT_MEASURES),
	count: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)),
	size: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(10000)),
	overlap: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(500))
});

export const inputSchema = v.object({
	dataUrl: v.pipe(v.string(), v.minLength(1)),
	direction: v.picklist(SPLIT_DIRECTIONS),
	vertical: axisSchema,
	horizontal: axisSchema,
	outputFormat: v.picklist(OUTPUT_FORMATS),
	quality: v.pipe(v.number(), v.minValue(0.1), v.maxValue(1))
});

export type ImageSplitterInput = v.InferOutput<typeof inputSchema>;
export type ImageSplitterOutput = SplitImageResult;

export async function run(input: ImageSplitterInput): Promise<ImageSplitterOutput> {
	return splitImage(input);
}

export const imageSplitter: ToolDefinition<ImageSplitterInput, ImageSplitterOutput> = {
	id: 'image-splitter',
	version: '1.0.0',
	category: 'image',
	mode: 'instant',
	status: 'stable',
	tags: ['image', 'split', 'grid', 'crop', 'puzzle', 'pieces', 'slice', 'instagram'],
	capabilities: ['upload', 'download', 'reset', 'favorite'],
	file: IMAGE_FILE_CONSTRAINTS,
	workflow: {
		next: ['image-compressor', 'crop-image', 'image-converter']
	},
	metadata: {
		name: 'Image Splitter',
		title: 'Image Splitter — Cut Images into Grid Pieces',
		description:
			'Split an image vertically, horizontally, or into a grid in your browser. Equal rows/columns or fixed block size, optional overlap—like PineTools. Download pieces individually or as a ZIP.',
		keywords: [
			'image splitter',
			'split image',
			'cut image into pieces',
			'grid split image',
			'instagram grid',
			'split photo online',
			'divide image'
		],
		related: ['crop-image', 'image-tiler', 'image-resizer', 'image-compressor'],
		howTo: [
			'Upload a PNG, JPEG, GIF, or WebP',
			'Choose vertical, horizontal, or grid split',
			'Set row/column count or fixed block size; add overlap if pieces should share edges',
			'Download individual tiles or all pieces as a ZIP'
		],
		faq: [
			{
				question: 'How is this different from Image Tiler?',
				answer:
					'Image Splitter cuts one image into separate files (for Instagram grids, puzzles, or print layouts). Image Tiler repeats one tile as a seamless background preview.'
			},
			{
				question: 'What does overlap do?',
				answer:
					'Overlap extends each piece into neighboring slices by N pixels—useful when you need a shared border between printed sections.'
			},
			{
				question: 'Are images uploaded to a server?',
				answer: 'No. Splitting uses canvas in your browser. Max file size is 2 MB.'
			},
			{
				question: 'Why is Share disabled?',
				answer: 'Image data is too large for URL sharing. Use Download or ZIP instead.'
			}
		]
	},
	validation: { input: inputSchema },
	run,
	ui: {
		component: () => import('./ui.svelte')
	},
	analytics: { eventName: 'tool_run', props: ['direction'] }
};

export type { SplitAxisInput, SplitDirection, SplitOutputFormat };
