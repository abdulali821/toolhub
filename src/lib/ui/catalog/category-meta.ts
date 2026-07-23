import type { CategoryId } from '$lib/config/site';
import { categories } from '$lib/config/site';

/** Muted zinc washes — Goforit grayscale language. */
export const categoryAccent: Record<CategoryId, string> = {
	developer: '#3f3f46',
	text: '#52525b',
	data: '#27272a',
	image: '#71717a',
	pdf: '#3f3f46',
	color: '#52525b',
	encoders: '#27272a',
	converters: '#3f3f46',
	generators: '#52525b',
	calculators: '#71717a'
};

export type CategoryIconKind =
	'code' | 'type' | 'braces' | 'image' | 'pdf' | 'palette' | 'encode' | 'swap' | 'spark' | 'calc';

export const categoryIconKind: Record<CategoryId, CategoryIconKind> = {
	developer: 'code',
	text: 'type',
	data: 'braces',
	image: 'image',
	pdf: 'pdf',
	color: 'palette',
	encoders: 'encode',
	converters: 'swap',
	generators: 'spark',
	calculators: 'calc'
};

export function categoryLabel(id: string): string {
	return categories.find((c) => c.id === id)?.label ?? id;
}

export function isCategoryId(id: string): id is CategoryId {
	return categories.some((c) => c.id === id);
}

export function accentForCategory(id: string | undefined): string {
	if (id && isCategoryId(id)) return categoryAccent[id];
	return 'var(--color-accent)';
}
