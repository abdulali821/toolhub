import type { PageServerLoad } from './$types';
import { listTools } from '$tools';
import { buildSeo } from '$seo';
import { getPublicEnv } from '$server/env';
import type { CategoryId } from '$lib/config/site';

export const load: PageServerLoad = async ({ url }) => {
	const q = url.searchParams.get('q') ?? undefined;
	const category = url.searchParams.get('category') ?? undefined;
	const tools = listTools({
		q,
		category: category as CategoryId | undefined
	});

	const siteUrl = getPublicEnv().PUBLIC_SITE_URL ?? url.origin;
	const seo = buildSeo(
		{
			title: 'Tools',
			description:
				'Browse free online tools on ToolHub — formatters, generators, converters, image and PDF utilities, and developer helpers.',
			canonicalPath: '/tools'
		},
		siteUrl
	);

	return { tools, q: q ?? '', category: category ?? '', seo };
};
