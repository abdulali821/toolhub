import type { ToolDefinition } from '$engine/types';
import { IMAGE_FILE_CONSTRAINTS, loadImage } from '$lib/utils/image-canvas';
import {
	BLEND_MODES,
	LOOK_FILTERS,
	OVERLAY_PRESETS,
	applyChromaticAberration,
	applyGrain,
	applyPixelate,
	applyPosterize,
	applyVignette,
	canvasBlendMode,
	clamp01,
	cssFilterForLook,
	paintOverlayPreset,
	type BlendMode,
	type LookFilter,
	type OverlayPreset
} from '$lib/utils/image-effects';
import * as v from 'valibot';

export {
	BLEND_MODES,
	LOOK_FILTERS,
	LOOK_FILTER_META,
	OVERLAY_GROUPS,
	OVERLAY_PRESETS,
	OVERLAY_PRESET_META,
	intensityFromPercent,
	normalizeIntensity,
	type BlendMode,
	type LookFilter,
	type OverlayPreset
} from '$lib/utils/image-effects';

export const INTENSITY_PRESETS = [10, 25, 50, 75] as const;

export const inputSchema = v.object({
	dataUrl: v.pipe(v.string(), v.minLength(1, 'Upload an image')),
	overlay: v.union([v.picklist(OVERLAY_PRESETS), v.literal('custom')]),
	overlayDataUrl: v.optional(v.string()),
	intensity: v.pipe(v.number(), v.minValue(0), v.maxValue(1)),
	rainbowness: v.pipe(v.number(), v.minValue(0), v.maxValue(1)),
	blendMode: v.picklist(BLEND_MODES),
	look: v.picklist(LOOK_FILTERS),
	hueRotate: v.pipe(v.number(), v.minValue(-180), v.maxValue(180)),
	vignette: v.pipe(v.number(), v.minValue(0), v.maxValue(1)),
	grain: v.pipe(v.number(), v.minValue(0), v.maxValue(1)),
	chromatic: v.pipe(v.number(), v.minValue(0), v.maxValue(1)),
	pixelate: v.pipe(v.number(), v.minValue(0), v.maxValue(1)),
	posterize: v.pipe(v.number(), v.minValue(0), v.maxValue(1))
});

export type ImageEffectsInput = v.InferOutput<typeof inputSchema>;
export type ImageEffectsOutput = { dataUrl: string };

export async function run(input: ImageEffectsInput): Promise<ImageEffectsOutput> {
	if (typeof document === 'undefined') {
		throw new Error('Image effects require a browser environment');
	}

	const parsed = v.parse(inputSchema, input);
	const img = await loadImage(parsed.dataUrl);
	const width = img.naturalWidth;
	const height = img.naturalHeight;
	if (width < 1 || height < 1) throw new Error('Image has no dimensions');

	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Canvas is not supported in this browser');

	ctx.drawImage(img, 0, 0);

	const intensity = clamp01(parsed.intensity);
	const overlayId = parsed.overlay;

	if (intensity > 0 && overlayId !== 'none') {
		const overlayCanvas = document.createElement('canvas');
		overlayCanvas.width = width;
		overlayCanvas.height = height;
		const octx = overlayCanvas.getContext('2d');
		if (!octx) throw new Error('Canvas is not supported in this browser');

		if (overlayId === 'custom') {
			const src = parsed.overlayDataUrl?.trim();
			if (!src) throw new Error('Upload a custom overlay texture');
			const overlayImg = await loadImage(src);
			octx.drawImage(overlayImg, 0, 0, width, height);
		} else {
			paintOverlayPreset(octx, width, height, overlayId as OverlayPreset, parsed.rainbowness);
		}

		ctx.save();
		ctx.globalAlpha = intensity;
		ctx.globalCompositeOperation = canvasBlendMode(parsed.blendMode as BlendMode);
		ctx.drawImage(overlayCanvas, 0, 0);
		ctx.restore();
	}

	const look = parsed.look as LookFilter;
	const lookCss = cssFilterForLook(look);
	const needsFilterPass = lookCss !== 'none' || parsed.hueRotate !== 0;
	if (needsFilterPass) {
		const filtered = document.createElement('canvas');
		filtered.width = width;
		filtered.height = height;
		const fctx = filtered.getContext('2d');
		if (!fctx) throw new Error('Canvas is not supported in this browser');
		const parts = [
			lookCss !== 'none' ? lookCss : '',
			parsed.hueRotate ? `hue-rotate(${parsed.hueRotate}deg)` : ''
		]
			.filter(Boolean)
			.join(' ');
		fctx.filter = parts || 'none';
		fctx.drawImage(canvas, 0, 0);
		ctx.clearRect(0, 0, width, height);
		ctx.drawImage(filtered, 0, 0);
	}

	applyPosterize(ctx, width, height, parsed.posterize);
	applyPixelate(ctx, width, height, parsed.pixelate);
	applyChromaticAberration(ctx, width, height, parsed.chromatic);
	applyVignette(ctx, width, height, parsed.vignette);
	applyGrain(ctx, width, height, parsed.grain);

	return { dataUrl: canvas.toDataURL('image/png') };
}

export const imageEffects: ToolDefinition<ImageEffectsInput, ImageEffectsOutput> = {
	id: 'image-effects',
	version: '1.1.0',
	category: 'image',
	mode: 'upload',
	status: 'stable',
	tags: [
		'image',
		'effects',
		'rainbow',
		'overlay',
		'blend',
		'aesthetic',
		'carrd',
		'tumblr',
		'vaporwave',
		'glitch',
		'filter'
	],
	capabilities: ['upload', 'download', 'copy', 'reset', 'favorite'],
	file: IMAGE_FILE_CONSTRAINTS,
	workflow: {
		next: ['image-watermark', 'image-compressor', 'background-remover', 'image-divider']
	},
	metadata: {
		name: 'Image Effects',
		title: 'Image Effects — Rainbow, Mood & Aesthetic Filters',
		description:
			'Overlay rainbows, sunsets, vaporwave, light leaks, and more on any image. Add looks (sepia, dreamy, harsh), chromatic fringe, pixelate, vignette, and grain—all in your browser.',
		keywords: [
			'rainbow overlay',
			'image effects',
			'aesthetic overlay',
			'vaporwave filter',
			'light leak',
			'carrd overlay',
			'glitch chromatic',
			'pixelate image'
		],
		related: ['image-watermark', 'image-divider', 'background-remover', 'image-compressor'],
		howTo: [
			'Upload a photo or graphic',
			'Pick an overlay (rainbow, mood, aesthetic) or your own texture',
			'Set intensity (10/25/50/75%) and optional rainbow-ness',
			'Stack a look filter + extras (chromatic, pixelate, grain), then download'
		],
		faq: [
			{
				question: 'What overlays are included?',
				answer:
					'Rainbows (soft, diagonal, radial, checker, pastel, neon), moods (sunset, ocean, ice, fire, forest, cotton candy, noir), and aesthetics (vaporwave, cyberpunk, chrome, matrix, light leak, film burn, sparkles, scanlines, halftone). Or upload a custom CC0 texture.'
			},
			{
				question: 'What is rainbow-ness?',
				answer:
					'Vividness for spectrum-style overlays. Lower = muted; higher = full chroma. Less relevant for chrome, scanlines, or custom textures.'
			},
			{
				question: 'Is my image uploaded?',
				answer: 'No. Effects run entirely in your browser with canvas.'
			}
		]
	},
	validation: { input: inputSchema },
	run,
	ui: {
		component: () => import('./ui.svelte')
	},
	analytics: { eventName: 'tool_run', props: ['overlay', 'blendMode', 'look'] }
};
