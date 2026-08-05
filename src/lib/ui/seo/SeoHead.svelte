<script lang="ts">
	import type { BuiltSeo } from '$seo';

	type Props = {
		seo: BuiltSeo;
	};

	let { seo }: Props = $props();
</script>

<title>{seo.title}</title>
<meta name="description" content={seo.description} />
<link rel="canonical" href={seo.canonical} />
{#if seo.robots}
	<meta name="robots" content={seo.robots} />
{/if}
{#if seo.keywords}
	<meta name="keywords" content={seo.keywords} />
{/if}
<meta property="og:title" content={seo.openGraph.title} />
<meta property="og:description" content={seo.openGraph.description} />
<meta property="og:url" content={seo.openGraph.url} />
<meta property="og:type" content={seo.openGraph.type} />
<meta property="og:site_name" content={seo.openGraph.siteName} />
{#if seo.openGraph.image}
	<meta property="og:image" content={seo.openGraph.image} />
	<meta property="og:image:width" content="1536" />
	<meta property="og:image:height" content="1024" />
{/if}
<meta property="og:locale" content="en_US" />
<meta name="twitter:card" content={seo.twitter.card} />
<meta name="twitter:title" content={seo.twitter.title} />
<meta name="twitter:description" content={seo.twitter.description} />
{#if seo.twitter.image}
	<meta name="twitter:image" content={seo.twitter.image} />
{/if}
