import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

export const KEY_EVENT_TYPES = ['keydown', 'keyup'] as const;
export type KeyEventType = (typeof KEY_EVENT_TYPES)[number];

export const inputSchema = v.object({
	type: v.picklist(KEY_EVENT_TYPES),
	key: v.pipe(v.string(), v.minLength(1, 'A key value is required')),
	code: v.pipe(v.string(), v.minLength(1, 'A code value is required')),
	keyCode: v.pipe(v.number(), v.minValue(0), v.finite()),
	location: v.pipe(v.number(), v.minValue(0), v.maxValue(3), v.integer()),
	ctrlKey: v.boolean(),
	altKey: v.boolean(),
	shiftKey: v.boolean(),
	metaKey: v.boolean()
});

export type KeyboardTesterInput = v.InferOutput<typeof inputSchema>;
export type KeyboardTesterOutput = { summary: string };

/** A single captured key event, kept for the on-screen log. */
export type KeyLogEntry = KeyboardTesterInput & { timestamp: number };

export const LOCATION_LABELS = ['Standard', 'Left', 'Right', 'Numpad'] as const;

/** Human-readable label for KeyboardEvent.location (0=Standard, 1=Left, 2=Right, 3=Numpad). */
export function locationLabel(location: number): string {
	return LOCATION_LABELS[location] ?? 'Standard';
}

/** Active modifier names, in a stable display order. */
export function modifiersFromEvent(
	input: Pick<KeyboardTesterInput, 'ctrlKey' | 'altKey' | 'shiftKey' | 'metaKey'>
): string[] {
	const mods: string[] = [];
	if (input.ctrlKey) mods.push('Ctrl');
	if (input.altKey) mods.push('Alt');
	if (input.shiftKey) mods.push('Shift');
	if (input.metaKey) mods.push('Meta');
	return mods;
}

function displayKey(key: string): string {
	if (key === ' ') return 'Space';
	return key;
}

/** One-line, shareable summary of a key event — used for the log and the Copy action. */
export function formatKeyEvent(entry: KeyboardTesterInput): string {
	const mods = modifiersFromEvent(entry);
	const modsText = mods.length ? ` · ${mods.join('+')}` : '';
	return `${entry.type} · key="${displayKey(entry.key)}" · code=${entry.code} · keyCode=${entry.keyCode} · location=${locationLabel(entry.location)}${modsText}`;
}

export function run(input: KeyboardTesterInput): KeyboardTesterOutput {
	const parsed = v.parse(inputSchema, input);
	return { summary: formatKeyEvent(parsed) };
}

export type KeyDef = {
	code: string;
	label: string;
	/** Relative width in keycap units (1 = a standard 1u key). */
	width?: number;
};

/** Physical QWERTY layout keyed by KeyboardEvent.code, grouped into visual rows. */
export const KEYBOARD_ROWS: KeyDef[][] = [
	[
		{ code: 'Escape', label: 'Esc' },
		{ code: 'F1', label: 'F1' },
		{ code: 'F2', label: 'F2' },
		{ code: 'F3', label: 'F3' },
		{ code: 'F4', label: 'F4' },
		{ code: 'F5', label: 'F5' },
		{ code: 'F6', label: 'F6' },
		{ code: 'F7', label: 'F7' },
		{ code: 'F8', label: 'F8' },
		{ code: 'F9', label: 'F9' },
		{ code: 'F10', label: 'F10' },
		{ code: 'F11', label: 'F11' },
		{ code: 'F12', label: 'F12' }
	],
	[
		{ code: 'Backquote', label: '`' },
		{ code: 'Digit1', label: '1' },
		{ code: 'Digit2', label: '2' },
		{ code: 'Digit3', label: '3' },
		{ code: 'Digit4', label: '4' },
		{ code: 'Digit5', label: '5' },
		{ code: 'Digit6', label: '6' },
		{ code: 'Digit7', label: '7' },
		{ code: 'Digit8', label: '8' },
		{ code: 'Digit9', label: '9' },
		{ code: 'Digit0', label: '0' },
		{ code: 'Minus', label: '-' },
		{ code: 'Equal', label: '=' },
		{ code: 'Backspace', label: 'Backspace', width: 2 }
	],
	[
		{ code: 'Tab', label: 'Tab', width: 1.5 },
		{ code: 'KeyQ', label: 'Q' },
		{ code: 'KeyW', label: 'W' },
		{ code: 'KeyE', label: 'E' },
		{ code: 'KeyR', label: 'R' },
		{ code: 'KeyT', label: 'T' },
		{ code: 'KeyY', label: 'Y' },
		{ code: 'KeyU', label: 'U' },
		{ code: 'KeyI', label: 'I' },
		{ code: 'KeyO', label: 'O' },
		{ code: 'KeyP', label: 'P' },
		{ code: 'BracketLeft', label: '[' },
		{ code: 'BracketRight', label: ']' },
		{ code: 'Backslash', label: '\\', width: 1.5 }
	],
	[
		{ code: 'CapsLock', label: 'Caps', width: 1.75 },
		{ code: 'KeyA', label: 'A' },
		{ code: 'KeyS', label: 'S' },
		{ code: 'KeyD', label: 'D' },
		{ code: 'KeyF', label: 'F' },
		{ code: 'KeyG', label: 'G' },
		{ code: 'KeyH', label: 'H' },
		{ code: 'KeyJ', label: 'J' },
		{ code: 'KeyK', label: 'K' },
		{ code: 'KeyL', label: 'L' },
		{ code: 'Semicolon', label: ';' },
		{ code: 'Quote', label: "'" },
		{ code: 'Enter', label: 'Enter', width: 2.25 }
	],
	[
		{ code: 'ShiftLeft', label: 'Shift', width: 2.25 },
		{ code: 'KeyZ', label: 'Z' },
		{ code: 'KeyX', label: 'X' },
		{ code: 'KeyC', label: 'C' },
		{ code: 'KeyV', label: 'V' },
		{ code: 'KeyB', label: 'B' },
		{ code: 'KeyN', label: 'N' },
		{ code: 'KeyM', label: 'M' },
		{ code: 'Comma', label: ',' },
		{ code: 'Period', label: '.' },
		{ code: 'Slash', label: '/' },
		{ code: 'ShiftRight', label: 'Shift', width: 2.75 }
	],
	[
		{ code: 'ControlLeft', label: 'Ctrl', width: 1.25 },
		{ code: 'MetaLeft', label: 'Win', width: 1.25 },
		{ code: 'AltLeft', label: 'Alt', width: 1.25 },
		{ code: 'Space', label: 'Space', width: 6.25 },
		{ code: 'AltRight', label: 'Alt', width: 1.25 },
		{ code: 'MetaRight', label: 'Win', width: 1.25 },
		{ code: 'ControlRight', label: 'Ctrl', width: 1.25 }
	]
];

/** Small navigation cluster shown alongside the main layout. */
export const NAV_CLUSTER: KeyDef[] = [
	{ code: 'ArrowUp', label: '↑' },
	{ code: 'ArrowLeft', label: '←' },
	{ code: 'ArrowDown', label: '↓' },
	{ code: 'ArrowRight', label: '→' }
];

export function findKeyDef(code: string): KeyDef | undefined {
	for (const row of KEYBOARD_ROWS) {
		const found = row.find((k) => k.code === code);
		if (found) return found;
	}
	return NAV_CLUSTER.find((k) => k.code === code);
}

export const keyboardTester: ToolDefinition<KeyboardTesterInput, KeyboardTesterOutput> = {
	id: 'keyboard-tester',
	version: '1.0.0',
	category: 'generators',
	mode: 'instant',
	status: 'stable',
	tags: ['keyboard', 'keys', 'hardware', 'test'],
	capabilities: ['copy', 'reset', 'favorite'],
	workflow: {
		next: ['device-tester']
	},
	metadata: {
		name: 'Keyboard Tester',
		title: 'Keyboard Tester — check every key online',
		description:
			'Press any key to see its name, code, and modifiers, and watch a live QWERTY layout light up. Test a new or repaired keyboard entirely in your browser.',
		keywords: [
			'keyboard tester',
			'test keyboard online',
			'keyboard checker',
			'key code tester',
			'keyboard ghosting test'
		],
		related: ['device-tester', 'ascii-converter', 'binary-converter'],
		faq: [
			{
				question: 'Does my keystroke data leave my device?',
				answer:
					'No. Key events are handled entirely in your browser and are never sent to a server or stored anywhere.'
			},
			{
				question: 'Why does the page not scroll when I press arrow keys or space?',
				answer:
					'While the capture panel is focused, this tool prevents the default browser action for keys so it can reliably detect and display them. Click outside the panel to use the page normally.'
			},
			{
				question: "What's the difference between key and code?",
				answer:
					'"key" is the character produced (affected by layout and Shift/Caps), while "code" identifies the physical key position (e.g. KeyA) regardless of layout — the visual layout below highlights by code.'
			},
			{
				question: 'Can I test if keys are stuck or not registering?',
				answer:
					'Yes. Press each key on your keyboard and confirm it lights up on the visual layout and appears in the event log with the correct name.'
			}
		],
		howTo: [
			'Click the capture panel so it has focus',
			'Press any keys on your keyboard',
			'Watch the visual layout highlight and the last-key details update',
			'Check the log for the most recent 20 events, or copy the last event'
		]
	},
	validation: { input: inputSchema },
	run,
	ui: {
		component: () => import('./ui.svelte')
	},
	analytics: { eventName: 'tool_run', props: ['type'] }
};
