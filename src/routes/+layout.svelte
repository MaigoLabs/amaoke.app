<script lang="ts">
  import favicon from "$lib/assets/favicon.svg"
  import "@fontsource/roboto"
  import 'virtual:uno.css'
  import "../style/app.sass"
  import "../style/material.scss"
  import '@unocss/reset/normalize.css'
  import '@unocss/reset/tailwind-v4.css'
  import { initI18n } from "$lib/i18n"
  import type { LayoutProps } from "./$types"
  import { onNavigate } from '$app/navigation'

  let { data, children }: LayoutProps = $props()
  initI18n(data.lang || 'en')

  // This function is called when the user navigates to a new page, it will start the view transition
  onNavigate((navigation) => {
    if (!document.startViewTransition) return

    const direction = navigation.delta && navigation.delta < 0 ? 'back' : 'forward'
    document.documentElement.dataset.transitionDirection = direction

    return new Promise((resolve) => {
      document.startViewTransition(async () => {
        resolve()
        await navigation.complete
      })
    })
  })
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<div class="vbox h-screen min-h-screen box-border overflow-hidden relative">
  {@render children()}
</div>

<style lang="sass">
  :global(::view-transition-old(root)),
  :global(::view-transition-new(root))
    animation-duration: 0.3s
    animation-timing-function: cubic-bezier(0.4, 0.0, 0.2, 1)
    position: absolute
    width: 100%
    height: 100%
    top: 0
    left: 0

  :global(html[data-transition-direction="back"]::view-transition-new(root))
    animation-name: slide-in-from-left-partial
    z-index: -1
  :global(html[data-transition-direction="back"]::view-transition-old(root))
    animation-name: slide-out-to-right
    z-index: 1

  :global(html[data-transition-direction="forward"]::view-transition-new(root))
    animation-name: slide-in-from-right
    z-index: 1
  :global(html[data-transition-direction="forward"]::view-transition-old(root))
    animation-name: slide-out-to-left-partial
    z-index: -1

  @keyframes slide-in-from-left-partial
    from
      transform: translateX(-30%)
    to
      transform: translateX(0)

  @keyframes slide-out-to-left-partial
    from
      transform: translateX(0)
    to
      transform: translateX(-30%)

  @keyframes slide-out-to-right
    from
      transform: translateX(0)
    to
      transform: translateX(100%)

  @keyframes slide-in-from-right
    from
      transform: translateX(100%)
    to
      transform: translateX(0)
</style>
