/**
 * Client-only configuration for @imgly/background-removal assets.
 * Set PUBLIC_BACKGROUND_REMOVAL_ASSET_PATH to self-host WASM/ONNX files
 * (must end with a trailing slash when used as publicPath).
 */
import { env } from '$env/dynamic/public';

/** Optional absolute or site-relative base URL for model + WASM assets. */
export function getBackgroundRemovalAssetPath(): string | undefined {
	const raw = env.PUBLIC_BACKGROUND_REMOVAL_ASSET_PATH?.trim();
	if (!raw) return undefined;
	return raw.endsWith('/') ? raw : `${raw}/`;
}
