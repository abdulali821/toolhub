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

	if (pattern === 'repeat') return [{ kind: 'icon', iconIndex: 0 }];

	if (pattern === 'alternate') {
		if (count >= 2) {
			return Array.from({ length: count }, (_, i) => ({ kind: 'icon' as const, iconIndex: i }));
		}
		return [{ kind: 'icon', iconIndex: 0 }, { kind: 'circle' }];
	}

	if (pattern === 'sequence') {
		return Array.from({ length: count }, (_, i) => ({ kind: 'icon' as const, iconIndex: i }));
	}

	if (pattern === 'icon-dot') {
		return [{ kind: 'icon', iconIndex: 0 }, { kind: 'circle' }];
	}

	return [
		{ kind: 'icon', iconIndex: 0, rotateDeg: -20 },
		{ kind: 'icon', iconIndex: 0, rotateDeg: 20 }
	];
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

export function layoutDividerSlots(
	canvasWidth: number,
	canvasHeight: number,
	cycle: DividerMotif[],
	iconSize: number,
	gap: number
): DividerSlot[] {
	if (!cycle.length) return [];

	const boxes = cycle.map((motif) => motifBox(motif, iconSize));
	const unitWidth = boxes.reduce((sum, box) => sum + box.w, 0) + gap * cycle.length;
	if (unitWidth <= 0) return [];

	const count = Math.max(1, Math.floor((canvasWidth + gap) / unitWidth));
	const totalWidth = count * unitWidth - gap;
	let x = Math.round((canvasWidth - totalWidth) / 2);
	const slots: DividerSlot[] = [];

	for (let n = 0; n < count; n++) {
		for (let i = 0; i < cycle.length; i++) {
			const box = boxes[i]!;
			slots.push({
				x,
				y: Math.round((canvasHeight - box.h) / 2),
				w: box.w,
				h: box.h,
				motif: cycle[i]!
			});
			x += box.w + gap;
		}
	}

	return slots;
}

export type DividerPaintSource = {
	width: number;
	height: number;
	draw: CanvasImageSource;
};

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
	}
) {
	const { width, height, slots, icons, background, backgroundColor, accentColor } = options;
	if (background === 'color') {
		ctx.fillStyle = backgroundColor;
		ctx.fillRect(0, 0, width, height);
	} else {
		ctx.clearRect(0, 0, width, height);
	}

	for (const slot of slots) {
		drawMotif(ctx, slot, icons, accentColor);
	}
}

function drawMotif(
	ctx: CanvasRenderingContext2D,
	slot: DividerSlot,
	icons: DividerPaintSource[],
	accentColor: string
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
	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = 'high';
	ctx.drawImage(icon.draw, -dw / 2, -dh / 2, dw, dh);
	ctx.restore();
}
