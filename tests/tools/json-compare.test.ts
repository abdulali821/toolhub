import { describe, expect, it } from 'vitest';
import { run } from '../../src/lib/tools/json-compare';

describe('json-compare', () => {
	it('detects identical JSON', () => {
		const json = '{"a":1,"b":[1,2]}';
		const result = run({ left: json, right: json });
		expect(result.equal).toBe(true);
		expect(result.counts.changed).toBe(0);
		expect(result.summary).toContain('identical');
	});

	it('reports structural differences', () => {
		const result = run({
			left: '{"name":"Ada","role":"Engineer"}',
			right: '{"name":"Ada","role":"Scientist","team":"Research"}'
		});
		expect(result.equal).toBe(false);
		expect(result.changed).toContain('$.role');
		expect(result.added).toContain('$.team');
		expect(result.counts.changed).toBe(1);
		expect(result.counts.added).toBe(1);
	});

	it('reports parse errors', () => {
		const result = run({ left: '{bad', right: '{}' });
		expect(result.validLeft).toBe(false);
		expect(result.errorLeft).toBeTruthy();
	});
});
