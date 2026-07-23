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
			'bg-fg text-white shadow-sm hover:bg-accent-hover disabled:opacity-50 disabled:pointer-events-none',
		secondary:
			'bg-white text-fg border border-border hover:bg-bg disabled:opacity-50 disabled:pointer-events-none',
		ghost:
			'bg-transparent text-fg hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none',
		danger: 'bg-danger text-white hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none'
	};

	const sizes: Record<Size, string> = {
		sm: 'h-8 px-3 text-sm gap-1.5',
		md: 'h-10 px-4 text-sm gap-2',
		lg: 'h-12 px-5 text-base gap-2'
	};

	function hrefFor(value: string) {
		if (
			value.startsWith('http://') ||
			value.startsWith('https://') ||
			value.startsWith('mailto:')
		) {
			return value;
		}
		return resolve(value as '/');
	}
</script>

{#if href}
	<a
		href={hrefFor(href)}
		class="pressable inline-flex items-center justify-center rounded-lg font-medium no-underline transition-[color,background-color,border-color,box-shadow,transform,opacity] duration-(--duration-fast) ease-out {variants[
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
		class="pressable inline-flex items-center justify-center rounded-lg font-medium no-underline transition-[color,background-color,border-color,box-shadow,transform,opacity] duration-(--duration-fast) ease-out disabled:active:scale-100 {variants[
			variant
		]} {sizes[size]} {className}"
		{...rest as HTMLButtonAttributes}
	>
		{@render children()}
	</button>
{/if}
