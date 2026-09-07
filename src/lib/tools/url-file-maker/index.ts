import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

const WINDOWS_BAD_CHARS = /[\\/:*?"<>|]+/g;

export const inputSchema = v.object({
	url: v.pipe(v.string(), v.minLength(1, 'Enter a URL')),
	fileName: v.optional(v.string(), '')
});

export type UrlFileMakerInput = v.InferOutput<typeof inputSchema>;
export type UrlFileMakerOutput = {
	content: string;
	fileName: string;
	zipFileName: string;
	error?: string;
};

/** Normalize user input into a downloadable `.url` basename (no path). */
export function sanitizeUrlFileName(raw: string, fallbackHost = 'shortcut'): string {
	let name = raw.trim().replace(/\.url$/i, '');
	name = name.replace(WINDOWS_BAD_CHARS, '-').replace(/\s+/g, ' ').trim();
	name = name.replace(/^\.+/, '').replace(/\.+$/, '');
	if (!name) {
		const safeHost = fallbackHost.replace(WINDOWS_BAD_CHARS, '-').replace(/^\.+/, '') || 'shortcut';
		name = safeHost;
	}
	return `${name}.url`;
}

function normalizeUrl(raw: string): { url: string; error?: string } {
	const trimmed = raw.trim();
	if (!trimmed) return { url: '', error: 'Enter a URL' };

	let candidate = trimmed;
	if (!/^[a-z][a-z0-9+.-]*:/i.test(candidate)) {
		candidate = `https://${candidate}`;
	}

	try {
		const parsed = new URL(candidate);
		if (!parsed.hostname) {
			return { url: '', error: 'Enter a valid URL with a host (e.g. https://example.com)' };
		}
		return { url: parsed.toString() };
	} catch {
		return { url: '', error: 'Enter a valid URL (e.g. https://example.com)' };
	}
}

/** Build a Windows Internet Shortcut (`.url`) file body. */
export function buildUrlFileContent(url: string): string {
	return `[InternetShortcut]\r\nURL=${url}\r\n`;
}

/** ZIP wraps the `.url` so Chromium/Edge won’t rename it to `.download`. */
export async function buildUrlShortcutZip(fileName: string, content: string): Promise<Blob> {
	const JSZip = (await import('jszip')).default;
	const zip = new JSZip();
	zip.file(fileName, content);
	return zip.generateAsync({ type: 'blob' });
}

export function run(input: UrlFileMakerInput): UrlFileMakerOutput {
	const { url, error } = normalizeUrl(input.url);
	if (error || !url) {
		return {
			content: '',
			fileName: 'shortcut.url',
			zipFileName: 'shortcut.zip',
			error: error ?? 'Enter a URL'
		};
	}

	let host = 'shortcut';
	try {
		host = new URL(url).hostname.replace(/^www\./i, '') || 'shortcut';
	} catch {
		/* keep default */
	}

	const fileName = sanitizeUrlFileName(input.fileName ?? '', host);
	const zipFileName = fileName.replace(/\.url$/i, '') + '.zip';
	return {
		content: buildUrlFileContent(url),
		fileName,
		zipFileName
	};
}

export const urlFileMaker: ToolDefinition<UrlFileMakerInput, UrlFileMakerOutput> = {
	id: 'url-file-maker',
	version: '1.0.0',
	category: 'generators',
	mode: 'instant',
	status: 'stable',
	tags: ['url', 'shortcut', 'internet shortcut', 'windows', 'link', 'generator'],
	capabilities: ['copy', 'share', 'reset', 'favorite'],
	share: {
		params: ['url', 'fileName']
	},
	presets: [
		{
			id: 'heytools',
			label: 'HeyTools example',
			params: { url: 'https://heytools.app', fileName: 'HeyTools' }
		},
		{
			id: 'docs',
			label: 'Example docs link',
			params: { url: 'https://example.com/docs', fileName: 'Example Docs' }
		}
	],
	workflow: {
		next: ['url-parser', 'qr-code-generator', 'url-codec']
	},
	metadata: {
		name: 'URL File Maker',
		title: 'URL File Maker — Create Windows .url Internet Shortcuts',
		description:
			'Create a Windows .url Internet Shortcut file from any link. Download a desktop-ready shortcut locally in your browser—no upload required.',
		keywords: [
			'url file maker',
			'url shortcut',
			'internet shortcut',
			'create .url file',
			'windows url file',
			'desktop shortcut generator'
		],
		related: ['url-parser', 'qr-code-generator', 'url-codec'],
		faq: [
			{
				question: 'What is a .url file?',
				answer:
					'A Windows Internet Shortcut. Double-clicking it opens the saved URL in your default browser. You can also pin it to the desktop or taskbar.'
			},
			{
				question: 'Does this work on Mac or Linux?',
				answer:
					'The file is a Windows format. You can still create and download it anywhere; opening the shortcut is primarily for Windows.'
			},
			{
				question: 'Why is the download a ZIP?',
				answer:
					'Chrome and Edge often rename or block direct .url downloads for security (you may see a .download file). The ZIP keeps a real .url inside — extract it, then double-click.'
			},
			{
				question: 'Does my URL leave the browser?',
				answer: 'No. The .url file is built locally. Nothing is uploaded to our servers.'
			}
		],
		howTo: [
			'Paste or type the website URL',
			'Optionally set a file name for the shortcut',
			'Download the ZIP, extract the .url file, and open it on Windows'
		]
	},
	validation: { input: inputSchema },
	run,
	ui: { component: () => import('./ui.svelte') },
	analytics: { eventName: 'tool_run' }
};
