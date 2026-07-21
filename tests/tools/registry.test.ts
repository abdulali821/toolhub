import { describe, expect, it } from 'vitest';
import { listTools, getTool, relatedTools } from '../../src/lib/tools';

describe('tool registry', () => {
	it('registers the expanded catalog', () => {
		const tools = listTools();
		expect(tools.length).toBeGreaterThanOrEqual(20);
		expect(getTool('word-counter')?.metadata.name).toBe('Word Counter');
		expect(getTool('jwt-decoder')?.metadata.name).toBe('JWT Decoder');
		expect(getTool('regex-tester')?.metadata.name).toBe('Regex Tester');
		expect(getTool('image-to-base64')?.metadata.name).toBe('Image to Base64');
	});

	it('ranks search results', () => {
		const results = listTools({ q: 'jwt' });
		expect(results[0]?.id).toBe('jwt-decoder');
	});

	it('returns related tools with scoring', () => {
		const related = relatedTools('json-formatter', 4);
		expect(related.length).toBeGreaterThan(0);
		expect(related.every((t) => t.id !== 'json-formatter')).toBe(true);
	});
});
