<script lang="ts">
    import { Layer } from "m3-svelte";

    let { icon, size = 24, ...rest } = $props();
</script>

<button class="cbox size-48px relative rounded-8px" {...rest}>
  <!-- <Layer/> -->
  <span class="{icon}" style="width: {size}px; height: {size}px"></span>
</button>