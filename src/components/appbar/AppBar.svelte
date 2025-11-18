<script lang="ts">
  import IconButton from "../IconButton.svelte";

  interface Icon {
    icon: string
    onclick: () => void
  }

  let { title, account, right }: {
    title?: string
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
  <div class="m3-font-title-large flex-1">{title}</div>
  <!--{#if right}-->
<!--    <IconButton icon="i-material-symbols:settings-rounded" onclick={right} aria-label="Settings" />-->
<!--  {/if}-->

  {#each right as item}
    <IconButton icon={item.icon} onclick={item.onclick} />
  {/each}
</div>