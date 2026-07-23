import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import * as v from 'valibot';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.user) {
		redirect(303, '/account');
	}

	return {
		next: url.searchParams.get('next') ?? '/account',
		message: url.searchParams.get('message')
	};
};

const credentialsSchema = v.object({
	email: v.pipe(v.string(), v.email('Enter a valid email')),
	password: v.pipe(v.string(), v.minLength(6, 'Password must be at least 6 characters'))
});

export const actions: Actions = {
	google: async ({ locals, url }) => {
		const next = url.searchParams.get('next') ?? '/account';
		const redirectTo = `${url.origin}/auth/callback?next=${encodeURIComponent(next)}`;

		const { data, error } = await locals.supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo,
				queryParams: {
					access_type: 'offline',
					prompt: 'consent'
				}
			}
		});

		if (error) {
			return fail(400, {
				mode: 'google',
				message: error.message
			});
		}

		if (!data.url) {
			return fail(500, {
				mode: 'google',
				message: 'Could not start Google sign-in.'
			});
		}

		redirect(303, data.url);
	},

	signin: async ({ request, locals, url }) => {
		const form = Object.fromEntries(await request.formData());
		const parsed = v.safeParse(credentialsSchema, form);
		if (!parsed.success) {
			return fail(400, {
				mode: 'signin',
				message: parsed.issues[0]?.message ?? 'Invalid input',
				email: String(form.email ?? '')
			});
		}

		const { error } = await locals.supabase.auth.signInWithPassword(parsed.output);
		if (error) {
			return fail(400, {
				mode: 'signin',
				message: error.message,
				email: parsed.output.email
			});
		}

		const next = url.searchParams.get('next') ?? '/account';
		redirect(303, next.startsWith('/') ? next : '/account');
	},

	signup: async ({ request, locals, url }) => {
		const form = Object.fromEntries(await request.formData());
		const parsed = v.safeParse(credentialsSchema, form);
		if (!parsed.success) {
			return fail(400, {
				mode: 'signup',
				message: parsed.issues[0]?.message ?? 'Invalid input',
				email: String(form.email ?? '')
			});
		}

		const { error } = await locals.supabase.auth.signUp({
			email: parsed.output.email,
			password: parsed.output.password,
			options: {
				emailRedirectTo: `${url.origin}/auth/callback`
			}
		});

		if (error) {
			return fail(400, {
				mode: 'signup',
				message: error.message,
				email: parsed.output.email
			});
		}

		return {
			mode: 'signup',
			success: true,
			message: 'Check your email to confirm your account, or sign in if confirmation is disabled.',
			email: parsed.output.email
		};
	}
};
