<script lang="ts">
  import { Layer } from "m3-svelte"
  import { fade } from "svelte/transition"

  let { open = $bindable(), ...p }: {
    title: string,
    children?: any,
    buttons?: {
      text: string,
      onclick: () => void
    }[]
    open: boolean
  } = $props()

  let buttons = $derived(p.buttons ?? [{
    text: '取消', onclick: () => open = false
  }])
</script>

{#if open}
<div class="cbox absolute inset-0 drop-shadow-xl" transition:fade>
  <div class="vbox rounded-28px mbg-surface-container-high w-312px">
    <div class="vbox gap-16px p-26px pb-0">
      <div class="m3-font-headline-small mfg-on-surface">{p.title}</div>
      <div class="m3-font-body-medium mfg-on-surface-variant">
        {@render p.children?.()}
      </div>
    </div>
    <div class="hbox gap-16px p-26px py-20px pl-8px pr-24px justify-end">
      {#each buttons as button}
        <button class="px-16px py-10px mfg-primary relative rounded-12px" onclick={button.onclick}>
          <Layer />
          {button.text}
        </button>
      {/each}
    </div> 
  </div>
</div>
{/if}