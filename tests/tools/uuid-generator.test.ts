import { describe, expect, it } from 'vitest';
import { run } from '../../src/lib/tools/uuid-generator';

describe('uuid-generator', () => {
	it('generates the requested count of UUIDs', () => {
		const { uuids } = run({ count: 3, version: 'v4' });
		expect(uuids).toHaveLength(3);
		for (const id of uuids) {
			expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
		}
	});
});
