export type PageMetadata = {
	title: string;
	description: string;
	canonicalPath: string;
	robots?: string;
	keywords?: string[];
	og?: {
		title?: string;
		description?: string;
		image?: string;
		type?: string;
	};
	twitter?: {
		card?: 'summary' | 'summary_large_image';
		title?: string;
		description?: string;
		image?: string;
	};
};
