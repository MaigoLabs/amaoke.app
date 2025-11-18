<script lang="ts">
let { icon, children, ...rest }: {
  icon?: string
  children?: any
} = $props();
</script>

<button class="hbox h-40px rounded-12px px-16px py-10px gap-8px mfg-on-primary-container mbg-inverse-primary m3-font-label-large" {...rest}>
  {#if icon}
    <span class="size-20px {icon}"></span>
  {/if}
  {@render children?.()}
</button>