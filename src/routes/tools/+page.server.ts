import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { listTools } from '$tools';
import { buildSeo, jsonLdItemList } from '$seo';
import { getPublicEnv } from '$server/env';
import { categories, type CategoryId } from '$lib/config/site';

export const load: PageServerLoad = async ({ url }) => {
	const q = url.searchParams.get('q') ?? undefined;
	const category = url.searchParams.get('category') ?? undefined;

	// Prefer dedicated SEO landings when browsing a category without a search query.
	if (category && !q && categories.some((c) => c.id === category)) {
		redirect(301, `/categories/${category}`);
	}

	const tools = listTools({
		q,
		category: category as CategoryId | undefined
	});

	const siteUrl = getPublicEnv().PUBLIC_SITE_URL ?? url.origin;
	const activeCategory = category ? categories.find((c) => c.id === category) : undefined;

	const seo = buildSeo(
		{
			title: activeCategory ? activeCategory.label : 'Tools',
			description: activeCategory
				? activeCategory.description
				: 'Browse free online tools on HeyTools — formatters, generators, converters, image and PDF utilities, and developer helpers.',
			canonicalPath: activeCategory ? `/categories/${activeCategory.id}` : '/tools'
		},
		siteUrl
	);

	const jsonLd = [
		jsonLdItemList(
			tools.slice(0, 100).map((t) => ({
				name: t.name,
				path: `/tools/${t.id}`,
				description: t.description
			})),
			siteUrl,
			{
				name: activeCategory ? activeCategory.label : 'All tools',
				description: activeCategory
					? activeCategory.description
					: 'Free online tools catalog on HeyTools.',
				path: activeCategory ? `/categories/${activeCategory.id}` : '/tools'
			}
		)
	].filter(Boolean);

	return { tools, q: q ?? '', category: category ?? '', seo, jsonLd };
};
