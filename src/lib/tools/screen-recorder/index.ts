import type { ToolDefinition } from '$engine/types';
import {
	MAX_RECORD_MS,
	extensionForMime,
	formatBytes,
	formatDuration
} from '$lib/utils/screen-recorder';
import * as v from 'valibot';

export {
	MAX_RECORD_MS,
	WARN_RECORD_MS,
	RECORDER_MIME_CANDIDATES,
	defaultRecordingFilename,
	extensionForMime,
	formatBytes,
	formatDuration,
	friendlyDisplayError,
	isDisplayCaptureSupported,
	makeRecordingSeekable,
	pickRecorderMimeType,
	sizeWarning
} from '$lib/utils/screen-recorder';

export const inputSchema = v.object({
	recorded: v.boolean(),
	durationMs: v.pipe(v.number(), v.minValue(0)),
	byteSize: v.pipe(v.number(), v.minValue(0), v.integer()),
	mimeType: v.pipe(v.string(), v.minLength(0), v.maxLength(120)),
	includeMic: v.boolean()
});

export type ScreenRecorderInput = v.InferOutput<typeof inputSchema>;
export type ScreenRecorderOutput = {
	ok: boolean;
	summary: string;
	extension: 'webm' | 'mp4';
};

export function run(input: ScreenRecorderInput): ScreenRecorderOutput {
	const parsed = v.parse(inputSchema, input);
	const extension = extensionForMime(parsed.mimeType || 'video/webm');

	if (!parsed.recorded) {
		return {
			ok: false,
			summary: 'No recording yet. Click Start recording and pick a tab, window, or screen.',
			extension
		};
	}

	const lines = [
		`Duration: ${formatDuration(parsed.durationMs)}`,
		`Size: ${formatBytes(parsed.byteSize)}`,
		`Format: ${parsed.mimeType || extension}`,
		`Microphone: ${parsed.includeMic ? 'included' : 'off'}`,
		'Saved only in this browser tab until you download.'
	];

	return {
		ok: true,
		summary: lines.join('\n'),
		extension
	};
}

export const screenRecorder: ToolDefinition<ScreenRecorderInput, ScreenRecorderOutput> = {
	id: 'screen-recorder',
	version: '1.0.0',
	category: 'generators',
	mode: 'instant',
	status: 'stable',
	tags: ['screen', 'record', 'video', 'webm', 'mp4', 'capture', 'mic'],
	capabilities: ['download', 'reset', 'favorite'],
	workflow: {
		next: ['mp4-to-gif', 'gif-to-mp4', 'device-tester']
	},
	metadata: {
		name: 'Screen Recorder',
		title: 'Screen Recorder — Record Your Screen Online (No Upload)',
		description:
			'Record a tab, window, or full screen in your browser. Optional microphone. Download a WebM or MP4 — nothing is uploaded.',
		keywords: [
			'screen recorder online',
			'record screen browser',
			'record tab',
			'webm recorder',
			'screen capture online',
			'record screen no upload'
		],
		related: ['device-tester', 'mp4-to-gif', 'gif-to-mp4', 'keyboard-tester'],
		howTo: [
			'Optionally turn on Include microphone',
			'Click Start recording and choose a tab, window, or screen (enable “Share audio” in the picker if you want system/tab sound)',
			'Click Stop when finished — or stop sharing from the browser bar',
			'Download the video. Everything stays in your browser.'
		],
		faq: [
			{
				question: 'Is the recording uploaded to a server?',
				answer:
					'No. Capture and encoding run only in your browser. The file stays on your device until you download it.'
			},
			{
				question: 'What format do I get?',
				answer:
					'Usually WebM (Chrome/Edge/Firefox). Some browsers may offer MP4. You can convert with GIF to MP4 / MP4 to GIF on HeyTools if needed.'
			},
			{
				question: 'Is there a time limit?',
				answer: `Recordings stop automatically after ${Math.round(MAX_RECORD_MS / 60000)} minutes so your browser stays responsive. Download sooner for long sessions.`
			},
			{
				question: 'Why can’t I hear system audio?',
				answer:
					'In the share dialog, pick a Chrome tab (or screen, where supported) and check Share audio. Microphone is separate via the Include microphone toggle.'
			},
			{
				question: 'Why didn’t the progress bar work before?',
				answer:
					'Browsers save MediaRecorder WebM as a live stream without duration metadata. HeyTools rewrites the file after you stop so VLC and other players can seek.'
			},
			{
				question: 'Which browsers work best?',
				answer:
					'Chrome and Edge are strongest for screen + mic. Recording needs HTTPS (or localhost). Safari support varies.'
			}
		]
	},
	validation: { input: inputSchema },
	run,
	ui: {
		component: () => import('./ui.svelte')
	},
	analytics: { eventName: 'tool_run', props: ['ok'] }
};
