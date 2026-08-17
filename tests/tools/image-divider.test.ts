import { describe, expect, it } from 'vitest';
import {
	layoutDividerSlots,
	motifCycle,
	patternNeedsImage
} from '../../src/lib/utils/image-divider';
import { imageDivider } from '../../src/lib/tools/image-divider';

describe('image-divider helpers', () => {
	it('needs an image for icon patterns only', () => {
		expect(patternNeedsImage('repeat')).toBe(true);
		expect(patternNeedsImage('tilt')).toBe(true);
		expect(patternNeedsImage('dots')).toBe(false);
		expect(patternNeedsImage('dashes')).toBe(false);
	});

	it('repeats a single icon', () => {
		expect(motifCycle('repeat', 1)).toEqual([{ kind: 'icon', iconIndex: 0 }]);
	});

	it('alternates uploaded icons, or icon + dot when there is only one', () => {
		expect(motifCycle('alternate', 2)).toEqual([
			{ kind: 'icon', iconIndex: 0 },
			{ kind: 'icon', iconIndex: 1 }
		]);
		expect(motifCycle('alternate', 1)).toEqual([
			{ kind: 'icon', iconIndex: 0 },
			{ kind: 'circle' }
		]);
	});

	it('keeps sequence order', () => {
		expect(motifCycle('sequence', 4).map((m) => m.iconIndex)).toEqual([0, 1, 2, 3]);
	});

	it('tilts the same icon both ways', () => {
		const cycle = motifCycle('tilt', 1);
		expect(cycle).toHaveLength(2);
		expect(cycle[0]?.rotateDeg).toBe(-20);
		expect(cycle[1]?.rotateDeg).toBe(20);
	});

	it('centers a row of slots inside the canvas', () => {
		const cycle = motifCycle('dots', 0);
		const slots = layoutDividerSlots(1200, 480, cycle, 40, 20);
		expect(slots.length).toBeGreaterThan(4);
		expect(slots[0]!.x).toBeGreaterThanOrEqual(0);
		const last = slots[slots.length - 1]!;
		expect(last.x + last.w).toBeLessThanOrEqual(1200);
		expect(slots.every((s) => s.y + s.h <= 480)).toBe(true);
	});

	it('returns no slots without a cycle', () => {
		expect(layoutDividerSlots(1200, 480, [], 40, 8)).toEqual([]);
	});
});

describe('image-divider tool', () => {
	it('registers as a downloadable image tool', () => {
		expect(imageDivider.id).toBe('image-divider');
		expect(imageDivider.category).toBe('image');
		expect(imageDivider.capabilities).toContain('download');
	});
});
