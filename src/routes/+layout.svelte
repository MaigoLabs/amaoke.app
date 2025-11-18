<script lang="ts">
  import favicon from "$lib/assets/favicon.svg"
  import "@fontsource/roboto"
  import 'virtual:uno.css'
  import "../style/app.sass"
  import "../style/material.scss"
  import '@unocss/reset/normalize.css'
  import '@unocss/reset/tailwind-v4.css'

  import AppBar from "../components/appbar/AppBar.svelte"
  import type { LayoutProps } from "./$types";

  let { data, children }: LayoutProps = $props();
  
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
