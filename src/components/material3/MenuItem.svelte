<script lang="ts">
  import { Layer } from "m3-svelte";
  import type { Snippet } from "svelte";

  let {
    icon,
    textIcon,
    disabled = false,
    onclick,
    children,
  }: {
    icon?: string;
    textIcon?: string;
    disabled?: boolean;
    onclick: () => void;
    children: Snippet;
  } = $props();
</script>

<button type="button" class="item focus-inset m3-font-label-large" {disabled} {onclick}>
  <Layer />
  {#if icon == "space"}
    <span class="icon"></span>
  {:else if icon || textIcon}
    <span class="icon cbox {icon}">
      {textIcon}
    </span>
  {/if}
  {@render children()}
</button>

<style lang="scss">
  .item {
    display: flex;
    align-items: center;
    height: calc(3rem + var(--m3-util-density-term));
    padding: 0 0.75rem;
    gap: 0.75rem;
    white-space: nowrap;

    border: none;
    position: relative;
    background-color: transparent;
    color: rgb(var(--m3-scheme-on-surface));

    cursor: pointer;
  }
  .icon {
    width: 1.5rem;
    height: 1.5rem;
    font-size: 1.3rem;
  }
  .item:disabled {
    color: rgb(var(--m3-scheme-on-surface) / 0.38);
    cursor: auto;
  }
  .item:disabled > .icon > :global(svg) {
    color: rgb(var(--m3-scheme-on-surface) / 0.38);
  }
</style>