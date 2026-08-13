import * as v from 'valibot';
import { env as publicEnv } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';

const publicSchema = v.object({
	PUBLIC_SITE_URL: v.optional(v.pipe(v.string(), v.url())),
	PUBLIC_SUPABASE_URL: v.optional(v.pipe(v.string(), v.url())),
	PUBLIC_SUPABASE_ANON_KEY: v.optional(v.string()),
	PUBLIC_ADS_ENABLED: v.optional(v.string()),
	PUBLIC_FF_AUTH: v.optional(v.string()),
	/** Base URL for self-hosted @imgly/background-removal WASM/ONNX assets (trailing slash optional). */
	PUBLIC_BACKGROUND_REMOVAL_ASSET_PATH: v.optional(v.string())
});

const privateSchema = v.object({
	SUPABASE_SERVICE_ROLE_KEY: v.optional(v.string()),
	LOG_LEVEL: v.optional(v.picklist(['debug', 'info', 'warn', 'error']))
});

export type PublicEnv = v.InferOutput<typeof publicSchema>;
export type PrivateEnv = v.InferOutput<typeof privateSchema>;

let cached: { public: PublicEnv; private: PrivateEnv } | null = null;

export function validateEnv() {
	if (cached) return cached;

	const publicResult = v.safeParse(publicSchema, {
		PUBLIC_SITE_URL: publicEnv.PUBLIC_SITE_URL,
		PUBLIC_SUPABASE_URL: publicEnv.PUBLIC_SUPABASE_URL,
		PUBLIC_SUPABASE_ANON_KEY: publicEnv.PUBLIC_SUPABASE_ANON_KEY,
		PUBLIC_ADS_ENABLED: publicEnv.PUBLIC_ADS_ENABLED,
		PUBLIC_FF_AUTH: publicEnv.PUBLIC_FF_AUTH,
		PUBLIC_BACKGROUND_REMOVAL_ASSET_PATH: publicEnv.PUBLIC_BACKGROUND_REMOVAL_ASSET_PATH
	});

	const privateResult = v.safeParse(privateSchema, {
		SUPABASE_SERVICE_ROLE_KEY: privateEnv.SUPABASE_SERVICE_ROLE_KEY,
		LOG_LEVEL: privateEnv.LOG_LEVEL
	});

	if (!publicResult.success || !privateResult.success) {
		const issues = [
			...(publicResult.success ? [] : publicResult.issues),
			...(privateResult.success ? [] : privateResult.issues)
		];
		const detail = issues
			.map((i) => `${i.path?.map((p) => p.key).join('.')}: ${i.message}`)
			.join('; ');
		throw new Error(`Invalid environment configuration: ${detail}`);
	}

	cached = { public: publicResult.output, private: privateResult.output };
	return cached;
}

export function getPublicEnv() {
	return validateEnv().public;
}

export function getPrivateEnv() {
	return validateEnv().private;
}
