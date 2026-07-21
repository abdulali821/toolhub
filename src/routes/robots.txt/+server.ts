import type { RequestHandler } from './$types';
import { getPublicEnv } from '$server/env';

export const GET: RequestHandler = async ({ url }) => {
	const siteUrl = (getPublicEnv().PUBLIC_SITE_URL ?? url.origin).replace(/\/$/, '');
	const body = `User-agent: *
Allow: /
Disallow: /account
Disallow: /api

Sitemap: ${siteUrl}/sitemap.xml
`;

	return new Response(body, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'public, max-age=86400'
		}
	});
};
