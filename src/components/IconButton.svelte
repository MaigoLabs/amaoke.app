<script lang="ts">
    import { Layer } from "m3-svelte";

    let { icon, ...rest } = $props();
</script>

<button class="cbox size-48px relative rounded-8px" {...rest}>
  <!-- <Layer/> -->
  <span class="size-24px {icon}"></span>
</button>