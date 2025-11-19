<script lang="ts">
    import { Layer } from "m3-svelte";

let { icon, children, big, ...rest }: {
  icon?: string
  children?: any
  big?: boolean
  [key: string]: any
} = $props();

let cls = $derived(big
  ? "h-56px px-24px py-16px m3-font-title-medium w-full justify-center"
  : "h-40px px-16px py-10px m3-font-label-large"
)
</script>

<button class="hbox gap-8px rounded-12px mfg-on-primary-container mbg-inverse-primary relative {cls}" {...rest}>
  <Layer/>
  {#if icon}
    <span class="size-20px {icon}"></span>
  {/if}
  {@render children?.()}
</button>