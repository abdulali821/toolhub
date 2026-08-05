import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import {
	run,
	formatDeviceLabel,
	computeAudioLevel,
	friendlyMediaError,
	inputSchema,
	deviceTester
} from '../../src/lib/tools/device-tester';

describe('device-tester', () => {
	it('uses the real label when available', () => {
		expect(formatDeviceLabel({ label: 'Logitech Webcam', kind: 'videoinput' }, 0)).toBe(
			'Logitech Webcam'
		);
	});

	it('falls back to a numbered placeholder when the label is blank', () => {
		expect(formatDeviceLabel({ label: '', kind: 'audioinput' }, 0)).toBe('Microphone 1');
		expect(formatDeviceLabel({ label: '  ', kind: 'videoinput' }, 2)).toBe('Camera 3');
		expect(formatDeviceLabel({ label: '', kind: 'audiooutput' }, 0)).toBe('Device 1');
	});

	it('computes zero audio level for silence (centered at 128)', () => {
		const silence = new Uint8Array(64).fill(128);
		expect(computeAudioLevel(silence)).toBe(0);
	});

	it('computes a positive audio level for a varying signal', () => {
		const data = new Uint8Array(64);
		for (let i = 0; i < data.length; i++) {
			data[i] = 128 + Math.round(80 * Math.sin(i / 3));
		}
		const level = computeAudioLevel(data);
		expect(level).toBeGreaterThan(0);
		expect(level).toBeLessThanOrEqual(1);
	});

	it('clamps audio level to a maximum of 1', () => {
		const loud = new Uint8Array(32).fill(255);
		expect(computeAudioLevel(loud)).toBe(1);
	});

	it('returns an empty level for an empty buffer', () => {
		expect(computeAudioLevel(new Uint8Array(0))).toBe(0);
	});

	it('maps common getUserMedia error names to friendly messages', () => {
		expect(friendlyMediaError('NotAllowedError', 'both')).toMatch(/permission/i);
		expect(friendlyMediaError('NotFoundError', 'camera')).toMatch(/microphone only/i);
		expect(friendlyMediaError('NotReadableError', 'mic')).toMatch(/microphone/i);
		expect(friendlyMediaError(undefined, 'both')).toMatch(/could not access/i);
	});

	it('mic-only mode can be ok without a camera', () => {
		const out = run({
			mode: 'mic',
			micGranted: true,
			cameraGranted: false,
			audioInputCount: 1,
			videoInputCount: 0
		});
		expect(out.ok).toBe(true);
		expect(out.checklist).toContain('Microphone only');
		expect(out.checklist).not.toContain('Camera permission');
	});

	it('both mode requires mic and camera', () => {
		const complete = run({
			mode: 'both',
			micGranted: true,
			cameraGranted: true,
			audioInputCount: 1,
			videoInputCount: 1
		});
		expect(complete.ok).toBe(true);

		const incomplete = run({
			mode: 'both',
			micGranted: true,
			cameraGranted: false,
			audioInputCount: 1,
			videoInputCount: 0
		});
		expect(incomplete.ok).toBe(false);
		expect(incomplete.checklist).toContain('⬜ Camera permission granted');
	});

	it('rejects negative device counts via schema', () => {
		expect(() =>
			v.parse(inputSchema, {
				mode: 'both',
				micGranted: true,
				cameraGranted: true,
				audioInputCount: -1,
				videoInputCount: 0
			})
		).toThrow();
	});

	it('declares capabilities and a Mic and Camera Tester name', () => {
		expect(deviceTester.capabilities).toEqual(['reset', 'favorite']);
		expect(deviceTester.metadata.name).toBe('Mic and Camera Tester');
		expect(deviceTester.metadata.faq?.length).toBeGreaterThanOrEqual(3);
	});
});
