/** Browser capability checks for in-browser ONNX background removal. */

export function isBrowserAiRemovalSupported(): boolean {
	if (typeof window === 'undefined') return false;
	if (typeof WebAssembly === 'undefined') return false;
	try {
		const canvas = document.createElement('canvas');
		if (!canvas.getContext('2d')) return false;
	} catch {
		return false;
	}
	return true;
}
