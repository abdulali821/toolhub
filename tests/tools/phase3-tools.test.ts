import { describe, expect, it } from 'vitest';
import { run } from '../../src/lib/tools/word-counter';
import { run as caseRun } from '../../src/lib/tools/case-converter';
import { run as slugRun } from '../../src/lib/tools/slugify';
import { run as base64Run } from '../../src/lib/tools/base64-codec';
import { run as colorRun } from '../../src/lib/tools/color-converter';
import { run as jwtRun } from '../../src/lib/tools/jwt-decoder';

describe('phase 3 tools', () => {
	it('counts words', () => {
		expect(run({ text: 'one two three' }).words).toBe(3);
	});

	it('converts to kebab-case', () => {
		expect(caseRun({ text: 'Hello World', mode: 'kebab' }).result).toBe('hello-world');
	});

	it('slugifies text', () => {
		expect(slugRun({ text: 'Hello HeyTools!' }).slug).toBe('hello-heytools');
	});

	it('encodes and decodes base64', () => {
		const encoded = base64Run({ text: 'hi', mode: 'encode' }).result;
		expect(base64Run({ text: encoded, mode: 'decode' }).result).toBe('hi');
	});

	it('converts hex colors', () => {
		const out = colorRun({ value: '#0f766e' });
		expect(out.hex).toBe('#0f766e');
		expect(out.rgb).toContain('15');
	});

	it('decodes jwt payload', () => {
		const token =
			'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0IiwibmFtZSI6IkhleVRvb2xzIn0.sig';
		const out = jwtRun({ token });
		expect(out.error).toBeUndefined();
		expect(out.payload).toContain('HeyTools');
	});
});
