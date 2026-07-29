export const THEME_STORAGE_KEY = 'heytools:theme';

export type Theme = 'light' | 'dark';

export function readTheme(): Theme {
	if (typeof window === 'undefined') return 'light';

	try {
		const stored = localStorage.getItem(THEME_STORAGE_KEY);
		if (stored === 'light' || stored === 'dark') return stored;
	} catch {
		// Private mode or blocked storage
	}

	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme: Theme): void {
	if (typeof document === 'undefined') return;
	document.documentElement.classList.toggle('dark', theme === 'dark');
}

export function setTheme(theme: Theme): void {
	applyTheme(theme);
	try {
		localStorage.setItem(THEME_STORAGE_KEY, theme);
	} catch {
		// ignore
	}
}

export function toggleTheme(current: Theme): Theme {
	const next: Theme = current === 'dark' ? 'light' : 'dark';
	setTheme(next);
	return next;
}
