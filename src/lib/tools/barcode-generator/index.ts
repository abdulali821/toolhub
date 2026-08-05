import type { ToolDefinition } from '$engine/types';
import JsBarcode from 'jsbarcode';
import * as v from 'valibot';

export const BARCODE_FORMATS = [
	'CODE128',
	'CODE39',
	'EAN13',
	'EAN8',
	'UPC',
	'ITF14',
	'codabar',
	'MSI'
] as const;

export type BarcodeFormat = (typeof BARCODE_FORMATS)[number];

export const inputSchema = v.object({
	value: v.pipe(v.string(), v.minLength(1, 'Enter a value to encode')),
	format: v.picklist(BARCODE_FORMATS),
	height: v.pipe(v.number(), v.integer(), v.minValue(40), v.maxValue(200)),
	barWidth: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(6)),
	displayValue: v.boolean()
});

export type BarcodeGeneratorInput = v.InferOutput<typeof inputSchema>;
export type BarcodeGeneratorOutput = { dataUrl: string };

export function run(input: BarcodeGeneratorInput): BarcodeGeneratorOutput {
	if (typeof document === 'undefined') {
		throw new Error('Barcode generation requires a browser environment');
	}

	const canvas = document.createElement('canvas');
	try {
		JsBarcode(canvas, input.value, {
			format: input.format,
			width: input.barWidth,
			height: input.height,
			displayValue: input.displayValue,
			margin: 10,
			background: '#ffffff',
			lineColor: '#000000'
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Invalid value for the selected format';
		throw new Error(message, { cause: err });
	}

	return { dataUrl: canvas.toDataURL('image/png') };
}

export const barcodeGenerator: ToolDefinition<BarcodeGeneratorInput, BarcodeGeneratorOutput> = {
	id: 'barcode-generator',
	version: '1.0.0',
	category: 'generators',
	mode: 'instant',
	status: 'stable',
	tags: ['barcode', 'generator', 'code128', 'ean', 'upc'],
	capabilities: ['copy', 'download', 'share', 'reset', 'favorite'],
	share: {
		params: ['value', 'format', 'height', 'barWidth', 'displayValue']
	},
	workflow: {
		next: ['qr-code-generator', 'password-generator']
	},
	metadata: {
		name: 'Barcode Generator',
		title: 'Barcode Generator — Create CODE128, EAN, UPC & more',
		description:
			'Generate PNG barcodes (CODE128, CODE39, EAN-13, EAN-8, UPC, and more) in your browser. Preview instantly and download—nothing is uploaded.',
		keywords: [
			'barcode generator',
			'code128 barcode',
			'ean13 generator',
			'upc barcode',
			'create barcode png'
		],
		related: ['qr-code-generator', 'password-generator', 'uuid-generator'],
		faq: [
			{
				question: 'Is my barcode data uploaded?',
				answer:
					'No. Barcodes are rendered locally with JsBarcode on a canvas in your browser and never sent to a server.'
			},
			{
				question: 'Which formats are supported?',
				answer:
					'CODE128, CODE39, EAN-13, EAN-8, UPC, ITF-14, Codabar, and MSI. Numeric retail formats (EAN/UPC) need the correct digit length; CODE128 accepts most text.'
			},
			{
				question: 'Why did generation fail for EAN or UPC?',
				answer:
					'Those formats require a specific number of digits (and a valid check digit when provided). Try CODE128 for free-form text, or use a valid product code.'
			}
		],
		howTo: [
			'Enter the value to encode',
			'Choose a barcode format',
			'Adjust height and bar width if needed',
			'Download or copy the PNG image'
		]
	},
	validation: { input: inputSchema },
	run,
	ui: {
		component: () => import('./ui.svelte')
	},
	analytics: { eventName: 'tool_run', props: ['format', 'height'] }
};
