<script lang="ts">
	import Button from '$ui/primitives/Button.svelte';

	type Props = {
		value: string;
		label?: string;
	};

	let { value, label = 'Copy' }: Props = $props();
	let copied = $state(false);

	async function copy() {
		try {
			await navigator.clipboard.writeText(value);
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 1500);
		} catch {
			copied = false;
		}
	}
</script>

<Button type="button" variant="secondary" size="sm" onclick={copy} disabled={!value}>
	{copied ? 'Copied' : label}
</Button>
