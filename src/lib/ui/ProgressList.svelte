<script lang="ts">
  import { LinearProgress } from "m3-svelte"

  export interface ProgressItem {
    title: string
    subtitle?: string
    icon: string
  }

  let { title, subtitle, percentage, items } = $props<{
    title?: string,
    subtitle?: string,
    percentage?: number,
    items: ProgressItem[]
  }>()
</script>

<div class="flex-1 vbox gap-16px min-h-0">
  {#if title}
    <div class="hbox gap-12px items-end! h-48px p-content">
      <div class="m3-font-headline-small">
        {title}
      </div>
      <div class="m3-font-label-small pb-3px">{subtitle}</div>
    </div>
  {/if}

  <LinearProgress percent={percentage ?? 0}/>

  <div class="vbox p-content scroll-here gap-8px overflow-x-hidden">
    {#each items as item}
      <div class="hbox gap-12px items-center h-40px">
        <span class="{item.icon} text-xl"></span>
        <div class="vbox min-w-0 flex-1">
          <span class="m3-font-title-medium truncate">{item.title}</span>
          {#if item.subtitle}
            <span class="m3-font-body-small mfg-on-surface-variant truncate">{item.subtitle}</span>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>