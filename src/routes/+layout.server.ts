import type { LayoutServerLoad } from './$types';
import { getPublicEnv } from '$server/env';

export const load: LayoutServerLoad = async ({ locals }) => {
	const env = getPublicEnv();
	return {
		user: locals.user
			? {
					id: locals.user.id,
					email: locals.user.email
				}
			: null,
		adsEnabled: env.PUBLIC_ADS_ENABLED === 'true'
	};
};
