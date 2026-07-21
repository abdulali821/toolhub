import type { CategoryId } from '$lib/config/site';
import { categories } from '$lib/config/site';

/** Subtle category accents — muted, never neon. */
export const categoryAccent: Record<CategoryId, string> = {
	developer: '#0f766e',
	text: '#4338ca',
	data: '#0369a1',
	image: '#a16207',
	pdf: '#b91c1c',
	color: '#c026d3',
	encoders: '#0e7490',
	converters: '#4f46e5',
	generators: '#047857',
	calculators: '#b45309'
};

export type CategoryIconKind =
	| 'code'
	| 'type'
	| 'braces'
	| 'image'
	| 'pdf'
	| 'palette'
	| 'encode'
	| 'swap'
	| 'spark'
	| 'calc';

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
