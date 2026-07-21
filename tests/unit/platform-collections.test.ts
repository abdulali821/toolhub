import { describe, expect, it } from 'vitest';
import {
	getCollection,
	listCollections,
	platformCollections
} from '../../src/lib/config/collections';
import { allToolIds } from '../../src/lib/tools';

describe('platform collections', () => {
	it('defines at least three curated packs', () => {
		expect(platformCollections.length).toBeGreaterThanOrEqual(3);
	});

	it('references only registered tools', () => {
		const ids = new Set(allToolIds());
		for (const collection of platformCollections) {
			for (const toolId of collection.toolIds) {
				expect(ids.has(toolId), `${collection.id} references unknown tool ${toolId}`).toBe(true);
			}
		}
	});

	it('looks up collections by id', () => {
		const pack = getCollection('developer-starter-pack');
		expect(pack?.name).toBe('Developer Starter Pack');
		expect(listCollections()).toHaveLength(platformCollections.length);
	});
});
