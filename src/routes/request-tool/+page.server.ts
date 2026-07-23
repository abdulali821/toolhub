import * as v from 'valibot';
import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { buildSeo } from '$seo';
import { getPublicEnv } from '$server/env';
import { site, categories } from '$lib/config/site';
import { flattenIssues } from '$lib/validation';

const categoryIds = new Set([...categories.map((c) => c.id), 'other']);

const RequestSchema = v.object({
	toolName: v.pipe(
		v.string(),
		v.trim(),
		v.minLength(2, 'Tool name must be at least 2 characters'),
		v.maxLength(120, 'Tool name is too long')
	),
	description: v.pipe(
		v.string(),
		v.trim(),
		v.minLength(10, 'Please describe the tool in at least 10 characters'),
		v.maxLength(4000, 'Description is too long')
	),
	category: v.pipe(
		v.string(),
		v.trim(),
		v.maxLength(64),
		v.check((value) => value === '' || categoryIds.has(value), 'Choose a valid category')
	),
	email: v.pipe(
		v.string(),
		v.trim(),
		v.maxLength(254),
		v.check(
			(value) => value === '' || v.safeParse(v.pipe(v.string(), v.email()), value).success,
			'Enter a valid email'
		)
	),
	website: v.optional(v.string())
});

export const load: PageServerLoad = async ({ url }) => {
	const siteUrl = getPublicEnv().PUBLIC_SITE_URL ?? url.origin;
	const seo = buildSeo(
		{
			title: `Request a tool | ${site.name}`,
			description:
				'Suggest a new browser tool for HeyTools. Tell us what you need and we will consider adding it to the catalog.',
			canonicalPath: '/request-tool'
		},
		siteUrl
	);

	return {
		seo,
		categories: categories.map((c) => ({ id: c.id, label: c.label }))
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const form = Object.fromEntries(await request.formData());
		const raw = {
			toolName: String(form.toolName ?? ''),
			description: String(form.description ?? ''),
			category: String(form.category ?? ''),
			email: String(form.email ?? ''),
			website: String(form.website ?? '')
		};

		// Honeypot — bots fill hidden fields; humans leave it empty.
		if (raw.website.trim()) {
			return {
				success: true,
				message: 'Thanks — we received your request.',
				errors: {} as Record<string, string>
			};
		}

		const parsed = v.safeParse(RequestSchema, raw);
		if (!parsed.success) {
			return fail(400, {
				success: false,
				message: 'Please fix the highlighted fields.',
				errors: flattenIssues(parsed.issues) as Record<string, string>,
				values: {
					toolName: raw.toolName,
					description: raw.description,
					category: raw.category,
					email: raw.email
				}
			});
		}

		const category = parsed.output.category || null;
		const email = parsed.output.email || null;

		const { error } = await locals.supabase.from('tool_requests').insert({
			tool_name: parsed.output.toolName,
			description: parsed.output.description,
			category,
			email,
			user_id: locals.user?.id ?? null
		});

		if (error) {
			locals.log.error('tool_request_insert_failed', { err: error });
			return fail(500, {
				success: false,
				message: 'Something went wrong saving your request. Please try again.',
				errors: {} as Record<string, string>,
				values: {
					toolName: raw.toolName,
					description: raw.description,
					category: raw.category,
					email: raw.email
				}
			});
		}

		return {
			success: true,
			message: 'Thanks — your tool request is in. We review every suggestion.',
			errors: {} as Record<string, string>
		};
	}
};
