import { describe, expect, it, vi } from 'vitest';

vi.mock('qrcode', () => ({
	default: {
		toDataURL: vi.fn(async (text: string, opts?: { width?: number }) => {
			return `data:image/png;base64,mock-${text}-${opts?.width ?? 256}`;
		})
	}
}));

import { run } from '../../src/lib/tools/qr-code-generator';

describe('qr-code-generator', () => {
	it('returns a PNG data URL', async () => {
		const out = await run({ text: 'hello', size: 200 });
		expect(out.dataUrl).toMatch(/^data:image\/png;base64,/);
		expect(out.dataUrl).toContain('hello');
		expect(out.dataUrl).toContain('200');
	});
});
