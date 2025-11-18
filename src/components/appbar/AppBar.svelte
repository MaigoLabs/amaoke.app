<script lang="ts">
  import IconButton from "../IconButton.svelte";

  interface Icon {
    icon: string
    onclick: () => void
  }

  let { title, sub, account, right }: {
    title?: string
    sub?: string
    account?: () => void
    right?: Icon[]
  } = $props()
</script>

<div class="hbox h-64px">
  {#if account}
    <IconButton icon="i-material-symbols:account-circle" onclick={account} aria-label="Account" />
  {:else}
    <IconButton icon="i-material-symbols:arrow-back-rounded" onclick={() => history.back()} aria-label="Account" />
  {/if}
  <div class="vbox flex-1">
    <div class="m3-font-title-large">{title}</div>
    {#if sub}
      <div class="m3-font-body-small mfg-on-surface-variant">{sub}</div>
    {/if}
  </div>

  {#each right as item}
    <IconButton icon={item.icon} onclick={item.onclick} />
  {/each}
</div>