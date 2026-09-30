declare module '$lib/vendor/fix-webm-duration.js' {
	/** Patch MediaRecorder WebM so Duration is set (enables seek / progress bars). */
	export default function fixWebmDuration(
		blob: Blob,
		durationMs: number,
		options?: { logger?: boolean | ((...args: unknown[]) => void) }
	): Promise<Blob>;
}
