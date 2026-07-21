<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button, Container, SeoHead, JsonLd } from '$ui';
	import ToolCard from '$ui/catalog/ToolCard.svelte';
	import { site } from '$lib/config/site';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<SeoHead seo={data.seo} />
</svelte:head>

<JsonLd data={data.jsonLd} />

<main id="main">
	<section class="relative isolate min-h-[min(92dvh,44rem)] overflow-hidden border-b border-border">
		<div
			class="animate-fade pointer-events-none absolute inset-0"
			style="background:
				radial-gradient(ellipse 90% 70% at 50% -10%, color-mix(in oklab, var(--color-accent) 22%, transparent), transparent 58%),
				radial-gradient(ellipse 50% 45% at 100% 30%, color-mix(in oklab, var(--color-info) 14%, transparent), transparent 55%),
				radial-gradient(ellipse 40% 40% at 0% 80%, color-mix(in oklab, var(--color-accent) 10%, transparent), transparent 50%),
				linear-gradient(180deg, color-mix(in oklab, var(--color-bg-elevated) 70%, transparent), var(--color-bg));"
			aria-hidden="true"
		></div>
		<div
			class="pointer-events-none absolute inset-0 [background-image:url('data:image/svg+xml,%3Csvg_viewBox=%270_0_256_256%27_xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter_id=%27n%27%3E%3CfeTurbulence_type=%27fractalNoise%27_baseFrequency=%270.85%27_numOctaves=%274%27_stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect_width=%27100%25%27_height=%27100%25%27_filter=%27url(%23n)%27/%3E%3C/svg%3E')] opacity-[0.04]"
			aria-hidden="true"
		></div>

		<Container
			class="relative flex min-h-[min(92dvh,44rem)] flex-col justify-center py-20 sm:py-28"
		>
			<h1
				class="animate-rise font-display text-5xl font-semibold tracking-tight text-fg sm:text-7xl md:text-8xl"
			>
				{site.name}
			</h1>
			<p
				class="animate-rise-delay-1 mt-4 max-w-2xl font-display text-2xl font-medium tracking-tight text-balance text-fg sm:text-3xl md:text-4xl"
			>
				{site.tagline}
			</p>
			<p class="animate-rise-delay-2 mt-4 max-w-lg text-lg text-pretty text-muted">
				Format, convert, and generate—privately in your browser. Free tools without the noise.
			</p>
			<div class="animate-rise-delay-2 mt-10 flex flex-wrap gap-3">
				<Button href="/tools" size="lg">Browse tools</Button>
				<Button href="/search" variant="secondary" size="lg">Search</Button>
			</div>
		</Container>
	</section>

	<Container as="section" class="py-16 sm:py-20" aria-labelledby="featured-heading">
		<div class="flex flex-wrap items-end justify-between gap-4">
			<div>
				<h2
					id="featured-heading"
					class="font-display text-2xl font-semibold tracking-tight sm:text-3xl"
				>
					Popular tools
				</h2>
				<p class="mt-2 text-muted">Start with the tools people open every day.</p>
			</div>
			<a href={resolve('/tools')} class="text-sm font-medium text-accent hover:underline"
				>View all tools</a
			>
		</div>

		<ul class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.featured as tool (tool.id)}
				<li>
					<ToolCard
						id={tool.id}
						name={tool.name}
						description={tool.description}
						category={tool.category}
					/>
				</li>
			{/each}
		</ul>
	</Container>

	<section class="border-y border-border bg-bg-elevated/50">
		<Container class="py-16 sm:py-20" aria-labelledby="packs-heading">
			<h2 id="packs-heading" class="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
				Tool packs
			</h2>
			<p class="mt-2 max-w-xl text-muted">Curated sets for common jobs—no account required.</p>

			<ul class="mt-10 grid gap-6 lg:grid-cols-3">
				{#each data.collections as pack (pack.id)}
					<li id="pack-{pack.id}" class="flex scroll-mt-24 flex-col">
						<h3 class="font-display text-xl font-semibold tracking-tight">{pack.name}</h3>
						<p class="mt-2 flex-1 text-sm text-pretty text-muted">{pack.description}</p>
						<ul class="mt-5 space-y-2">
							{#each pack.tools as tool (tool.id)}
								<li>
									<a
										href={resolve(`/tools/${tool.id}`)}
										class="text-sm font-medium text-fg no-underline hover:text-accent"
										>{tool.name}</a
									>
								</li>
							{/each}
						</ul>
					</li>
				{/each}
			</ul>
		</Container>
	</section>

	<Container as="section" class="py-16 sm:py-20" aria-labelledby="why-heading">
		<h2 id="why-heading" class="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
			Built for getting things done
		</h2>
		<ul class="mt-10 grid gap-8 sm:grid-cols-3">
			<li>
				<p class="font-display text-lg font-semibold">Private by default</p>
				<p class="mt-2 text-sm text-pretty text-muted">
					Most tools run entirely in your browser. Your text and files stay on your device.
				</p>
			</li>
			<li>
				<p class="font-display text-lg font-semibold">Shareable settings</p>
				<p class="mt-2 text-sm text-pretty text-muted">
					Many text and data tools let you copy a link with your options—handy for docs and
					teammates. File tools stay local (no URL payloads).
				</p>
			</li>
			<li>
				<p class="font-display text-lg font-semibold">Always free</p>
				<p class="mt-2 text-sm text-pretty text-muted">
					No subscriptions. No API keys. Just open a tool and finish the task.
				</p>
			</li>
		</ul>
	</Container>
</main>
