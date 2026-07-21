<script lang="ts">
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';
	import { resolve } from '$app/paths';

	type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
	type Size = 'sm' | 'md' | 'lg';

	type Props = {
		variant?: Variant;
		size?: Size;
		href?: string;
		type?: HTMLButtonAttributes['type'];
		disabled?: boolean;
		class?: string;
		children: Snippet;
	} & Omit<HTMLAnchorAttributes & HTMLButtonAttributes, 'type' | 'disabled' | 'class' | 'children'>;

	let {
		variant = 'primary',
		size = 'md',
		href,
		type = 'button',
		disabled = false,
		class: className = '',
		children,
		...rest
	}: Props = $props();

	const variants: Record<Variant, string> = {
		primary:
			'bg-accent text-accent-fg hover:bg-accent-hover disabled:opacity-50 disabled:pointer-events-none',
		secondary:
			'bg-bg-elevated text-fg border border-border hover:bg-bg disabled:opacity-50 disabled:pointer-events-none',
		ghost:
			'bg-transparent text-fg hover:bg-bg-elevated disabled:opacity-50 disabled:pointer-events-none',
		danger: 'bg-danger text-white hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none'
	};

	const sizes: Record<Size, string> = {
		sm: 'h-8 px-3 text-sm gap-1.5',
		md: 'h-10 px-4 text-base gap-2',
		lg: 'h-12 px-5 text-lg gap-2'
	};

	function hrefFor(value: string) {
		if (
			value.startsWith('http://') ||
			value.startsWith('https://') ||
			value.startsWith('mailto:')
		) {
			return value;
		}
		// Design-system primitive accepts app paths; cast for typed resolve().
		return resolve(value as '/');
	}
</script>

{#if href}
	<a
		href={hrefFor(href)}
		class="inline-flex items-center justify-center rounded-md font-medium no-underline transition-colors duration-200 ease-out {variants[
			variant
		]} {sizes[size]} {className}"
		{...rest as HTMLAnchorAttributes}
	>
		{@render children()}
	</a>
{:else}
	<button
		{type}
		{disabled}
		class="inline-flex items-center justify-center rounded-md font-medium no-underline transition-colors duration-200 ease-out {variants[
			variant
		]} {sizes[size]} {className}"
		{...rest as HTMLButtonAttributes}
	>
		{@render children()}
	</button>
{/if}
