import type { RequestHandler } from './$types';
import { listTools } from '$tools';
import { getPublicEnv } from '$server/env';
import { categories } from '$lib/config/site';

type Entry = {
	path: string;
	changefreq: 'daily' | 'weekly' | 'monthly' | 'yearly';
	priority: string;
};

export const GET: RequestHandler = async ({ url }) => {
	const siteUrl = (getPublicEnv().PUBLIC_SITE_URL ?? url.origin).replace(/\/$/, '');

	const pages: Entry[] = [
		{ path: '/', changefreq: 'weekly', priority: '1.0' },
		{ path: '/tools', changefreq: 'daily', priority: '0.9' },
		{ path: '/categories', changefreq: 'weekly', priority: '0.8' },
		...categories.map((c) => ({
			path: `/categories/${c.id}`,
			changefreq: 'weekly' as const,
			priority: '0.75'
		})),
		{ path: '/request-tool', changefreq: 'monthly', priority: '0.5' },
		{ path: '/privacy', changefreq: 'yearly', priority: '0.3' },
		...listTools().map((t) => ({
			path: `/tools/${t.id}`,
			changefreq: 'weekly' as const,
			priority: '0.7'
		}))
	];

	const urls = pages
		.map(
			(p) => `<url>
<loc>${siteUrl}${p.path}</loc>
<changefreq>${p.changefreq}</changefreq>
<priority>${p.priority}</priority>
</url>`
		)
		.join('\n');

	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

	return new Response(body, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
