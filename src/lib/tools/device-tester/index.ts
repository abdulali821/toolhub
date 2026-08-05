import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

export const TEST_MODES = ['mic', 'camera', 'both'] as const;
export type TestMode = (typeof TEST_MODES)[number];

export const inputSchema = v.object({
	mode: v.picklist(TEST_MODES),
	micGranted: v.boolean(),
	cameraGranted: v.boolean(),
	audioInputCount: v.pipe(v.number(), v.minValue(0), v.integer()),
	videoInputCount: v.pipe(v.number(), v.minValue(0), v.integer())
});

export type DeviceTesterInput = v.InferOutput<typeof inputSchema>;
export type DeviceTesterOutput = {
	ok: boolean;
	/** Plain-text checklist, one line per check — safe to copy. */
	checklist: string;
	devices: { audioInputs: number; videoInputs: number };
};

/** Minimal MediaDeviceInfo shape needed to build a display label. */
export type DeviceLike = { label: string; kind: string };

/**
 * Browsers only expose real device labels after permission is granted.
 * Falls back to a numbered "Microphone N" / "Camera N" placeholder otherwise.
 */
export function formatDeviceLabel(device: DeviceLike, index: number): string {
	const label = device.label?.trim();
	if (label) return label;
	const kindLabel =
		device.kind === 'audioinput'
			? 'Microphone'
			: device.kind === 'videoinput'
				? 'Camera'
				: 'Device';
	return `${kindLabel} ${index + 1}`;
}

/**
 * Normalized 0–1 audio level from a time-domain analyser buffer (Uint8Array,
 * values centered at 128). Pure and testable without real media access.
 */
export function computeAudioLevel(data: Uint8Array): number {
	if (!data.length) return 0;
	let sumSquares = 0;
	for (let i = 0; i < data.length; i++) {
		const centered = (data[i] - 128) / 128;
		sumSquares += centered * centered;
	}
	const rms = Math.sqrt(sumSquares / data.length);
	return Math.min(1, rms * 3.5);
}

function checkLine(passed: boolean, label: string): string {
	return `${passed ? '✅' : '⬜'} ${label}`;
}

export function run(input: DeviceTesterInput): DeviceTesterOutput {
	const parsed = v.parse(inputSchema, input);
	const wantMic = parsed.mode === 'mic' || parsed.mode === 'both';
	const wantCamera = parsed.mode === 'camera' || parsed.mode === 'both';

	const lines: string[] = [
		`Mode: ${parsed.mode === 'mic' ? 'Microphone only' : parsed.mode === 'camera' ? 'Camera only' : 'Microphone + camera'}`
	];

	if (wantMic) {
		lines.push(checkLine(parsed.micGranted, 'Microphone permission granted'));
		lines.push(
			checkLine(
				parsed.audioInputCount > 0,
				`${parsed.audioInputCount} microphone${parsed.audioInputCount === 1 ? '' : 's'} detected`
			)
		);
	}
	if (wantCamera) {
		lines.push(checkLine(parsed.cameraGranted, 'Camera permission granted'));
		lines.push(
			checkLine(
				parsed.videoInputCount > 0,
				`${parsed.videoInputCount} camera${parsed.videoInputCount === 1 ? '' : 's'} detected`
			)
		);
	}

	const ok =
		(!wantMic || (parsed.micGranted && parsed.audioInputCount > 0)) &&
		(!wantCamera || (parsed.cameraGranted && parsed.videoInputCount > 0));

	return {
		ok,
		checklist: lines.join('\n'),
		devices: { audioInputs: parsed.audioInputCount, videoInputs: parsed.videoInputCount }
	};
}

/** Friendly copy for common getUserMedia() failure names. */
export function friendlyMediaError(name: string | undefined, mode: TestMode = 'both'): string {
	switch (name) {
		case 'NotAllowedError':
		case 'PermissionDeniedError':
			return 'Permission denied. Allow access for this site in your browser settings, then try again.';
		case 'NotFoundError':
		case 'DevicesNotFoundError':
			if (mode === 'mic') return 'No microphone was found on this device.';
			if (mode === 'camera')
				return 'No camera was found. If you only have a mic, switch to “Microphone only”.';
			return 'No camera or microphone was found. Try “Microphone only” if you don’t have a camera.';
		case 'NotReadableError':
		case 'TrackStartError':
			if (mode === 'mic')
				return 'The microphone is busy or unavailable. Close other apps using it, or pick another mic.';
			if (mode === 'camera')
				return 'The camera is busy or unavailable (or none is installed). Try “Microphone only” if you don’t need video.';
			return 'A selected device is busy or missing. Try “Microphone only” or “Camera only”, or close other apps using the device.';
		case 'OverconstrainedError':
			return 'The selected device is not available. Try a different one from the dropdown.';
		case 'SecurityError':
			return 'Camera/microphone access requires HTTPS (or localhost).';
		default:
			return 'Could not access the selected device. Try another mode (mic only / camera only) or refresh the page.';
	}
}

export const deviceTester: ToolDefinition<DeviceTesterInput, DeviceTesterOutput> = {
	id: 'device-tester',
	version: '1.0.1',
	category: 'generators',
	mode: 'instant',
	status: 'stable',
	tags: ['microphone', 'camera', 'webcam', 'device', 'test'],
	capabilities: ['reset', 'favorite'],
	workflow: {
		next: ['keyboard-tester']
	},
	metadata: {
		name: 'Mic and Camera Tester',
		title: 'Mic and Camera Tester — check your webcam and microphone online',
		description:
			'Test your microphone and/or camera in the browser. Choose mic only, camera only, or both—live preview, mic meter, and device switching. Nothing is uploaded.',
		keywords: [
			'mic test online',
			'camera test online',
			'webcam test',
			'microphone test',
			'test my microphone and camera'
		],
		related: ['keyboard-tester', 'qr-code-generator'],
		faq: [
			{
				question: 'Does this upload my audio or video anywhere?',
				answer:
					'No. Your microphone and camera streams stay in your browser tab — nothing is uploaded, recorded, or sent to a server.'
			},
			{
				question: 'I don’t have a camera — can I still test my mic?',
				answer:
					'Yes. Set “What to test” to Microphone only. Camera-only and Both modes need a working camera; mic-only never asks for video.'
			},
			{
				question: 'Why is it asking for permission?',
				answer:
					'Browsers require explicit permission before any site can access a microphone or camera. Click Start test and allow access when prompted; you can revoke it anytime in your browser settings.'
			},
			{
				question: 'Why does it say the device is already in use?',
				answer:
					'Often another app or browser tab is holding the camera/mic, or this page requested a camera you don’t have. Switch to Microphone only, close other apps, then try again.'
			}
		],
		howTo: [
			'Choose Microphone only, Camera only, or both',
			'Click Start test and allow access when prompted',
			'Watch the preview and/or mic meter',
			'Click Stop when done — this releases the device(s)'
		]
	},
	validation: { input: inputSchema },
	run,
	ui: {
		component: () => import('./ui.svelte')
	},
	analytics: { eventName: 'tool_run', props: ['ok'] }
};
