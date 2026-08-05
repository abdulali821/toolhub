import type { ToolDefinition } from '$engine/types';
import { IMAGE_FILE_CONSTRAINTS, loadImage } from '$lib/utils/image-canvas';
import * as v from 'valibot';

export const WATERMARK_POSITIONS = [
	'center',
	'bottom-right',
	'bottom-left',
	'top-right',
	'top-left'
] as const;

export type WatermarkPosition = (typeof WATERMARK_POSITIONS)[number];

export const inputSchema = v.object({
	dataUrl: v.pipe(v.string(), v.minLength(1, 'Upload an image')),
	text: v.pipe(v.string(), v.minLength(1, 'Enter watermark text')),
	fontSize: v.pipe(v.number(), v.integer(), v.minValue(8), v.maxValue(200)),
	opacity: v.pipe(v.number(), v.minValue(0), v.maxValue(1)),
	position: v.picklist(WATERMARK_POSITIONS)
});

export type ImageWatermarkInput = v.InferOutput<typeof inputSchema>;
export type ImageWatermarkOutput = { dataUrl: string };

/**
 * Pure layout helper: computes the top-left (x, y) origin for drawing watermark
 * text of the given bounding box within a canvas, for a named position.
 * Assumes ctx.textAlign = 'left' and ctx.textBaseline = 'top'.
 */
export function computeWatermarkPosition(
	canvasWidth: number,
	canvasHeight: number,
	textWidth: number,
	textHeight: number,
	position: WatermarkPosition,
	margin = 16
): { x: number; y: number } {
	switch (position) {
		case 'center':
			return { x: (canvasWidth - textWidth) / 2, y: (canvasHeight - textHeight) / 2 };
		case 'top-left':
			return { x: margin, y: margin };
		case 'top-right':
			return { x: canvasWidth - textWidth - margin, y: margin };
		case 'bottom-left':
			return { x: margin, y: canvasHeight - textHeight - margin };
		case 'bottom-right':
			return { x: canvasWidth - textWidth - margin, y: canvasHeight - textHeight - margin };
	}
}

export async function run(input: ImageWatermarkInput): Promise<ImageWatermarkOutput> {
	if (typeof document === 'undefined') {
		throw new Error('Image watermarking requires a browser environment');
	}

	const img = await loadImage(input.dataUrl);
	const canvas = document.createElement('canvas');
	canvas.width = img.naturalWidth;
	canvas.height = img.naturalHeight;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Canvas is not supported in this browser');

	ctx.drawImage(img, 0, 0);

	ctx.font = `${input.fontSize}px sans-serif`;
	ctx.textAlign = 'left';
	ctx.textBaseline = 'top';
	const metrics = ctx.measureText(input.text);
	const { x, y } = computeWatermarkPosition(
		canvas.width,
		canvas.height,
		metrics.width,
		input.fontSize,
		input.position
	);

	const opacity = Math.min(1, Math.max(0, input.opacity));
	ctx.lineWidth = Math.max(1, input.fontSize / 16);
	ctx.strokeStyle = `rgba(0, 0, 0, ${(opacity * 0.6).toFixed(3)})`;
	ctx.strokeText(input.text, x, y);
	ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
	ctx.fillText(input.text, x, y);

	return { dataUrl: canvas.toDataURL('image/png') };
}

export const imageWatermark: ToolDefinition<ImageWatermarkInput, ImageWatermarkOutput> = {
	id: 'image-watermark',
	version: '1.0.0',
	category: 'image',
	mode: 'instant',
	status: 'stable',
	tags: ['watermark', 'image', 'overlay', 'text', 'canvas'],
	capabilities: ['upload', 'download', 'copy', 'reset', 'favorite'],
	file: IMAGE_FILE_CONSTRAINTS,
	workflow: {
		next: ['crop-image', 'image-compressor', 'image-converter']
	},
	metadata: {
		name: 'Image Watermark',
		title: 'Image Watermark — Add text watermarks to images',
		description:
			'Stamp a text watermark onto PNG, JPEG, GIF, or WebP images in your browser. Choose font size, opacity, and position—no upload required.',
		keywords: [
			'image watermark',
			'add watermark to image',
			'text watermark',
			'watermark photo online',
			'stamp text on image'
		],
		related: ['crop-image', 'image-compressor', 'image-converter'],
		howTo: [
			'Upload an image',
			'Enter the watermark text and choose font size, opacity, and position',
			'Download or copy the watermarked PNG'
		],
		faq: [
			{
				question: 'Where can I place the watermark?',
				answer:
					'Choose center, or one of the four corners: top-left, top-right, bottom-left, or bottom-right.'
			},
			{
				question: 'Can I control how visible the watermark is?',
				answer:
					'Yes. The opacity slider controls the watermark\u2019s transparency, and a subtle dark outline is added automatically so it stays readable on light or dark backgrounds.'
			},
			{
				question: 'Are images uploaded to a server?',
				answer: 'No. Watermarking uses canvas locally in your browser. Max file size is 2 MB.'
			},
			{
				question: 'Why is Share disabled?',
				answer: 'Image data is too large for URL sharing. Use Download or Copy instead.'
			}
		]
	},
	validation: { input: inputSchema },
	run,
	ui: {
		component: () => import('./ui.svelte')
	},
	analytics: { eventName: 'tool_run', props: ['position'] }
};
