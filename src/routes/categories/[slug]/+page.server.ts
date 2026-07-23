import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { categories, legacyCategoryRedirects, type CategoryId } from '$lib/config/site';

/** Category landings removed — filter on /tools instead. */
export const load: PageServerLoad = async ({ params, url }) => {
	const legacy = legacyCategoryRedirects[params.slug];
	const slug = (legacy && legacy !== params.slug ? legacy : params.slug) as string;
	const known = categories.some((c) => c.id === slug);

	const next = new URL('/tools', url.origin);
	if (known) next.searchParams.set('category', slug as CategoryId);
	const q = url.searchParams.get('q');
	if (q) next.searchParams.set('q', q);

	redirect(301, `${next.pathname}${next.search}`);
};
