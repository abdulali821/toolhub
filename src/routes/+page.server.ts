import type { PageServerLoad } from './$types';
import { getTool, listTools } from '$tools';
import { listCollections } from '$lib/config/collections';
import { buildSeo, jsonLdOrganization, jsonLdWebsite } from '$seo';
import { getPublicEnv } from '$server/env';
import { site } from '$lib/config/site';

const FEATURED_IDS = [
	'json-formatter',
	'password-generator',
	'word-counter',
	'base64-codec',
	'color-converter',
	'regex-tester'
] as const;

export const load: PageServerLoad = async ({ url }) => {
	const all = listTools();
	const featured = FEATURED_IDS.map((id) => all.find((t) => t.id === id)).filter(
		(t): t is NonNullable<typeof t> => t != null
	);

	const collections = listCollections().map((pack) => ({
		id: pack.id,
		name: pack.name,
		description: pack.description,
		tools: pack.toolIds
			.map((id) => getTool(id))
			.filter((t): t is NonNullable<typeof t> => t != null)
			.map((t) => ({ id: t.id, name: t.metadata.name }))
	}));

	const siteUrl = getPublicEnv().PUBLIC_SITE_URL ?? url.origin;
	const seo = buildSeo(
		{
			title: `${site.name} — Premium tools for focused work`,
			description:
				'A carefully curated suite of browser-based utilities. Fast, privacy-first, and completely free. Format, convert, and generate locally.',
			canonicalPath: '/'
		},
		siteUrl
	);

	return {
		featured,
		collections,
		seo,
		jsonLd: [jsonLdWebsite(siteUrl), jsonLdOrganization(siteUrl)]
	};
};
