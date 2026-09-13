export const DIVIDER_PATTERNS = [
	'repeat',
	'alternate',
	'sequence',
	'icon-dot',
	'dots',
	'dashes',
	'tilt'
] as const;

export type DividerPattern = (typeof DIVIDER_PATTERNS)[number];

export const DIVIDER_MOTIONS = ['none', 'rainbow', 'scroll', 'bounce', 'combo'] as const;

export type DividerMotion = (typeof DIVIDER_MOTIONS)[number];

export type DividerEffects = {
	rainbow: boolean;
	scroll: boolean;
	bounce: boolean;
};

export const DIVIDER_EFFECT_KEYS = ['rainbow', 'scroll', 'bounce'] as const;

export type DividerEffectKey = (typeof DIVIDER_EFFECT_KEYS)[number];

export function normalizeEffects(partial?: Partial<DividerEffects> | null): DividerEffects {
	return {
		rainbow: Boolean(partial?.rainbow),
		scroll: Boolean(partial?.scroll),
		bounce: Boolean(partial?.bounce)
	};
}

export function effectsAreAnimated(effects: DividerEffects): boolean {
	return effects.rainbow || effects.scroll || effects.bounce;
}

/** @deprecated Prefer effectsAreAnimated + DividerEffects switches. */
export function motionIsAnimated(motion: DividerMotion): boolean {
	return motion !== 'none';
}

export function effectsFromMotion(motion: DividerMotion): DividerEffects {
	if (motion === 'combo') return { rainbow: true, scroll: true, bounce: true };
	if (motion === 'rainbow') return { rainbow: true, scroll: false, bounce: false };
	if (motion === 'scroll') return { rainbow: false, scroll: true, bounce: false };
	if (motion === 'bounce') return { rainbow: false, scroll: false, bounce: true };
	return { rainbow: false, scroll: false, bounce: false };
}

export function motionFromEffects(effects: DividerEffects): DividerMotion {
	const { rainbow, scroll, bounce } = effects;
	const count = Number(rainbow) + Number(scroll) + Number(bounce);
	if (count === 0) return 'none';
	if (count === 3) return 'combo';
	if (count === 1) {
		if (rainbow) return 'rainbow';
		if (scroll) return 'scroll';
		return 'bounce';
	}
	return 'combo';
}

export type DividerMotifKind = 'icon' | 'circle' | 'dash';

export type DividerMotif = {
	kind: DividerMotifKind;
	iconIndex?: number;
	rotateDeg?: number;
};

export type DividerSlot = {
	x: number;
	y: number;
	w: number;
	h: number;
	motif: DividerMotif;
};

export const DIVIDER_SIZE_PRESETS = [
	{ id: 'carrd', label: '1200 × 480', width: 1200, height: 480 },
	{ id: 'thin', label: '1200 × 120', width: 1200, height: 120 },
	{ id: 'strip', label: '1500 × 64', width: 1500, height: 64 },
	{ id: 'wide', label: '1920 × 200', width: 1920, height: 200 }
] as const;

export function patternNeedsImage(pattern: DividerPattern): boolean {
	return pattern !== 'dots' && pattern !== 'dashes';
}

/** Repeating motif list for a pattern. Icons cycle by upload order. */
export function motifCycle(pattern: DividerPattern, iconCount: number): DividerMotif[] {
	const count = Math.max(0, Math.floor(iconCount));

	if (pattern === 'dots') return [{ kind: 'circle' }];
	if (pattern === 'dashes') return [{ kind: 'dash' }];

	if (count < 1) {
		if (pattern === 'icon-dot') return [{ kind: 'circle' }];
		return [];
	}

	const allIcons = () =>
		Array.from({ length: count }, (_, i) => ({ kind: 'icon' as const, iconIndex: i }));

	if (pattern === 'repeat' || pattern === 'sequence') {
		return allIcons();
	}

	if (pattern === 'alternate') {
		if (count >= 2) return allIcons();
		return [{ kind: 'icon', iconIndex: 0 }, { kind: 'circle' }];
	}

	if (pattern === 'icon-dot') {
		return allIcons().flatMap((icon) => [icon, { kind: 'circle' as const }]);
	}

	// tilt — every upload, alternating lean
	return allIcons().map((icon, i) => ({
		...icon,
		rotateDeg: i % 2 === 0 ? -20 : 20
	}));
}

export function motifBox(motif: DividerMotif, iconSize: number): { w: number; h: number } {
	const size = Math.max(8, Math.round(iconSize));
	if (motif.kind === 'circle') {
		const d = Math.max(8, Math.round(size * 0.42));
		return { w: d, h: d };
	}
	if (motif.kind === 'dash') {
		return {
			w: Math.max(3, Math.round(size * 0.1)),
			h: Math.max(12, Math.round(size * 0.55))
		};
	}
	const pad = motif.rotateDeg ? 1.18 : 1;
	const box = Math.round(size * pad);
	return { w: box, h: box };
}

/** Max unique uploads (palette of icons). */
export const MAX_DIVIDER_UPLOADS = 8;

/** Hard cap on motifs drawn in one strip. */
export const MAX_DIVIDER_MOTIFS = 48;

/** Width of one full motif cycle (icons + gaps), used for seamless scroll. */
export function cycleUnitWidth(cycle: DividerMotif[], iconSize: number, gap: number): number {
	if (!cycle.length) return 0;
	const boxes = cycle.map((motif) => motifBox(motif, iconSize));
	return boxes.reduce((sum, box) => sum + box.w, 0) + gap * cycle.length;
}

/** How many motifs fit at the given size with at least `gap` between each. */
export function maxMotifCount(
	canvasWidth: number,
	cycle: DividerMotif[],
	iconSize: number,
	gap: number
): number {
	if (!cycle.length || canvasWidth <= 0) return 0;

	let used = 0;
	let count = 0;
	while (count < MAX_DIVIDER_MOTIFS) {
		const box = motifBox(cycle[count % cycle.length]!, iconSize);
		const next = count === 0 ? box.w : used + gap + box.w;
		if (next > canvasWidth + 0.5) break;
		used = next;
		count += 1;
	}
	if (count === 0) return motifBox(cycle[0]!, iconSize).w > 0 ? 1 : 0;
	return count;
}

/** Scroll period from laid-out slots (one pattern cycle). */
export function scrollUnitFromSlots(slots: DividerSlot[], cycleLength: number): number {
	const len = Math.max(1, cycleLength);
	if (slots.length > len) return Math.max(1, slots[len]!.x - slots[0]!.x);
	if (slots.length <= 1) return Math.max(1, slots[0]?.w ?? 1);
	const last = slots[slots.length - 1]!;
	return Math.max(1, last.x + last.w - slots[0]!.x);
}

/**
 * Lay out one marquee tile from the raw motif cycle.
 * Period = sum(widths) + n×gap (trailing gap included) so tile N+1's first
 * sits exactly one gap after tile N's last — seamless first↔last sync.
 */
export function layoutScrollTile(
	cycle: DividerMotif[],
	canvasHeight: number,
	iconSize: number,
	gap: number
): { slots: DividerSlot[]; period: number; cycleLength: number } {
	if (!cycle.length) return { slots: [], period: 1, cycleLength: 0 };

	const spacing = Math.max(0, Math.round(gap));
	const slots: DividerSlot[] = [];
	let x = 0;

	for (const motif of cycle) {
		const box = motifBox(motif, iconSize);
		slots.push({
			x,
			y: Math.round((canvasHeight - box.h) / 2),
			w: box.w,
			h: box.h,
			motif
		});
		x += box.w + spacing;
	}

	// Exact integer period (includes trailing gap after the last motif).
	const period = Math.max(1, x);
	return { slots, period, cycleLength: slots.length };
}

/** @deprecated Use the raw cycle via layoutScrollTile — kept for callers/tests. */
export function loopSyncCycle(cycle: DividerMotif[]): DividerMotif[] {
	return [...cycle];
}

export function layoutDividerSlots(
	canvasWidth: number,
	canvasHeight: number,
	cycle: DividerMotif[],
	iconSize: number,
	gap: number,
	count?: number
): DividerSlot[] {
	if (!cycle.length) return [];

	const max = maxMotifCount(canvasWidth, cycle, iconSize, gap);
	if (max < 1) return [];

	const motifCount = Math.max(1, Math.min(max, Math.round(count ?? max)));
	const motifs = Array.from({ length: motifCount }, (_, i) => cycle[i % cycle.length]!);
	const boxes = motifs.map((motif) => motifBox(motif, iconSize));
	const contentWidth = boxes.reduce((sum, box) => sum + box.w, 0);

	// Edge-to-edge: stretch leftover width into gaps so sides aren't empty/transparent.
	const free = Math.max(0, canvasWidth - contentWidth);
	const spacing = motifCount > 1 ? free / (motifCount - 1) : 0;

	const slots: DividerSlot[] = [];
	let x = motifCount === 1 ? Math.round((canvasWidth - boxes[0]!.w) / 2) : 0;

	for (let i = 0; i < motifCount; i++) {
		const box = boxes[i]!;
		slots.push({
			x: Math.round(x),
			y: Math.round((canvasHeight - box.h) / 2),
			w: box.w,
			h: box.h,
			motif: motifs[i]!
		});
		x += box.w + spacing;
	}

	return slots;
}

export type DividerPaintSource = {
	width: number;
	height: number;
	draw: CanvasImageSource;
};

export type DividerAnimOptions = {
	/** Independent effect switches (preferred). */
	effects?: Partial<DividerEffects>;
	/** @deprecated Use effects switches instead. */
	motion?: DividerMotion;
	/** Loop progress in [0, 1). */
	progress: number;
	/** Width of one pattern cycle for seamless marquee. */
	unitWidth?: number;
	/** Motifs in one pattern cycle (marquee tiles this set only). */
	cycleLength?: number;
};

function resolveEffects(anim?: DividerAnimOptions): DividerEffects {
	if (anim?.effects) return normalizeEffects(anim.effects);
	if (anim?.motion) return effectsFromMotion(anim.motion);
	return normalizeEffects();
}

function hslAccent(progress: number): string {
	const hue = (progress * 360) % 360;
	return `hsl(${hue.toFixed(1)} 85% 55%)`;
}

export function paintDivider(
	ctx: CanvasRenderingContext2D,
	options: {
		width: number;
		height: number;
		slots: DividerSlot[];
		icons: DividerPaintSource[];
		background: 'transparent' | 'color';
		backgroundColor: string;
		accentColor: string;
		anim?: DividerAnimOptions;
	}
) {
	const { width, height, slots, icons, background, backgroundColor, accentColor, anim } = options;
	if (background === 'color') {
		ctx.fillStyle = backgroundColor;
		ctx.fillRect(0, 0, width, height);
	} else {
		ctx.clearRect(0, 0, width, height);
	}

	const effects = resolveEffects(anim);
	const progress = (((anim?.progress ?? 0) % 1) + 1) % 1;
	const doRainbow = effects.rainbow;
	const doScroll = effects.scroll;
	const doBounce = effects.bounce;
	const period = Math.max(1, anim?.unitWidth ?? width);
	// Pixel-stable offset; progress 0 and 1 are identical (seamless first↔last).
	const scrollDx = doScroll ? progress * period : 0;
	const offset = doScroll ? Math.floor(((scrollDx % period) + period) % period) : 0;
	const bounceAmp = doBounce ? Math.min(height * 0.18, 28) : 0;
	const rainbowAccent = doRainbow ? hslAccent(progress) : accentColor;
	const hueRotate = doRainbow ? progress * 360 : 0;

	const paintOne = (slot: DividerSlot, snakePhase: number, xShift: number) => {
		const bounce = bounceAmp === 0 ? 0 : Math.sin(progress * Math.PI * 2 + snakePhase) * bounceAmp;
		drawMotif(
			ctx,
			{
				...slot,
				x: slot.x + xShift,
				y: slot.y + bounce
			},
			icons,
			rainbowAccent,
			hueRotate
		);
	};

	if (!doScroll) {
		slots.forEach((slot, i) => paintOne(slot, i * 0.85, 0));
		return;
	}

	const cycleLen = Math.max(1, Math.min(slots.length, anim?.cycleLength ?? slots.length));
	const tile = slots.slice(0, cycleLen);
	if (!tile.length) return;

	const scrollSnakePerPx = 0.85 / Math.max(12, period / Math.max(1, tile.length));

	// Stamp the same tile across the strip. offset=0 and offset=period are identical.
	const startK = Math.floor((-period - offset) / period) - 1;
	const endK = Math.ceil((width + period - offset) / period) + 1;
	for (let k = startK; k <= endK; k++) {
		const xShift = k * period - offset;
		tile.forEach((slot) => {
			const x = slot.x + xShift;
			if (x > width + slot.w || x + slot.w < -slot.w) return;
			// Screen X → seamless with scroll wrap (same X ⇒ same bounce forever).
			paintOne(slot, x * scrollSnakePerPx, xShift);
		});
	}
}

function drawMotif(
	ctx: CanvasRenderingContext2D,
	slot: DividerSlot,
	icons: DividerPaintSource[],
	accentColor: string,
	hueRotateDeg = 0
) {
	const { motif } = slot;
	const cx = slot.x + slot.w / 2;
	const cy = slot.y + slot.h / 2;

	if (motif.kind === 'circle') {
		ctx.fillStyle = accentColor;
		ctx.beginPath();
		ctx.arc(cx, cy, slot.w / 2, 0, Math.PI * 2);
		ctx.fill();
		return;
	}

	if (motif.kind === 'dash') {
		ctx.fillStyle = accentColor;
		const radius = Math.min(slot.w / 2, 3);
		ctx.beginPath();
		if (typeof ctx.roundRect === 'function') {
			ctx.roundRect(slot.x, slot.y, slot.w, slot.h, radius);
		} else {
			ctx.rect(slot.x, slot.y, slot.w, slot.h);
		}
		ctx.fill();
		return;
	}

	const icon = icons[motif.iconIndex ?? 0] ?? icons[0];
	if (!icon) return;

	const max = Math.min(slot.w, slot.h);
	const scale = Math.min(max / icon.width, max / icon.height);
	const dw = icon.width * scale;
	const dh = icon.height * scale;

	ctx.save();
	ctx.translate(cx, cy);
	if (motif.rotateDeg) ctx.rotate((motif.rotateDeg * Math.PI) / 180);
	if (hueRotateDeg) ctx.filter = `hue-rotate(${hueRotateDeg.toFixed(1)}deg)`;
	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = 'high';
	ctx.drawImage(icon.draw, -dw / 2, -dh / 2, dw, dh);
	ctx.restore();
}

export type DividerGifOptions = {
	width: number;
	height: number;
	slots: DividerSlot[];
	icons: DividerPaintSource[];
	background: 'transparent' | 'color';
	backgroundColor: string;
	accentColor: string;
	effects: DividerEffects;
	unitWidth: number;
	cycleLength: number;
	/** Number of frames in one loop (8–36). */
	frameCount?: number;
	/** Delay per frame in ms. */
	delayMs?: number;
};

/** Render an animated divider to a GIF Blob (browser only). */
export async function encodeDividerGif(options: DividerGifOptions): Promise<Blob> {
	if (typeof document === 'undefined') {
		throw new Error('GIF export requires a browser environment');
	}

	const effects = normalizeEffects(options.effects);
	const { GIFEncoder, quantize, applyPalette } = await import('gifenc');
	const frames = Math.max(8, Math.min(36, Math.round(options.frameCount ?? 18)));
	const delay = Math.max(40, Math.min(200, Math.round(options.delayMs ?? 80)));
	const transparent = options.background === 'transparent';

	const canvas = document.createElement('canvas');
	canvas.width = options.width;
	canvas.height = options.height;
	const ctx = canvas.getContext('2d', { willReadFrequently: true });
	if (!ctx) throw new Error('Canvas is not supported in this browser');

	const gif = GIFEncoder();
	const format = transparent ? 'rgba4444' : 'rgb565';

	// Stable palette from several phases so rainbow doesn't flicker on loop.
	const sampleCount = effectsAreAnimated(effects) ? 4 : 1;
	const sampleBytes = options.width * options.height * 4;
	const sampleData = new Uint8ClampedArray(sampleBytes * sampleCount);
	for (let s = 0; s < sampleCount; s++) {
		paintDivider(ctx, {
			width: options.width,
			height: options.height,
			slots: options.slots,
			icons: options.icons,
			background: options.background,
			backgroundColor: options.backgroundColor,
			accentColor: options.accentColor,
			anim: {
				effects,
				progress: s / sampleCount,
				unitWidth: options.unitWidth,
				cycleLength: options.cycleLength
			}
		});
		sampleData.set(ctx.getImageData(0, 0, options.width, options.height).data, s * sampleBytes);
	}
	const palette = quantize(sampleData, 256, {
		format,
		oneBitAlpha: transparent,
		clearAlpha: transparent
	});
	let transparentIndex = 0;
	if (transparent) {
		const found = palette.findIndex((c: number[]) => (c[3] ?? 255) < 128);
		transparentIndex = found >= 0 ? found : 0;
	}

	for (let i = 0; i < frames; i++) {
		const progress = i / frames;
		paintDivider(ctx, {
			width: options.width,
			height: options.height,
			slots: options.slots,
			icons: options.icons,
			background: options.background,
			backgroundColor: options.backgroundColor,
			accentColor: options.accentColor,
			anim: {
				effects,
				progress,
				unitWidth: options.unitWidth,
				cycleLength: options.cycleLength
			}
		});

		const { data } = ctx.getImageData(0, 0, options.width, options.height);
		const index = applyPalette(data, palette, format);

		gif.writeFrame(index, options.width, options.height, {
			palette,
			delay,
			repeat: 0,
			transparent,
			transparentIndex
		});
	}

	gif.finish();
	return new Blob([Uint8Array.from(gif.bytes())], { type: 'image/gif' });
}
