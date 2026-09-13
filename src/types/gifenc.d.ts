declare module 'gifenc' {
	export type Palette = number[][];

	export function quantize(
		rgba: Uint8ClampedArray | Uint8Array,
		maxColors: number,
		options?: {
			format?: 'rgb565' | 'rgba4444' | 'rgb444';
			oneBitAlpha?: boolean;
			clearAlpha?: boolean;
		}
	): Palette;

	export function applyPalette(
		rgba: Uint8ClampedArray | Uint8Array,
		palette: Palette,
		format?: 'rgb565' | 'rgba4444' | 'rgb444'
	): Uint8Array;

	export function GIFEncoder(options?: { auto?: boolean }): {
		writeFrame: (
			index: Uint8Array,
			width: number,
			height: number,
			opts?: {
				palette?: Palette;
				delay?: number;
				repeat?: number;
				transparent?: boolean;
				transparentIndex?: number;
			}
		) => void;
		finish: () => void;
		bytes: () => Uint8Array;
	};
}
