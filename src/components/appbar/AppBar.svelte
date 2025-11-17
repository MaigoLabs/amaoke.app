<script lang="ts">
  import IconButton from "../IconButton.svelte";

  let { title, account, settings }: {
    title?: string
    account?: () => void
    settings?: () => void
  } = $props()
</script>

<div class="hbox h-64px">
  {#if account}
    <IconButton icon="i-material-symbols:account-circle" onclick={account} aria-label="Account" />
  {:else}
    <IconButton icon="i-material-symbols:arrow-back-rounded" onclick={() => history.back()} aria-label="Account" />
  {/if}
  <div class="m3-font-title-large flex-1">{title}</div>
  {#if settings}
    <IconButton icon="i-material-symbols:settings-rounded" onclick={settings} aria-label="Settings" />
  {/if}
</div>