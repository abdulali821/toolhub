import { describe, expect, it } from 'vitest';
import { optimizeSvg } from '../../src/lib/utils/image-canvas';
import { run, svgOptimizer } from '../../src/lib/tools/svg-optimizer';

describe('svg-optimizer', () => {
	it('declares share and download capabilities', () => {
		expect(svgOptimizer.capabilities).toContain('share');
		expect(svgOptimizer.capabilities).toContain('download');
		expect(svgOptimizer.share?.params).toEqual(['source']);
	});

	it('strips comments and collapses whitespace', () => {
		const source = `<svg>
  <!-- icon -->
  <rect x="0" y="0" width="10" height="10"/>
</svg>`;
		const out = run({ source });
		expect(out.svg).not.toContain('<!--');
		expect(out.svg).toContain('><rect');
		expect(out.optimizedBytes).toBeLessThan(out.originalBytes);
	});

	it('matches optimizeSvg helper output', () => {
		const source = '<svg><circle r="1"/></svg>';
		expect(run({ source })).toEqual(optimizeSvg(source));
	});
});
