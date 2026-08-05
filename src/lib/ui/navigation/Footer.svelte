<script lang="ts">
	import { resolve } from '$app/paths';
	import Container from '$ui/layout/Container.svelte';
	import { categories } from '$lib/config/site';

	type Props = {
		brand?: string;
	};

	let { brand = 'HeyTools' }: Props = $props();
	const year = new Date().getFullYear();

	const popular = [
		{ href: '/tools/json-formatter', label: 'JSON Formatter' },
		{ href: '/tools/password-generator', label: 'Password Generator' },
		{ href: '/tools/word-counter', label: 'Word Counter' },
		{ href: '/tools/qr-code-generator', label: 'QR Code Generator' },
		{ href: '/tools/image-compressor', label: 'Image Compressor' },
		{ href: '/tools/pdf-merge', label: 'PDF Merge' }
	] as const;
</script>

<footer class="mt-auto border-t border-border bg-bg py-12">
	<Container class="flex flex-col gap-10">
		<div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
			<div class="sm:col-span-2 lg:col-span-1">
				<a href={resolve('/')} class="flex items-center gap-2 no-underline">
					<span
						class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded bg-zinc-900"
						aria-hidden="true"
					>
						<img src="/logo-1.png" alt="" width="20" height="20" class="object-cover" />
					</span>
					<span class="font-display text-lg font-semibold tracking-tight text-fg">{brand}</span>
				</a>
				<p class="mt-3 max-w-xs text-sm text-pretty text-muted">
					Free, privacy-first browser tools—no install required.
				</p>
			</div>

			<nav aria-label="Categories">
				<p class="text-xs font-semibold tracking-wider text-muted uppercase">Categories</p>
				<ul class="mt-3 space-y-2 text-sm">
					{#each categories.slice(0, 6) as category (category.id)}
						<li>
							<a
								href={resolve(`/categories/${category.id}`)}
								class="text-muted no-underline transition-colors hover:text-fg"
								>{category.label.replace(' Tools', '')}</a
							>
						</li>
					{/each}
					<li>
						<a
							href={resolve('/categories')}
							class="font-medium text-fg no-underline transition-colors hover:underline"
							>All categories</a
						>
					</li>
				</ul>
			</nav>

			<nav aria-label="Popular tools">
				<p class="text-xs font-semibold tracking-wider text-muted uppercase">Popular</p>
				<ul class="mt-3 space-y-2 text-sm">
					{#each popular as tool (tool.href)}
						<li>
							<a
								href={resolve(tool.href)}
								class="text-muted no-underline transition-colors hover:text-fg">{tool.label}</a
							>
						</li>
					{/each}
				</ul>
			</nav>

			<nav aria-label="Legal">
				<p class="text-xs font-semibold tracking-wider text-muted uppercase">Site</p>
				<ul class="mt-3 space-y-2 text-sm">
					<li>
						<a
							href={resolve('/tools')}
							class="text-muted no-underline transition-colors hover:text-fg">All tools</a
						>
					</li>
					<li>
						<a
							href={resolve('/request-tool')}
							class="text-muted no-underline transition-colors hover:text-fg">Request a tool</a
						>
					</li>
					<li>
						<a
							href={resolve('/privacy')}
							class="text-muted no-underline transition-colors hover:text-fg">Privacy</a
						>
					</li>
				</ul>
			</nav>
		</div>

		<p class="border-t border-border pt-6 text-center text-sm text-muted md:text-left">
			&copy; {year}
			{brand}. Premium Browser Tools.
		</p>
	</Container>
</footer>
