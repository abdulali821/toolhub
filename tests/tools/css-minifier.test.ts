import { describe, expect, it } from 'vitest';
import { run } from '../../src/lib/tools/css-minifier';

describe('css-minifier', () => {
	it('minifies CSS comments and whitespace', () => {
		const out = run({
			mode: 'minify',
			css: '.card {\n  color: #111;\n  padding: 8px; /* note */\n}\n'
		});
		expect(out.error).toBeUndefined();
		expect(out.result).toBe('.card{color:#111;padding:8px}');
	});

	it('beautifies compact CSS', () => {
		const out = run({ mode: 'beautify', css: '.card{color:#111;padding:8px}' });
		expect(out.error).toBeUndefined();
		expect(out.result).toContain('.card {');
		expect(out.result).toContain('color: #111;');
		expect(out.result).toContain('padding: 8px;');
	});

	it('errors on empty input', () => {
		const out = run({ mode: 'minify', css: '   ' });
		expect(out.result).toBe('');
		expect(out.error).toMatch(/css/i);
	});
});
