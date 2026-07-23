import { describe, expect, it } from 'vitest';
import { resolveAnalyticsConfig } from '../../src/lib/analytics/provider';

describe('analytics provider', () => {
	it('prefers Plausible when both are unset vs set', () => {
		expect(resolveAnalyticsConfig({})).toEqual({ provider: 'none' });
		expect(resolveAnalyticsConfig({ PUBLIC_PLAUSIBLE_DOMAIN: 'heytools.app' })).toEqual({
			provider: 'plausible',
			domain: 'heytools.app'
		});
		expect(resolveAnalyticsConfig({ PUBLIC_SA_DOMAIN: 'heytools.app' })).toEqual({
			provider: 'simple',
			domain: 'heytools.app'
		});
		expect(
			resolveAnalyticsConfig({
				PUBLIC_PLAUSIBLE_DOMAIN: 'a.test',
				PUBLIC_SA_DOMAIN: 'b.test'
			}).provider
		).toBe('plausible');
	});
});
