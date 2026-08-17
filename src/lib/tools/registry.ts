import { clearRegistry, registerTool } from '$engine/registry';
import type { ToolDefinition } from '$engine/types';
import { jsonFormatter } from './json-formatter';
import { uuidGenerator } from './uuid-generator';
import { passwordGenerator } from './password-generator';
import { wordCounter } from './word-counter';
import { caseConverter } from './case-converter';
import { slugify } from './slugify';
import { loremIpsum } from './lorem-ipsum';
import { base64Codec } from './base64-codec';
import { urlCodec } from './url-codec';
import { hashGenerator } from './hash-generator';
import { timestampConverter } from './timestamp-converter';
import { colorConverter } from './color-converter';
import { jwtDecoder } from './jwt-decoder';
import { htmlCodec } from './html-codec';
import { numberBaseConverter } from './number-base-converter';
import { textDiff } from './text-diff';
import { csvJsonConverter } from './csv-json-converter';
import { regexTester } from './regex-tester';
import { markdownPreview } from './markdown-preview';
import { imageToBase64 } from './image-to-base64';
import { findReplace } from './find-replace';
import { lineSort } from './line-sort';
import { duplicateLineRemover } from './duplicate-line-remover';
import { randomNumber } from './random-number';
import { percentageCalculator } from './percentage-calculator';
import { jsonValidator } from './json-validator';
import { jsonMinifier } from './json-minifier';
import { jsonCompare } from './json-compare';
import { jsonToYaml } from './json-to-yaml';
import { yamlToJson } from './yaml-to-json';
import { removeEmptyLines } from './remove-empty-lines';
import { trimLines } from './trim-lines';
import { addPrefixSuffix } from './add-prefix-suffix';
import { whitespaceCleaner } from './whitespace-cleaner';
import { sqlFormatter } from './sql-formatter';
import { yamlFormatter } from './yaml-formatter';
import { yamlValidator } from './yaml-validator';
import { xmlFormatter } from './xml-formatter';
import { qrCodeGenerator } from './qr-code-generator';
import { randomStringGenerator } from './random-string-generator';
import { fakeDataGenerator } from './fake-data-generator';
import { colorPicker } from './color-picker';
import { gradientGenerator } from './gradient-generator';
import { imageCompressor } from './image-compressor';
import { imageResizer } from './image-resizer';
import { pngToJpg } from './png-to-jpg';
import { jpgToWebp } from './jpg-to-webp';
import { pdfMerge } from './pdf-merge';
import { cropImage } from './crop-image';
import { rotateImage } from './rotate-image';
import { flipImage } from './flip-image';
import { jpgToPng } from './jpg-to-png';
import { webpToPng } from './webp-to-png';
import { webpToJpg } from './webp-to-jpg';
import { pngToWebp } from './png-to-webp';
import { svgOptimizer } from './svg-optimizer';
import { imageMetadata } from './image-metadata';
import { imageColorExtractor } from './image-color-extractor';
import { imageConverter } from './image-converter';
import { pdfSplit } from './pdf-split';
import { pdfCompress } from './pdf-compress';
import { pdfRotate } from './pdf-rotate';
import { pdfDeletePages } from './pdf-delete-pages';
import { pdfExtractPages } from './pdf-extract-pages';
import { pdfReorderPages } from './pdf-reorder-pages';
import { imagesToPdf } from './images-to-pdf';
import { pdfToImages } from './pdf-to-images';
import { pdfMetadata } from './pdf-metadata';
import { asciiConverter } from './ascii-converter';
import { binaryConverter } from './binary-converter';
import { hexCodec } from './hex-codec';
import { unicodeEscape } from './unicode-escape';
import { rot13 } from './rot13';
import { morseCodec } from './morse-codec';
import { contrastChecker } from './contrast-checker';
import { colorBlindnessSimulator } from './color-blindness-simulator';
import { barcodeGenerator } from './barcode-generator';
import { unitConverter } from './unit-converter';
import { cronGenerator } from './cron-generator';
import { dateCalculator } from './date-calculator';
import { jwtEncoder } from './jwt-encoder';
import { cssMinifier } from './css-minifier';
import { colorPaletteGenerator } from './color-palette-generator';
import { markdownToHtml } from './markdown-to-html';
import { aspectRatioCalculator } from './aspect-ratio-calculator';
import { nanoidGenerator } from './nanoid-generator';
import { readingTimeEstimator } from './reading-time-estimator';
import { boxShadowGenerator } from './box-shadow-generator';
import { urlParser } from './url-parser';
import { queryStringJson } from './query-string-json';
import { tipCalculator } from './tip-calculator';
import { bmiCalculator } from './bmi-calculator';
import { imageWatermark } from './image-watermark';
import { markdownToPdf } from './markdown-to-pdf';
import { cssAnimationGenerator } from './css-animation-generator';
import { faviconGenerator } from './favicon-generator';
import { timezoneMeetingPlanner } from './timezone-meeting-planner';
import { curlToFetch } from './curl-to-fetch';
import { csvViewer } from './csv-viewer';
import { keyboardTester } from './keyboard-tester';
import { glassmorphismGenerator } from './glassmorphism-generator';
import { deviceTester } from './device-tester';
import { backgroundRemover } from './background-remover';
import { imageTiler } from './image-tiler';
import { imageSplitter } from './image-splitter';
import { imageDivider } from './image-divider';

const tools = [
	jsonFormatter,
	uuidGenerator,
	passwordGenerator,
	wordCounter,
	caseConverter,
	slugify,
	loremIpsum,
	base64Codec,
	urlCodec,
	hashGenerator,
	timestampConverter,
	colorConverter,
	jwtDecoder,
	htmlCodec,
	numberBaseConverter,
	textDiff,
	csvJsonConverter,
	regexTester,
	markdownPreview,
	imageToBase64,
	findReplace,
	lineSort,
	duplicateLineRemover,
	randomNumber,
	percentageCalculator,
	jsonValidator,
	jsonMinifier,
	jsonCompare,
	jsonToYaml,
	yamlToJson,
	removeEmptyLines,
	trimLines,
	addPrefixSuffix,
	whitespaceCleaner,
	sqlFormatter,
	yamlFormatter,
	yamlValidator,
	xmlFormatter,
	qrCodeGenerator,
	randomStringGenerator,
	fakeDataGenerator,
	colorPicker,
	gradientGenerator,
	imageCompressor,
	imageResizer,
	pngToJpg,
	jpgToWebp,
	pdfMerge,
	cropImage,
	rotateImage,
	flipImage,
	jpgToPng,
	webpToPng,
	webpToJpg,
	pngToWebp,
	svgOptimizer,
	imageMetadata,
	imageColorExtractor,
	imageConverter,
	pdfSplit,
	pdfCompress,
	pdfRotate,
	pdfDeletePages,
	pdfExtractPages,
	pdfReorderPages,
	imagesToPdf,
	pdfToImages,
	pdfMetadata,
	asciiConverter,
	binaryConverter,
	hexCodec,
	unicodeEscape,
	rot13,
	morseCodec,
	contrastChecker,
	colorBlindnessSimulator,
	barcodeGenerator,
	unitConverter,
	cronGenerator,
	dateCalculator,
	jwtEncoder,
	cssMinifier,
	colorPaletteGenerator,
	markdownToHtml,
	aspectRatioCalculator,
	nanoidGenerator,
	readingTimeEstimator,
	boxShadowGenerator,
	urlParser,
	queryStringJson,
	tipCalculator,
	bmiCalculator,
	imageWatermark,
	markdownToPdf,
	cssAnimationGenerator,
	faviconGenerator,
	timezoneMeetingPlanner,
	curlToFetch,
	csvViewer,
	keyboardTester,
	glassmorphismGenerator,
	deviceTester,
	backgroundRemover,
	imageTiler,
	imageSplitter,
	imageDivider
] as const;

// Vite HMR re-executes this module while the engine Map may still hold prior entries.
clearRegistry();

for (const tool of tools) {
	registerTool(tool as ToolDefinition);
}

if (import.meta.hot) {
	import.meta.hot.accept();
}

export { tools };
export {
	getTool,
	listTools,
	relatedTools,
	requireTool,
	allToolIds,
	workflowNextTools
} from '$engine/registry';
