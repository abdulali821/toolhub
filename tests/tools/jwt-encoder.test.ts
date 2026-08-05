import { describe, expect, it } from 'vitest';
import { run } from '../../src/lib/tools/jwt-encoder';

describe('jwt-encoder', () => {
	it('signs the classic jwt.io HS256 example exactly', async () => {
		const out = await run({
			headerJson: '{"alg":"HS256","typ":"JWT"}',
			payloadJson: '{"sub":"1234567890","name":"John Doe","iat":1516239022}',
			secret: 'your-256-bit-secret',
			algorithm: 'HS256'
		});
		expect(out.error).toBeUndefined();
		expect(out.token).toBe(
			'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
		);
	});

	it('produces an unsigned token for the "none" algorithm', async () => {
		const out = await run({
			headerJson: '{"typ":"JWT"}',
			payloadJson: '{"sub":"abc"}',
			secret: '',
			algorithm: 'none'
		});
		expect(out.error).toBeUndefined();
		expect(out.token.endsWith('.')).toBe(true);
		const parts = out.token.split('.');
		expect(parts).toHaveLength(3);
		expect(parts[2]).toBe('');

		const header = JSON.parse(Buffer.from(parts[0]!, 'base64').toString('utf8'));
		expect(header.alg).toBe('none');
	});

	it('errors on invalid header JSON', async () => {
		const out = await run({
			headerJson: 'not json',
			payloadJson: '{}',
			secret: 'secret',
			algorithm: 'HS256'
		});
		expect(out.error).toBeDefined();
		expect(out.token).toBe('');
	});

	it('errors on invalid payload JSON', async () => {
		const out = await run({
			headerJson: '{"alg":"HS256","typ":"JWT"}',
			payloadJson: '[]',
			secret: 'secret',
			algorithm: 'HS256'
		});
		expect(out.error).toBeDefined();
	});

	it('errors when HS256 is selected without a secret', async () => {
		const out = await run({
			headerJson: '{"alg":"HS256","typ":"JWT"}',
			payloadJson: '{"sub":"abc"}',
			secret: '',
			algorithm: 'HS256'
		});
		expect(out.error).toBeDefined();
	});
});
