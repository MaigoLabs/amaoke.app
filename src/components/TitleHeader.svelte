<script lang="ts">
  import IconButton from "./IconButton.svelte";

  let { title, ...rest } = $props()
</script>

<div class="hbox h-full px-16px" {...rest}>
  <div class="m3-font-title-large">{title}</div>
  <IconButton icon="i-material-symbols:arrow-forward" />
</div>