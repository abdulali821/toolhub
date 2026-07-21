import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(303, '/login?next=/account');
	}

	return {
		email: locals.user.email ?? '',
		userId: locals.user.id
	};
};
