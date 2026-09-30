import type { ToolDefinition } from '$engine/types';
import { IMAGE_FILE_CONSTRAINTS, loadImage } from '$lib/utils/image-canvas';
import {
	DIVIDER_PATTERNS,
	MAX_DIVIDER_MOTIFS,
	MAX_DIVIDER_UPLOADS,
	effectsAreAnimated,
	encodeDividerGif,
	isStarbanner,
	layoutDividerSlots,
	layoutScrollTile,
	layoutStarbannerSlots,
	maxMotifCount,
	motifCycle,
	normalizeEffects,
	paintDivider,
	patternNeedsImage,
	type DividerEffects
} from '$lib/utils/image-divider';
import * as v from 'valibot';

export {
	DIVIDER_MOTIONS,
	DIVIDER_PATTERNS,
	DIVIDER_SIZE_PRESETS,
	MAX_DIVIDER_MOTIFS,
	MAX_DIVIDER_UPLOADS,
	effectsAreAnimated,
	effectsFromMotion,
	motionFromEffects,
	motionIsAnimated,
	normalizeEffects,
	patternNeedsImage,
	type DividerEffects,
	type DividerMotion,
	type DividerPattern
} from '$lib/utils/image-divider';

export const inputSchema = v.object({
	dataUrls: v.optional(v.array(v.pipe(v.string(), v.minLength(1))), []),
	pattern: v.picklist(DIVIDER_PATTERNS),
	rainbow: v.optional(v.boolean(), false),
	scroll: v.optional(v.boolean(), false),
	bounce: v.optional(v.boolean(), false),
	width: v.pipe(v.number(), v.integer(), v.minValue(200), v.maxValue(4000)),
	height: v.pipe(v.number(), v.integer(), v.minValue(32), v.maxValue(1200)),
	iconSize: v.pipe(v.number(), v.minValue(12), v.maxValue(200)),
	gap: v.pipe(v.number(), v.minValue(0), v.maxValue(120)),
	count: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(MAX_DIVIDER_MOTIFS))),
	background: v.picklist(['transparent', 'color']),
	backgroundColor: v.pipe(v.string(), v.minLength(4), v.maxLength(9)),
	accentColor: v.pipe(v.string(), v.minLength(4), v.maxLength(9)),
	speed: v.optional(v.pipe(v.number(), v.minValue(0.35), v.maxValue(2.5)), 1)
});

export type ImageDividerInput = v.InferOutput<typeof inputSchema>;
export type ImageDividerOutput = {
	dataUrl: string;
	mime: 'image/png' | 'image/gif';
	extension: 'png' | 'gif';
};

function requireCtx(canvas: HTMLCanvasElement) {
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Canvas is not supported in this browser');
	return ctx;
}

function effectsFromInput(input: ImageDividerInput): DividerEffects {
	return normalizeEffects({
		rainbow: input.rainbow,
		scroll: input.scroll,
		bounce: input.bounce
	});
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
	for (const url of dataUrls.slice(0, MAX_DIVIDER_UPLOADS)) {
		const img = await loadImage(url);
		icons.push({ width: img.naturalWidth, height: img.naturalHeight, draw: img });
	}

	const effects = effectsFromInput(input);

	let slots;
	let unitWidth: number;
	let cycleLength: number;

	if (isStarbanner(input.pattern)) {
		slots = layoutStarbannerSlots(
			input.width,
			input.height,
			input.iconSize,
			input.gap,
			icons.length >= 1
		);
		unitWidth = input.width;
		cycleLength = slots.length;
	} else {
		const cycle = motifCycle(input.pattern, icons.length);
		if (effects.scroll) {
			const tile = layoutScrollTile(cycle, input.height, input.iconSize, input.gap);
			slots = tile.slots;
			unitWidth = tile.period;
			cycleLength = tile.cycleLength;
		} else {
			const max = maxMotifCount(input.width, cycle, input.iconSize, input.gap);
			const count = input.count ? Math.min(input.count, Math.max(1, max)) : undefined;
			slots = layoutDividerSlots(
				input.width,
				input.height,
				cycle,
				input.iconSize,
				input.gap,
				count
			);
			cycleLength = Math.max(1, cycle.length);
			unitWidth = input.width;
		}
	}

	if (effectsAreAnimated(effects)) {
		const speed = input.speed ?? 1;
		const blob = await encodeDividerGif({
			width: input.width,
			height: input.height,
			slots,
			icons,
			background: input.background,
			backgroundColor: input.backgroundColor,
			accentColor: input.accentColor,
			effects,
			unitWidth,
			cycleLength,
			frameCount: Math.round(18 / Math.max(0.5, Math.min(1.5, speed))),
			delayMs: Math.round(90 / Math.max(0.5, Math.min(2, speed)))
		});
		const dataUrl = URL.createObjectURL(blob);
		return { dataUrl, mime: 'image/gif', extension: 'gif' };
	}

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

	return {
		dataUrl: canvas.toDataURL('image/png'),
		mime: 'image/png',
		extension: 'png'
	};
}

export const imageDivider: ToolDefinition<ImageDividerInput, ImageDividerOutput> = {
	id: 'image-divider',
	version: '1.3.0',
	category: 'image',
	mode: 'upload',
	status: 'stable',
	tags: [
		'image',
		'divider',
		'banner',
		'starbanner',
		'repeat',
		'pattern',
		'carrd',
		'tumblr',
		'pixel',
		'gif',
		'animated'
	],
	capabilities: ['upload', 'download', 'copy', 'reset', 'favorite'],
	file: IMAGE_FILE_CONSTRAINTS,
	workflow: {
		next: ['image-tiler', 'background-remover', 'image-resizer']
	},
	metadata: {
		name: 'Divider Maker',
		title: 'Divider Maker — Repeating Icon Banners (PNG or Animated GIF)',
		description:
			'Turn small icons into a wide repeating divider for blogs and Carrd. Toggle rainbow, scroll, and bounce independently—export a still PNG or an animated GIF, built locally in your browser.',
		keywords: [
			'divider maker',
			'blog divider',
			'carrd divider',
			'animated divider',
			'gif divider',
			'rainbow divider',
			'repeating icon banner',
			'starbanner',
			'f2u divider',
			'pixel divider',
			'tumblr divider'
		],
		related: ['image-tiler', 'background-remover', 'image-resizer', 'crop-image'],
		howTo: [
			'Upload one or more small icons (PNG with a transparent background works best) — up to 8 max',
			'Pick a pattern — repeat, alternate, sequence, dots, dashes, tilted, or Starbanner',
			'Set how many images appear in the row (max depends on strip size; Starbanner is always line — ornament — line)',
			'Toggle rainbow, scroll, and/or bounce on or off',
			'Download a PNG (still) or GIF (when any effect is on)'
		],
		faq: [
			{
				question: 'How is this different from Image Tiler?',
				answer:
					'Image Tiler fills a whole wallpaper. Divider Maker lays icons in one thin horizontal strip for blogs, Carrd pages, and profile headers.'
			},
			{
				question: 'Can I make animated dividers like Tumblr GIFs?',
				answer:
					'Yes. Flip on Rainbow, Scroll, and/or Bounce — mix any combo. Animated exports are GIFs. With all effects off you get a PNG.'
			},
			{
				question: 'What is Starbanner?',
				answer:
					'A classic F2U-style strip: horizontal line, center ornament, horizontal line. Upload an icon for the center, or leave it empty for a built-in outline star. Accent color tints the lines (and the star when unused).'
			},
			{
				question: 'How do I control how many icons show?',
				answer:
					'Use Images in row. The max is calculated from strip width, icon size, and minimum spacing so motifs stay edge-to-edge without empty side gutters. Starbanner always uses one center ornament.'
			},
			{
				question: 'Do I need more than one image?',
				answer:
					'No. One icon is enough for Repeat, Tilted, or Icon + dots. Dots, dashes, and Starbanner work with no upload. Upload several if you want them to take turns.'
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
	analytics: {
		eventName: 'tool_run',
		props: ['pattern', 'rainbow', 'scroll', 'bounce']
	}
};
