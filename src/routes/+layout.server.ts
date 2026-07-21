import type { LayoutServerLoad } from './$types';
import { getPublicEnv } from '$server/env';
import { resolveAnalyticsConfig } from '$lib/analytics/provider';

export const load: LayoutServerLoad = async ({ locals }) => {
	const env = getPublicEnv();
	return {
		user: locals.user
			? {
					id: locals.user.id,
					email: locals.user.email
				}
			: null,
		analytics: resolveAnalyticsConfig(env),
		adsEnabled: env.PUBLIC_ADS_ENABLED === 'true'
	};
};
