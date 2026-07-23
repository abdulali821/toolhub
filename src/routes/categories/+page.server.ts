import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

/** Categories index removed — catalog lives on /tools. */
export const load: PageServerLoad = async () => {
	redirect(301, '/tools');
};
