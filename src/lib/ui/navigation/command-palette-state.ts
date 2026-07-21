/** Tiny client store so Header / hotkeys can open the palette. */
let openHandler: (() => void) | null = null;

export function registerCommandPalette(open: () => void) {
	openHandler = open;
	return () => {
		if (openHandler === open) openHandler = null;
	};
}

export function openCommandPalette() {
	openHandler?.();
}
