import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';
import { toSlug } from '$lib/utils/string';

export const inputSchema = v.object({
	text: v.pipe(v.string(), v.minLength(1, 'Enter text to slugify'))
});

export type SlugifyInput = v.InferOutput<typeof inputSchema>;
export type SlugifyOutput = { slug: string };

export function run(input: SlugifyInput): SlugifyOutput {
	return { slug: toSlug(input.text) };
}

export const slugify: ToolDefinition<SlugifyInput, SlugifyOutput> = {
	id: 'slugify',
	version: '1.0.0',
	category: 'text',
	mode: 'instant',
	status: 'stable',
	tags: ['slug', 'url', 'text', 'seo'],
	capabilities: ['copy', 'share', 'reset', 'favorite'],
	share: {
		params: ['text']
	},
	presets: [
		{
			id: 'blog-post',
			label: 'Blog post title',
			params: { text: '10 Ways to Speed Up Your SvelteKit App in 2026' }
		},
		{
			id: 'how-to',
			label: 'How-to guide',
			params: { text: 'How to Build a Privacy-First Developer Toolkit' }
		},
		{
			id: 'product',
			label: 'Product launch',
			params: { text: 'Introducing HeyTools: Instant Browser Utilities' }
		}
	],
	workflow: {
		next: ['case-converter', 'url-codec']
	},
	metadata: {
		name: 'Slugify',
		title: 'Slugify — Turn titles into URL-friendly slugs',
		description:
			'Convert blog titles, product names, and headings into clean kebab-case slugs for URLs, filenames, and IDs. Instant, private, and free in your browser.',
		keywords: ['slugify', 'url slug', 'kebab-case', 'permalink generator', 'SEO slug'],
		related: ['case-converter', 'url-codec'],
		faq: [
			{
				question: 'What characters are allowed in the output?',
				answer:
					'Slugs use lowercase letters, numbers, and hyphens only. Spaces and punctuation are normalized into separators.'
			},
			{
				question: 'Is my title uploaded?',
				answer:
					'No. Slug generation runs entirely in your browser—useful for draft post titles you are not ready to publish.'
			},
			{
				question: 'Can I use this for filenames and IDs?',
				answer:
					'Yes. The same kebab-case output works well for static paths, asset names, and readable resource IDs. Encode reserved characters separately with URL Encoder if you need percent-encoding.'
			}
		],
		howTo: [
			'Paste a title or phrase',
			'Copy the generated slug',
			'Use it in a URL path, filename, or ID'
		]
	},
	validation: { input: inputSchema },
	run,
	ui: { component: () => import('./ui.svelte') },
	analytics: { eventName: 'tool_run' }
};
