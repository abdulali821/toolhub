/** Canvas image effects — overlays, blend modes, aesthetic filters. */

export const BLEND_MODES = [
	'overlay',
	'soft-light',
	'screen',
	'multiply',
	'color',
	'hard-light',
	'source-over',
	'lighten',
	'darken'
] as const;

export type BlendMode = (typeof BLEND_MODES)[number];

export const OVERLAY_PRESETS = [
	'none',
	'rainbow-soft',
	'rainbow-diagonal',
	'rainbow-radial',
	'checker-prism',
	'pastel-spectrum',
	'neon-stripes',
	'sunset-glow',
	'golden-hour',
	'ocean-mist',
	'arctic-ice',
	'ember-fire',
	'forest-haze',
	'vaporwave',
	'cyberpunk',
	'cotton-candy',
	'noir-fade',
	'chrome-metal',
	'matrix-rain',
	'light-leak',
	'film-burn',
	'sparkle-dust',
	'scanlines',
	'halftone-dots'
] as const;

export type OverlayPreset = (typeof OVERLAY_PRESETS)[number];

export const OVERLAY_GROUPS: { label: string; ids: OverlayPreset[] }[] = [
	{
		label: 'Rainbow',
		ids: [
			'rainbow-soft',
			'rainbow-diagonal',
			'rainbow-radial',
			'checker-prism',
			'pastel-spectrum',
			'neon-stripes'
		]
	},
	{
		label: 'Moods',
		ids: [
			'sunset-glow',
			'golden-hour',
			'ocean-mist',
			'arctic-ice',
			'ember-fire',
			'forest-haze',
			'cotton-candy',
			'noir-fade'
		]
	},
	{
		label: 'Aesthetic',
		ids: [
			'vaporwave',
			'cyberpunk',
			'chrome-metal',
			'matrix-rain',
			'light-leak',
			'film-burn',
			'sparkle-dust',
			'scanlines',
			'halftone-dots'
		]
	}
];

export const OVERLAY_PRESET_META: Record<OverlayPreset, { title: string; hint: string }> = {
	none: { title: 'None', hint: 'Skip overlay — filters only' },
	'rainbow-soft': { title: 'Rainbow soft', hint: 'Smooth horizontal spectrum' },
	'rainbow-diagonal': { title: 'Rainbow diagonal', hint: 'Corner-to-corner sweep' },
	'rainbow-radial': { title: 'Rainbow radial', hint: 'Centered circular spectrum' },
	'checker-prism': { title: 'Checker prism', hint: 'Dithered rainbow checker' },
	'pastel-spectrum': { title: 'Pastel spectrum', hint: 'Soft low-contrast rainbow' },
	'neon-stripes': { title: 'Neon stripes', hint: 'Bold vertical color bands' },
	'sunset-glow': { title: 'Sunset glow', hint: 'Warm orange → magenta wash' },
	'golden-hour': { title: 'Golden hour', hint: 'Soft amber light' },
	'ocean-mist': { title: 'Ocean mist', hint: 'Teal → deep blue' },
	'arctic-ice': { title: 'Arctic ice', hint: 'Cyan → white frost' },
	'ember-fire': { title: 'Ember fire', hint: 'Red → gold heat' },
	'forest-haze': { title: 'Forest haze', hint: 'Moss green atmosphere' },
	'cotton-candy': { title: 'Cotton candy', hint: 'Pink ↔ baby blue' },
	'noir-fade': { title: 'Noir fade', hint: 'Cool blue-black grade' },
	vaporwave: { title: 'Vaporwave', hint: 'Pink / cyan split' },
	cyberpunk: { title: 'Cyberpunk', hint: 'Magenta ↔ electric teal' },
	'chrome-metal': { title: 'Chrome metal', hint: 'Silver reflective bands' },
	'matrix-rain': { title: 'Matrix rain', hint: 'Green code glow' },
	'light-leak': { title: 'Light leak', hint: 'Analog film flare' },
	'film-burn': { title: 'Film burn', hint: 'Edge heat / fog' },
	'sparkle-dust': { title: 'Sparkle dust', hint: 'Scattered bright flecks' },
	scanlines: { title: 'Scanlines', hint: 'CRT horizontal lines' },
	'halftone-dots': { title: 'Halftone dots', hint: 'Print-style dots' }
};

export const LOOK_FILTERS = [
	'none',
	'grayscale',
	'sepia',
	'invert',
	'warm',
	'cool',
	'dreamy',
	'harsh',
	'fade'
] as const;

export type LookFilter = (typeof LOOK_FILTERS)[number];

export const LOOK_FILTER_META: Record<LookFilter, { title: string; hint: string }> = {
	none: { title: 'None', hint: 'No color grade' },
	grayscale: { title: 'Grayscale', hint: 'Black & white' },
	sepia: { title: 'Sepia', hint: 'Warm vintage brown' },
	invert: { title: 'Invert', hint: 'Negative colors' },
	warm: { title: 'Warm', hint: 'Boost oranges / reds' },
	cool: { title: 'Cool', hint: 'Boost blues' },
	dreamy: { title: 'Dreamy', hint: 'Soft blur + glow' },
	harsh: { title: 'Harsh', hint: 'High contrast punch' },
	fade: { title: 'Fade', hint: 'Lifted blacks, matte' }
};

export function clamp01(n: number): number {
	return Math.min(1, Math.max(0, n));
}

export function normalizeIntensity(n: number): number {
	return clamp01(n);
}

export function intensityFromPercent(pct: number): number {
	return clamp01(pct / 100);
}

function hsl(h: number, s: number, l: number, a = 1): string {
	const alpha = a < 1 ? ` / ${clamp01(a)}` : '';
	return `hsl(${((h % 360) + 360) % 360} ${clamp01(s) * 100}% ${clamp01(l) * 100}%${alpha})`;
}

function fillLinear(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	x0: number,
	y0: number,
	x1: number,
	y1: number,
	stops: Array<[number, string]>
) {
	const g = ctx.createLinearGradient(x0, y0, x1, y1);
	for (const [o, c] of stops) g.addColorStop(o, c);
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, width, height);
}

function fillRadial(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	stops: Array<[number, string]>
) {
	const g = ctx.createRadialGradient(
		width / 2,
		height / 2,
		0,
		width / 2,
		height / 2,
		Math.hypot(width, height) / 2
	);
	for (const [o, c] of stops) g.addColorStop(o, c);
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, width, height);
}

/**
 * Paint a procedural overlay. `vivid` (rainbowness) boosts chroma for spectrum looks.
 */
export function paintOverlayPreset(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	preset: OverlayPreset,
	vivid: number
) {
	if (preset === 'none') return;

	const sat = 0.35 + clamp01(vivid) * 0.65;
	const light = 0.52 - clamp01(vivid) * 0.08;

	if (preset === 'rainbow-soft') {
		const stops: Array<[number, string]> = [];
		for (let i = 0; i <= 12; i++) stops.push([i / 12, hsl(i * 30, sat, light)]);
		fillLinear(ctx, width, height, 0, 0, width, 0, stops);
		return;
	}

	if (preset === 'rainbow-diagonal') {
		const stops: Array<[number, string]> = [];
		for (let i = 0; i <= 12; i++) stops.push([i / 12, hsl(i * 30, sat, light)]);
		fillLinear(ctx, width, height, 0, 0, width, height, stops);
		return;
	}

	if (preset === 'rainbow-radial') {
		const stops: Array<[number, string]> = [];
		for (let i = 0; i <= 12; i++) stops.push([i / 12, hsl(i * 30, sat, light)]);
		fillRadial(ctx, width, height, stops);
		return;
	}

	if (preset === 'pastel-spectrum') {
		const stops: Array<[number, string]> = [];
		for (let i = 0; i <= 10; i++) stops.push([i / 10, hsl(i * 36, sat * 0.55, 0.72)]);
		fillLinear(ctx, width, height, 0, height, width, 0, stops);
		return;
	}

	if (preset === 'neon-stripes') {
		const bands = 8;
		const bandW = width / bands;
		for (let i = 0; i < bands; i++) {
			ctx.fillStyle = hsl(i * (360 / bands), Math.min(1, sat + 0.15), 0.5);
			ctx.fillRect(Math.floor(i * bandW), 0, Math.ceil(bandW) + 1, height);
		}
		return;
	}

	if (preset === 'sunset-glow') {
		fillLinear(ctx, width, height, 0, height, 0, 0, [
			[0, hsl(15, sat, 0.45)],
			[0.45, hsl(35, sat, 0.55)],
			[1, hsl(320, sat * 0.85, 0.4)]
		]);
		return;
	}

	if (preset === 'golden-hour') {
		fillRadial(ctx, width, height, [
			[0, hsl(42, sat * 0.9, 0.75, 0.95)],
			[0.55, hsl(28, sat * 0.7, 0.55, 0.55)],
			[1, hsl(20, sat * 0.5, 0.25, 0.35)]
		]);
		return;
	}

	if (preset === 'ocean-mist') {
		fillLinear(ctx, width, height, 0, 0, width, height, [
			[0, hsl(190, sat * 0.7, 0.7)],
			[0.5, hsl(205, sat, 0.45)],
			[1, hsl(230, sat * 0.9, 0.28)]
		]);
		return;
	}

	if (preset === 'arctic-ice') {
		fillLinear(ctx, width, height, 0, height, width, 0, [
			[0, hsl(195, sat * 0.5, 0.85)],
			[0.5, hsl(200, sat * 0.7, 0.65)],
			[1, hsl(220, sat * 0.4, 0.9)]
		]);
		return;
	}

	if (preset === 'ember-fire') {
		fillRadial(ctx, width, height, [
			[0, hsl(50, sat, 0.65)],
			[0.4, hsl(25, sat, 0.5)],
			[0.75, hsl(5, sat, 0.35)],
			[1, hsl(0, sat * 0.8, 0.12)]
		]);
		return;
	}

	if (preset === 'forest-haze') {
		fillLinear(ctx, width, height, 0, 0, 0, height, [
			[0, hsl(95, sat * 0.55, 0.55)],
			[0.5, hsl(130, sat * 0.7, 0.35)],
			[1, hsl(150, sat * 0.5, 0.18)]
		]);
		return;
	}

	if (preset === 'cotton-candy') {
		fillLinear(ctx, width, height, 0, 0, width, height, [
			[0, hsl(330, sat * 0.7, 0.78)],
			[0.5, hsl(300, sat * 0.5, 0.85)],
			[1, hsl(200, sat * 0.6, 0.78)]
		]);
		return;
	}

	if (preset === 'noir-fade') {
		fillLinear(ctx, width, height, 0, 0, 0, height, [
			[0, hsl(220, 0.15, 0.35)],
			[0.5, hsl(220, 0.2, 0.18)],
			[1, hsl(220, 0.25, 0.06)]
		]);
		return;
	}

	if (preset === 'vaporwave') {
		fillLinear(ctx, width, height, 0, 0, width, height, [
			[0, hsl(320, sat, 0.65)],
			[0.5, hsl(280, sat * 0.7, 0.45)],
			[1, hsl(185, sat, 0.55)]
		]);
		return;
	}

	if (preset === 'cyberpunk') {
		fillLinear(ctx, width, height, 0, height, width, 0, [
			[0, hsl(300, sat, 0.45)],
			[0.5, hsl(270, sat * 0.8, 0.25)],
			[1, hsl(175, sat, 0.5)]
		]);
		return;
	}

	if (preset === 'chrome-metal') {
		fillLinear(ctx, width, height, 0, 0, 0, height, [
			[0, hsl(0, 0, 0.85)],
			[0.25, hsl(0, 0, 0.45)],
			[0.5, hsl(0, 0, 0.9)],
			[0.75, hsl(0, 0, 0.35)],
			[1, hsl(0, 0, 0.7)]
		]);
		return;
	}

	if (preset === 'matrix-rain') {
		fillLinear(ctx, width, height, 0, 0, 0, height, [
			[0, hsl(120, sat, 0.15)],
			[0.5, hsl(125, sat, 0.35)],
			[1, hsl(110, sat * 0.8, 0.08)]
		]);
		ctx.fillStyle = hsl(120, sat, 0.55, 0.25);
		const col = Math.max(4, Math.round(width / 40));
		for (let x = 0; x < width; x += col) {
			const h = height * (0.2 + Math.random() * 0.8);
			ctx.fillRect(x, 0, Math.max(1, col * 0.35), h);
		}
		return;
	}

	if (preset === 'light-leak') {
		ctx.clearRect(0, 0, width, height);
		const blobs = [
			{ x: width * 0.1, y: height * 0.15, r: Math.min(width, height) * 0.45, h: 25 },
			{ x: width * 0.85, y: height * 0.7, r: Math.min(width, height) * 0.4, h: 350 },
			{ x: width * 0.5, y: height * 0.05, r: Math.min(width, height) * 0.35, h: 45 }
		];
		for (const b of blobs) {
			const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
			g.addColorStop(0, hsl(b.h, sat, 0.7, 0.85));
			g.addColorStop(0.5, hsl(b.h + 20, sat * 0.8, 0.55, 0.35));
			g.addColorStop(1, hsl(b.h, sat, 0.4, 0));
			ctx.fillStyle = g;
			ctx.fillRect(0, 0, width, height);
		}
		return;
	}

	if (preset === 'film-burn') {
		fillRadial(ctx, width, height, [
			[0, hsl(0, 0, 0, 0)],
			[0.55, hsl(30, sat * 0.6, 0.4, 0.15)],
			[0.8, hsl(15, sat, 0.35, 0.55)],
			[1, hsl(5, sat, 0.2, 0.9)]
		]);
		return;
	}

	if (preset === 'sparkle-dust') {
		ctx.fillStyle = hsl(0, 0, 0, 0);
		ctx.clearRect(0, 0, width, height);
		const count = Math.round((width * height) / 1800);
		for (let i = 0; i < count; i++) {
			const x = Math.random() * width;
			const y = Math.random() * height;
			const r = 0.5 + Math.random() * 2.2;
			ctx.fillStyle = hsl(40 + Math.random() * 40, sat * 0.4, 0.95, 0.35 + Math.random() * 0.55);
			ctx.beginPath();
			ctx.arc(x, y, r, 0, Math.PI * 2);
			ctx.fill();
		}
		return;
	}

	if (preset === 'scanlines') {
		ctx.fillStyle = hsl(0, 0, 0, 0);
		ctx.clearRect(0, 0, width, height);
		const step = Math.max(2, Math.round(height / 180));
		ctx.fillStyle = hsl(0, 0, 0, 0.45);
		for (let y = 0; y < height; y += step * 2) {
			ctx.fillRect(0, y, width, step);
		}
		fillLinear(ctx, width, height, 0, 0, 0, height, [
			[0, hsl(190, sat * 0.3, 0.5, 0.12)],
			[1, hsl(280, sat * 0.3, 0.4, 0.12)]
		]);
		return;
	}

	if (preset === 'halftone-dots') {
		ctx.fillStyle = '#000';
		ctx.fillRect(0, 0, width, height);
		const step = Math.max(4, Math.round(Math.min(width, height) / 48));
		for (let y = 0; y < height; y += step) {
			for (let x = 0; x < width; x += step) {
				const t = (x / width + y / height) * 0.5;
				const r = step * (0.15 + 0.35 * (0.5 + 0.5 * Math.sin(t * Math.PI * 4)));
				ctx.fillStyle = hsl(t * 360, sat, light);
				ctx.beginPath();
				ctx.arc(x + step / 2, y + step / 2, r, 0, Math.PI * 2);
				ctx.fill();
			}
		}
		return;
	}

	// checker-prism
	const cell = Math.max(2, Math.round(Math.min(width, height) / 64));
	for (let y = 0; y < height; y += cell) {
		for (let x = 0; x < width; x += cell) {
			const cx = Math.floor(x / cell);
			const cy = Math.floor(y / cell);
			if ((cx + cy) % 2 === 0) {
				ctx.fillStyle = '#000000';
			} else {
				const t = (x / width + y / height) * 0.5;
				ctx.fillStyle = hsl(t * 360 + (cx % 7) * 8, sat, light);
			}
			ctx.fillRect(x, y, cell, cell);
		}
	}
}

export function cssFilterForLook(look: LookFilter): string {
	switch (look) {
		case 'grayscale':
			return 'grayscale(1)';
		case 'sepia':
			return 'sepia(0.85)';
		case 'invert':
			return 'invert(1)';
		case 'warm':
			return 'sepia(0.25) saturate(1.2) hue-rotate(-10deg)';
		case 'cool':
			return 'saturate(1.1) hue-rotate(15deg) brightness(1.02)';
		case 'dreamy':
			return 'contrast(0.95) saturate(1.15) brightness(1.05) blur(0.6px)';
		case 'harsh':
			return 'contrast(1.35) saturate(1.25)';
		case 'fade':
			return 'contrast(0.85) brightness(1.08) saturate(0.9)';
		default:
			return 'none';
	}
}

export function applyVignette(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	amount: number
) {
	const a = clamp01(amount);
	if (a <= 0) return;
	const g = ctx.createRadialGradient(
		width / 2,
		height / 2,
		Math.min(width, height) * 0.25,
		width / 2,
		height / 2,
		Math.hypot(width, height) * 0.55
	);
	g.addColorStop(0, 'rgba(0,0,0,0)');
	g.addColorStop(1, `rgba(0,0,0,${(0.55 * a).toFixed(3)})`);
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, width, height);
}

export function applyGrain(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	amount: number
) {
	const a = clamp01(amount);
	if (a <= 0) return;
	const image = ctx.getImageData(0, 0, width, height);
	const data = image.data;
	const strength = a * 48;
	for (let i = 0; i < data.length; i += 4) {
		const n = (Math.random() - 0.5) * strength;
		data[i] = Math.min(255, Math.max(0, data[i]! + n));
		data[i + 1] = Math.min(255, Math.max(0, data[i + 1]! + n));
		data[i + 2] = Math.min(255, Math.max(0, data[i + 2]! + n));
	}
	ctx.putImageData(image, 0, 0);
}

/** RGB channel split — retro / glitch fringe. */
export function applyChromaticAberration(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	amount: number
) {
	const a = clamp01(amount);
	if (a <= 0) return;
	const shift = Math.max(1, Math.round(Math.min(width, height) * 0.012 * a));
	const src = ctx.getImageData(0, 0, width, height);
	const out = ctx.createImageData(width, height);
	const s = src.data;
	const d = out.data;

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const i = (y * width + x) * 4;
			const xl = Math.min(width - 1, Math.max(0, x - shift));
			const xr = Math.min(width - 1, Math.max(0, x + shift));
			const il = (y * width + xl) * 4;
			const ir = (y * width + xr) * 4;
			d[i] = s[il]!; // R from left
			d[i + 1] = s[i + 1]!; // G center
			d[i + 2] = s[ir + 2]!; // B from right
			d[i + 3] = s[i + 3]!;
		}
	}
	ctx.putImageData(out, 0, 0);
}

/** Mosaic / pixel-art look. `amount` 0–1 maps to block size. */
export function applyPixelate(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	amount: number
) {
	const a = clamp01(amount);
	if (a <= 0) return;
	const block = Math.max(2, Math.round(2 + a * Math.min(width, height) * 0.08));
	const smallW = Math.max(1, Math.floor(width / block));
	const smallH = Math.max(1, Math.floor(height / block));
	const tmp = document.createElement('canvas');
	tmp.width = smallW;
	tmp.height = smallH;
	const tctx = tmp.getContext('2d');
	if (!tctx) return;
	tctx.imageSmoothingEnabled = false;
	tctx.drawImage(ctx.canvas, 0, 0, smallW, smallH);
	ctx.imageSmoothingEnabled = false;
	ctx.clearRect(0, 0, width, height);
	ctx.drawImage(tmp, 0, 0, smallW, smallH, 0, 0, width, height);
	ctx.imageSmoothingEnabled = true;
}

/** Reduce color depth. */
export function applyPosterize(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	amount: number
) {
	const a = clamp01(amount);
	if (a <= 0) return;
	const levels = Math.max(2, Math.round(16 - a * 14));
	const step = 255 / (levels - 1);
	const image = ctx.getImageData(0, 0, width, height);
	const data = image.data;
	for (let i = 0; i < data.length; i += 4) {
		data[i] = Math.round(data[i]! / step) * step;
		data[i + 1] = Math.round(data[i + 1]! / step) * step;
		data[i + 2] = Math.round(data[i + 2]! / step) * step;
	}
	ctx.putImageData(image, 0, 0);
}

export function canvasBlendMode(mode: BlendMode): GlobalCompositeOperation {
	return mode as GlobalCompositeOperation;
}
