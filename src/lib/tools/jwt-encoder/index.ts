import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

export const inputSchema = v.object({
	headerJson: v.pipe(v.string(), v.minLength(2, 'Enter header JSON')),
	payloadJson: v.pipe(v.string(), v.minLength(2, 'Enter payload JSON')),
	secret: v.string(),
	algorithm: v.picklist(['none', 'HS256'])
});

export type JwtEncoderInput = v.InferOutput<typeof inputSchema>;
export type JwtEncoderOutput = {
	token: string;
	error?: string;
};

export const DEFAULT_HEADER_JSON = '{"alg":"HS256","typ":"JWT"}';
export const DEFAULT_PAYLOAD_JSON = '{"sub":"1234567890","name":"HeyTools","iat":1516239022}';
export const DEFAULT_SECRET = 'your-256-bit-secret';

function base64UrlFromBytes(bytes: Uint8Array): string {
	let base64: string;
	if (typeof btoa === 'function') {
		let binary = '';
		for (const byte of bytes) binary += String.fromCharCode(byte);
		base64 = btoa(binary);
	} else {
		base64 = Buffer.from(bytes).toString('base64');
	}
	return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlFromString(text: string): string {
	return base64UrlFromBytes(new TextEncoder().encode(text));
}

function parseJsonObject(text: string, label: string): Record<string, unknown> {
	let parsed: unknown;
	try {
		parsed = JSON.parse(text);
	} catch {
		throw new Error(`${label} must be valid JSON`);
	}
	if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
		throw new Error(`${label} must be a JSON object`);
	}
	return parsed as Record<string, unknown>;
}

async function hmacSha256(secret: string, data: string): Promise<Uint8Array> {
	const key = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
	return new Uint8Array(signature);
}

export async function run(input: JwtEncoderInput): Promise<JwtEncoderOutput> {
	try {
		const header = parseJsonObject(input.headerJson, 'Header');
		const payload = parseJsonObject(input.payloadJson, 'Payload');

		const finalHeader = { ...header, alg: input.algorithm };
		const headerB64 = base64UrlFromString(JSON.stringify(finalHeader));
		const payloadB64 = base64UrlFromString(JSON.stringify(payload));
		const signingInput = `${headerB64}.${payloadB64}`;

		if (input.algorithm === 'none') {
			return { token: `${signingInput}.` };
		}

		if (!input.secret) {
			throw new Error('Enter a secret to sign with HS256');
		}

		const signature = await hmacSha256(input.secret, signingInput);
		return { token: `${signingInput}.${base64UrlFromBytes(signature)}` };
	} catch (err) {
		return { token: '', error: err instanceof Error ? err.message : 'Failed to encode token' };
	}
}

export const jwtEncoder: ToolDefinition<JwtEncoderInput, JwtEncoderOutput> = {
	id: 'jwt-encoder',
	version: '1.0.0',
	category: 'developer',
	mode: 'instant',
	status: 'stable',
	tags: ['jwt', 'encode', 'token', 'hs256'],
	// Signing secrets are sensitive — no share capability or share URL params.
	capabilities: ['copy', 'reset', 'favorite'],
	workflow: {
		next: ['jwt-decoder', 'hash-generator']
	},
	metadata: {
		name: 'JWT Encoder',
		title: 'JWT Encoder — Sign a JSON Web Token locally (HS256 or none)',
		description:
			'Build and sign a JSON Web Token from header and payload JSON using HS256 (HMAC-SHA256) or the "none" algorithm — entirely in your browser.',
		keywords: ['jwt encoder', 'encode jwt', 'sign jwt', 'hs256 jwt', 'create json web token'],
		related: ['jwt-decoder', 'hash-generator', 'base64-codec'],
		faq: [
			{
				question: 'Is this safe for production secrets?',
				answer:
					'Treat this as a debugging and learning tool, not a production signer. The secret and signature are computed locally in your browser via the Web Crypto API and never leave your device, but you should still avoid pasting real production secrets into any browser tool casually.'
			},
			{
				question: 'What does the "none" algorithm do?',
				answer:
					'It produces an unsigned token in the form "header.payload." with an empty signature segment. Most JWT libraries reject "none" tokens by default — it exists here for testing and demonstration only.'
			},
			{
				question: 'How is the signature created?',
				answer:
					'For HS256, the header and payload are base64url-encoded, joined with a period, and signed using HMAC-SHA256 with your secret via crypto.subtle.sign — all locally, with no network request.'
			}
		],
		howTo: [
			'Edit the header and payload JSON',
			'Choose "none" or HS256 and enter a secret',
			'Copy the generated token'
		]
	},
	validation: { input: inputSchema },
	run,
	ui: {
		component: () => import('./ui.svelte')
	},
	analytics: { eventName: 'tool_run', props: ['algorithm'] }
};
