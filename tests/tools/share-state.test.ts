import { describe, expect, it } from 'vitest';
import {
	buildShareQuery,
	buildShareUrl,
	readShareBool,
	readShareNumber,
	readShareParams
} from '../../src/lib/engine/share-state';
import { relatedTools, workflowNextTools } from '../../src/lib/tools';

describe('shareable tool state', () => {
	it('reads declared params from the query string', () => {
		const sp = new URLSearchParams('length=32&uppercase=true&symbols=false');
		expect(readShareParams(sp, ['length', 'uppercase', 'symbols'])).toEqual({
			length: '32',
			uppercase: 'true',
			symbols: 'false'
		});
		expect(readShareNumber(sp, 'length', 16)).toBe(32);
		expect(readShareBool(sp, 'uppercase', false)).toBe(true);
		expect(readShareBool(sp, 'symbols', true)).toBe(false);
	});

	it('omits params equal to their defaults', () => {
		const query = buildShareQuery(
			{ length: 16, uppercase: true, symbols: true },
			['length', 'uppercase', 'symbols'],
			{ defaults: { length: '16', uppercase: 'true', symbols: 'false' } }
		);
		expect(query).toBe('symbols=true');
	});

	it('builds share URLs and drops oversized values', () => {
		const url = buildShareUrl('/tools/color-converter', { hex: 'ff0000' }, ['hex']);
		expect(url).toBe('/tools/color-converter?hex=ff0000');

		const huge = 'x'.repeat(5000);
		const query = buildShareQuery({ json: huge, indent: '2' }, ['json', 'indent'], {
			maxParamBytes: 100
		});
		expect(query.includes('json=')).toBe(false);
		expect(query).toContain('indent=2');
	});
});

describe('workflow next tools', () => {
	it('returns workflow next for json-formatter', () => {
		const next = workflowNextTools('json-formatter', 4);
		expect(next.map((t) => t.id)).toEqual([
			'json-validator',
			'json-minifier',
			'json-compare',
			'json-to-yaml'
		]);
	});

	it('boosts workflow tools in related scoring', () => {
		const related = relatedTools('json-formatter', 6);
		const ids = related.map((t) => t.id);
		expect(ids).toContain('json-validator');
	});
});
