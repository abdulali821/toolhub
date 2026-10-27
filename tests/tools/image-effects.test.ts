import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import {
	BLEND_MODES,
	INTENSITY_PRESETS,
	LOOK_FILTERS,
	OVERLAY_GROUPS,
	OVERLAY_PRESETS,
	imageEffects,
	inputSchema,
	intensityFromPercent,
	normalizeIntensity
} from '../../src/lib/tools/image-effects';
import { clamp01, cssFilterForLook, paintOverlayPreset } from '../../src/lib/utils/image-effects';

describe('image-effects helpers', () => {
	it('clamps and maps intensity percents', () => {
		expect(clamp01(1.5)).toBe(1);
		expect(normalizeIntensity(0.35)).toBe(0.35);
		expect(intensityFromPercent(25)).toBe(0.25);
	});

	it('exposes intensity presets including 10 / 25 / 75', () => {
		expect(INTENSITY_PRESETS).toEqual([10, 25, 50, 75]);
	});

	it('ships many overlays beyond rainbow', () => {
		expect(OVERLAY_PRESETS.length).toBeGreaterThanOrEqual(20);
		expect(OVERLAY_PRESETS).toContain('vaporwave');
		expect(OVERLAY_PRESETS).toContain('light-leak');
		expect(OVERLAY_PRESETS).toContain('cyberpunk');
		expect(OVERLAY_PRESETS).toContain('sunset-glow');
		expect(OVERLAY_GROUPS.length).toBeGreaterThanOrEqual(3);
	});

	it('exposes look filters and blend modes', () => {
		expect(LOOK_FILTERS).toContain('sepia');
		expect(LOOK_FILTERS).toContain('dreamy');
		expect(cssFilterForLook('grayscale')).toContain('grayscale');
		expect(BLEND_MODES).toContain('soft-light');
	});

	it('validates schema with new extras', () => {
		expect(() =>
			v.parse(inputSchema, {
				dataUrl: 'data:image/png;base64,xx',
				overlay: 'vaporwave',
				intensity: 0.4,
				rainbowness: 0.7,
				blendMode: 'overlay',
				look: 'warm',
				hueRotate: 10,
				vignette: 0.1,
				grain: 0.05,
				chromatic: 0.2,
				pixelate: 0,
				posterize: 0.3
			})
		).not.toThrow();
	});
});

describe('paintOverlayPreset', () => {
	it('paints multiple presets without throwing', () => {
		const fills: string[] = [];
		const stops: Array<{ o: number; c: string }> = [];
		const ctx = {
			createLinearGradient: () => ({
				addColorStop: (o: number, c: string) => stops.push({ o, c })
			}),
			createRadialGradient: () => ({
				addColorStop: (o: number, c: string) => stops.push({ o, c })
			}),
			beginPath: () => undefined,
			arc: () => undefined,
			fill: () => fills.push('arc'),
			clearRect: () => undefined,
			fillRect: () => fills.push('rect'),
			set fillStyle(_v: unknown) {
				/* ignore */
			},
			get fillStyle() {
				return '';
			}
		} as unknown as CanvasRenderingContext2D;

		paintOverlayPreset(ctx, 64, 64, 'none', 0.5);
		expect(fills.length).toBe(0);

		paintOverlayPreset(ctx, 64, 64, 'sunset-glow', 0.8);
		expect(stops.length).toBeGreaterThan(1);

		fills.length = 0;
		paintOverlayPreset(ctx, 256, 256, 'sparkle-dust', 0.6);
		expect(fills.length).toBeGreaterThan(10);
	});
});

describe('image-effects tool', () => {
	it('registers as a downloadable image tool', () => {
		expect(imageEffects.id).toBe('image-effects');
		expect(imageEffects.version).toBe('1.1.0');
		expect(imageEffects.tags).toContain('vaporwave');
		expect(imageEffects.metadata.name).toBe('Image Effects');
	});
});
