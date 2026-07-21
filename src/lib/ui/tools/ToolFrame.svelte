<script lang="ts">
	import type { Snippet } from 'svelte';
	import Breadcrumb from '$ui/navigation/Breadcrumb.svelte';
	import Container from '$ui/layout/Container.svelte';
	import type { FaqItem, ToolCapability, ToolPreset, ToolSummary } from '$engine/types';
	import RelatedTools from '$ui/tools/RelatedTools.svelte';
	import ToolFaq from '$ui/tools/ToolFaq.svelte';
	import ToolHowTo from '$ui/tools/ToolHowTo.svelte';
	import ToolActionBar from '$ui/tools/ToolActionBar.svelte';
	import AdSlot from '$ui/marketing/AdSlot.svelte';
	import Button from '$ui/primitives/Button.svelte';
	import {
		setToolShellContext,
		type ToolShellActions,
		type ToolShellContext
	} from '$ui/tools/tool-shell-context';

	type Props = {
		name: string;
		description: string;
		categoryLabel: string;
		categoryId: string;
		related: ToolSummary[];
		workflowNext?: ToolSummary[];
		faq?: FaqItem[];
		howTo?: string[];
		capabilities?: ToolCapability[];
		presets?: ToolPreset[];
		shareParams?: string[];
		favorited?: boolean;
		canFavorite?: boolean;
		loginHref?: string;
		adsEnabled?: boolean;
		children: Snippet;
	};

	let {
		name,
		description,
		categoryLabel,
		categoryId,
		related,
		workflowNext = [],
		faq = [],
		howTo = [],
		capabilities = [],
		presets = [],
		shareParams = [],
		favorited = false,
		canFavorite = false,
		loginHref = '/login',
		adsEnabled = false,
		children
	}: Props = $props();

	let shellActions = $state<ToolShellActions>({});

	const shell: ToolShellContext = {
		getActions: () => shellActions,
		setActions: (next) => {
			shellActions = next;
		}
	};

	setToolShellContext(shell);

	const showHeaderFavorite = $derived(!capabilities.includes('favorite'));
</script>

<main id="main">
	<Container class="py-8 sm:py-12">
		<Breadcrumb
			items={[
				{ label: 'Home', href: '/' },
				{ label: 'Tools', href: '/tools' },
				{ label: categoryLabel, href: `/categories/${categoryId}` },
				{ label: name }
			]}
		/>

		<header class="mt-6 flex max-w-3xl flex-wrap items-start justify-between gap-4 sm:mt-8">
			<div class="animate-rise">
				<p class="text-xs font-semibold tracking-[0.1em] text-muted uppercase">{categoryLabel}</p>
				<h1
					class="mt-2 font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl md:text-5xl"
				>
					{name}
				</h1>
				<p class="mt-3 text-base text-pretty text-muted sm:mt-4 sm:text-lg">{description}</p>
			</div>

			{#if showHeaderFavorite}
				{#if canFavorite}
					<form method="POST" action="?/toggleFavorite">
						<input type="hidden" name="favorited" value={favorited ? '1' : '0'} />
						<Button type="submit" variant={favorited ? 'secondary' : 'ghost'} size="sm">
							{favorited ? 'Favorited' : 'Favorite'}
						</Button>
					</form>
				{:else}
					<a href={loginHref} class="text-sm text-muted transition-colors hover:text-fg"
						>Sign in to favorite</a
					>
				{/if}
			{/if}
		</header>

		<section
			class="animate-rise-delay-1 mt-8 rounded-xl border border-border bg-bg-elevated p-4 shadow-sm sm:mt-10 sm:p-6"
			aria-label="Tool"
		>
			<ToolActionBar
				{capabilities}
				{presets}
				{shareParams}
				actions={shellActions}
				{favorited}
				{canFavorite}
				{loginHref}
			/>
			{@render children()}
		</section>

		<AdSlot enabled={adsEnabled} placement="in-content" class="mt-10" />

		{#if howTo.length}
			<div class="mt-12 border-t border-border/70 pt-10 sm:mt-14 sm:pt-12">
				<ToolHowTo steps={howTo} />
			</div>
		{/if}

		{#if workflowNext.length}
			<div class="mt-12 border-t border-border/70 pt-10 sm:mt-14 sm:pt-12">
				<RelatedTools tools={workflowNext} title="Next step" />
			</div>
		{/if}

		{#if faq.length}
			<div class="mt-12 border-t border-border/70 pt-10 sm:mt-14 sm:pt-12">
				<ToolFaq items={faq} />
			</div>
		{/if}

		{#if related.length}
			<div class="mt-12 border-t border-border/70 pt-10 sm:mt-14 sm:pt-12">
				<RelatedTools tools={related} />
			</div>
		{/if}
	</Container>
</main>
