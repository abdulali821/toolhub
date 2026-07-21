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
	signin: async ({ request, locals }) => {
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

		redirect(303, '/account');
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
	},

	magic: async ({ request, locals, url }) => {
		const form = Object.fromEntries(await request.formData());
		const email = String(form.email ?? '');
		const parsed = v.safeParse(v.pipe(v.string(), v.email()), email);
		if (!parsed.success) {
			return fail(400, {
				mode: 'magic',
				message: 'Enter a valid email',
				email
			});
		}

		const { error } = await locals.supabase.auth.signInWithOtp({
			email: parsed.output,
			options: {
				emailRedirectTo: `${url.origin}/auth/callback`
			}
		});

		if (error) {
			return fail(400, { mode: 'magic', message: error.message, email });
		}

		return {
			mode: 'magic',
			success: true,
			message: 'Magic link sent — check your email.',
			email
		};
	}
};
