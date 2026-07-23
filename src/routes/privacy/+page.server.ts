import type { PageServerLoad } from './$types';
import { buildSeo } from '$seo';
import { getPublicEnv } from '$server/env';
import { site } from '$lib/config/site';

export const load: PageServerLoad = async ({ url }) => {
	const siteUrl = getPublicEnv().PUBLIC_SITE_URL ?? url.origin;
	const seo = buildSeo(
		{
			title: `Trust & Privacy | ${site.name}`,
			description:
				'How HeyTools keeps your workflow private: local-first tools, minimal data collection, and a free forever promise.',
			canonicalPath: '/privacy'
		},
		siteUrl
	);

	return { seo };
};
