import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

export const DIRECTIONS = ['normal', 'reverse', 'alternate', 'alternate-reverse'] as const;
export const FILL_MODES = ['none', 'forwards', 'backwards', 'both'] as const;
export const EASING_PRESETS = [
	'ease',
	'linear',
	'ease-in',
	'ease-out',
	'ease-in-out',
	'custom'
] as const;

export type AnimDirection = (typeof DIRECTIONS)[number];
export type AnimFillMode = (typeof FILL_MODES)[number];
export type EasingPreset = (typeof EASING_PRESETS)[number];

export type KeyframeStep = {
	percent: number;
	opacity: string;
	transform: string;
	backgroundColor: string;
};

export type CssAnimationGeneratorInput = {
	name: string;
	duration: number;
	delay: number;
	iteration: string;
	direction: AnimDirection;
	fillMode: AnimFillMode;
	easing: string;
	steps: KeyframeStep[];
};

export type CssAnimationGeneratorOutput = {
	name: string;
	keyframes: string;
	rule: string;
	css: string;
	animation: string;
};

const stepSchema = v.object({
	percent: v.pipe(v.number(), v.minValue(0), v.maxValue(100)),
	opacity: v.string(),
	transform: v.string(),
	backgroundColor: v.string()
});

export const inputSchema = v.object({
	name: v.pipe(v.string(), v.minLength(1, 'Enter an animation name')),
	duration: v.pipe(v.number(), v.minValue(0), v.finite()),
	delay: v.pipe(v.number(), v.minValue(0), v.finite()),
	iteration: v.pipe(v.string(), v.minLength(1)),
	direction: v.picklist(DIRECTIONS),
	fillMode: v.picklist(FILL_MODES),
	easing: v.pipe(v.string(), v.minLength(1)),
	steps: v.pipe(v.array(stepSchema), v.minLength(1, 'Add at least one keyframe'))
});

export const DEFAULT_STEPS: KeyframeStep[] = [
	{ percent: 0, opacity: '0', transform: 'translateY(12px)', backgroundColor: '' },
	{ percent: 100, opacity: '1', transform: 'translateY(0)', backgroundColor: '' }
];

/** CSS-safe animation identifier. */
export function sanitizeAnimName(name: string): string {
	const cleaned = name
		.trim()
		.replace(/[^a-zA-Z0-9_-]+/g, '-')
		.replace(/^-+|-+$/g, '');
	if (!cleaned) return 'heytools-anim';
	return /^[0-9]/.test(cleaned) ? `a-${cleaned}` : cleaned;
}

export function encodeSteps(steps: KeyframeStep[]): string {
	return steps
		.map((s) => {
			const p = clampPercent(s.percent);
			const o = (s.opacity ?? '').replace(/\|/g, '');
			const t = (s.transform ?? '').replace(/\|/g, '');
			const b = (s.backgroundColor ?? '').replace(/\|/g, '');
			return `${p}~${o}~${b}~${t}`;
		})
		.join('|');
}

export function decodeSteps(
	raw: string | null | undefined,
	fallback = DEFAULT_STEPS
): KeyframeStep[] {
	if (!raw?.trim()) return fallback.map(cloneStep);
	try {
		const steps = raw.split('|').map((chunk) => {
			const [p, o = '', b = '', ...rest] = chunk.split('~');
			return {
				percent: clampPercent(Number(p)),
				opacity: o,
				backgroundColor: b,
				transform: rest.join('~')
			} satisfies KeyframeStep;
		});
		return steps.length ? steps : fallback.map(cloneStep);
	} catch {
		return fallback.map(cloneStep);
	}
}

function clampPercent(n: number): number {
	if (!Number.isFinite(n)) return 0;
	return Math.min(100, Math.max(0, Math.round(n * 1000) / 1000));
}

function cloneStep(step: KeyframeStep): KeyframeStep {
	return { ...step };
}

function formatSeconds(value: number): string {
	const n = Math.max(0, Number(value));
	if (!Number.isFinite(n)) return '0s';
	const rounded = Math.round(n * 1000) / 1000;
	return `${rounded}s`;
}

function formatIteration(iteration: string): string {
	const raw = iteration.trim().toLowerCase();
	if (raw === 'infinite') return 'infinite';
	const n = Number(raw);
	if (Number.isFinite(n) && n >= 0) {
		return String(Math.round(n * 1000) / 1000);
	}
	return '1';
}

function declarationsForStep(step: KeyframeStep): string[] {
	const decls: string[] = [];
	if (step.opacity.trim()) decls.push(`opacity: ${step.opacity.trim()}`);
	if (step.transform.trim()) decls.push(`transform: ${step.transform.trim()}`);
	if (step.backgroundColor.trim()) {
		decls.push(`background-color: ${step.backgroundColor.trim()}`);
	}
	return decls;
}

export function buildKeyframes(name: string, steps: KeyframeStep[]): string {
	const safe = sanitizeAnimName(name);
	const sorted = [...steps].sort((a, b) => a.percent - b.percent);
	const body = sorted
		.map((step) => {
			const decls = declarationsForStep(step);
			const inner = decls.length ? `\n    ${decls.join(';\n    ')};\n  ` : ' ';
			return `  ${clampPercent(step.percent)}% {${inner}}`;
		})
		.join('\n');
	return `@keyframes ${safe} {\n${body}\n}`;
}

export function buildAnimationShorthand(input: CssAnimationGeneratorInput): string {
	const name = sanitizeAnimName(input.name);
	const duration = formatSeconds(input.duration);
	const easing = input.easing.trim() || 'ease';
	const delay = formatSeconds(input.delay);
	const iteration = formatIteration(input.iteration);
	return `${name} ${duration} ${easing} ${delay} ${iteration} ${input.direction} ${input.fillMode}`;
}

export function run(input: CssAnimationGeneratorInput): CssAnimationGeneratorOutput {
	const parsed = v.parse(inputSchema, input);
	const name = sanitizeAnimName(parsed.name);
	const keyframes = buildKeyframes(name, parsed.steps);
	const animation = buildAnimationShorthand({ ...parsed, name });
	const rule = `.animated {\n  animation: ${animation};\n}`;
	const css = `${keyframes}\n\n${rule}`;
	return { name, keyframes, rule, css, animation };
}

export const DEFAULT_INPUT: CssAnimationGeneratorInput = {
	name: 'fade-up',
	duration: 0.8,
	delay: 0,
	iteration: '1',
	direction: 'normal',
	fillMode: 'both',
	easing: 'ease-out',
	steps: DEFAULT_STEPS.map(cloneStep)
};

export type AnimationOption = {
	id: string;
	label: string;
	duration: number;
	delay: number;
	iteration: string;
	direction: AnimDirection;
	fillMode: AnimFillMode;
	easing: string;
	steps: KeyframeStep[];
};

function anim(
	id: string,
	label: string,
	partial: Partial<Omit<AnimationOption, 'id' | 'label' | 'steps'>> & { steps: KeyframeStep[] }
): AnimationOption {
	return {
		id,
		label,
		duration: partial.duration ?? 0.8,
		delay: partial.delay ?? 0,
		iteration: partial.iteration ?? '1',
		direction: partial.direction ?? 'normal',
		fillMode: partial.fillMode ?? 'both',
		easing: partial.easing ?? 'ease-out',
		steps: partial.steps.map(cloneStep)
	};
}

/** All built-in animations shown in the Animation dropdown. */
export const ANIMATION_OPTIONS: AnimationOption[] = [
	anim('fade-in', 'Fade in', {
		duration: 0.6,
		easing: 'ease-out',
		steps: [
			{ percent: 0, opacity: '0', transform: '', backgroundColor: '' },
			{ percent: 100, opacity: '1', transform: '', backgroundColor: '' }
		]
	}),
	anim('fade-out', 'Fade out', {
		duration: 0.6,
		easing: 'ease-in',
		fillMode: 'forwards',
		steps: [
			{ percent: 0, opacity: '1', transform: '', backgroundColor: '' },
			{ percent: 100, opacity: '0', transform: '', backgroundColor: '' }
		]
	}),
	anim('fade-up', 'Fade up', {
		duration: 0.8,
		easing: 'ease-out',
		steps: DEFAULT_STEPS
	}),
	anim('fade-down', 'Fade down', {
		duration: 0.8,
		easing: 'ease-out',
		steps: [
			{ percent: 0, opacity: '0', transform: 'translateY(-12px)', backgroundColor: '' },
			{ percent: 100, opacity: '1', transform: 'translateY(0)', backgroundColor: '' }
		]
	}),
	anim('slide-in-left', 'Slide in left', {
		duration: 0.6,
		easing: 'ease-out',
		steps: [
			{ percent: 0, opacity: '0', transform: 'translateX(-24px)', backgroundColor: '' },
			{ percent: 100, opacity: '1', transform: 'translateX(0)', backgroundColor: '' }
		]
	}),
	anim('slide-in-right', 'Slide in right', {
		duration: 0.6,
		easing: 'ease-out',
		steps: [
			{ percent: 0, opacity: '0', transform: 'translateX(24px)', backgroundColor: '' },
			{ percent: 100, opacity: '1', transform: 'translateX(0)', backgroundColor: '' }
		]
	}),
	anim('slide-out-left', 'Slide out left', {
		duration: 0.5,
		easing: 'ease-in',
		fillMode: 'forwards',
		steps: [
			{ percent: 0, opacity: '1', transform: 'translateX(0)', backgroundColor: '' },
			{ percent: 100, opacity: '0', transform: 'translateX(-24px)', backgroundColor: '' }
		]
	}),
	anim('slide-out-right', 'Slide out right', {
		duration: 0.5,
		easing: 'ease-in',
		fillMode: 'forwards',
		steps: [
			{ percent: 0, opacity: '1', transform: 'translateX(0)', backgroundColor: '' },
			{ percent: 100, opacity: '0', transform: 'translateX(24px)', backgroundColor: '' }
		]
	}),
	anim('bounce', 'Bounce', {
		duration: 0.9,
		easing: 'ease-out',
		steps: [
			{ percent: 0, opacity: '1', transform: 'translateY(0)', backgroundColor: '' },
			{ percent: 40, opacity: '1', transform: 'translateY(-28px)', backgroundColor: '' },
			{ percent: 60, opacity: '1', transform: 'translateY(-12px)', backgroundColor: '' },
			{ percent: 80, opacity: '1', transform: 'translateY(-6px)', backgroundColor: '' },
			{ percent: 100, opacity: '1', transform: 'translateY(0)', backgroundColor: '' }
		]
	}),
	anim('pulse', 'Pulse', {
		duration: 1.2,
		iteration: 'infinite',
		fillMode: 'none',
		easing: 'ease-in-out',
		steps: [
			{ percent: 0, opacity: '1', transform: 'scale(1)', backgroundColor: '' },
			{ percent: 50, opacity: '0.7', transform: 'scale(1.08)', backgroundColor: '' },
			{ percent: 100, opacity: '1', transform: 'scale(1)', backgroundColor: '' }
		]
	}),
	anim('spin', 'Spin', {
		duration: 1,
		iteration: 'infinite',
		fillMode: 'none',
		easing: 'linear',
		steps: [
			{ percent: 0, opacity: '1', transform: 'rotate(0deg)', backgroundColor: '' },
			{ percent: 100, opacity: '1', transform: 'rotate(360deg)', backgroundColor: '' }
		]
	}),
	anim('shake', 'Shake', {
		duration: 0.6,
		easing: 'ease-in-out',
		steps: [
			{ percent: 0, opacity: '1', transform: 'translateX(0)', backgroundColor: '' },
			{ percent: 20, opacity: '1', transform: 'translateX(-8px)', backgroundColor: '' },
			{ percent: 40, opacity: '1', transform: 'translateX(8px)', backgroundColor: '' },
			{ percent: 60, opacity: '1', transform: 'translateX(-6px)', backgroundColor: '' },
			{ percent: 80, opacity: '1', transform: 'translateX(6px)', backgroundColor: '' },
			{ percent: 100, opacity: '1', transform: 'translateX(0)', backgroundColor: '' }
		]
	}),
	anim('zoom-in', 'Zoom in', {
		duration: 0.5,
		easing: 'ease-out',
		steps: [
			{ percent: 0, opacity: '0', transform: 'scale(0.6)', backgroundColor: '' },
			{ percent: 100, opacity: '1', transform: 'scale(1)', backgroundColor: '' }
		]
	}),
	anim('zoom-out', 'Zoom out', {
		duration: 0.5,
		easing: 'ease-in',
		fillMode: 'forwards',
		steps: [
			{ percent: 0, opacity: '1', transform: 'scale(1)', backgroundColor: '' },
			{ percent: 100, opacity: '0', transform: 'scale(0.6)', backgroundColor: '' }
		]
	}),
	anim('flip-x', 'Flip X', {
		duration: 0.7,
		easing: 'ease-in-out',
		steps: [
			{ percent: 0, opacity: '1', transform: 'rotateY(0deg)', backgroundColor: '' },
			{ percent: 100, opacity: '1', transform: 'rotateY(360deg)', backgroundColor: '' }
		]
	}),
	anim('flip-y', 'Flip Y', {
		duration: 0.7,
		easing: 'ease-in-out',
		steps: [
			{ percent: 0, opacity: '1', transform: 'rotateX(0deg)', backgroundColor: '' },
			{ percent: 100, opacity: '1', transform: 'rotateX(360deg)', backgroundColor: '' }
		]
	}),
	anim('heartbeat', 'Heartbeat', {
		duration: 1.2,
		iteration: 'infinite',
		fillMode: 'none',
		easing: 'ease-in-out',
		steps: [
			{ percent: 0, opacity: '1', transform: 'scale(1)', backgroundColor: '' },
			{ percent: 14, opacity: '1', transform: 'scale(1.15)', backgroundColor: '' },
			{ percent: 28, opacity: '1', transform: 'scale(1)', backgroundColor: '' },
			{ percent: 42, opacity: '1', transform: 'scale(1.15)', backgroundColor: '' },
			{ percent: 70, opacity: '1', transform: 'scale(1)', backgroundColor: '' },
			{ percent: 100, opacity: '1', transform: 'scale(1)', backgroundColor: '' }
		]
	}),
	anim('flash', 'Flash', {
		duration: 1,
		iteration: 'infinite',
		fillMode: 'none',
		easing: 'ease-in-out',
		steps: [
			{ percent: 0, opacity: '1', transform: '', backgroundColor: '' },
			{ percent: 50, opacity: '0', transform: '', backgroundColor: '' },
			{ percent: 100, opacity: '1', transform: '', backgroundColor: '' }
		]
	}),
	anim('wobble', 'Wobble', {
		duration: 0.9,
		easing: 'ease-in-out',
		steps: [
			{ percent: 0, opacity: '1', transform: 'rotate(0deg)', backgroundColor: '' },
			{ percent: 15, opacity: '1', transform: 'rotate(-8deg)', backgroundColor: '' },
			{ percent: 30, opacity: '1', transform: 'rotate(6deg)', backgroundColor: '' },
			{ percent: 45, opacity: '1', transform: 'rotate(-4deg)', backgroundColor: '' },
			{ percent: 60, opacity: '1', transform: 'rotate(2deg)', backgroundColor: '' },
			{ percent: 100, opacity: '1', transform: 'rotate(0deg)', backgroundColor: '' }
		]
	}),
	anim('color-pulse', 'Color pulse', {
		duration: 1.4,
		iteration: 'infinite',
		fillMode: 'none',
		easing: 'ease-in-out',
		steps: [
			{ percent: 0, opacity: '1', transform: '', backgroundColor: '#2563eb' },
			{ percent: 50, opacity: '1', transform: '', backgroundColor: '#9333ea' },
			{ percent: 100, opacity: '1', transform: '', backgroundColor: '#2563eb' }
		]
	})
];

export const ANIMATION_IDS = ANIMATION_OPTIONS.map((a) => a.id);

export function getAnimationOption(id: string): AnimationOption | undefined {
	return ANIMATION_OPTIONS.find((a) => a.id === id);
}

export function resolveAnimationId(name: string | null | undefined): string {
	if (name && getAnimationOption(name)) return name;
	return DEFAULT_INPUT.name;
}

export function inputFromAnimation(option: AnimationOption): CssAnimationGeneratorInput {
	return {
		name: option.id,
		duration: option.duration,
		delay: option.delay,
		iteration: option.iteration,
		direction: option.direction,
		fillMode: option.fillMode,
		easing: option.easing,
		steps: option.steps.map(cloneStep)
	};
}

function presetParams(option: AnimationOption): Record<string, string> {
	return {
		name: option.id,
		duration: String(option.duration),
		delay: String(option.delay),
		iteration: option.iteration,
		direction: option.direction,
		fillMode: option.fillMode,
		easing: option.easing,
		steps: encodeSteps(option.steps)
	};
}

const ACTION_BAR_PRESET_IDS = [
	'fade-up',
	'bounce',
	'pulse',
	'spin',
	'slide-in-left',
	'shake'
] as const;

export const cssAnimationGenerator: ToolDefinition<
	CssAnimationGeneratorInput,
	CssAnimationGeneratorOutput
> = {
	id: 'css-animation-generator',
	version: '1.0.0',
	category: 'color',
	mode: 'instant',
	status: 'stable',
	tags: ['css', 'animation', 'keyframes', 'generator', 'motion'],
	capabilities: ['copy', 'share', 'reset', 'favorite'],
	share: {
		params: ['name', 'duration', 'delay', 'iteration', 'direction', 'fillMode', 'easing', 'steps'],
		maxParamBytes: 3500
	},
	presets: ACTION_BAR_PRESET_IDS.map((id) => {
		const option = getAnimationOption(id)!;
		return { id: option.id, label: option.label, params: presetParams(option) };
	}),
	workflow: {
		next: ['box-shadow-generator', 'gradient-generator', 'css-minifier']
	},
	metadata: {
		name: 'CSS Animation Generator',
		title: 'CSS Animation Generator — Keyframes builder with live preview',
		description:
			'Build CSS @keyframes animations visually. Set duration, delay, easing, iteration, and keyframe steps for transform, opacity, and background-color—then copy the CSS.',
		keywords: [
			'css animation generator',
			'css keyframes generator',
			'css animation maker',
			'@keyframes generator',
			'animation css'
		],
		related: ['box-shadow-generator', 'gradient-generator', 'css-minifier', 'color-picker'],
		faq: [
			{
				question: 'What CSS do I get?',
				answer:
					'A complete @keyframes block plus an .animated rule with the animation shorthand (name, duration, easing, delay, iteration, direction, fill-mode).'
			},
			{
				question: 'Which animations are available?',
				answer:
					'Pick from the Animation dropdown: fades, slides, bounce, pulse, spin, shake, zoom, flip, heartbeat, flash, wobble, and color pulse. You can still tweak timing and keyframes after selecting.'
			},
			{
				question: 'Which properties can I animate?',
				answer:
					'Each keyframe supports transform, opacity, and background-color—enough for fades, slides, pulses, spins, and color flashes.'
			},
			{
				question: 'Can I use a custom easing curve?',
				answer:
					'Yes. Pick Custom and enter a cubic-bezier(...) value, or any valid CSS animation-timing-function.'
			},
			{
				question: 'Does this run on a server?',
				answer: 'No. The CSS is generated locally in your browser.'
			}
		],
		howTo: [
			'Choose an animation from the dropdown',
			'Tune duration, delay, iteration, direction, fill mode, and easing',
			'Edit keyframe steps if you want custom motion',
			'Preview live, then copy the CSS from the Action Bar'
		]
	},
	validation: { input: inputSchema },
	run,
	ui: {
		component: () => import('./ui.svelte')
	},
	analytics: { eventName: 'tool_run', props: ['direction', 'fillMode'] }
};
