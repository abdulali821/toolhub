<script lang="ts">
	import { resolve } from '$app/paths';
	import Container from '$ui/layout/Container.svelte';
	import { categories, site } from '$lib/config/site';

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
					Free, privacy-first browser tools—no install required. Open source—add a tool on GitHub.
				</p>
				<div class="mt-4 flex items-center gap-2">
					<a
						href={site.links.github}
						target="_blank"
						rel="noopener noreferrer"
						class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted transition-colors hover:border-border hover:bg-bg-elevated hover:text-fg"
						aria-label="GitHub repository — contribute tools"
						title="Contribute on GitHub"
					>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
							<path
								d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.341-3.369-1.341-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"
							/>
						</svg>
					</a>
					<a
						href={site.links.discord}
						target="_blank"
						rel="noopener noreferrer"
						class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted transition-colors hover:border-border hover:bg-bg-elevated hover:text-fg"
						aria-label="Join Discord community"
						title="Join Discord"
					>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
							<path
								d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"
							/>
						</svg>
					</a>
				</div>
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

			<nav aria-label="Community and site">
				<p class="text-xs font-semibold tracking-wider text-muted uppercase">Community</p>
				<ul class="mt-3 space-y-2 text-sm">
					<li>
						<a
							href={site.links.github}
							target="_blank"
							rel="noopener noreferrer"
							class="text-muted no-underline transition-colors hover:text-fg">GitHub — add a tool</a
						>
					</li>
					<li>
						<a
							href={site.links.discord}
							target="_blank"
							rel="noopener noreferrer"
							class="text-muted no-underline transition-colors hover:text-fg">Discord</a
						>
					</li>
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
