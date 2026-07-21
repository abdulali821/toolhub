/**
 * Shared color math for converters, contrast, and blindness simulation.
 */

export function clamp(n: number, min: number, max: number) {
	return Math.min(max, Math.max(min, n));
}

export type Rgb = { r: number; g: number; b: number };

export function parseColorToRgb(value: string): Rgb {
	const raw = value.trim();
	const hex = raw.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
	if (hex) {
		let h = hex[1]!;
		if (h.length === 3)
			h = h
				.split('')
				.map((c) => c + c)
				.join('');
		return {
			r: parseInt(h.slice(0, 2), 16),
			g: parseInt(h.slice(2, 4), 16),
			b: parseInt(h.slice(4, 6), 16)
		};
	}

	const rgb = raw.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
	if (rgb) {
		return {
			r: clamp(Number(rgb[1]), 0, 255),
			g: clamp(Number(rgb[2]), 0, 255),
			b: clamp(Number(rgb[3]), 0, 255)
		};
	}

	throw new Error('Enter #hex or rgb(r, g, b)');
}

export function rgbToHex({ r, g, b }: Rgb): string {
	return `#${[r, g, b].map((n) => clamp(n, 0, 255).toString(16).padStart(2, '0')).join('')}`;
}

/** Relative luminance per WCAG 2.x */
export function relativeLuminance({ r, g, b }: Rgb): number {
	const channel = (c: number) => {
		const s = c / 255;
		return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
	};
	return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(fg: Rgb, bg: Rgb): number {
	const l1 = relativeLuminance(fg);
	const l2 = relativeLuminance(bg);
	const lighter = Math.max(l1, l2);
	const darker = Math.min(l1, l2);
	return (lighter + 0.05) / (darker + 0.05);
}

export type ContrastResult = {
	ratio: number;
	ratioLabel: string;
	aaNormal: boolean;
	aaLarge: boolean;
	aaaNormal: boolean;
	aaaLarge: boolean;
};

export function evaluateContrast(fg: Rgb, bg: Rgb): ContrastResult {
	const ratio = contrastRatio(fg, bg);
	return {
		ratio,
		ratioLabel: `${ratio.toFixed(2)}:1`,
		aaNormal: ratio >= 4.5,
		aaLarge: ratio >= 3,
		aaaNormal: ratio >= 7,
		aaaLarge: ratio >= 4.5
	};
}

export type BlindnessType = 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia' | 'none';

/** Brettel / simplified matrices for common CVD types */
const MATRICES: Record<Exclude<BlindnessType, 'none'>, number[][]> = {
	protanopia: [
		[0.56667, 0.43333, 0],
		[0.55833, 0.44167, 0],
		[0, 0.24167, 0.75833]
	],
	deuteranopia: [
		[0.625, 0.375, 0],
		[0.7, 0.3, 0],
		[0, 0.3, 0.7]
	],
	tritanopia: [
		[0.95, 0.05, 0],
		[0, 0.43333, 0.56667],
		[0, 0.475, 0.525]
	],
	achromatopsia: [
		[0.299, 0.587, 0.114],
		[0.299, 0.587, 0.114],
		[0.299, 0.587, 0.114]
	]
};

export function simulateColorBlindness(rgb: Rgb, type: BlindnessType): Rgb {
	if (type === 'none') return { ...rgb };
	const m = MATRICES[type];
	const r = clamp(Math.round(m[0]![0]! * rgb.r + m[0]![1]! * rgb.g + m[0]![2]! * rgb.b), 0, 255);
	const g = clamp(Math.round(m[1]![0]! * rgb.r + m[1]![1]! * rgb.g + m[1]![2]! * rgb.b), 0, 255);
	const b = clamp(Math.round(m[2]![0]! * rgb.r + m[2]![1]! * rgb.g + m[2]![2]! * rgb.b), 0, 255);
	return { r, g, b };
}

export function applyBlindnessToImageData(
	data: Uint8ClampedArray,
	type: BlindnessType
): Uint8ClampedArray {
	if (type === 'none') return data;
	const out = new Uint8ClampedArray(data.length);
	for (let i = 0; i < data.length; i += 4) {
		const sim = simulateColorBlindness({ r: data[i]!, g: data[i + 1]!, b: data[i + 2]! }, type);
		out[i] = sim.r;
		out[i + 1] = sim.g;
		out[i + 2] = sim.b;
		out[i + 3] = data[i + 3]!;
	}
	return out;
}
