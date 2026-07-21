import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { categories, legacyCategoryRedirects } from '$lib/config/site';
import { listTools } from '$tools';
import { buildSeo } from '$seo';
import { getPublicEnv } from '$server/env';

export const load: PageServerLoad = async ({ params, url }) => {
	const legacy = legacyCategoryRedirects[params.slug];
	if (legacy && legacy !== params.slug) {
		const next = new URL(url);
		next.pathname = `/categories/${legacy}`;
		redirect(301, `${next.pathname}${next.search}`);
	}

	const category = categories.find((item) => item.id === params.slug);
	if (!category) error(404, 'Category not found');

	const q = url.searchParams.get('q') ?? '';
	const tools = listTools({
		category: category.id,
		q: q || undefined
	});

	const siteUrl = getPublicEnv().PUBLIC_SITE_URL ?? url.origin;
	const seo = buildSeo(
		{
			title: category.label,
			description: category.description,
			canonicalPath: `/categories/${category.id}`
		},
		siteUrl
	);

	return { category, tools, q, seo };
};
