import type { ToolDefinition } from '$engine/types';
import { IMAGE_FILE_CONSTRAINTS, loadImage } from '$lib/utils/image-canvas';
import {
	blendCenterSeams,
	forEachTiledCell,
	repeatingUnitPixelSize,
	wrapOffsetRgba,
	type SeamlessMode,
	type TilePattern
} from '$lib/utils/image-tile';
import * as v from 'valibot';

export const TILE_PATTERNS = ['repeat', 'mirror', 'brick'] as const;
export const SEAMLESS_MODES = ['off', 'offset', 'blend'] as const;
export const WALLPAPER_WIDTH = 1920;
export const WALLPAPER_HEIGHT = 1080;

export const inputSchema = v.object({
	dataUrl: v.pipe(v.string(), v.minLength(1)),
	pattern: v.picklist(TILE_PATTERNS),
	scale: v.pipe(v.number(), v.minValue(0.25), v.maxValue(2)),
	gap: v.pipe(v.number(), v.minValue(0), v.maxValue(80)),
	seamless: v.picklist(SEAMLESS_MODES),
	feather: v.pipe(v.number(), v.minValue(2), v.maxValue(80)),
	output: v.picklist(['tile', 'wallpaper'])
});

export type ImageTilerInput = v.InferOutput<typeof inputSchema>;
export type ImageTilerOutput = { dataUrl: string };

function requireCtx(canvas: HTMLCanvasElement) {
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Canvas is not supported in this browser');
	return ctx;
}

export async function buildSourceTile(
	dataUrl: string,
	scale: number,
	seamless: SeamlessMode,
	feather: number
): Promise<HTMLCanvasElement> {
	const img = await loadImage(dataUrl);
	const w = Math.max(1, Math.round(img.naturalWidth * scale));
	const h = Math.max(1, Math.round(img.naturalHeight * scale));
	const canvas = document.createElement('canvas');
	canvas.width = w;
	canvas.height = h;
	const ctx = requireCtx(canvas);
	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = 'high';
	ctx.drawImage(img, 0, 0, w, h);

	if (seamless === 'off') return canvas;

	const imageData = ctx.getImageData(0, 0, w, h);
	wrapOffsetRgba(imageData.data, w, h, Math.floor(w / 2), Math.floor(h / 2));
	if (seamless === 'blend') {
		blendCenterSeams(imageData.data, w, h, feather);
		wrapOffsetRgba(imageData.data, w, h, Math.floor(w / 2), Math.floor(h / 2));
	}
	ctx.putImageData(imageData, 0, 0);
	return canvas;
}

function drawCell(
	ctx: CanvasRenderingContext2D,
	tile: HTMLCanvasElement,
	x: number,
	y: number,
	flipX: boolean,
	flipY: boolean
) {
	ctx.save();
	ctx.translate(x + (flipX ? tile.width : 0), y + (flipY ? tile.height : 0));
	ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
	ctx.drawImage(tile, 0, 0);
	ctx.restore();
}

export function paintTiledCanvas(
	ctx: CanvasRenderingContext2D,
	tile: HTMLCanvasElement,
	pattern: TilePattern,
	gap: number,
	outWidth: number,
	outHeight: number,
	options?: { fill?: string; showGrid?: boolean }
) {
	if (options?.fill) {
		ctx.fillStyle = options.fill;
		ctx.fillRect(0, 0, outWidth, outHeight);
	} else {
		ctx.clearRect(0, 0, outWidth, outHeight);
	}

	forEachTiledCell(tile.width, tile.height, pattern, gap, outWidth, outHeight, (cell) => {
		drawCell(ctx, tile, cell.x, cell.y, cell.flipX, cell.flipY);
	});

	if (options?.showGrid) {
		ctx.save();
		ctx.strokeStyle = 'rgba(255, 32, 96, 0.7)';
		ctx.lineWidth = 1;
		forEachTiledCell(tile.width, tile.height, pattern, gap, outWidth, outHeight, (cell) => {
			ctx.strokeRect(cell.x + 0.5, cell.y + 0.5, tile.width, tile.height);
		});
		ctx.restore();
	}
}

export async function run(input: ImageTilerInput): Promise<ImageTilerOutput> {
	if (typeof document === 'undefined') {
		throw new Error('Image tiling requires a browser environment');
	}

	const tile = await buildSourceTile(input.dataUrl, input.scale, input.seamless, input.feather);

	if (input.output === 'tile') {
		const size = repeatingUnitPixelSize(tile.width, tile.height, input.gap, input.pattern);
		const canvas = document.createElement('canvas');
		canvas.width = size.width;
		canvas.height = size.height;
		const ctx = requireCtx(canvas);
		paintTiledCanvas(ctx, tile, input.pattern, input.gap, canvas.width, canvas.height);
		return { dataUrl: canvas.toDataURL('image/png') };
	}

	const canvas = document.createElement('canvas');
	canvas.width = WALLPAPER_WIDTH;
	canvas.height = WALLPAPER_HEIGHT;
	const ctx = requireCtx(canvas);
	paintTiledCanvas(ctx, tile, input.pattern, input.gap, canvas.width, canvas.height);
	return { dataUrl: canvas.toDataURL('image/png') };
}

export const imageTiler: ToolDefinition<ImageTilerInput, ImageTilerOutput> = {
	id: 'image-tiler',
	version: '1.0.0',
	category: 'image',
	mode: 'instant',
	status: 'stable',
	tags: ['image', 'tile', 'seamless', 'texture', 'wallpaper', 'repeat', 'pattern', 'background'],
	capabilities: ['upload', 'download', 'copy', 'reset', 'favorite'],
	file: IMAGE_FILE_CONSTRAINTS,
	workflow: {
		next: ['image-resizer', 'image-compressor', 'background-remover']
	},
	metadata: {
		name: 'Image Tiler',
		title: 'Image Tiler — Live Seamless Tile & Wallpaper Preview',
		description:
			'Repeat an image as a tiling background in your browser. Live preview shows whether seams actually line up. Mirror, brick, and edge-blend modes. Download a tile or a 1920×1080 wallpaper—no upload.',
		keywords: [
			'image tiler',
			'seamless texture',
			'tile background',
			'repeat image',
			'make seamless',
			'wallpaper maker',
			'tiling preview'
		],
		related: ['image-resizer', 'background-remover', 'image-converter', 'crop-image'],
		howTo: [
			'Upload a PNG, JPEG, GIF, or WebP',
			'Watch the live tiled preview — seams show up as a grid if the image does not repeat cleanly',
			'Try Mirror or Brick, or Seamless blend to hide edges',
			'Download the repeating tile or a 1920×1080 wallpaper'
		],
		faq: [
			{
				question: 'How do I know if it tiles properly?',
				answer:
					'The large preview repeats your tile the same way a CSS background would. If you see a grid of lines, the source does not meet itself. Turn on “Show tile edges” to mark where tiles join. Mirror, Brick, or Seamless blend can hide a hard edge.'
			},
			{
				question: 'What does Seamless blend do?',
				answer:
					'It wrap-offsets the tile by 50%, soft-blends the seam in the middle, then offsets back. It is a classic non-AI trick—great for textures, not a magic clone-stamp.'
			},
			{
				question: 'What is Offset inspect?',
				answer:
					'It shifts the tile by 50% so original edges sit in the middle of the thumbnail (Photoshop Offset). The tiled preview looks the same, just shifted—use it to judge the seam on a single tile.'
			},
			{
				question: 'Are images uploaded to a server?',
				answer: 'No. Tiling uses canvas in your browser. Max file size is 2 MB.'
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
	analytics: { eventName: 'tool_run', props: ['pattern', 'seamless'] }
};
