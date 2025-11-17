<script lang="ts">
	import favicon from '$lib/assets/favicon.svg'
	import "@fontsource/roboto"
	import "./app.sass"
	import "./material.scss"
    import { AppBar } from "m3-svelte"

	let { children } = $props()
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
