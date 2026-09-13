import { describe, expect, it } from 'vitest';
import {
	layoutDividerSlots,
	layoutScrollTile,
	loopSyncCycle,
	maxMotifCount,
	motifCycle,
	motionIsAnimated,
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

	it('treats only non-none motions as animated', () => {
		expect(motionIsAnimated('none')).toBe(false);
		expect(motionIsAnimated('rainbow')).toBe(true);
		expect(motionIsAnimated('scroll')).toBe(true);
		expect(motionIsAnimated('bounce')).toBe(true);
		expect(motionIsAnimated('combo')).toBe(true);
	});

	it('repeats every uploaded icon across the row', () => {
		expect(motifCycle('repeat', 1)).toEqual([{ kind: 'icon', iconIndex: 0 }]);
		expect(motifCycle('repeat', 3).map((m) => m.iconIndex)).toEqual([0, 1, 2]);
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

	it('pairs every uploaded icon with a dot', () => {
		expect(motifCycle('icon-dot', 2)).toEqual([
			{ kind: 'icon', iconIndex: 0 },
			{ kind: 'circle' },
			{ kind: 'icon', iconIndex: 1 },
			{ kind: 'circle' }
		]);
	});

	it('tilts every uploaded icon, alternating lean', () => {
		const one = motifCycle('tilt', 1);
		expect(one).toEqual([{ kind: 'icon', iconIndex: 0, rotateDeg: -20 }]);
		const many = motifCycle('tilt', 3);
		expect(many.map((m) => [m.iconIndex, m.rotateDeg])).toEqual([
			[0, -20],
			[1, 20],
			[2, -20]
		]);
	});

	it('loop-sync keeps the raw cycle (period trailing-gap is the real seam fix)', () => {
		const cycle = motifCycle('repeat', 2);
		expect(loopSyncCycle(cycle)).toEqual(cycle);
		const odd = motifCycle('icon-dot', 3);
		expect(loopSyncCycle(odd)).toEqual(odd);
	});

	it('builds a scroll tile whose period includes the trailing gap', () => {
		const cycle = motifCycle('repeat', 2);
		const { slots, period } = layoutScrollTile(cycle, 120, 40, 20);
		expect(slots).toHaveLength(2);
		const last = slots[slots.length - 1]!;
		expect(period).toBe(last.x + last.w + 20);
		// first of next tile would land at `period` — same gap as between icons
		expect(period - (last.x + last.w)).toBe(slots[1]!.x - (slots[0]!.x + slots[0]!.w));
	});

	it('packs motifs edge-to-edge without side gutters', () => {
		const cycle = motifCycle('dots', 0);
		const slots = layoutDividerSlots(1200, 120, cycle, 40, 20);
		expect(slots.length).toBeGreaterThan(4);
		expect(slots[0]!.x).toBe(0);
		const last = slots[slots.length - 1]!;
		expect(last.x + last.w).toBe(1200);
		expect(slots.every((s) => s.y >= 0 && s.y + s.h <= 120)).toBe(true);
	});

	it('respects an explicit motif count up to max', () => {
		const cycle = motifCycle('repeat', 1);
		const max = maxMotifCount(1200, cycle, 48, 24);
		expect(max).toBeGreaterThan(3);
		const slots = layoutDividerSlots(1200, 120, cycle, 48, 24, 3);
		expect(slots).toHaveLength(3);
		expect(slots[0]!.x).toBe(0);
		const last = slots[2]!;
		expect(last.x + last.w).toBe(1200);
	});

	it('returns no slots without a cycle', () => {
		expect(layoutDividerSlots(1200, 480, [], 40, 8)).toEqual([]);
	});
});

describe('image-divider tool', () => {
	it('registers as a downloadable image tool with GIF-capable metadata', () => {
		expect(imageDivider.id).toBe('image-divider');
		expect(imageDivider.category).toBe('image');
		expect(imageDivider.capabilities).toContain('download');
		expect(imageDivider.tags).toContain('gif');
		expect(imageDivider.version).toBe('1.2.0');
	});
});
