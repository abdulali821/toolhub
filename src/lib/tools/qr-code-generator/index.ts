import type { ToolDefinition } from '$engine/types';
import QRCode from 'qrcode';
import * as v from 'valibot';

export const inputSchema = v.object({
	text: v.pipe(v.string(), v.minLength(1, 'Enter text or a URL')),
	size: v.pipe(v.number(), v.integer(), v.minValue(64), v.maxValue(1024))
});

export type QrCodeGeneratorInput = v.InferOutput<typeof inputSchema>;
export type QrCodeGeneratorOutput = { dataUrl: string };

export async function run(input: QrCodeGeneratorInput): Promise<QrCodeGeneratorOutput> {
	const dataUrl = await QRCode.toDataURL(input.text, {
		width: input.size,
		margin: 2,
		errorCorrectionLevel: 'M'
	});
	return { dataUrl };
}

export const qrCodeGenerator: ToolDefinition<QrCodeGeneratorInput, QrCodeGeneratorOutput> = {
	id: 'qr-code-generator',
	version: '1.0.0',
	category: 'generators',
	mode: 'instant',
	status: 'stable',
	tags: ['qr', 'qrcode', 'generator', 'barcode'],
	capabilities: ['copy', 'download', 'share', 'reset', 'favorite'],
	share: {
		params: ['text', 'size']
	},
	workflow: {
		next: ['barcode-generator', 'password-generator']
	},
	metadata: {
		name: 'QR Code Generator',
		title: 'QR Code Generator — Create QR codes from text or URLs',
		description:
			'Generate PNG QR codes from any text or URL. Adjust size, preview instantly, and download—everything runs locally in your browser.',
		keywords: ['qr code generator', 'create qr code', 'url qr code', 'qr png'],
		related: ['barcode-generator', 'password-generator', 'uuid-generator', 'url-codec'],
		faq: [
			{
				question: 'Is my content uploaded?',
				answer:
					'No. QR codes are rendered locally with the qrcode library and never sent to a server.'
			},
			{
				question: 'What can I encode?',
				answer:
					'Any text—URLs, Wi-Fi strings, contact cards, or plain messages up to the QR capacity for the chosen size.'
			}
		],
		howTo: ['Enter text or a URL', 'Adjust the QR code size', 'Download or copy the image']
	},
	validation: { input: inputSchema },
	run,
	ui: {
		component: () => import('./ui.svelte')
	},
	analytics: { eventName: 'tool_run', props: ['size'] }
};
