<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { getFieldDescribedBy } from '../forms/field-context';

	type Props = HTMLInputAttributes & {
		invalid?: boolean;
	};

	let {
		type = 'text',
		class: className = '',
		invalid = false,
		value = $bindable<string | number>(''),
		'aria-describedby': ariaDescribedBy,
		...rest
	}: Props = $props();

	const fieldDescribedBy = $derived(getFieldDescribedBy());
	const describedBy = $derived(
		[fieldDescribedBy, ariaDescribedBy].filter(Boolean).join(' ') || undefined
	);
</script>

<input
	{type}
	bind:value
	aria-invalid={invalid || undefined}
	aria-describedby={describedBy}
	class="h-10 w-full rounded-md border bg-bg px-3 text-fg transition-colors duration-150 placeholder:text-muted focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none disabled:opacity-50 {invalid
		? 'border-danger'
		: 'border-border'} {className}"
	{...rest}
/>
