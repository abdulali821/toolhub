import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getTool, relatedTools, workflowNextTools } from '$tools';
import { categories } from '$lib/config/site';
import {
	buildSeo,
	jsonLdBreadcrumb,
	jsonLdFaq,
	jsonLdHowTo,
	jsonLdWebApplication,
	toolToPageMetadata
} from '$seo';
import { getPublicEnv } from '$server/env';
import { addFavorite, isFavorite, removeFavorite } from '$lib/features/favorites/api.server';
import { recordHistory } from '$lib/features/history/api.server';

export const load: PageServerLoad = async ({ params, url, locals }) => {
	const tool = getTool(params.slug);
	if (!tool) error(404, 'Tool not found');

	const category = categories.find((item) => item.id === tool.category);
	const siteUrl = getPublicEnv().PUBLIC_SITE_URL ?? url.origin;
	const seo = buildSeo(toolToPageMetadata(tool), siteUrl);
	const related = relatedTools(tool.id, 4);
	const workflowNext = workflowNextTools(tool.id, 3);
	const relatedFiltered = related.filter(
		(item) => !workflowNext.some((next) => next.id === item.id)
	);

	let favorited = false;
	if (locals.user) {
		try {
			favorited = await isFavorite(locals.supabase, locals.user.id, tool.id);
			await recordHistory(locals.supabase, locals.user.id, tool.id, {
				source: 'tool_page'
			});
		} catch (err) {
			locals.log.warn('tool_page_user_data_failed', { err, toolId: tool.id });
		}
	}

	const jsonLd = [
		jsonLdWebApplication(tool, siteUrl),
		jsonLdBreadcrumb(
			[
				{ name: 'Home', path: '/' },
				{ name: 'Tools', path: '/tools' },
				{ name: category?.label ?? tool.category, path: `/categories/${tool.category}` },
				{ name: tool.metadata.name, path: `/tools/${tool.id}` }
			],
			siteUrl
		),
		jsonLdFaq(tool.metadata.faq ?? []),
		jsonLdHowTo(tool.metadata.name, tool.metadata.howTo ?? [], siteUrl, `/tools/${tool.id}`)
	].filter(Boolean);

	return {
		tool: {
			id: tool.id,
			name: tool.metadata.name,
			title: tool.metadata.title,
			description: tool.metadata.description,
			category: tool.category,
			categoryLabel: category?.label ?? tool.category,
			faq: tool.metadata.faq ?? [],
			howTo: tool.metadata.howTo ?? [],
			mode: tool.mode,
			status: tool.status,
			capabilities: tool.capabilities ?? [],
			presets: tool.presets ?? [],
			shareParams: tool.share?.params ?? [],
			maxParamBytes: tool.share?.maxParamBytes
		},
		related: relatedFiltered,
		workflowNext,
		seo,
		jsonLd,
		favorited,
		canFavorite: Boolean(locals.user),
		adsEnabled: getPublicEnv().PUBLIC_ADS_ENABLED === 'true'
	};
};

export const actions: Actions = {
	toggleFavorite: async ({ locals, params }) => {
		if (!locals.user) {
			return fail(401, { message: 'Sign in required' });
		}

		const tool = getTool(params.slug);
		if (!tool) return fail(404, { message: 'Tool not found' });

		const currentlyFavorited = await isFavorite(locals.supabase, locals.user.id, tool.id);
		if (currentlyFavorited) {
			await removeFavorite(locals.supabase, locals.user.id, tool.id);
		} else {
			await addFavorite(locals.supabase, locals.user.id, tool.id);
		}

		return { favorited: !currentlyFavorited };
	}
};
