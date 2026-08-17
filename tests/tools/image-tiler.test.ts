import { describe, expect, it } from 'vitest';
import {
	blendCenterSeams,
	forEachTiledCell,
	patternUnitSize,
	previewGridLayout,
	repeatingUnitPixelSize,
	tileCell,
	wrapIndex,
	wrapOffsetRgba
} from '../../src/lib/utils/image-tile';
import { imageTiler, run } from '../../src/lib/tools/image-tiler';

function rgba(width: number, height: number, fill: [number, number, number, number]) {
	const data = new Uint8ClampedArray(width * height * 4);
	for (let i = 0; i < data.length; i += 4) {
		data[i] = fill[0];
		data[i + 1] = fill[1];
		data[i + 2] = fill[2];
		data[i + 3] = fill[3];
	}
	return data;
}

function setPixel(
	data: Uint8ClampedArray,
	width: number,
	x: number,
	y: number,
	color: [number, number, number, number]
) {
	const i = (y * width + x) * 4;
	data[i] = color[0];
	data[i + 1] = color[1];
	data[i + 2] = color[2];
	data[i + 3] = color[3];
}

function getPixel(data: Uint8ClampedArray, width: number, x: number, y: number) {
	const i = (y * width + x) * 4;
	return [data[i], data[i + 1], data[i + 2], data[i + 3]];
}

describe('image-tile helpers', () => {
	it('mirrors odd columns and rows', () => {
		expect(tileCell(0, 0, 'mirror')).toMatchObject({ flipX: false, flipY: false, shiftX: 0 });
		expect(tileCell(1, 0, 'mirror')).toMatchObject({ flipX: true, flipY: false });
		expect(tileCell(0, 1, 'mirror')).toMatchObject({ flipX: false, flipY: true });
		expect(tileCell(1, 1, 'mirror')).toMatchObject({ flipX: true, flipY: true });
	});

	it('shifts odd brick rows by half a tile', () => {
		expect(tileCell(0, 0, 'brick').shiftX).toBe(0);
		expect(tileCell(0, 1, 'brick').shiftX).toBe(0.5);
		expect(tileCell(2, 3, 'repeat')).toMatchObject({ flipX: false, flipY: false, shiftX: 0 });
	});

	it('uses a 2×2 unit for mirror and brick', () => {
		expect(patternUnitSize('repeat')).toEqual({ cols: 1, rows: 1 });
		expect(patternUnitSize('mirror')).toEqual({ cols: 2, rows: 2 });
		expect(patternUnitSize('brick')).toEqual({ cols: 2, rows: 2 });
		expect(repeatingUnitPixelSize(10, 8, 0, 'repeat')).toEqual({ width: 10, height: 8 });
		expect(repeatingUnitPixelSize(10, 8, 0, 'mirror')).toEqual({ width: 20, height: 16 });
		expect(repeatingUnitPixelSize(10, 8, 4, 'repeat')).toEqual({ width: 10, height: 8 });
	});

	it('wraps negative indices', () => {
		expect(wrapIndex(-1, 4)).toBe(3);
		expect(wrapIndex(5, 4)).toBe(1);
	});

	it('wrap-offsets pixels like Photoshop Offset', () => {
		const data = rgba(2, 1, [0, 0, 0, 255]);
		setPixel(data, 2, 0, 0, [255, 0, 0, 255]);
		setPixel(data, 2, 1, 0, [0, 255, 0, 255]);
		wrapOffsetRgba(data, 2, 1, 1, 0);
		expect(getPixel(data, 2, 0, 0)).toEqual([0, 255, 0, 255]);
		expect(getPixel(data, 2, 1, 0)).toEqual([255, 0, 0, 255]);
	});

	it('blends toward the wrapped opposite pixel at the center seam', () => {
		const data = rgba(4, 4, [255, 0, 0, 255]);
		setPixel(data, 4, 0, 0, [0, 0, 255, 255]);
		blendCenterSeams(data, 4, 4, 2);
		const after = getPixel(data, 4, 2, 2);
		expect(after[2]).toBeGreaterThan(0);
		expect(after[0]).toBeLessThan(255);
	});

	it('fits a full N×N grid without clipping portrait tiles', () => {
		const layout = previewGridLayout(100, 200, 0, 3, 600, 420);
		expect(layout.width).toBeLessThanOrEqual(600);
		expect(layout.height).toBeLessThanOrEqual(420);
		expect(layout.height).toBe(3 * layout.tileHeight);
		expect(layout.width).toBe(3 * layout.tileWidth);
	});

	it('places brick cells on a half-step for odd rows', () => {
		const cells: { x: number; y: number }[] = [];
		forEachTiledCell(10, 10, 'brick', 0, 20, 20, (cell) => {
			if (cell.y === 10 && cell.x === 5) cells.push({ x: cell.x, y: cell.y });
		});
		expect(cells.length).toBeGreaterThan(0);
	});
});

describe('image-tiler tool', () => {
	it('declares upload/download without share', () => {
		expect(imageTiler.capabilities).toContain('upload');
		expect(imageTiler.capabilities).toContain('download');
		expect(imageTiler.capabilities).not.toContain('share');
		expect(imageTiler.workflow?.next).toEqual([
			'image-resizer',
			'image-compressor',
			'background-remover'
		]);
	});

	it('refuses to run without a browser canvas', async () => {
		await expect(
			run({
				dataUrl: 'data:image/png;base64,abc',
				pattern: 'repeat',
				scale: 1,
				gap: 0,
				seamless: 'off',
				feather: 24,
				output: 'tile'
			})
		).rejects.toThrow(/browser/i);
	});
});
