import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

export const inputSchema = v.object({
	dataUrl: v.string(),
	fileName: v.optional(v.string(), 'image')
});

export type ImageToBase64Input = v.InferOutput<typeof inputSchema>;
export type ImageToBase64Output = {
	dataUrl: string;
	base64: string;
	css: string;
	html: string;
};

export function run(input: ImageToBase64Input): ImageToBase64Output {
	const dataUrl = input.dataUrl;
	const comma = dataUrl.indexOf(',');
	const base64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
	return {
		dataUrl,
		base64,
		css: `background-image: url(${dataUrl});`,
		html: `<img src="${dataUrl}" alt="${input.fileName ?? 'image'}" />`
	};
}

export const imageToBase64: ToolDefinition<ImageToBase64Input, ImageToBase64Output> = {
	id: 'image-to-base64',
	version: '1.0.0',
	category: 'image',
	mode: 'instant',
	status: 'stable',
	tags: ['image', 'base64', 'data-uri', 'encode'],
	capabilities: ['copy', 'download', 'reset', 'favorite'],
	workflow: {
		next: ['image-converter', 'image-compressor', 'svg-optimizer']
	},
	file: {
		maxBytes: 2 * 1024 * 1024,
		accept: 'image/png,image/jpeg,image/gif,image/webp,image/svg+xml',
		mimeAllowlist: ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'],
		extensions: ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']
	},
	metadata: {
		name: 'Image to Base64',
		title: 'Image to Base64 — Convert images to Data URI',
		description:
			'Convert PNG, JPEG, GIF, WebP, or SVG images to Base64 and Data URI strings. Files stay in your browser.',
		keywords: ['image to base64', 'data uri', 'base64 image'],
		related: ['base64-codec', 'color-converter'],
		faq: [
			{
				question: 'Is my image uploaded?',
				answer: 'No. Conversion happens locally in your browser. Max size is 2 MB.'
			},
			{
				question: 'What output formats are available?',
				answer: 'Data URI, raw Base64, CSS background snippet, and an HTML img tag.'
			},
			{
				question: 'Which image types are supported?',
				answer: 'PNG, JPEG, GIF, WebP, and SVG files up to 2 MB.'
			}
		],
		howTo: ['Upload an image file', 'View Data URI and Base64 output', 'Copy the format you need']
	},
	validation: { input: inputSchema },
	run,
	ui: { component: () => import('./ui.svelte') },
	analytics: { eventName: 'tool_run' }
};
