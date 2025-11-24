<script lang="ts">
  import { fly, slide, fade } from "svelte/transition";
  import { Menu } from "m3-svelte";
  import IconButton from "../IconButton.svelte";

  interface Icon {
    icon: string
    onclick: () => void
  }

  let { title, sub, account, right, children, moreIcon, gradient }: {
    title?: string
    sub?: string
    account?: () => void
    right?: Icon[]
    children?: any
    moreIcon?: string
    gradient?: boolean
  } = $props()

  let showMenu = $state(false)
</script>

<div class="hbox h-64px" class:appbar-gradient={gradient}>
  {#if account}
    <IconButton icon="i-material-symbols:account-circle" onclick={account} aria-label="Account" />
  {:else}
    <IconButton icon="i-material-symbols:arrow-back-rounded" onclick={() => history.back()} aria-label="Account" />
  {/if}
  <div class="vbox flex-1 min-w-0">
    <div class="m3-font-title-large truncate">{title}</div>
    {#if sub}
      <div class="m3-font-body-small mfg-on-surface-variant truncate">{sub}</div>
    {/if}
  </div>

  {#each right as item}
    <IconButton icon={item.icon} onclick={item.onclick} />
  {/each}

  {#if children}
    <IconButton icon={moreIcon ?? 'i-material-symbols:more-vert'} onclick={() => showMenu = !showMenu} />
  {/if}
</div>

{#if children && showMenu}
  <div class="absolute inset-0 bg-black bg-opacity-20 backdrop-blur-sm z-10" onclick={() => showMenu = false} transition:fade={{ duration: 200 }} aria-hidden="true">
    <div class="absolute right-0 top-48px p-16px mt-[-16px] z-11" transition:fly={{ duration: 200, y: -10 }}>
      <Menu>
        {@render children()}
      </Menu>
    </div>
  </div>
{/if}

<style lang="sass">
  .appbar-gradient
    background: linear-gradient(180deg, rgba(var(--m3-scheme-surface) / 1), transparent)
    z-index: 100
  @media (prefers-color-scheme: dark)
    .appbar-gradient
      background: linear-gradient(180deg, rgba(var(--m3-scheme-surface) / 0.2), transparent)
      // background: none
      // mix-blend-mode: overlay
</style>