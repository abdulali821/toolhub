import type { PageServerLoad } from './$types';
import { categories } from '$lib/config/site';
import '$tools';
import { countToolsByCategory } from '$engine';
import { buildSeo } from '$seo';
import { getPublicEnv } from '$server/env';

export const load: PageServerLoad = async ({ url }) => {
	const counts = countToolsByCategory();
	const siteUrl = getPublicEnv().PUBLIC_SITE_URL ?? url.origin;
	const seo = buildSeo(
		{
			title: 'Categories',
			description:
				'Browse ToolHub by category — Developer Tools, Text, Data, Image, PDF, Color, Encoders, Converters, Generators, and Calculators.',
			canonicalPath: '/categories'
		},
		siteUrl
	);

	return {
		categories: categories.map((category) => ({
			...category,
			count: counts[category.id]
		})),
		seo
	};
};
