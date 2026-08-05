import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import {
	run,
	formatKeyEvent,
	modifiersFromEvent,
	locationLabel,
	findKeyDef,
	KEYBOARD_ROWS,
	NAV_CLUSTER,
	inputSchema,
	keyboardTester,
	type KeyboardTesterInput
} from '../../src/lib/tools/keyboard-tester';

const base: KeyboardTesterInput = {
	type: 'keydown',
	key: 'a',
	code: 'KeyA',
	keyCode: 65,
	location: 0,
	ctrlKey: false,
	altKey: false,
	shiftKey: false,
	metaKey: false
};

describe('keyboard-tester', () => {
	it('formats a plain key event', () => {
		const summary = formatKeyEvent(base);
		expect(summary).toContain('keydown');
		expect(summary).toContain('key="a"');
		expect(summary).toContain('code=KeyA');
		expect(summary).toContain('keyCode=65');
		expect(summary).toContain('location=Standard');
	});

	it('renders Space instead of a literal blank key', () => {
		expect(formatKeyEvent({ ...base, key: ' ', code: 'Space', keyCode: 32 })).toContain(
			'key="Space"'
		);
	});

	it('lists active modifiers in a stable order', () => {
		expect(modifiersFromEvent(base)).toEqual([]);
		expect(
			modifiersFromEvent({ ...base, ctrlKey: true, shiftKey: true, metaKey: true })
		).toEqual(['Ctrl', 'Shift', 'Meta']);
	});

	it('includes modifiers in the formatted summary', () => {
		const summary = formatKeyEvent({ ...base, ctrlKey: true, altKey: true });
		expect(summary).toContain('Ctrl+Alt');
	});

	it('maps KeyboardEvent.location to a readable label', () => {
		expect(locationLabel(0)).toBe('Standard');
		expect(locationLabel(1)).toBe('Left');
		expect(locationLabel(2)).toBe('Right');
		expect(locationLabel(3)).toBe('Numpad');
		expect(locationLabel(99)).toBe('Standard');
	});

	it('finds key definitions by code across rows and the nav cluster', () => {
		expect(findKeyDef('KeyA')?.label).toBe('A');
		expect(findKeyDef('Space')?.label).toBe('Space');
		expect(findKeyDef('ArrowUp')?.label).toBe('↑');
		expect(findKeyDef('NoSuchCode')).toBeUndefined();
	});

	it('covers every letter key in the layout exactly once', () => {
		const codes = KEYBOARD_ROWS.flat().map((k) => k.code);
		expect(new Set(codes).size).toBe(codes.length);
		expect(codes).toContain('Space');
		expect(codes).toContain('Enter');
	});

	it('keeps the nav cluster separate from the main rows', () => {
		const mainCodes = new Set(KEYBOARD_ROWS.flat().map((k) => k.code));
		for (const key of NAV_CLUSTER) {
			expect(mainCodes.has(key.code)).toBe(false);
		}
	});

	it('run() returns a formatted summary of the given event', () => {
		const out = run(base);
		expect(out.summary).toBe(formatKeyEvent(base));
	});

	it('rejects an empty key via schema', () => {
		expect(() => v.parse(inputSchema, { ...base, key: '' })).toThrow();
	});

	it('declares capabilities', () => {
		expect(keyboardTester.capabilities).toContain('reset');
		expect(keyboardTester.capabilities).toContain('favorite');
		expect(keyboardTester.metadata.faq?.length).toBeGreaterThanOrEqual(3);
	});
});
