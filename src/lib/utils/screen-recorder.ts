/** Browser screen-recording helpers (MediaRecorder + getDisplayMedia). Pure where possible. */

export const MAX_RECORD_MS = 10 * 60 * 1000;
export const WARN_RECORD_MS = 5 * 60 * 1000;

/** Preferred MIME types, best first. */
export const RECORDER_MIME_CANDIDATES = [
	'video/webm;codecs=vp9,opus',
	'video/webm;codecs=vp8,opus',
	'video/webm;codecs=vp9',
	'video/webm;codecs=vp8',
	'video/webm',
	'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
	'video/mp4'
] as const;

export function isDisplayCaptureSupported(): boolean {
	return (
		typeof navigator !== 'undefined' &&
		typeof navigator.mediaDevices?.getDisplayMedia === 'function' &&
		typeof MediaRecorder !== 'undefined'
	);
}

export function pickRecorderMimeType(): string | null {
	if (typeof MediaRecorder === 'undefined') return null;
	for (const mime of RECORDER_MIME_CANDIDATES) {
		if (MediaRecorder.isTypeSupported(mime)) return mime;
	}
	return '';
}

export function extensionForMime(mime: string): 'webm' | 'mp4' {
	return mime.toLowerCase().includes('mp4') ? 'mp4' : 'webm';
}

export function formatDuration(ms: number): string {
	const total = Math.max(0, Math.floor(ms / 1000));
	const h = Math.floor(total / 3600);
	const m = Math.floor((total % 3600) / 60);
	const s = total % 60;
	if (h > 0) {
		return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
	}
	return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatBytes(bytes: number): string {
	if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Soft warning when a finished recording is getting large for in-tab RAM. */
export function sizeWarning(bytes: number): string | null {
	if (bytes >= 200 * 1024 * 1024) {
		return 'This file is very large. Download it, then start a new recording to free memory.';
	}
	if (bytes >= 80 * 1024 * 1024) {
		return 'Large file — download soon so your browser stays responsive.';
	}
	return null;
}

export function friendlyDisplayError(name: string | undefined): string {
	switch (name) {
		case 'NotAllowedError':
		case 'PermissionDeniedError':
			return 'Permission denied or the share dialog was cancelled. Try again and choose a tab, window, or screen.';
		case 'NotFoundError':
		case 'DevicesNotFoundError':
			return 'Nothing was available to share. Try another tab or window.';
		case 'NotReadableError':
		case 'TrackStartError':
			return 'Could not start capture. Close other apps using the display, then try again.';
		case 'NotSupportedError':
			return 'Screen recording is not supported in this browser.';
		case 'SecurityError':
			return 'Screen recording requires HTTPS (or localhost).';
		case 'InvalidStateError':
			return 'Recorder was in a bad state. Stop and try again.';
		default:
			return 'Could not start screen recording. Try another browser (Chrome or Edge work best).';
	}
}

export function defaultRecordingFilename(mime: string, when = new Date()): string {
	const stamp = when.toISOString().replace(/[:.]/g, '-').slice(0, 19);
	return `screen-recording-${stamp}.${extensionForMime(mime)}`;
}

/**
 * MediaRecorder emits “live” WebM without Duration/cues, so VLC and other players
 * show a dead progress bar. Patch Duration (and remux when possible) before download.
 */
export async function makeRecordingSeekable(
	blob: Blob,
	durationMs: number,
	onProgress?: (phase: 'fixing' | 'remuxing') => void
): Promise<Blob> {
	const type = (blob.type || 'video/webm').toLowerCase();
	if (!type.includes('webm') && !type.includes('matroska')) {
		return blob;
	}

	let fixed: Blob;
	onProgress?.('fixing');
	try {
		const { default: fixWebmDuration } = await import('$lib/vendor/fix-webm-duration.js');
		fixed = await fixWebmDuration(blob, Math.max(0, durationMs), { logger: false });
	} catch {
		fixed = blob;
	}

	// Remux rebuilds cues so scrubbing works in VLC / Windows players.
	try {
		onProgress?.('remuxing');
		const { remuxWebmSeekable } = await import('$lib/utils/media-convert');
		return await remuxWebmSeekable(fixed);
	} catch {
		return fixed;
	}
}
