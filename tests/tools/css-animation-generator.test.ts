import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import {
	run,
	encodeSteps,
	decodeSteps,
	sanitizeAnimName,
	buildKeyframes,
	inputSchema,
	cssAnimationGenerator,
	DEFAULT_STEPS,
	ANIMATION_OPTIONS,
	getAnimationOption,
	resolveAnimationId,
	type KeyframeStep
} from '../../src/lib/tools/css-animation-generator';

describe('css-animation-generator', () => {
	it('builds keyframes and animation shorthand CSS', () => {
		const out = run({
			name: 'fade-up',
			duration: 0.8,
			delay: 0,
			iteration: '1',
			direction: 'normal',
			fillMode: 'both',
			easing: 'ease-out',
			steps: DEFAULT_STEPS
		});
		expect(out.name).toBe('fade-up');
		expect(out.keyframes).toContain('@keyframes fade-up');
		expect(out.keyframes).toContain('0%');
		expect(out.keyframes).toContain('opacity: 0');
		expect(out.keyframes).toContain('transform: translateY(12px)');
		expect(out.animation).toBe('fade-up 0.8s ease-out 0s 1 normal both');
		expect(out.css).toContain('.animated');
		expect(out.css).toContain(out.keyframes);
	});

	it('sanitizes invalid animation names', () => {
		expect(sanitizeAnimName(' My Anim! ')).toBe('My-Anim');
		expect(sanitizeAnimName('2bounce')).toBe('a-2bounce');
		expect(sanitizeAnimName('###')).toBe('heytools-anim');
	});

	it('supports infinite iteration and custom easing', () => {
		const out = run({
			name: 'spin',
			duration: 1,
			delay: 0.25,
			iteration: 'infinite',
			direction: 'normal',
			fillMode: 'none',
			easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
			steps: [
				{ percent: 0, opacity: '1', transform: 'rotate(0deg)', backgroundColor: '' },
				{ percent: 100, opacity: '1', transform: 'rotate(360deg)', backgroundColor: '' }
			]
		});
		expect(out.animation).toContain('infinite');
		expect(out.animation).toContain('cubic-bezier(0.4, 0, 0.2, 1)');
		expect(out.animation).toContain('0.25s');
	});

	it('omits empty properties from keyframes', () => {
		const css = buildKeyframes('only-opacity', [
			{ percent: 0, opacity: '0', transform: '', backgroundColor: '' },
			{ percent: 100, opacity: '1', transform: '', backgroundColor: '' }
		]);
		expect(css).toContain('opacity: 0');
		expect(css).not.toContain('transform:');
		expect(css).not.toContain('background-color:');
	});

	it('round-trips step encoding', () => {
		const steps: KeyframeStep[] = [
			{ percent: 0, opacity: '0', transform: 'translateY(8px)', backgroundColor: '#111' },
			{ percent: 100, opacity: '1', transform: 'none', backgroundColor: '' }
		];
		const decoded = decodeSteps(encodeSteps(steps));
		expect(decoded).toEqual(steps);
	});

	it('rejects empty keyframe list via schema', () => {
		expect(() =>
			v.parse(inputSchema, {
				name: 'x',
				duration: 1,
				delay: 0,
				iteration: '1',
				direction: 'normal',
				fillMode: 'both',
				easing: 'ease',
				steps: []
			})
		).toThrow();
	});

	it('lists built-in animations for the dropdown', () => {
		expect(ANIMATION_OPTIONS.length).toBeGreaterThanOrEqual(15);
		expect(resolveAnimationId('spin')).toBe('spin');
		expect(resolveAnimationId('not-real')).toBe('fade-up');
		expect(getAnimationOption('bounce')?.label).toBe('Bounce');
	});

	it('declares share params and capabilities', () => {
		expect(cssAnimationGenerator.capabilities).toContain('share');
		expect(cssAnimationGenerator.share?.params).toContain('steps');
		expect(cssAnimationGenerator.presets?.length).toBeGreaterThan(0);
	});
});
