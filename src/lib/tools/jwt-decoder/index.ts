import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

export const inputSchema = v.object({
	token: v.pipe(v.string(), v.minLength(10, 'Paste a JWT'))
});

export type JwtInput = v.InferOutput<typeof inputSchema>;
export type JwtOutput = {
	header: string;
	payload: string;
	error?: string;
};

/** Demo token for local reset only — never shared via URL. */
export const DEMO_JWT =
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlRvb2xIdWIiLCJpYXQiOjE1MTYyMzkwMjJ9.signature';

function decodePart(part: string) {
	const normalized = part.replace(/-/g, '+').replace(/_/g, '/');
	const pad = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
	const json = atob(normalized + pad);
	return JSON.stringify(JSON.parse(json), null, 2);
}

export function run(input: JwtInput): JwtOutput {
	try {
		const parts = input.token.trim().split('.');
		if (parts.length < 2) throw new Error('JWT must have at least header and payload');
		return {
			header: decodePart(parts[0]!),
			payload: decodePart(parts[1]!)
		};
	} catch (err) {
		return {
			header: '',
			payload: '',
			error: err instanceof Error ? err.message : 'Invalid JWT'
		};
	}
}

export const jwtDecoder: ToolDefinition<JwtInput, JwtOutput> = {
	id: 'jwt-decoder',
	version: '1.0.0',
	category: 'developer',
	mode: 'instant',
	status: 'stable',
	tags: ['jwt', 'token', 'decode', 'dev'],
	// Tokens are sensitive — no share capability or share URL params.
	capabilities: ['copy', 'reset', 'favorite'],
	workflow: {
		next: ['json-formatter', 'base64-codec']
	},
	metadata: {
		name: 'JWT Decoder',
		title: 'JWT Decoder — Inspect header and payload locally',
		description:
			'Decode a JSON Web Token’s header and payload in your browser for debugging claims and expiry. Signatures are not verified, and tokens are never uploaded or shared via URL.',
		keywords: ['jwt decoder', 'decode jwt', 'json web token', 'jwt payload', 'inspect jwt'],
		related: ['base64-codec', 'json-formatter', 'hash-generator'],
		faq: [
			{
				question: 'Does this verify the signature?',
				answer:
					'No. It only Base64URL-decodes the header and payload so you can inspect claims. Signature verification belongs in your auth server or library with the correct secret or key.'
			},
			{
				question: 'Is my token sent to a server?',
				answer:
					'No. Decoding happens entirely in your browser. Prefer that when debugging real access or refresh tokens.'
			},
			{
				question: 'Can I share a JWT via URL?',
				answer:
					'No. Share links are disabled for this tool so tokens are not written into the address bar or history.'
			}
		],
		howTo: [
			'Paste a JWT',
			'Inspect the decoded header and payload',
			'Copy fields you need—do not share live tokens'
		]
	},
	validation: { input: inputSchema },
	run,
	ui: { component: () => import('./ui.svelte') },
	analytics: { eventName: 'tool_run' }
};
