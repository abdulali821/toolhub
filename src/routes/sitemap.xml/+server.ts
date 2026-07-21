import type { RequestHandler } from './$types';
import { listTools } from '$tools';
import { categories } from '$lib/config/site';
import { getPublicEnv } from '$server/env';

export const GET: RequestHandler = async ({ url }) => {
	const siteUrl = (getPublicEnv().PUBLIC_SITE_URL ?? url.origin).replace(/\/$/, '');
	const staticPaths = ['/', '/tools', '/categories'];
	const categoryPaths = categories.map((c) => `/categories/${c.id}`);
	const toolPaths = listTools().map((t) => `/tools/${t.id}`);

	const urls = [...staticPaths, ...categoryPaths, ...toolPaths]
		.map(
			(path) => `  <url>
    <loc>${siteUrl}${path}</loc>
    <changefreq>weekly</changefreq>
    <priority>${path === '/' ? '1.0' : '0.7'}</priority>
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
