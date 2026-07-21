/**
 * External analytics provider (Plausible or Simple Analytics).
 * No first-party event warehouse — scripts load only when env is set.
 */
export type AnalyticsProvider = 'plausible' | 'simple' | 'none';

export type AnalyticsConfig = {
	provider: AnalyticsProvider;
	domain?: string;
};

export function resolveAnalyticsConfig(env: {
	PUBLIC_PLAUSIBLE_DOMAIN?: string;
	PUBLIC_SA_DOMAIN?: string;
}): AnalyticsConfig {
	if (env.PUBLIC_PLAUSIBLE_DOMAIN) {
		return { provider: 'plausible', domain: env.PUBLIC_PLAUSIBLE_DOMAIN };
	}
	if (env.PUBLIC_SA_DOMAIN) {
		return { provider: 'simple', domain: env.PUBLIC_SA_DOMAIN };
	}
	return { provider: 'none' };
}

/** Optional client-side custom event (no-ops until a provider script is present). */
export function trackEvent(name: string, props?: Record<string, string | number | boolean>): void {
	if (typeof window === 'undefined') return;
	const w = window as Window & {
		plausible?: (event: string, options?: { props?: Record<string, unknown> }) => void;
		sa_event?: (event: string) => void;
	};
	if (typeof w.plausible === 'function') {
		w.plausible(name, props ? { props } : undefined);
		return;
	}
	if (typeof w.sa_event === 'function') {
		w.sa_event(name);
	}
}
