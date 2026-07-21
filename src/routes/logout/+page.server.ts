import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	redirect(303, '/');
};

export const actions: Actions = {
	default: async ({ locals }) => {
		await locals.supabase.auth.signOut();
		redirect(303, '/');
	}
};
