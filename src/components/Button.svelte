<script lang="ts">
    import { Layer } from "m3-svelte";

let { icon, children, big, secondary, ...rest }: {
  icon?: string
  children?: any
  big?: boolean
  secondary?: boolean
  [key: string]: any
} = $props();

let cls = $derived(big
  ? "h-56px px-24px py-16px m3-font-title-medium w-full justify-center"
  : "h-40px px-16px py-10px m3-font-label-large"
)
let cls2 = $derived(secondary
  ? "mbg-secondary-container mfg-on-secondary-container"
  : "mbg-inverse-primary mfg-on-primary-container"
)
</script>

<button {...rest} class="hbox gap-8px rounded-12px relative flex-shrink-1 {cls} {cls2} {rest.class}">
  <Layer/>
  {#if icon}
    <span class="size-20px {icon}"></span>
  {/if}
  {@render children?.()}
</button>