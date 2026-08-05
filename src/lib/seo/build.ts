import { site } from '$lib/config/site';
import type { PageMetadata } from './types';
import type { FaqItem, ToolDefinition } from '$engine/types';

/** Default social preview path under /static — absolute via site URL in buildSeo. */
export const DEFAULT_OG_IMAGE_PATH = '/og-default.png';

export type BuiltSeo = {
	title: string;
	description: string;
	canonical: string;
	robots?: string;
	keywords?: string;
	openGraph: {
		title: string;
		description: string;
		url: string;
		type: string;
		siteName: string;
		image?: string;
	};
	twitter: {
		card: 'summary_large_image' | 'summary';
		title: string;
		description: string;
		image?: string;
	};
};

function absoluteUrl(path: string, siteUrl?: string) {
	const base = (siteUrl ?? '').replace(/\/$/, '');
	if (!base) return path;
	return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export function buildSeo(page: PageMetadata, siteUrl?: string): BuiltSeo {
	const title = page.title.includes(site.name)
		? page.title
		: site.defaultTitleTemplate.replace('%s', page.title);
	const canonical = absoluteUrl(page.canonicalPath, siteUrl);
	const imagePath = page.og?.image ?? DEFAULT_OG_IMAGE_PATH;
	const image = absoluteUrl(imagePath, siteUrl);
	const absoluteImage = Boolean(siteUrl) || /^https?:\/\//i.test(image);

	return {
		title,
		description: page.description,
		canonical,
		robots: page.robots,
		keywords: page.keywords?.join(', '),
		openGraph: {
			title: page.og?.title ?? title,
			description: page.og?.description ?? page.description,
			url: canonical,
			type: page.og?.type ?? 'website',
			siteName: site.name,
			image
		},
		twitter: {
			card: absoluteImage ? (page.twitter?.card ?? 'summary_large_image') : 'summary',
			title: page.twitter?.title ?? title,
			description: page.twitter?.description ?? page.description,
			image: page.twitter?.image ? absoluteUrl(page.twitter.image, siteUrl) : image
		}
	};
}

export function toolToPageMetadata(tool: ToolDefinition): PageMetadata {
	return {
		title: tool.metadata.title,
		description: tool.metadata.description,
		canonicalPath: `/tools/${tool.id}`,
		keywords: tool.metadata.keywords,
		robots: tool.seo?.noindex ? 'noindex,nofollow' : tool.seo?.robots,
		og: {
			title: tool.metadata.title,
			description: tool.metadata.description,
			type: 'website',
			image: tool.seo?.ogImage
		}
	};
}

export function jsonLdWebsite(siteUrl: string) {
	const base = siteUrl.replace(/\/$/, '');
	return {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: site.name,
		url: base,
		description: site.tagline,
		potentialAction: {
			'@type': 'SearchAction',
			target: {
				'@type': 'EntryPoint',
				urlTemplate: `${base}/search?q={search_term_string}`
			},
			'query-input': 'required name=search_term_string'
		}
	};
}

export function jsonLdOrganization(siteUrl: string) {
	const base = siteUrl.replace(/\/$/, '');
	return {
		'@context': 'https://schema.org',
		'@type': 'Organization',
		name: site.name,
		url: base,
		logo: {
			'@type': 'ImageObject',
			url: `${base}/logo-1.png`
		}
	};
}

export function jsonLdItemList(
	items: { name: string; path: string; description?: string }[],
	siteUrl: string,
	opts?: { name?: string; description?: string; path?: string }
) {
	if (!items.length) return null;
	const list = {
		'@context': 'https://schema.org',
		'@type': 'ItemList',
		numberOfItems: items.length,
		itemListElement: items.map((item, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: item.name,
			url: absoluteUrl(item.path, siteUrl),
			...(item.description ? { description: item.description } : {})
		}))
	};
	if (!opts?.name && !opts?.path) return list;
	return {
		'@context': 'https://schema.org',
		'@type': 'CollectionPage',
		name: opts.name,
		description: opts.description,
		url: opts.path ? absoluteUrl(opts.path, siteUrl) : undefined,
		mainEntity: list
	};
}

export function jsonLdWebApplication(tool: ToolDefinition, siteUrl: string) {
	return {
		'@context': 'https://schema.org',
		'@type': 'WebApplication',
		name: tool.metadata.name,
		description: tool.metadata.description,
		url: absoluteUrl(`/tools/${tool.id}`, siteUrl),
		applicationCategory: 'UtilitiesApplication',
		operatingSystem: 'Any',
		offers: {
			'@type': 'Offer',
			price: '0',
			priceCurrency: 'USD'
		}
	};
}

export function jsonLdFaq(faq: FaqItem[]) {
	if (!faq.length) return null;
	return {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: faq.map((item) => ({
			'@type': 'Question',
			name: item.question,
			acceptedAnswer: {
				'@type': 'Answer',
				text: item.answer
			}
		}))
	};
}

export function jsonLdHowTo(name: string, steps: string[], siteUrl: string, path: string) {
	if (!steps.length) return null;
	return {
		'@context': 'https://schema.org',
		'@type': 'HowTo',
		name: `How to use ${name}`,
		url: absoluteUrl(path, siteUrl),
		step: steps.map((text, index) => ({
			'@type': 'HowToStep',
			position: index + 1,
			text
		}))
	};
}

export function jsonLdBreadcrumb(items: { name: string; path: string }[], siteUrl: string) {
	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: items.map((item, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: item.name,
			item: absoluteUrl(item.path, siteUrl)
		}))
	};
}
