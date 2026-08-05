import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { listTools } from '$tools';
import { buildSeo, jsonLdBreadcrumb, jsonLdItemList } from '$seo';
import { getPublicEnv } from '$server/env';
import { categories, legacyCategoryRedirects, type CategoryId } from '$lib/config/site';

export const load: PageServerLoad = async ({ params, url }) => {
	const legacy = legacyCategoryRedirects[params.slug];
	if (legacy && legacy !== params.slug) {
		redirect(301, `/categories/${legacy}`);
	}

	const category = categories.find((c) => c.id === params.slug);
	if (!category) error(404, 'Category not found');

	const tools = listTools({ category: category.id as CategoryId });
	const siteUrl = getPublicEnv().PUBLIC_SITE_URL ?? url.origin;

	const seo = buildSeo(
		{
			title: category.label,
			description: category.description,
			canonicalPath: `/categories/${category.id}`,
			keywords: [category.label, 'free online tools', 'HeyTools']
		},
		siteUrl
	);

	const jsonLd = [
		jsonLdBreadcrumb(
			[
				{ name: 'Home', path: '/' },
				{ name: 'Tools', path: '/tools' },
				{ name: category.label, path: `/categories/${category.id}` }
			],
			siteUrl
		),
		jsonLdItemList(
			tools.map((t) => ({
				name: t.name,
				path: `/tools/${t.id}`,
				description: t.description
			})),
			siteUrl,
			{
				name: category.label,
				description: category.description,
				path: `/categories/${category.id}`
			}
		)
	].filter(Boolean);

	return {
		category,
		tools: tools.map((t) => ({
			id: t.id,
			name: t.name,
			description: t.description,
			category: t.category
		})),
		seo,
		jsonLd
	};
};
