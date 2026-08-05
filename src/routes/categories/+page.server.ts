import type { PageServerLoad } from './$types';
import { listTools } from '$tools';
import { buildSeo, jsonLdItemList } from '$seo';
import { getPublicEnv } from '$server/env';
import { categories } from '$lib/config/site';

export const load: PageServerLoad = async ({ url }) => {
	const siteUrl = getPublicEnv().PUBLIC_SITE_URL ?? url.origin;
	const counts = Object.fromEntries(
		categories.map((c) => [c.id, listTools({ category: c.id }).length])
	);

	const seo = buildSeo(
		{
			title: 'Tool categories',
			description:
				'Browse HeyTools by category — developer, text, data, image, PDF, color, encoders, converters, generators, and calculators.',
			canonicalPath: '/categories'
		},
		siteUrl
	);

	const jsonLd = [
		jsonLdItemList(
			categories.map((c) => ({
				name: c.label,
				path: `/categories/${c.id}`,
				description: c.description
			})),
			siteUrl,
			{
				name: 'Tool categories',
				description: 'HeyTools SEO category landings.',
				path: '/categories'
			}
		)
	].filter(Boolean);

	return {
		categories: categories.map((c) => ({
			...c,
			count: counts[c.id] ?? 0
		})),
		seo,
		jsonLd
	};
};
