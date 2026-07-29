import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('jsbarcode', () => ({
	default: vi.fn(
		(
			canvas: { toDataURL: (type?: string) => string },
			value: string,
			opts?: { format?: string }
		) => {
			canvas.toDataURL = () => `data:image/png;base64,mock-${opts?.format ?? 'CODE128'}-${value}`;
		}
	)
}));

vi.stubGlobal('document', {
	createElement: () => ({
		toDataURL: () => 'data:image/png;base64,empty'
	})
});

import { run } from '../../src/lib/tools/barcode-generator';
import JsBarcode from 'jsbarcode';

describe('barcode-generator', () => {
	beforeEach(() => {
		vi.mocked(JsBarcode).mockClear();
	});

	it('returns a PNG data URL for CODE128', () => {
		const out = run({
			value: 'HeyTools',
			format: 'CODE128',
			height: 80,
			barWidth: 2,
			displayValue: true
		});
		expect(out.dataUrl).toMatch(/^data:image\/png;base64,/);
		expect(out.dataUrl).toContain('HeyTools');
		expect(out.dataUrl).toContain('CODE128');
		expect(JsBarcode).toHaveBeenCalled();
	});

	it('passes format and sizing options to JsBarcode', () => {
		run({
			value: '5901234123457',
			format: 'EAN13',
			height: 100,
			barWidth: 3,
			displayValue: false
		});
		expect(JsBarcode).toHaveBeenCalledWith(
			expect.anything(),
			'5901234123457',
			expect.objectContaining({
				format: 'EAN13',
				width: 3,
				height: 100,
				displayValue: false
			})
		);
	});
});
