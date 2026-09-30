import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import {
	extensionForMime,
	formatBytes,
	formatDuration,
	friendlyDisplayError,
	inputSchema,
	run,
	screenRecorder,
	sizeWarning
} from '../../src/lib/tools/screen-recorder';
import {
	MAX_RECORD_MS,
	pickRecorderMimeType,
	makeRecordingSeekable
} from '../../src/lib/utils/screen-recorder';

describe('screen-recorder helpers', () => {
	it('formats durations as m:ss and h:mm:ss', () => {
		expect(formatDuration(0)).toBe('0:00');
		expect(formatDuration(65_000)).toBe('1:05');
		expect(formatDuration(3_661_000)).toBe('1:01:01');
	});

	it('formats byte sizes', () => {
		expect(formatBytes(500)).toBe('500 B');
		expect(formatBytes(2048)).toBe('2.0 KB');
		expect(formatBytes(3 * 1024 * 1024)).toBe('3.0 MB');
	});

	it('picks webm vs mp4 extension from mime', () => {
		expect(extensionForMime('video/webm;codecs=vp9')).toBe('webm');
		expect(extensionForMime('video/mp4')).toBe('mp4');
	});

	it('warns on large blobs', () => {
		expect(sizeWarning(10 * 1024 * 1024)).toBeNull();
		expect(sizeWarning(90 * 1024 * 1024)).toMatch(/large/i);
		expect(sizeWarning(220 * 1024 * 1024)).toMatch(/very large/i);
	});

	it('maps display-capture errors to friendly copy', () => {
		expect(friendlyDisplayError('NotAllowedError')).toMatch(/permission|cancelled/i);
		expect(friendlyDisplayError('SecurityError')).toMatch(/https/i);
		expect(friendlyDisplayError(undefined)).toMatch(/could not start/i);
	});

	it('exposes a soft max recording length', () => {
		expect(MAX_RECORD_MS).toBe(10 * 60 * 1000);
	});

	it('pickRecorderMimeType is null-safe outside a browser MediaRecorder', () => {
		// Node test env: typically no MediaRecorder → null
		const mime = pickRecorderMimeType();
		expect(mime === null || typeof mime === 'string').toBe(true);
	});

	it('makeRecordingSeekable leaves non-webm blobs alone', async () => {
		const blob = new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'video/mp4' });
		const out = await makeRecordingSeekable(blob, 2500);
		expect(out).toBe(blob);
	});
});

describe('screen-recorder run', () => {
	it('reports empty state before a recording', () => {
		const out = run({
			recorded: false,
			durationMs: 0,
			byteSize: 0,
			mimeType: '',
			includeMic: true
		});
		expect(out.ok).toBe(false);
		expect(out.summary).toMatch(/no recording/i);
	});

	it('summarizes a finished recording', () => {
		const out = run({
			recorded: true,
			durationMs: 125_000,
			byteSize: 4_500_000,
			mimeType: 'video/webm',
			includeMic: false
		});
		expect(out.ok).toBe(true);
		expect(out.extension).toBe('webm');
		expect(out.summary).toContain('2:05');
		expect(out.summary).toMatch(/microphone: off/i);
	});

	it('rejects negative sizes via schema', () => {
		expect(() =>
			v.parse(inputSchema, {
				recorded: true,
				durationMs: 1,
				byteSize: -1,
				mimeType: 'video/webm',
				includeMic: false
			})
		).toThrow();
	});
});

describe('screen-recorder tool', () => {
	it('registers as a downloadable generator', () => {
		expect(screenRecorder.id).toBe('screen-recorder');
		expect(screenRecorder.category).toBe('generators');
		expect(screenRecorder.capabilities).toContain('download');
		expect(screenRecorder.metadata.name).toBe('Screen Recorder');
		expect(screenRecorder.metadata.faq?.length).toBeGreaterThanOrEqual(3);
	});
});
