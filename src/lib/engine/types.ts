import type { Component } from 'svelte';
import type { CategoryId } from '$lib/config/site';

export type ToolId = string;
export type ToolMode = 'instant' | 'form' | 'upload' | 'hybrid';
export type ToolStatus = 'stable' | 'beta' | 'deprecated';
export type ToolLayout = 'default' | 'split' | 'editor';

/** Shell action bar capabilities — enabled when declared on ToolDefinition. */
export type ToolCapability =
	'copy' | 'download' | 'share' | 'upload' | 'clipboard' | 'favorite' | 'history' | 'reset';

export type ToolPreset = {
	id: string;
	label: string;
	params: Record<string, string>;
};

export type ToolWorkflow = {
	next?: ToolId[];
	prev?: ToolId[];
};

export type ToolShareConfig = {
	/** Query param keys serialized to the URL for bookmark/share. */
	params: string[];
	maxParamBytes?: number;
};

export type FaqItem = {
	question: string;
	answer: string;
};

export type ToolMetadata = {
	name: string;
	title: string;
	description: string;
	keywords?: string[];
	related?: ToolId[];
	faq?: FaqItem[];
	howTo?: string[];
};

export type ToolSeoConfig = {
	robots?: string;
	noindex?: boolean;
	ogImage?: string;
};

export type ToolContext = {
	requestId?: string;
};

export type ToolDefinition<TInput = unknown, TOutput = unknown> = {
	id: ToolId;
	version: string;
	category: CategoryId;
	metadata: ToolMetadata;
	mode: ToolMode;
	tags: string[];
	status: ToolStatus;
	/** Shell actions the shared tool frame may render (copy, share, favorite, etc.). */
	capabilities?: ToolCapability[];
	/** Named URL param packs — no database. */
	presets?: ToolPreset[];
	/** Logical next/previous tools in a cross-tool workflow. */
	workflow?: ToolWorkflow;
	/** Declarative shareable URL state keys. */
	share?: ToolShareConfig;
	seo?: ToolSeoConfig;
	/** Declared for upload/hybrid tools; enforced in UI via Dropzone helpers. */
	file?: {
		maxBytes: number;
		accept?: string;
		mimeAllowlist?: string[];
		extensions?: string[];
	};
	/** Valibot schema (or any Standard Schema). Kept loose for plugin flexibility. */
	validation: {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		input: any;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		output?: any;
	};
	run: (input: TInput, ctx?: ToolContext) => Promise<TOutput> | TOutput;
	ui: {
		component: () => Promise<{ default: Component }>;
		layout?: ToolLayout;
	};
	shortcuts?: Record<string, string>;
	analytics?: { eventName: string; props?: string[] };
};

export type ToolSummary = {
	id: ToolId;
	name: string;
	title: string;
	description: string;
	category: CategoryId;
	tags: string[];
	status: ToolStatus;
	mode: ToolMode;
};
