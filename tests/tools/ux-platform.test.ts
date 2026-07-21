import { describe, expect, it } from 'vitest';
import { getTool, listTools } from '../../src/lib/tools';

describe('ux platform rollout', () => {
	it('every registered tool declares at least one capability', () => {
		const tools = listTools();
		expect(tools.length).toBeGreaterThanOrEqual(25);
		for (const tool of tools) {
			const def = getTool(tool.id);
			expect(def?.capabilities?.length, `${tool.id} missing capabilities`).toBeGreaterThan(0);
		}
	});

	it('shareable tools declare share.params', () => {
		const mustShare = [
			'json-formatter',
			'case-converter',
			'base64-codec',
			'color-converter',
			'password-generator'
		];
		for (const id of mustShare) {
			expect(getTool(id)?.share?.params?.length, `${id} missing share.params`).toBeGreaterThan(0);
		}
	});

	it('jwt and image tools omit share capability', () => {
		expect(getTool('jwt-decoder')?.capabilities?.includes('share')).toBe(false);
		expect(getTool('image-to-base64')?.capabilities?.includes('share')).toBe(false);
	});
});
