export { getBackgroundRemovalAssetPath } from './config';
export { isBrowserAiRemovalSupported } from './support';
export {
	beginBackgroundRemovalGeneration,
	cancelBackgroundRemovalJobs,
	getActiveBackgroundRemovalGeneration,
	isBackgroundRemovalModelReady,
	prepareImageForAiRemoval,
	removeBackgroundWithAi,
	type AiRemovalProgress,
	type AiRemovalProgressPhase,
	type RemoveBackgroundAiOptions
} from './client';
